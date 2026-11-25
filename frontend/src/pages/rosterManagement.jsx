
import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5000/api";

// Convert date into readable format
function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = String(dateValue).split("T")[0];

  return date;
}

// Get status from different possible backend field names
function getRosterStatus(entry) {
  const possibleStatusFields = [
    "status",
    "entry_status",
    "roster_status",
    "schedule_status",
    "attendance_status",
    "work_status"
  ];

  for (const field of possibleStatusFields) {
    if (
      entry[field] !== undefined &&
      entry[field] !== null &&
      String(entry[field]).trim() !== ""
    ) {
      return String(entry[field]).toUpperCase();
    }
  }

  return "NOT PROVIDED";
}

// Status badge color class
function getStatusClass(status) {
  const normalizedStatus = String(status).toUpperCase();

  if (
    normalizedStatus === "WORKING" ||
    normalizedStatus === "PRESENT" ||
    normalizedStatus === "ASSIGNED"
  ) {
    return "status-working";
  }

  if (
    normalizedStatus === "WEEKLY_OFF" ||
    normalizedStatus === "WEEKLY OFF" ||
    normalizedStatus === "OFF"
  ) {
    return "status-off";
  }

  if (
    normalizedStatus === "LEAVE" ||
    normalizedStatus === "ON_LEAVE"
  ) {
    return "status-leave";
  }

  if (
    normalizedStatus === "HOLIDAY" ||
    normalizedStatus === "PUBLIC_HOLIDAY"
  ) {
    return "status-holiday";
  }

  if (
    normalizedStatus === "COMP_OFF" ||
    normalizedStatus === "COMPENSATORY_OFF"
  ) {
    return "status-comp-off";
  }

  if (
    normalizedStatus === "NOT PROVIDED"
  ) {
    return "status-missing";
  }

  return "status-default";
}

export default function RosterManagement() {
  const today = new Date();

  const [month, setMonth] = useState(
    String(today.getMonth() + 1)
  );

  const [year, setYear] = useState(
    String(today.getFullYear())
  );

  const [roster, setRoster] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function generateRoster() {
    setLoading(true);
    setMessage("");
    setError("");
    setRoster([]);
    setConflicts([]);

    try {
      if (!month || !year) {
        throw new Error(
          "Please select month and year."
        );
      }

      const selectedMonth = Number(month);
      const selectedYear = Number(year);

      if (
        selectedMonth < 1 ||
        selectedMonth > 12 ||
        selectedYear < 2026 ||
        selectedYear > 2035
      ) {
        throw new Error(
          "Please select a valid month and year."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/rosters/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            month: selectedMonth,
            year: selectedYear
          })
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Backend returned an invalid response. HTTP Status: ${response.status}`
        );
      }

      if (
        !response.ok ||
        data.status === "error"
      ) {
        throw new Error(
          data.message ||
          `Roster generation failed. HTTP Status: ${response.status}`
        );
      }

      const rosterEntries = Array.isArray(data.entries)
        ? data.entries
        : [];

      const rosterConflicts = Array.isArray(data.conflicts)
        ? data.conflicts
        : [];

      // Debug information for checking backend response
      console.log(
        "Roster API response:",
        data
      );

      console.log(
        "First roster entry:",
        rosterEntries[0]
      );

      setRoster(rosterEntries);
      setConflicts(rosterConflicts);

      setMessage(
        data.message ||
        "Roster generated successfully!"
      );
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to backend. Make sure Flask is running at http://127.0.0.1:5000"
        );
      } else {
        setError(
          err.message ||
          "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Roster Management</h2>

          <p>
            Generate and manage monthly employee schedules.
          </p>
        </div>
      </div>

      {/* Generate Roster */}
      <div className="content-card">
        <h3>Generate Monthly Roster</h3>

        <div className="form-row">

          <div className="form-group">
            <label>Month</label>

            <select
              value={month}
              onChange={(e) =>
                setMonth(e.target.value)
              }
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
              ].map((name, index) => (
                <option
                  key={name}
                  value={index + 1}
                >
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Year</label>

            <input
              type="number"
              min="2026"
              max="2035"
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
              }
            />
          </div>

          <button
            onClick={generateRoster}
            disabled={
              loading ||
              !month ||
              !year
            }
          >
            {loading
              ? "Generating Roster..."
              : "Generate Roster"}
          </button>

        </div>

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
      </div>

      {/* Generated Roster */}
      <div className="content-card">

        <h3>
          Generated Roster ({roster.length})
        </h3>

        {loading ? (
          <p>
            Generating employee schedules...
          </p>
        ) : roster.length === 0 ? (
          <p>
            No roster generated yet.
            Select a month and click Generate Roster.
          </p>
        ) : (
          <div className="table-responsive">

            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Brand</th>
                  <th>Process</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {roster.map((entry, index) => {
                  const status = getRosterStatus(entry);

                  return (
                    <tr
                      key={
                        entry.roster_entry_id ||
                        index
                      }
                    >
                      <td>
                        {entry.full_name || "-"}
                      </td>

                      <td>
                        {entry.brand_name || "-"}
                      </td>

                      <td>
                        {entry.process_name || "-"}
                      </td>

                      <td>
                        {formatDate(entry.work_date)}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(status)}`}
                        >
                          {status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
        )}
      </div>

      {/* Roster Conflicts */}
      <div className="content-card">

        <h3>
          Roster Conflicts ({conflicts.length})
        </h3>

        {conflicts.length === 0 ? (
          <p>
            No conflicts reported.
          </p>
        ) : (
          <div className="table-responsive">

            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>

              <tbody>
                {conflicts.map((conflict, index) => (
                  <tr
                    key={
                      conflict.conflict_id ||
                      index
                    }
                  >
                    <td>
                      {conflict.conflict_type || "-"}
                    </td>

                    <td>
                      {conflict.severity || "-"}
                    </td>

                    <td>
                      {formatDate(
                        conflict.conflict_date
                      )}
                    </td>

                    <td>
                      {conflict.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>

    </div>
  );
}
