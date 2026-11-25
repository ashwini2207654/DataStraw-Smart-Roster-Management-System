
import calendar
import json
from datetime import date, datetime, timedelta


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def normalize_date(value):
    """Convert MySQL date/datetime values into Python date."""

    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    return date.fromisoformat(str(value)[:10])


def normalize_rule(value):
    """Normalize process working-rule values."""

    if value is None:
        return ""

    return (
        str(value)
        .strip()
        .upper()
        .replace(" ", "_")
        .replace("-", "_")
    )


def parse_operating_days(value):
    """
    Convert operating_days into a list of integers.

    Database convention:
    0 = Sunday
    1 = Monday
    2 = Tuesday
    3 = Wednesday
    4 = Thursday
    5 = Friday
    6 = Saturday
    """

    if value is None or value == "":
        return None

    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            value = [
                item.strip()
                for item in value.split(",")
                if item.strip()
            ]

    if not isinstance(value, (list, tuple, set)):
        return None

    weekday_names = {
        "SUNDAY": 0,
        "MONDAY": 1,
        "TUESDAY": 2,
        "WEDNESDAY": 3,
        "THURSDAY": 4,
        "FRIDAY": 5,
        "SATURDAY": 6
    }

    result = []

    for item in value:
        if isinstance(item, str):
            item = item.strip().upper()

            if item in weekday_names:
                result.append(weekday_names[item])
                continue

            try:
                item = int(item)
            except ValueError:
                continue

        if isinstance(item, int) and 0 <= item <= 6:
            result.append(item)

    return sorted(set(result))


def database_weekday(work_date):
    """
    Python weekday:
    Monday = 0, Sunday = 6

    Database weekday:
    Sunday = 0, Monday = 1, ..., Saturday = 6
    """

    return (work_date.weekday() + 1) % 7


# =========================================================
# MAIN ROSTER GENERATOR
# =========================================================

def generate_monthly_roster(
    cursor,
    roster_id,
    month,
    year
):
    """
    Generate monthly roster entries and coverage conflicts.

    Supports:
    - Active employee assignments
    - Brand/process operating rules
    - Public holidays
    - Employee weekly offs
    - Approved leaves
    - Compensatory offs
    - Employee availability
    - Coverage overrides
    - Minimum staffing validation
    """

    _, total_days = calendar.monthrange(year, month)

    start_date = date(year, month, 1)
    end_date = date(year, month, total_days)

    # =====================================================
    # 1. ACTIVE ASSIGNMENTS
    # =====================================================

    cursor.execute(
        """
        SELECT
            a.assignment_id,
            a.employee_id,
            a.brand_process_id,
            a.effective_from,
            a.effective_to,

            e.full_name,

            bp.working_rule,
            bp.minimum_staff,
            bp.operating_days,

            b.brand_name,
            b.brand_id,

            p.process_name

        FROM assignments a

        JOIN employees e
            ON a.employee_id = e.employee_id

        JOIN brand_processes bp
            ON a.brand_process_id = bp.brand_process_id

        JOIN brands b
            ON bp.brand_id = b.brand_id

        JOIN processes p
            ON bp.process_id = p.process_id

        WHERE a.status = 'ACTIVE'
          AND e.employment_status = 'ACTIVE'
          AND bp.status = 'ACTIVE'

          AND a.effective_from <= %s

          AND (
              a.effective_to IS NULL
              OR a.effective_to >= %s
          )

        ORDER BY a.assignment_id
        """,
        (end_date, start_date)
    )

    assignments = cursor.fetchall()

    # =====================================================
    # 2. PUBLIC HOLIDAYS
    # =====================================================

    cursor.execute(
        """
        SELECT
            holiday_date,
            brand_id

        FROM public_holidays

        WHERE holiday_date BETWEEN %s AND %s
        """,
        (start_date, end_date)
    )

    holidays = cursor.fetchall()

    holiday_set = set()

    for row in holidays:
        holiday_date = normalize_date(
            row["holiday_date"]
        )

        brand_id = row["brand_id"]

        holiday_set.add(
            (holiday_date, brand_id)
        )

    # =====================================================
    # 3. EMPLOYEE WEEKLY OFFS
    # =====================================================

    cursor.execute(
        """
        SELECT
            employee_id,
            weekday,
            effective_from,
            effective_to

        FROM employee_weekly_offs

        WHERE effective_from <= %s

          AND (
              effective_to IS NULL
              OR effective_to >= %s
          )
        """,
        (end_date, start_date)
    )

    weekly_offs = cursor.fetchall()

    weekly_off_map = {}

    for row in weekly_offs:
        weekly_off_map.setdefault(
            row["employee_id"],
            []
        ).append(row)

    # =====================================================
    # 4. APPROVED LEAVES
    # =====================================================

    cursor.execute(
        """
        SELECT
            employee_id,
            start_date,
            end_date,
            leave_type

        FROM leave_requests

        WHERE approval_status = 'APPROVED'

          AND start_date <= %s
          AND end_date >= %s
        """,
        (end_date, start_date)
    )

    leaves = cursor.fetchall()

    leave_map = {}

    for row in leaves:
        leave_map.setdefault(
            row["employee_id"],
            []
        ).append(row)

    # =====================================================
    # 5. EMPLOYEE AVAILABILITY
    # =====================================================

    cursor.execute(
        """
        SELECT
            employee_id,
            availability_date,
            availability_status

        FROM employee_availability

        WHERE availability_date BETWEEN %s AND %s
        """,
        (start_date, end_date)
    )

    availability_records = cursor.fetchall()

    availability_map = {}

    for row in availability_records:
        availability_date = normalize_date(
            row["availability_date"]
        )

        availability_map[
            (
                row["employee_id"],
                availability_date
            )
        ] = str(
            row["availability_status"]
        ).strip().upper()

    # =====================================================
    # 6. COVERAGE OVERRIDES
    # =====================================================

    cursor.execute(
        """
        SELECT
            brand_process_id,
            override_date,
            required_staff

        FROM coverage_overrides

        WHERE override_date BETWEEN %s AND %s
        """,
        (start_date, end_date)
    )

    overrides = cursor.fetchall()

    override_map = {}

    for row in overrides:
        override_date = normalize_date(
            row["override_date"]
        )

        override_map[
            (
                row["brand_process_id"],
                override_date
            )
        ] = row["required_staff"]

    # =====================================================
    # 7. PROCESS OPERATING CALENDAR
    # =====================================================

    def is_public_holiday(work_date, brand_id):
        """
        A holiday applies when:
        - brand_id is NULL: company-wide holiday
        - brand_id matches: brand-specific holiday
        """

        return (
            (work_date, None) in holiday_set
            or (work_date, brand_id) in holiday_set
        )

    def process_operates(assignment, work_date):
        """
        Determine whether the process operates on a date.
        """

        rule = normalize_rule(
            assignment["working_rule"]
        )

        brand_id = assignment["brand_id"]

        holiday = is_public_holiday(
            work_date,
            brand_id
        )

        # Rule 1: Operates every calendar day.
        if rule in (
            "365_DAYS",
            "365",
            "ALL_DAYS",
            "EVERY_DAY"
        ):
            return True

        # Rule 2: Closed on public holidays.
        if rule in (
            "EXCEPT_PUBLIC_HOLIDAYS",
            "EXCLUDE_PUBLIC_HOLIDAYS",
            "ALL_DAYS_EXCEPT_PUBLIC_HOLIDAYS"
        ):
            return not holiday

        # Rule 3: Monday to Friday.
        if rule in (
            "WEEKDAYS_ONLY",
            "WEEKDAYS",
            "MONDAY_TO_FRIDAY"
        ):
            return (
                work_date.weekday() < 5
                and not holiday
            )

        # Rule 4: Use configured operating days.
        operating_days = parse_operating_days(
            assignment["operating_days"]
        )

        if operating_days is not None:
            return (
                database_weekday(work_date)
                in operating_days
                and not holiday
            )

        # Safe default:
        # Do not schedule on public holidays.
        return not holiday

    # =====================================================
    # 8. UNIQUE BRAND-PROCESSES
    # =====================================================

    brand_process_map = {}

    for assignment in assignments:
        brand_process_id = assignment[
            "brand_process_id"
        ]

        if brand_process_id not in brand_process_map:
            brand_process_map[
                brand_process_id
            ] = assignment

    brand_processes = list(
        brand_process_map.values()
    )

    # =====================================================
    # 9. GENERATE DAILY ROSTER
    # =====================================================

    entries = []
    conflicts = []

    current_date = start_date

    while current_date <= end_date:

        daily_coverage = {}

        for assignment in assignments:

            employee_id = assignment[
                "employee_id"
            ]

            brand_process_id = assignment[
                "brand_process_id"
            ]

            assignment_start = normalize_date(
                assignment["effective_from"]
            )

            assignment_end = normalize_date(
                assignment["effective_to"]
            )

            # Skip dates outside assignment validity.
            if (
                assignment_start
                and current_date < assignment_start
            ):
                continue

            if (
                assignment_end
                and current_date > assignment_end
            ):
                continue

            # ---------------------------------------------
            # PROCESS CALENDAR
            # ---------------------------------------------

            operates = process_operates(
                assignment,
                current_date
            )

            if operates:
                status = "WORKING"
            else:
                status = "HOLIDAY"

            # ---------------------------------------------
            # EMPLOYEE WEEKLY OFF
            # ---------------------------------------------

            employee_weekday = database_weekday(
                current_date
            )

            weekly_off = False

            for off in weekly_off_map.get(
                employee_id,
                []
            ):

                off_start = normalize_date(
                    off["effective_from"]
                )

                off_end = normalize_date(
                    off["effective_to"]
                )

                if (
                    int(off["weekday"])
                    == employee_weekday

                    and (
                        off_start is None
                        or off_start <= current_date
                    )

                    and (
                        off_end is None
                        or off_end >= current_date
                    )
                ):
                    weekly_off = True
                    break

            # Apply weekly off only if the process
            # is otherwise scheduled to operate.
            if operates and weekly_off:
                status = "WEEKLY_OFF"

            # ---------------------------------------------
            # APPROVED LEAVE / COMP-OFF
            # ---------------------------------------------

            for leave in leave_map.get(
                employee_id,
                []
            ):

                leave_start = normalize_date(
                    leave["start_date"]
                )

                leave_end = normalize_date(
                    leave["end_date"]
                )

                if (
                    leave_start
                    <= current_date
                    <= leave_end
                ):

                    leave_type = str(
                        leave["leave_type"] or ""
                    ).strip().upper()

                    if leave_type == "COMP_OFF":
                        status = "COMP_OFF"
                    else:
                        status = "LEAVE"

                    break

            # ---------------------------------------------
            # EMPLOYEE AVAILABILITY
            # ---------------------------------------------

            availability_status = availability_map.get(
                (
                    employee_id,
                    current_date
                )
            )

            if availability_status in (
                "UNAVAILABLE",
                "ABSENT"
            ):
                status = "LEAVE"

            # ---------------------------------------------
            # SAVE ROSTER ENTRY
            # ---------------------------------------------

            entries.append({
                "roster_id": roster_id,

                "employee_id": employee_id,

                "assignment_id": assignment[
                    "assignment_id"
                ],

                "brand_process_id": brand_process_id,

                "work_date": current_date,

                "status": status
            })

            # ---------------------------------------------
            # COUNT WORKING STAFF
            # ---------------------------------------------

            if status == "WORKING":

                key = (
                    brand_process_id,
                    current_date
                )

                daily_coverage.setdefault(
                    key,
                    set()
                ).add(employee_id)

        # =================================================
        # 10. MINIMUM STAFFING VALIDATION
        # =================================================

        for assignment in brand_processes:

            brand_process_id = assignment[
                "brand_process_id"
            ]

            key = (
                brand_process_id,
                current_date
            )

            # Do not check coverage when the process
            # is closed for this date.
            if not process_operates(
                assignment,
                current_date
            ):
                continue

            required_staff = override_map.get(
                key,
                assignment["minimum_staff"]
            )

            required_staff = int(
                required_staff or 0
            )

            assigned_staff = len(
                daily_coverage.get(
                    key,
                    set()
                )
            )

            if assigned_staff < required_staff:

                conflicts.append({
                    "roster_id": roster_id,

                    "conflict_type": "COVERAGE_GAP",

                    "severity": "HIGH",

                    "date": current_date,

                    "employee_id": None,

                    "brand_process_id": (
                        brand_process_id
                    ),

                    "description": (
                        f"Required {required_staff} "
                        f"employees but only "
                        f"{assigned_staff} working for "
                        f"{assignment['brand_name']} - "
                        f"{assignment['process_name']} "
                        f"on {current_date}."
                    ),

                    "resolution_status": "OPEN"
                })

        current_date += timedelta(days=1)

    return entries, conflicts
