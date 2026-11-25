
import { useEffect, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Availability() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: "",
    date: new Date().toISOString().slice(0, 10),
    availability_status: "AVAILABLE",
    reason: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load employees
  async function loadEmployees() {
    const response = await fetch(`${API_BASE_URL}/employees`);

    if (!response.ok) {
      throw new Error("Unable to load employees.");
    }

    const data = await response.json();

    setEmployees(
      (data.employees || []).filter(
        (employee) => employee.employment_status === "ACTIVE"
      )
    );
  }

  // Load availability records
  async function loadAvailability() {
    const response = await fetch(`${API_BASE_URL}/availability`);

    if (!response.ok) {
      throw new Error("Unable to load availability records.");
    }

    const data = await response.json();
    setRecords(data.availability || []);
  }

  // Load page data
  async function loadPageData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadEmployees(),
        loadAvailability()
      ]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  // Handle input changes
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // Save availability
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save availability.");
      }

      setMessage(data.message || "Availability saved successfully.");

      await loadAvailability();

      setFormData((previous) => ({
        ...previous,
        reason: ""
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="employees-page">

      {/* Heading */}
      <div className="employee-heading">
        <div>
          <h1>Employee Availability</h1>
          <p>Manage employee availability for roster planning.</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadPageData}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="employee-summary">
        <div className="employee-summary-icon">
          <Users size={24} />
        </div>

        <div>
          <h2>{records.length}</h2>
          <p>Availability Records</p>
        </div>
      </div>

      {/* Availability Form */}
      <div className="add-employee-card">
        <h2>Mark Employee Availability</h2>
        <p>Select an employee and enter their availability details.</p>

        <form onSubmit={handleSubmit}>

          <div className="employee-form-grid">

            <div className="employee-form-group">
              <label>Employee *</label>

              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
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

            <div className="employee-form-group">
              <label>Date *</label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="employee-form-group">
              <label>Availability Status *</label>

              <select
                name="availability_status"
                value={formData.availability_status}
                onChange={handleChange}
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>

            <div className="employee-form-group">
              <label>Reason</label>

              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter reason"
              />
            </div>

          </div>

          {message && (
            <p className="employee-form-message">{message}</p>
          )}

          {error && (
            <p className="employee-form-message error-text">{error}</p>
          )}

          <button
            type="submit"
            className="save-employee-button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>

        </form>
      </div>

      {/* Availability Records */}
      <div className="employee-table-card">

        <div className="employee-toolbar">
          <h2>Availability Records</h2>
        </div>

        {loading ? (
          <div className="employee-message">
            Loading availability records...
          </div>
        ) : error && records.length === 0 ? (
          <div className="employee-message error-text">
            {error}
          </div>
        ) : (
          <div className="employee-table-wrapper">

            <table className="employee-table">

              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>EMPLOYEE ID</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>REASON</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr key={`${record.employee_id}-${record.date}-${index}`}>

                    <td>{record.full_name}</td>
                    <td>{record.employee_code}</td>
                    <td>{record.date}</td>

                    <td>
                      {record.availability_status === "AVAILABLE" ? (
                        <span className="status-badge status-active">
                          <CheckCircle size={13} /> Available
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">
                          <XCircle size={13} /> Unavailable
                        </span>
                      )}
                    </td>

                    <td>{record.reason || "-"}</td>

                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-employees">
                      No availability records found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>
        )}

        <div className="employee-table-footer">
          Total records: {records.length}
        </div>

      </div>

    </div>
  );
}

export default Availability;
