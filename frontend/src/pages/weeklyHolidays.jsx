
import { useEffect, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Plus,
  Search
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function WeeklyHolidays() {
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [weeklyOffs, setWeeklyOffs] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [weeklyForm, setWeeklyForm] = useState({
    employee_id: "",
    weekday: "0",
    effective_from: "2026-01-01",
    effective_to: ""
  });

  const [holidayForm, setHolidayForm] = useState({
    holiday_name: "",
    holiday_date: "",
    brand_id: "",
    description: ""
  });

  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    boxSizing: "border-box",
    fontSize: "14px"
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "22px"
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/employees`),
        fetch(`${API_BASE_URL}/brands`),
        fetch(`${API_BASE_URL}/weekly-offs`),
        fetch(`${API_BASE_URL}/holidays`)
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("Unable to load weekly offs and holidays");
      }

      const [employeeData, brandData, weeklyData, holidayData] =
        await Promise.all(responses.map((response) => response.json()));

      setEmployees(
        (employeeData.employees || []).filter(
          (employee) => employee.employment_status === "ACTIVE"
        )
      );

      setBrands(brandData.brands || []);
      setWeeklyOffs(weeklyData.weekly_offs || []);
      setHolidays(holidayData.holidays || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWeeklyChange = (event) => {
    setWeeklyForm({
      ...weeklyForm,
      [event.target.name]: event.target.value
    });
  };

  const handleHolidayChange = (event) => {
    setHolidayForm({
      ...holidayForm,
      [event.target.name]: event.target.value
    });
  };

  const addWeeklyOff = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/weekly-offs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(weeklyForm)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add weekly off");
      }

      setMessage("Weekly off added successfully!");

      setWeeklyForm({
        employee_id: "",
        weekday: "0",
        effective_from: "2026-01-01",
        effective_to: ""
      });

      await loadData();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(holidayForm)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add holiday");
      }

      setMessage("Public holiday added successfully!");

      setHolidayForm({
        holiday_name: "",
        holiday_date: "",
        brand_id: "",
        description: ""
      });

      await loadData();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredWeeklyOffs = weeklyOffs.filter((record) =>
    [
      record.employee_code,
      record.full_name,
      weekdays[record.weekday]
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredHolidays = holidays.filter((holiday) =>
    [
      holiday.holiday_name,
      holiday.brand_name,
      holiday.description
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "4px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "22px"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px" }}>
            Weekly Offs & Public Holidays
          </h2>
          <p style={{ color: "#6b7280" }}>
            Manage employee weekly offs and company holidays.
          </p>
        </div>

        <button onClick={loadData} style={{
          padding: "10px 15px",
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: "7px",
          cursor: "pointer"
        }}>
          <RefreshCw size={15} style={{ marginRight: "7px", verticalAlign: "middle" }} />
          Refresh
        </button>
      </div>

      {message && (
        <p style={{
          color: "#15803d",
          background: "#dcfce7",
          padding: "12px",
          borderRadius: "7px"
        }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{
          color: "#b91c1c",
          background: "#fee2e2",
          padding: "12px",
          borderRadius: "7px"
        }}>
          {error}
        </p>
      )}

      <div style={cardStyle}>
        <h3>Assign Employee Weekly Off</h3>

        <form onSubmit={addWeeklyOff}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "15px"
          }}>
            <div>
              <label>Employee</label>
              <select
                name="employee_id"
                value={weeklyForm.employee_id}
                onChange={handleWeeklyChange}
                required
                style={inputStyle}
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}
                  >
                    {employee.employee_code} - {employee.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Weekly Off Day</label>
              <select
                name="weekday"
                value={weeklyForm.weekday}
                onChange={handleWeeklyChange}
                style={inputStyle}
              >
                {weekdays.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Effective From</label>
              <input
                type="date"
                name="effective_from"
                value={weeklyForm.effective_from}
                onChange={handleWeeklyChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Effective To (Optional)</label>
              <input
                type="date"
                name="effective_to"
                value={weeklyForm.effective_to}
                onChange={handleWeeklyChange}
                min={weeklyForm.effective_from}
                style={inputStyle}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            marginTop: "17px",
            padding: "11px 18px",
            border: "none",
            borderRadius: "7px",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer"
          }}>
            <Plus size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {saving ? "Saving..." : "Add Weekly Off"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Add Public Holiday</h3>

        <form onSubmit={addHoliday}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "15px"
          }}>
            <div>
              <label>Holiday Name</label>
              <input
                name="holiday_name"
                value={holidayForm.holiday_name}
                onChange={handleHolidayChange}
                placeholder="e.g. Independence Day"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Holiday Date</label>
              <input
                type="date"
                name="holiday_date"
                value={holidayForm.holiday_date}
                onChange={handleHolidayChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Brand (Optional)</label>
              <select
                name="brand_id"
                value={holidayForm.brand_id}
                onChange={handleHolidayChange}
                style={inputStyle}
              >
                <option value="">All Brands (Company Holiday)</option>
                {brands.map((brand) => (
                  <option key={brand.brand_id} value={brand.brand_id}>
                    {brand.brand_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Description</label>
              <input
                name="description"
                value={holidayForm.description}
                onChange={handleHolidayChange}
                placeholder="Optional description"
                style={inputStyle}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            marginTop: "17px",
            padding: "11px 18px",
            border: "none",
            borderRadius: "7px",
            background: "#15803d",
            color: "#fff",
            cursor: "pointer"
          }}>
            <Plus size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {saving ? "Saving..." : "Add Public Holiday"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Weekly Off Records ({weeklyOffs.length})</h3>

        <div style={{ position: "relative", maxWidth: "320px", marginBottom: "15px" }}>
          <Search size={17} style={{
            position: "absolute",
            left: "10px",
            top: "11px",
            color: "#9ca3af"
          }} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            style={{ ...inputStyle, paddingLeft: "35px" }}
          />
        </div>

        {loading ? (
          <p>Loading records...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "650px"
            }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Employee</th>
                  <th style={{ padding: "12px" }}>Weekly Off</th>
                  <th style={{ padding: "12px" }}>Effective From</th>
                  <th style={{ padding: "12px" }}>Effective To</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeeklyOffs.map((record) => (
                  <tr key={record.weekly_off_id}>
                    <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                      {record.employee_code} - {record.full_name}
                    </td>
                    <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                      {weekdays[record.weekday]}
                    </td>
                    <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                      {record.effective_from}
                    </td>
                    <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                      {record.effective_to || "Until changed"}
                    </td>
                  </tr>
                ))}

                {filteredWeeklyOffs.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: "20px", textAlign: "center" }}>
                      No weekly off records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3>
          <CalendarDays size={18} style={{ marginRight: "7px", verticalAlign: "middle" }} />
          Public Holidays ({holidays.length})
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "650px"
          }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Holiday Name</th>
                <th style={{ padding: "12px" }}>Date</th>
                <th style={{ padding: "12px" }}>Scope</th>
                <th style={{ padding: "12px" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredHolidays.map((holiday) => (
                <tr key={holiday.holiday_id}>
                  <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                    {holiday.holiday_name}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                    {holiday.holiday_date}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                    {holiday.brand_name || "All Brands"}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #eee" }}>
                    {holiday.description || "-"}
                  </td>
                </tr>
              ))}

              {filteredHolidays.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: "20px", textAlign: "center" }}>
                    No public holidays found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WeeklyHolidays;
