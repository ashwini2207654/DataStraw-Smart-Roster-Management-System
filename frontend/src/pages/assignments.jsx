
import { useEffect, useState } from "react";
import { Search, RefreshCw, ClipboardList } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/assignments`);

      if (!response.ok) {
        throw new Error("Failed to load assignments");
      }

      const data = await response.json();
      setAssignments(data.assignments || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const filteredAssignments = assignments.filter((item) =>
    [
      item.employee_code,
      item.full_name,
      item.brand_name,
      item.process_name,
      item.status
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Employee Assignments</h1>
          <p>View employee, brand and process assignments.</p>
        </div>

        <button onClick={loadAssignments}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <ClipboardList size={22} />
          <h2>{assignments.length}</h2>
          <p>Total Assignments</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div>
            <h3>Assignment Records</h3>
            <p>All employee assignments</p>
          </div>

          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search employee, brand or process..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading assignments...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Brand</th>
                  <th>Process</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((item) => (
                    <tr key={item.assignment_id}>
                      <td>{item.assignment_id}</td>
                      <td>{item.employee_code}</td>
                      <td>{item.full_name}</td>
                      <td>{item.brand_name}</td>
                      <td>{item.process_name}</td>
                      <td>{item.effective_from || "-"}</td>
                      <td>{item.effective_to || "Ongoing"}</td>
                      <td>
                        <span className="status-badge">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No assignments found.
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

export default Assignments;
