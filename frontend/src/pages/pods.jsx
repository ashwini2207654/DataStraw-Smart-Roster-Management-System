
import { useEffect, useState } from "react";
import { Search, RefreshCw, Users, Building2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Pods() {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadPods = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/pods`);

      if (!response.ok) {
        throw new Error("Failed to load pods");
      }

      const data = await response.json();
      setPods(data.pods || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPods();
  }, []);

  const filteredPods = pods.filter((pod) =>
    `${pod.pod_name} ${pod.pod_lead || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalEmployees = pods.reduce(
    (total, pod) => total + Number(pod.employee_count || 0),
    0
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Pods Management</h1>
          <p>View and manage your company pods.</p>
        </div>

        <button onClick={loadPods} className="refresh-button">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Building2 size={24} />
          <h3>Total Pods</h3>
          <h2>{pods.length}</h2>
        </div>

        <div className="stat-card">
          <Users size={24} />
          <h3>Total Employees</h3>
          <h2>{totalEmployees}</h2>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Pods</h2>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search pods or pod lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading pods...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pod ID</th>
                <th>Pod Name</th>
                <th>Pod Lead</th>
                <th>Employee Count</th>
              </tr>
            </thead>

            <tbody>
              {filteredPods.length > 0 ? (
                filteredPods.map((pod) => (
                  <tr key={pod.pod_id}>
                    <td>{pod.pod_id}</td>
                    <td>{pod.pod_name}</td>
                    <td>{pod.pod_lead || "Not Assigned"}</td>
                    <td>{pod.employee_count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No pods found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Pods;
