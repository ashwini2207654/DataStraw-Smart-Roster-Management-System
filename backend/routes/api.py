
from flask import Blueprint, jsonify, request
from config.database import get_db_connection

api = Blueprint("api", __name__)


# --------------------------------
# DATABASE HELPER
# --------------------------------

def fetch_all(query):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query)
        return cursor.fetchall()

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


# --------------------------------
# HEALTH CHECK
# --------------------------------

@api.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "message": "DataStraw Roster API is running!"
    })


# --------------------------------
# GET EMPLOYEES
# --------------------------------

@api.route("/employees", methods=["GET"])
def get_employees():
    try:
        employees = fetch_all("""
            SELECT
                e.employee_id,
                e.employee_code,
                e.full_name,
                e.email,
                e.phone,
                e.employment_status,
                p.pod_name,
                e.pod_id,
                DATE_FORMAT(e.joining_date, '%Y-%m-%d') AS joining_date
            FROM employees e
            LEFT JOIN pods p ON e.pod_id = p.pod_id
            ORDER BY e.employee_id
        """)

        return jsonify({
            "status": "success",
            "total": len(employees),
            "employees": employees
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------
# GET BRANDS
# --------------------------------

@api.route("/brands", methods=["GET"])
def get_brands():
    try:
        brands = fetch_all("""
            SELECT
                brand_id,
                brand_name,
                description,
                status
            FROM brands
            ORDER BY brand_id
        """)

        return jsonify({
            "status": "success",
            "total": len(brands),
            "brands": brands
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------
# GET PODS
# --------------------------------

@api.route("/pods", methods=["GET"])
def get_pods():
    try:
        pods = fetch_all("""
            SELECT
                p.pod_id,
                p.pod_name,
                pod_leader.full_name AS pod_lead,
                COUNT(member.employee_id) AS employee_count

            FROM pods p

            LEFT JOIN employees pod_leader
                ON p.lead_employee_id = pod_leader.employee_id

            LEFT JOIN employees member
                ON p.pod_id = member.pod_id

            GROUP BY
                p.pod_id,
                p.pod_name,
                pod_leader.full_name

            ORDER BY p.pod_id
        """)

        return jsonify({
            "status": "success",
            "total": len(pods),
            "pods": pods
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------
# GET PROCESSES
# --------------------------------

@api.route("/processes", methods=["GET"])
def get_processes():
    try:
        processes = fetch_all("""
            SELECT
                process_id,
                process_name,
                description
            FROM processes
            ORDER BY process_id
        """)

        return jsonify({
            "status": "success",
            "total": len(processes),
            "processes": processes
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------
# GET BRAND PROCESSES
# --------------------------------

@api.route("/brand-processes", methods=["GET"])
def get_brand_processes():
    try:
        records = fetch_all("""
            SELECT
                bp.brand_process_id,
                b.brand_name,
                p.process_name,
                bp.working_rule,
                bp.minimum_staff,
                bp.operating_days,
                bp.status
            FROM brand_processes bp
            JOIN brands b
                ON bp.brand_id = b.brand_id
            JOIN processes p
                ON bp.process_id = p.process_id
            ORDER BY b.brand_id, p.process_id
        """)

        return jsonify({
            "status": "success",
            "total": len(records),
            "brand_processes": records
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------
# ADD EMPLOYEE
# --------------------------------

@api.route("/employees", methods=["POST"])
def add_employee():
    data = request.get_json() or {}

    employee_code = data.get("employee_code")
    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    pod_id = data.get("pod_id")
    joining_date = data.get("joining_date") or None

    if not employee_code or not full_name or not email or not pod_id:
        return jsonify({
            "status": "error",
            "message": "Employee ID, name, email and pod are required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO employees
            (
                employee_code,
                full_name,
                email,
                phone,
                pod_id,
                employment_status,
                joining_date
            )
            VALUES (%s, %s, %s, %s, %s, 'ACTIVE', %s)
        """

        values = (
            employee_code,
            full_name,
            email,
            phone,
            pod_id,
            joining_date
        )

        cursor.execute(query, values)
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Employee added successfully!",
            "employee_id": cursor.lastrowid
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# UPDATE EMPLOYEE
# --------------------------------

@api.route("/employees/<int:employee_id>", methods=["PUT"])
def update_employee(employee_id):
    data = request.get_json() or {}

    employee_code = data.get("employee_code")
    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    pod_id = data.get("pod_id")
    joining_date = data.get("joining_date") or None

    if not employee_code or not full_name or not email or not pod_id:
        return jsonify({
            "status": "error",
            "message": "Employee ID, name, email and pod are required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT employee_id FROM employees WHERE employee_id = %s",
            (employee_id,)
        )

        if not cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Employee not found."
            }), 404

        query = """
            UPDATE employees
            SET
                employee_code = %s,
                full_name = %s,
                email = %s,
                phone = %s,
                pod_id = %s,
                joining_date = %s
            WHERE employee_id = %s
        """

        values = (
            employee_code,
            full_name,
            email,
            phone,
            pod_id,
            joining_date,
            employee_id
        )

        cursor.execute(query, values)
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Employee updated successfully!"
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# DEACTIVATE EMPLOYEE
# --------------------------------

@api.route("/employees/<int:employee_id>/deactivate", methods=["PUT"])
def deactivate_employee(employee_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT employee_id FROM employees WHERE employee_id = %s",
            (employee_id,)
        )

        employee = cursor.fetchone()

        if not employee:
            return jsonify({
                "status": "error",
                "message": "Employee not found"
            }), 404

        cursor.execute("""
            UPDATE employees
            SET employment_status = 'INACTIVE'
            WHERE employee_id = %s
        """, (employee_id,))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Employee deactivated successfully"
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# GET EMPLOYEE AVAILABILITY
# --------------------------------

@api.route("/availability", methods=["GET"])
def get_availability():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                ea.availability_id,
                ea.employee_id,
                e.employee_code,
                e.full_name,
                ea.availability_date AS date,
                ea.availability_status,
                ea.reason
            FROM employee_availability ea
            JOIN employees e
                ON ea.employee_id = e.employee_id
            ORDER BY ea.availability_date DESC
        """)

        records = cursor.fetchall()

        for record in records:
            record["date"] = record["date"].isoformat()

        return jsonify({
            "status": "success",
            "availability": records,
            "total": len(records)
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# ADD / UPDATE EMPLOYEE AVAILABILITY
# --------------------------------

@api.route("/availability", methods=["POST"])
def add_availability():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        employee_id = data.get("employee_id")
        availability_date = data.get("date")
        availability_status = data.get("availability_status")
        reason = data.get("reason", "")

        if not employee_id or not availability_date or not availability_status:
            return jsonify({
                "status": "error",
                "message": "Employee, date and availability status are required."
            }), 400

        if availability_status not in ["AVAILABLE", "UNAVAILABLE"]:
            return jsonify({
                "status": "error",
                "message": "Invalid availability status."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT availability_id
            FROM employee_availability
            WHERE employee_id = %s
              AND availability_date = %s
        """, (employee_id, availability_date))

        existing_record = cursor.fetchone()

        if existing_record:

            cursor.execute("""
                UPDATE employee_availability
                SET
                    availability_status = %s,
                    reason = %s
                WHERE availability_id = %s
            """, (
                availability_status,
                reason,
                existing_record["availability_id"]
            ))

            message = "Employee availability updated successfully."

        else:

            cursor.execute("""
                INSERT INTO employee_availability
                (
                    employee_id,
                    availability_date,
                    availability_status,
                    reason
                )
                VALUES (%s, %s, %s, %s)
            """, (
                employee_id,
                availability_date,
                availability_status,
                reason
            ))

            message = "Employee availability saved successfully."

        connection.commit()

        return jsonify({
            "status": "success",
            "message": message
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()

# --------------------------------
# GET EMPLOYEE ASSIGNMENTS
# --------------------------------

@api.route("/assignments", methods=["GET"])
def get_assignments():
    try:
        assignments = fetch_all("""
            SELECT
                a.assignment_id,
                a.employee_id,
                e.employee_code,
                e.full_name,
                b.brand_name,
                p.process_name,
                DATE_FORMAT(a.effective_from, '%Y-%m-%d') AS effective_from,
                DATE_FORMAT(a.effective_to, '%Y-%m-%d') AS effective_to,
                a.status

            FROM assignments a

            JOIN employees e
                ON a.employee_id = e.employee_id

            JOIN brand_processes bp
                ON a.brand_process_id = bp.brand_process_id

            JOIN brands b
                ON bp.brand_id = b.brand_id

            JOIN processes p
                ON bp.process_id = p.process_id

            ORDER BY a.assignment_id
        """)

        return jsonify({
            "status": "success",
            "total": len(assignments),
            "assignments": assignments
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

# --------------------------------
# LEAVE MANAGEMENT
# --------------------------------

@api.route("/leaves", methods=["GET"])
def get_leaves():
    try:
        leaves = fetch_all("""
            SELECT
                l.leave_id,
                l.employee_id,
                e.employee_code,
                e.full_name,
                l.leave_type,
                DATE_FORMAT(l.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(l.end_date, '%Y-%m-%d') AS end_date,
                l.approval_status,
                l.reason
            FROM leave_requests l
            JOIN employees e
                ON l.employee_id = e.employee_id
            ORDER BY l.created_at DESC
        """)

        return jsonify({
            "status": "success",
            "total": len(leaves),
            "leaves": leaves
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


@api.route("/leaves", methods=["POST"])
def add_leave():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        required_fields = [
            "employee_id",
            "leave_type",
            "start_date",
            "end_date"
        ]

        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({
                    "status": "error",
                    "message": f"{field} is required"
                }), 400

        if data["leave_type"] not in ["PLANNED", "SICK", "COMP_OFF"]:
            return jsonify({
                "status": "error",
                "message": "Invalid leave type"
            }), 400

        if data["end_date"] < data["start_date"]:
            return jsonify({
                "status": "error",
                "message": "End date cannot be before start date"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO leave_requests (
                employee_id,
                leave_type,
                start_date,
                end_date,
                approval_status,
                reason
            )
            VALUES (%s, %s, %s, %s, 'PENDING', %s)
        """, (
            data["employee_id"],
            data["leave_type"],
            data["start_date"],
            data["end_date"],
            data.get("reason", "")
        ))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Leave request added successfully",
            "leave_id": cursor.lastrowid
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@api.route("/leaves/<int:leave_id>/status", methods=["PUT"])
def update_leave_status(leave_id):
    connection = None
    cursor = None

    try:
        data = request.get_json()
        status = data.get("approval_status") if data else None

        if status not in ["APPROVED", "REJECTED"]:
            return jsonify({
                "status": "error",
                "message": "Status must be APPROVED or REJECTED"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE leave_requests
            SET approval_status = %s
            WHERE leave_id = %s
        """, (status, leave_id))

        if cursor.rowcount == 0:
            connection.rollback()
            return jsonify({
                "status": "error",
                "message": "Leave request not found or status unchanged"
            }), 404

        connection.commit()

        return jsonify({
            "status": "success",
            "message": f"Leave request {status.lower()} successfully"
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# --------------------------------
# WEEKLY OFFS
# --------------------------------

@api.route("/weekly-offs", methods=["GET"])
def get_weekly_offs():
    try:
        records = fetch_all("""
            SELECT
                w.weekly_off_id,
                w.employee_id,
                e.employee_code,
                e.full_name,
                w.weekday,
                w.effective_from,
                w.effective_to
            FROM employee_weekly_offs w
            JOIN employees e
                ON w.employee_id = e.employee_id
            ORDER BY w.weekday, e.full_name
        """)

        for record in records:
            record["effective_from"] = str(record["effective_from"])
            record["effective_to"] = (
                str(record["effective_to"])
                if record["effective_to"] else None
            )

        return jsonify({
            "status": "success",
            "total": len(records),
            "weekly_offs": records
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


@api.route("/weekly-offs", methods=["POST"])
def add_weekly_off():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        required_fields = ["employee_id", "weekday", "effective_from"]

        for field in required_fields:
            if not data or data.get(field) is None:
                return jsonify({
                    "status": "error",
                    "message": f"{field} is required"
                }), 400

        weekday = int(data["weekday"])

        if weekday < 0 or weekday > 6:
            return jsonify({
                "status": "error",
                "message": "Weekday must be between 0 and 6"
            }), 400

        effective_to = data.get("effective_to") or None

        if effective_to and effective_to < data["effective_from"]:
            return jsonify({
                "status": "error",
                "message": "Effective end date cannot be before start date"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT COUNT(*)
            FROM employee_weekly_offs
            WHERE employee_id = %s
              AND weekday = %s
              AND (effective_to IS NULL OR effective_to >= %s)
              AND (%s IS NULL OR effective_from <= %s)
        """, (
            data["employee_id"],
            weekday,
            data["effective_from"],
            effective_to,
            effective_to
        ))

        if cursor.fetchone()[0] > 0:
            return jsonify({
                "status": "error",
                "message": "An overlapping weekly-off rule already exists for this employee and weekday"
            }), 409

        cursor.execute("""
            INSERT INTO employee_weekly_offs (
                employee_id,
                weekday,
                effective_from,
                effective_to
            )
            VALUES (%s, %s, %s, %s)
        """, (
            data["employee_id"],
            weekday,
            data["effective_from"],
            effective_to
        ))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Weekly off added successfully",
            "weekly_off_id": cursor.lastrowid
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# PUBLIC HOLIDAYS
# --------------------------------

@api.route("/holidays", methods=["GET"])
def get_holidays():
    try:
        holidays = fetch_all("""
            SELECT
                h.holiday_id,
                h.holiday_name,
                h.holiday_date,
                h.brand_id,
                b.brand_name,
                h.description
            FROM public_holidays h
            LEFT JOIN brands b
                ON h.brand_id = b.brand_id
            ORDER BY h.holiday_date
        """)

        for holiday in holidays:
            holiday["holiday_date"] = str(holiday["holiday_date"])

        return jsonify({
            "status": "success",
            "total": len(holidays),
            "holidays": holidays
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


@api.route("/holidays", methods=["POST"])
def add_holiday():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        if not data or not data.get("holiday_name") or not data.get("holiday_date"):
            return jsonify({
                "status": "error",
                "message": "Holiday name and date are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT COUNT(*)
            FROM public_holidays
            WHERE holiday_date = %s
              AND (
                  brand_id = %s
                  OR (brand_id IS NULL AND %s IS NULL)
              )
        """, (
            data["holiday_date"],
            data.get("brand_id"),
            data.get("brand_id")
        ))

        if cursor.fetchone()[0] > 0:
            return jsonify({
                "status": "error",
                "message": "This holiday already exists for the selected date and scope"
            }), 409

        cursor.execute("""
            INSERT INTO public_holidays (
                holiday_name,
                holiday_date,
                brand_id,
                description
            )
            VALUES (%s, %s, %s, %s)
        """, (
            data["holiday_name"],
            data["holiday_date"],
            data.get("brand_id") or None,
            data.get("description", "")
        ))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Public holiday added successfully",
            "holiday_id": cursor.lastrowid
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()




# --------------------------------
# GENERATE MONTHLY ROSTER
# --------------------------------

from scheduler.roster_engine import generate_monthly_roster


@api.route("/rosters/generate", methods=["POST"])
def generate_roster():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        month = int(data.get("month", 0))
        year = int(data.get("year", 0))

        if month < 1 or month > 12:
            return jsonify({
                "status": "error",
                "message": "Month must be between 1 and 12."
            }), 400

        if year < 2026 or year > 2035:
            return jsonify({
                "status": "error",
                "message": "Please enter a year between 2026 and 2035."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check whether this month's roster already exists
        cursor.execute("""
            SELECT roster_id, status
            FROM rosters
            WHERE roster_month = %s
              AND roster_year = %s
        """, (month, year))

        existing_roster = cursor.fetchone()

        if existing_roster:
            roster_id = existing_roster["roster_id"]

            # Do not overwrite a published roster
            if existing_roster["status"] == "PUBLISHED":
                return jsonify({
                    "status": "error",
                    "message": (
                        "This roster is already published. "
                        "A published roster cannot be regenerated."
                    ),
                    "roster_id": roster_id
                }), 400

            # Remove previous draft/validated data
            cursor.execute("""
                DELETE FROM roster_entries
                WHERE roster_id = %s
            """, (roster_id,))

            cursor.execute("""
                DELETE FROM roster_conflicts
                WHERE roster_id = %s
            """, (roster_id,))

            cursor.execute("""
                UPDATE rosters
                SET status = 'DRAFT',
                    generated_at = CURRENT_TIMESTAMP
                WHERE roster_id = %s
            """, (roster_id,))

        else:
            cursor.execute("""
                INSERT INTO rosters (
                    roster_month,
                    roster_year,
                    status
                )
                VALUES (%s, %s, 'DRAFT')
            """, (month, year))

            roster_id = cursor.lastrowid

        # Generate roster using scheduler
        entries, conflicts = generate_monthly_roster(
            cursor,
            roster_id,
            month,
            year
        )

        # --------------------------------
        # SAVE ROSTER ENTRIES
        # --------------------------------

        if entries:
            entry_values = []

            for entry in entries:
                entry_values.append((
                    entry.get("roster_id", roster_id),
                    entry["employee_id"],
                    entry["assignment_id"],
                    entry["brand_process_id"],
                    entry["work_date"],
                    entry.get(
                        "status",
                        entry.get("work_status", "WORKING")
                    ),
                    entry.get("shift_start"),
                    entry.get("shift_end"),
                    entry.get("notes")
                ))

            cursor.executemany("""
                INSERT INTO roster_entries (
                    roster_id,
                    employee_id,
                    assignment_id,
                    brand_process_id,
                    work_date,
                    work_status,
                    shift_start,
                    shift_end,
                    notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, entry_values)

        # --------------------------------
        # SAVE ROSTER CONFLICTS
        # --------------------------------

        if conflicts:
            conflict_values = []

            for conflict in conflicts:
                severity = str(
                    conflict.get("severity", "ERROR")
                ).upper()

                # Database severity values:
                # ERROR, WARNING, INFO
                if severity == "HIGH":
                    severity = "ERROR"

                if severity not in ["ERROR", "WARNING", "INFO"]:
                    severity = "ERROR"

                conflict_values.append((
                    conflict.get("roster_id", roster_id),
                    conflict["conflict_type"],
                    severity,
                    conflict.get(
                        "date",
                        conflict.get("conflict_date")
                    ),
                    conflict.get("employee_id"),
                    conflict.get("brand_process_id"),
                    conflict["description"],
                    conflict.get("resolution_status", "OPEN")
                ))

            cursor.executemany("""
                INSERT INTO roster_conflicts (
                    roster_id,
                    conflict_type,
                    severity,
                    conflict_date,
                    employee_id,
                    brand_process_id,
                    description,
                    resolution_status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, conflict_values)

        # Save all generated records
        connection.commit()

        # --------------------------------
        # FETCH GENERATED ROSTER
        # --------------------------------

        cursor.execute("""
            SELECT
                re.entry_id,
                e.full_name,
                b.brand_name,
                p.process_name,
                DATE_FORMAT(
                    re.work_date,
                    '%Y-%m-%d'
                ) AS work_date,
                re.work_status
            FROM roster_entries re

            JOIN employees e
                ON re.employee_id = e.employee_id

            JOIN assignments a
                ON re.assignment_id = a.assignment_id

            JOIN brand_processes bp
                ON re.brand_process_id = bp.brand_process_id

            JOIN brands b
                ON bp.brand_id = b.brand_id

            JOIN processes p
                ON bp.process_id = p.process_id

            WHERE re.roster_id = %s

            ORDER BY
                re.work_date,
                e.full_name
        """, (roster_id,))

        roster_data = cursor.fetchall()

        # --------------------------------
        # FETCH CONFLICTS
        # --------------------------------

        cursor.execute("""
            SELECT
                conflict_id,
                conflict_type,
                severity,
                DATE_FORMAT(
                    conflict_date,
                    '%Y-%m-%d'
                ) AS conflict_date,
                description,
                resolution_status
            FROM roster_conflicts
            WHERE roster_id = %s
            ORDER BY conflict_date
        """, (roster_id,))

        conflict_data = cursor.fetchall()

        return jsonify({
            "status": "success",
            "message": "Monthly roster generated successfully!",
            "roster_id": roster_id,
            "roster_status": "DRAFT",
            "total_entries": len(roster_data),
            "total_conflicts": len(conflict_data),
            "entries": roster_data,
            "conflicts": conflict_data
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# =========================================================
# ROSTER LIST, VALIDATION AND PUBLISHING
# =========================================================


# --------------------------------
# GET ALL GENERATED ROSTERS
# --------------------------------

@api.route("/rosters", methods=["GET"])
def get_rosters():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                r.roster_id,
                r.roster_month,
                r.roster_year,
                r.status,
                r.generated_at,

                COUNT(DISTINCT re.entry_id)
                    AS total_entries,

                COUNT(
                    DISTINCT CASE
                        WHEN rc.resolution_status = 'OPEN'
                        THEN rc.conflict_id
                    END
                ) AS open_conflicts

            FROM rosters r

            LEFT JOIN roster_entries re
                ON r.roster_id = re.roster_id

            LEFT JOIN roster_conflicts rc
                ON r.roster_id = rc.roster_id

            GROUP BY
                r.roster_id,
                r.roster_month,
                r.roster_year,
                r.status,
                r.generated_at

            ORDER BY
                r.roster_year DESC,
                r.roster_month DESC
        """)

        rosters = cursor.fetchall()

        for roster in rosters:
            if roster.get("generated_at"):
                roster["generated_at"] = str(
                    roster["generated_at"]
                )

        return jsonify({
            "status": "success",
            "total": len(rosters),
            "rosters": rosters
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# VALIDATE ROSTER
# --------------------------------

@api.route(
    "/rosters/validate/<int:roster_id>",
    methods=["POST"]
)
def validate_roster(roster_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check roster exists
        cursor.execute("""
            SELECT roster_id, status
            FROM rosters
            WHERE roster_id = %s
        """, (roster_id,))

        roster = cursor.fetchone()

        if not roster:
            return jsonify({
                "status": "error",
                "message": "Roster not found."
            }), 404

        if roster["status"] == "PUBLISHED":
            return jsonify({
                "status": "error",
                "message": "Published rosters cannot be validated again."
            }), 400

        # Check roster entries
        cursor.execute("""
            SELECT COUNT(*) AS total_entries
            FROM roster_entries
            WHERE roster_id = %s
        """, (roster_id,))

        total_entries = int(
            cursor.fetchone()["total_entries"]
        )

        if total_entries == 0:
            return jsonify({
                "status": "error",
                "message": "Cannot validate an empty roster."
            }), 400

        # Get unresolved conflicts
        cursor.execute("""
            SELECT
                conflict_id,
                conflict_type,
                severity,
                resolution_status,
                description
            FROM roster_conflicts
            WHERE roster_id = %s
              AND resolution_status = 'OPEN'
            ORDER BY conflict_id
        """, (roster_id,))

        open_conflicts = cursor.fetchall()

        blocking_conflicts = [
            conflict
            for conflict in open_conflicts
            if str(conflict.get("severity", "")).upper()
            in ["ERROR", "HIGH"]
        ]

        if blocking_conflicts:
            return jsonify({
                "status": "error",
                "message": (
                    "Roster validation failed. "
                    "Resolve ERROR or HIGH conflicts first."
                ),
                "roster_id": roster_id,
                "total_entries": total_entries,
                "total_open_conflicts": len(open_conflicts),
                "blocking_conflicts": len(blocking_conflicts),
                "conflicts": blocking_conflicts
            }), 400

        # Update roster status
        cursor.execute("""
            UPDATE rosters
            SET status = 'VALIDATED'
            WHERE roster_id = %s
        """, (roster_id,))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Roster validated successfully!",
            "roster_id": roster_id,
            "roster_status": "VALIDATED",
            "total_entries": total_entries,
            "total_open_conflicts": len(open_conflicts)
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------
# PUBLISH ROSTER
# --------------------------------

@api.route(
    "/rosters/publish/<int:roster_id>",
    methods=["POST"]
)
def publish_roster(roster_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check roster exists
        cursor.execute("""
            SELECT roster_id, status
            FROM rosters
            WHERE roster_id = %s
        """, (roster_id,))

        roster = cursor.fetchone()

        if not roster:
            return jsonify({
                "status": "error",
                "message": "Roster not found."
            }), 404

        # Already published
        if roster["status"] == "PUBLISHED":
            return jsonify({
                "status": "success",
                "message": "This roster is already published.",
                "roster_id": roster_id,
                "roster_status": "PUBLISHED"
            }), 200

        # Only validated rosters can be published
        if roster["status"] != "VALIDATED":
            return jsonify({
                "status": "error",
                "message": (
                    "Only VALIDATED rosters can be published. "
                    "Validate the roster first."
                )
            }), 400

        # Recheck blocking conflicts
        cursor.execute("""
            SELECT COUNT(*) AS blocking_conflicts
            FROM roster_conflicts
            WHERE roster_id = %s
              AND resolution_status = 'OPEN'
              AND severity IN ('ERROR', 'HIGH')
        """, (roster_id,))

        blocking_conflicts = int(
            cursor.fetchone()["blocking_conflicts"]
        )

        if blocking_conflicts > 0:
            return jsonify({
                "status": "error",
                "message": (
                    "Roster cannot be published because "
                    "unresolved blocking conflicts exist."
                ),
                "blocking_conflicts": blocking_conflicts
            }), 400

        # Publish roster
        cursor.execute("""
            UPDATE rosters
            SET status = 'PUBLISHED'
            WHERE roster_id = %s
        """, (roster_id,))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Roster published successfully!",
            "roster_id": roster_id,
            "roster_status": "PUBLISHED"
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
