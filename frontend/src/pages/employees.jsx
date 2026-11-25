
import { useState, useEffect } from "react";
import {
  Search,
  Users,
  RefreshCw,
  Plus,
  X,
  Pencil,
  UserX
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
  employee_code: "",
  full_name: "",
  email: "",
  phone: "",
  pod_id: "",
  joining_date: ""
};

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pods, setPods] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  const [formData, setFormData] = useState(emptyForm);

  // Load employees
  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/employees`);

      if (!response.ok) {
        throw new Error("Unable to fetch employees.");
      }

      const data = await response.json();
      setEmployees(data.employees || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load pods
  async function loadPods() {
    try {
      const response = await fetch(`${API_BASE_URL}/pods`);

      if (!response.ok) {
        throw new Error("Unable to fetch pods.");
      }

      const data = await response.json();
      setPods(data.pods || []);

    } catch (err) {
      setFormMessage(err.message);
    }
  }

  useEffect(() => {
    loadEmployees();
    loadPods();
  }, []);

  // Handle form inputs
  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  }

  // Open Add Employee form
  function handleAddNew() {
    setEditingEmployeeId(null);
    setFormData(emptyForm);
    setFormMessage("");
    setShowForm(true);
  }

  // Open Edit Employee form
  function handleEdit(employee) {
    setFormData({
      employee_code: employee.employee_code || "",
      full_name: employee.full_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      pod_id: employee.pod_id
        ? String(employee.pod_id)
        : "",
      joining_date: employee.joining_date
        ? String(employee.joining_date).substring(0, 10)
        : ""
    });

    setEditingEmployeeId(employee.employee_id);
    setFormMessage("");
    setShowForm(true);
  }

  // Deactivate Employee
  async function handleDeactivate(employee) {
    const confirmDeactivate = window.confirm(
      `Are you sure you want to deactivate ${employee.full_name}?`
    );

    if (!confirmDeactivate) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/employees/${employee.employee_id}/deactivate`,
        {
          method: "PUT"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to deactivate employee");
      }

      alert("Employee deactivated successfully!");
      await loadEmployees();

    } catch (err) {
      alert(err.message);
    }
  }

  // Close form
  function handleCloseForm() {
    setShowForm(false);
    setEditingEmployeeId(null);
    setFormData(emptyForm);
    setFormMessage("");
  }

  // Add or Update employee
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormMessage("");

      const isEditing = editingEmployeeId !== null;

      const url = isEditing
        ? `${API_BASE_URL}/employees/${editingEmployeeId}`
        : `${API_BASE_URL}/employees`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save employee.");
      }

      setFormMessage(
        isEditing
          ? "Employee updated successfully!"
          : "Employee added successfully!"
      );

      await loadEmployees();

      setFormData(emptyForm);
      setEditingEmployeeId(null);

      setTimeout(() => {
        setShowForm(false);
        setFormMessage("");
      }, 1000);

    } catch (err) {
      setFormMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Search and filter
  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      employee.full_name?.toLowerCase().includes(searchText) ||
      employee.employee_code?.toLowerCase().includes(searchText) ||
      employee.email?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      employee.employment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="employees-page">

      {/* Page Heading */}
      <div className="employee-heading">
        <div>
          <h1>Employee Management</h1>
          <p>Manage and monitor your workforce information.</p>
        </div>

        <div className="employee-heading-actions">
          <button
            className="refresh-button"
            onClick={loadEmployees}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="add-employee-button"
            onClick={showForm ? handleCloseForm : handleAddNew}
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Close Form" : "Add Employee"}
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="add-employee-card">
          <h2>
            {editingEmployeeId
              ? "Edit Employee"
              : "Add New Employee"}
          </h2>

          <p>Enter the employee details below.</p>

          <form onSubmit={handleSubmit}>
            <div className="employee-form-grid">

              <div className="employee-form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  name="employee_code"
                  value={formData.employee_code}
                  onChange={handleInputChange}
                  placeholder="Example: EMP037"
                  required
                />
              </div>

              <div className="employee-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="employee-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="employee-form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="employee-form-group">
                <label>Pod *</label>
                <select
                  name="pod_id"
                  value={formData.pod_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Pod</option>

                  {pods.map((pod) => (
                    <option
                      key={pod.pod_id}
                      value={pod.pod_id}
                    >
                      {pod.pod_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="employee-form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleInputChange}
                />
              </div>

            </div>

            {formMessage && (
              <p className="employee-form-message">
                {formMessage}
              </p>
            )}

            <button
              type="submit"
              className="save-employee-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingEmployeeId
                  ? "Update Employee"
                  : "Save Employee"}
            </button>
          </form>
        </div>
      )}

      {/* Employee Summary */}
      <div className="employee-summary">
        <div className="employee-summary-icon">
          <Users size={24} />
        </div>

        <div>
          <h2>{employees.length}</h2>
          <p>Total Employees</p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="employee-table-card">

        <div className="employee-toolbar">
          <div className="employee-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="employee-message">
            Loading employee records...
          </div>

        ) : error ? (
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
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>POD</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>
                      <div className="employee-name-cell">
                        <div className="employee-avatar">
                          {employee.full_name?.charAt(0)}
                        </div>

                        <strong>{employee.full_name}</strong>
                      </div>
                    </td>

                    <td>{employee.employee_code}</td>
                    <td>{employee.email}</td>
                    <td>{employee.phone}</td>
                    <td>{employee.pod_name || "Not Assigned"}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          employee.employment_status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {employee.employment_status}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          className="edit-employee-button"
                          onClick={() => handleEdit(employee)}
                          title="Edit Employee"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        {employee.employment_status === "ACTIVE" && (
                          <button
                            className="deactivate-employee-button"
                            onClick={() => handleDeactivate(employee)}
                            title="Deactivate Employee"
                          >
                            <UserX size={15} />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-employees">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        )}

        <div className="employee-table-footer">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>

      </div>
    </div>
  );
}

export default Employees;
