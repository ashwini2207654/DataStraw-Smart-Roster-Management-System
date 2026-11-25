
import { useEffect, useState } from "react";
import { Search, RefreshCw, Building2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadBrands() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/brands`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load brands.");
      }

      setBrands(data.brands || []);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrands();
  }, []);

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch =
      brand.brand_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || brand.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = brands.filter(
    (brand) => brand.status === "ACTIVE"
  ).length;

  const inactiveCount = brands.filter(
    (brand) => brand.status === "INACTIVE"
  ).length;

  return (
    <div style={{ padding: "10px" }}>

      {/* Page Heading */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div>
          <h1 style={{ marginBottom: "6px" }}>Brand Management</h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            View and manage all company brands.
          </p>
        </div>

        <button
          onClick={loadBrands}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "1px solid #ddd",
            borderRadius: "7px",
            background: "white",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "18px",
        marginBottom: "25px"
      }}>
        <div style={cardStyle}>
          <Building2 color="#4f46e5" size={25} />
          <h2>{brands.length}</h2>
          <p>Total Brands</p>
        </div>

        <div style={cardStyle}>
          <Building2 color="#16a34a" size={25} />
          <h2>{activeCount}</h2>
          <p>Active Brands</p>
        </div>

        <div style={cardStyle}>
          <Building2 color="#dc2626" size={25} />
          <h2>{inactiveCount}</h2>
          <p>Inactive Brands</p>
        </div>
      </div>

      {/* Brands Table */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "22px",
        border: "1px solid #e5e7eb"
      }}>
        <h2 style={{ marginTop: 0 }}>All Brands</h2>

        {/* Search and Filter */}
        <div style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #ddd",
            borderRadius: "7px",
            padding: "0 12px",
            flex: 1,
            minWidth: "200px"
          }}>
            <Search size={17} color="#64748b" />

            <input
              type="text"
              placeholder="Search brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                padding: "11px 0",
                width: "100%"
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "7px"
            }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        {loading ? (
          <p>Loading brands...</p>
        ) : filteredBrands.length === 0 ? (
          <p style={{ textAlign: "center", padding: "30px" }}>
            No brands found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={cellStyle}>Brand ID</th>
                  <th style={cellStyle}>Brand Name</th>
                  <th style={cellStyle}>Description</th>
                  <th style={cellStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBrands.map((brand) => (
                  <tr key={brand.brand_id}>
                    <td style={cellStyle}>
                      {brand.brand_id}
                    </td>

                    <td style={{
                      ...cellStyle,
                      fontWeight: "600"
                    }}>
                      {brand.brand_name}
                    </td>

                    <td style={cellStyle}>
                      {brand.description || "-"}
                    </td>

                    <td style={cellStyle}>
                      <span style={{
                        background: brand.status === "ACTIVE"
                          ? "#dcfce7"
                          : "#fee2e2",
                        color: brand.status === "ACTIVE"
                          ? "#166534"
                          : "#991b1b",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {brand.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{
          color: "#64748b",
          textAlign: "right",
          marginTop: "18px",
          fontSize: "13px"
        }}>
          Showing {filteredBrands.length} of {brands.length} brands
        </p>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  minHeight: "110px"
};

const cellStyle = {
  padding: "14px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px"
};

export default Brands;
