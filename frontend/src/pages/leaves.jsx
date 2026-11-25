
import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  CalendarDays,
  CheckCircle,
  XCircle
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Leaves() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "PLANNED",
    start_date: "",
    end_date: "",
    reason: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeeResponse, leaveResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/employees`),
        fetch(`${API_BASE_URL}/leaves`)
      ]);

      if (!employeeResponse.ok || !leaveResponse.ok) {
        throw new Error("Failed to load leave management data");
      }

      const employeeData = await employeeResponse.json();
      const leaveData = await leaveResponse.json();

      setEmployees(
        (employeeData.employees || []).filter(
          (employee) => employee.employment_status === "ACTIVE"
        )
      );

      setLeaves(leaveData.leaves || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add leave request");
      }

      setMessage("Leave request added successfully!");

      setFormData({
        employee_id: "",
        leave_type: "PLANNED",
        start_date: "",
        end_date: "",
        reason: ""
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (leaveId, status) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} this leave request?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/leaves/${leaveId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            approval_status: status
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update leave status");
      }

      setMessage(`Leave request ${status.toLowerCase()} successfully!`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredLeaves = leaves.filter((leave) =>
    [
      leave.employee_code,
      leave.full_name,
      leave.leave_type,
      leave.approval_status
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const pendingCount = leaves.filter(
    (leave) => leave.approval_status === "PENDING"
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.approval_status === "APPROVED"
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.approval_status === "REJECTED"
  ).length;

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    flex: "1",
    minWidth: "150px"
  };

  const inputStyle = {
    width: "100%",
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "14px",
    boxSizing: "border-box"
  };

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
          <h2 style={{ margin: 0, fontSize: "24px" }}>Leave Management</h2>
          <p style={{ color: "#6b7280", marginTop: "6px" }}>
            Manage employee leave requests and approvals.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            padding: "10px 15px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            background: "#fff",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={15} style={{ marginRight: "7px", verticalAlign: "middle" }} />
          Refresh
        </button>
      </div>

      {message && (
        <p style={{ color: "#15803d", background: "#dcfce7", padding: "12px", borderRadius: "7px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "#b91c1c", background: "#fee2e2", padding: "12px", borderRadius: "7px" }}>
          {error}
        </p>
      )}

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "24px"
      }}>
        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Total Requests</p>
          <h2>{leaves.length}</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Pending</p>
          <h2 style={{ color: "#d97706" }}>{pendingCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Approved</p>
          <h2 style={{ color: "#15803d" }}>{approvedCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Rejected</p>
          <h2 style={{ color: "#dc2626" }}>{rejectedCount}</h2>
        </div>
      </div>

      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "22px",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0 }}>
          <Plus size={18} style={{ verticalAlign: "middle", marginRight: "7px" }} />
          Add Leave Request
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px"
          }}>
            <div>
              <label>Employee</label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
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
              <label>Leave Type</label>
              <select
                name="leave_type"
                value={formData.leave_type}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="PLANNED">Planned Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="COMP_OFF">Comp-Off</option>
              </select>
            </div>

            <div>
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date || undefined}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label>Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for leave"
              rows="3"
              style={{ ...inputStyle, marginTop: "6px" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "16px",
              padding: "11px 18px",
              border: "none",
              borderRadius: "7px",
              background: "#2563eb",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1
            }}
          >
            <Plus size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {saving ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </div>

      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "22px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px"
        }}>
          <h3 style={{ margin: 0 }}>
            <CalendarDays size={18} style={{ marginRight: "7px", verticalAlign: "middle" }} />
            Leave Requests
          </h3>

          <div style={{ position: "relative", width: "250px", maxWidth: "100%" }}>
            <Search
              size={17}
              style={{
                position: "absolute",
                left: "10px",
                top: "11px",
                color: "#9ca3af"
              }}
            />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ ...inputStyle, paddingLeft: "35px" }}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading leave requests...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "850px"
            }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  {[
                    "Employee",
                    "Leave Type",
                    "Start Date",
                    "End Date",
                    "Reason",
                    "Status",
                    "Actions"
                  ].map((heading) => (
                    <th key={heading} style={{
                      padding: "13px",
                      borderBottom: "1px solid #e5e7eb"
                    }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.leave_id}>
                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      <strong>{leave.full_name}</strong>
                      <br />
                      <small>{leave.employee_code}</small>
                    </td>

                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      {leave.leave_type}
                    </td>

                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      {leave.start_date}
                    </td>

                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      {leave.end_date}
                    </td>

                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      {leave.reason || "-"}
                    </td>

                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      {leave.approval_status}
                    </td>

                    <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                      {leave.approval_status === "PENDING" ? (
                        <div style={{ display: "flex", gap: "7px" }}>
                          <button
                            onClick={() => updateStatus(leave.leave_id, "APPROVED")}
                            title="Approve"
                            style={{
                              background: "#dcfce7",
                              color: "#15803d",
                              border: "none",
                              padding: "7px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <CheckCircle size={17} />
                          </button>

                          <button
                            onClick={() => updateStatus(leave.leave_id, "REJECTED")}
                            title="Reject"
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              padding: "7px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <XCircle size={17} />
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}

                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{
                      padding: "25px",
                      textAlign: "center",
                      color: "#6b7280"
                    }}>
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaves;
