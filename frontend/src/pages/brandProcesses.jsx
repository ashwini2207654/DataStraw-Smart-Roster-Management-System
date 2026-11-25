
import { useEffect, useState } from "react";
import { Search, RefreshCw, Network } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function BrandProcesses() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadBrandProcesses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/brand-processes`);

      if (!response.ok) {
        throw new Error("Failed to load brand processes");
      }

      const data = await response.json();
      setRecords(data.brand_processes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrandProcesses();
  }, []);

  const filteredRecords = records.filter((record) =>
    `${record.brand_name} ${record.process_name} ${record.working_rule}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Brand–Process Management</h1>
          <p>View process assignments and working rules for each brand.</p>
        </div>

        <button onClick={loadBrandProcesses} className="refresh-button">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Network size={24} />
          <h3>Total Brand Processes</h3>
          <h2>{records.length}</h2>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Brand Process Records</h2>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search brand or process..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading brand processes...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Brand</th>
                <th>Process</th>
                <th>Working Rule</th>
                <th>Minimum Staff</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.brand_process_id}>
                    <td>{record.brand_process_id}</td>
                    <td>{record.brand_name}</td>
                    <td>{record.process_name}</td>
                    <td>{record.working_rule}</td>
                    <td>{record.minimum_staff}</td>
                    <td>{record.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BrandProcesses;
