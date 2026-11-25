
import { useState, useEffect } from "react";

import Employees from "./pages/employees.jsx";
import Availability from "./pages/availability.jsx";
import Brands from "./pages/brands.jsx";
import Pods from "./pages/pods.jsx";
import Processes from "./pages/processes.jsx";
import BrandProcesses from "./pages/brandProcesses.jsx";
import Assignments from "./pages/assignments.jsx";
import Leaves from "./pages/leaves.jsx";
import WeeklyHolidays from "./pages/weeklyHolidays.jsx";
import RosterManagement from "./pages/rosterManagement.jsx";

import {
  LayoutDashboard,
  Users,
  Building2,
  Network,
  BriefcaseBusiness,
  CalendarDays,
  CalendarCheck,
  AlertTriangle,
  FileBarChart,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronRight,
  ClipboardList
} from "lucide-react";

import { fetchDashboardData } from "./services/api";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [stats, setStats] = useState({
    employees: 0,
    brands: 0,
    pods: 0,
    processes: 0
  });

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Employees", icon: Users },
    { name: "Pods", icon: Network },
    { name: "Brands", icon: Building2 },
    { name: "Brand Processes", icon: Network },
    { name: "Processes", icon: BriefcaseBusiness },
    { name: "Assignments", icon: ClipboardList },
    { name: "Availability", icon: CalendarDays },
    { name: "Leave Management", icon: CalendarCheck },
    { name: "Weekly Offs & Holidays", icon: CalendarDays },
    { name: "Roster Management", icon: CalendarCheck },
    { name: "Conflicts", icon: AlertTriangle },
    { name: "Reports", icon: FileBarChart },
    { name: "Settings", icon: Settings }
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setApiError("");

        const data = await fetchDashboardData();
        setStats(data);

      } catch (error) {
        setApiError(
          "Unable to load database information. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const statCards = [
    { title: "Total Employees", value: stats.employees, icon: Users },
    { title: "Total Brands", value: stats.brands, icon: Building2 },
    { title: "Total Pods", value: stats.pods, icon: Network },
    { title: "Total Processes", value: stats.processes, icon: BriefcaseBusiness }
  ];

  return (
    <div className="app-container">

      <aside className={`sidebar ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <div className="brand-logo">
          <div className="logo-icon">D</div>
          <div className="brand-name">
            <h2>DataStraw</h2>
            <span>Roster Management</span>
          </div>
        </div>

        <div className="menu-heading">WORKSPACE</div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menu-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">ON</div>
          <div className="profile-info">
            <strong>Admin User</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={21} />
            </button>

            <div>
              <div className="breadcrumb">
                Workspace <ChevronRight size={14} /> {activePage}
              </div>
              <h2>{activePage}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button notification-button">
              <Bell size={19} />
              <span></span>
            </button>

            <div className="topbar-avatar">ON</div>
          </div>
        </header>

        <section className="page-content">

          {activePage === "Employees" ? (
            <Employees />

          ) : activePage === "Availability" ? (
            <Availability />

          ) : activePage === "Brands" ? (
            <Brands />

          ) : activePage === "Pods" ? (
            <Pods />

          ) : activePage === "Processes" ? (
            <Processes />

          ) : activePage === "Brand Processes" ? (
            <BrandProcesses />

          ) : activePage === "Assignments" ? (
            <Assignments />

          ) : activePage === "Leave Management" ? (
            <Leaves />

          ) : activePage === "Weekly Offs & Holidays" ? (
            <WeeklyHolidays />

          ) : activePage === "Roster Management" ? (
            <RosterManagement />

          ) : activePage === "Overview" ? (
            <>
              <div className="welcome-section">
                <div>
                  <h1>Welcome to DataStraw 👋</h1>
                  <p>
                    Manage your workforce, assignments and monthly rosters
                    from one place.
                  </p>
                </div>

                <div className="date-display">
                  <CalendarDays size={17} />
                  November 2026
                </div>
              </div>

              {apiError && (
                <div className="error-message">{apiError}</div>
              )}

              <div className="stats-grid">
                {statCards.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div className="stat-card" key={stat.title}>
                      <div className="stat-top">
                        <div className="stat-icon">
                          <Icon size={21} />
                        </div>
                        <span className="stat-label">
                          {loading ? "Loading..." : "Live Database"}
                        </span>
                      </div>

                      <h2>{loading ? "..." : stat.value}</h2>
                      <p>{stat.title}</p>
                    </div>
                  );
                })}
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-card roster-card">
                  <div className="card-heading">
                    <div>
                      <h3>Roster Overview</h3>
                      <p>Monthly roster status</p>
                    </div>
                    <CalendarCheck size={21} />
                  </div>

                  <div className="empty-state">
                    <div className="empty-icon">
                      <CalendarDays size={30} />
                    </div>

                    <h3>No roster generated yet</h3>
                    <p>
                      Generate a monthly roster to view employee
                      schedules and coverage.
                    </p>

                    <button
                      className="primary-button"
                      onClick={() => setActivePage("Roster Management")}
                    >
                      Go to Roster Management
                    </button>
                  </div>
                </div>

                <div className="dashboard-card quick-card">
                  <h3>Quick Navigation</h3>
                  <p>Access important sections</p>

                  {["Employees", "Brands", "Availability", "Conflicts"].map(
                    (name) => (
                      <button
                        className="quick-link"
                        key={name}
                        onClick={() => setActivePage(name)}
                      >
                        <span>{name}</span>
                        <ChevronRight size={17} />
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="dashboard-card placeholder-page">
              <div className="empty-icon">
                <LayoutDashboard size={30} />
              </div>

              <h2>{activePage}</h2>
              <p>
                This section is ready for development.
                We will add its functionality step by step.
              </p>

              <button
                className="primary-button"
                onClick={() => setActivePage("Overview")}
              >
                Back to Overview
              </button>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default App;
