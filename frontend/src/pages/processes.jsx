
import { useEffect, useState } from "react";
import { Search, RefreshCw, BriefcaseBusiness } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Processes() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadProcesses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/processes`);

      if (!response.ok) {
        throw new Error("Failed to load processes");
      }

      const data = await response.json();
      setProcesses(data.processes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const filteredProcesses = processes.filter((process) =>
    `${process.process_name} ${process.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Processes Management</h1>
          <p>View all business processes in your organization.</p>
        </div>

        <button onClick={loadProcesses} className="refresh-button">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <BriefcaseBusiness size={24} />
          <h3>Total Processes</h3>
          <h2>{processes.length}</h2>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Processes</h2>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search processes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading processes...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Process ID</th>
                <th>Process Name</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {filteredProcesses.length > 0 ? (
                filteredProcesses.map((process) => (
                  <tr key={process.process_id}>
                    <td>{process.process_id}</td>
                    <td>{process.process_name}</td>
                    <td>{process.description || "No description"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No processes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Processes;
