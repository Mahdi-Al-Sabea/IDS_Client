import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser) {
        setUser(parsedUser);
      } else {
        navigate("/signin");
      }
    } catch {
      navigate("/signin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_exp");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <div
      className="d-flex flex-column bg-dark text-white vh-100 shadow"
      style={{ width: "240px" }}
    >
      <div className="p-3 border-bottom text-center">
        <h5 className="mb-0">📝 Room Manager</h5>
      </div>

      <nav className="flex-grow-1 p-3">
        <ul className="nav flex-column gap-1">
          {user.role === "Admin" && (
            <li className="nav-item">
              <Link
                to="/projects"
                className={`nav-link ${
                  isActive("/projects") ? "bg-light text-dark" : "text-white"
                } rounded px-3 py-2`}
              >
                Projects
              </Link>
            </li>
          )}

          {(user.role === "Employee" || user.role === "Guest") && (
            <>
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  className={`nav-link ${
                    isActive("/dashboard") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/boards"
                  className={`nav-link ${
                    isActive("/boards") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Boards
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/tasks"
                  className={`nav-link ${
                    isActive("/tasks") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Tasks
                </Link>
              </li>
            </>
          )}

          <li className="nav-item">
            <Link
              to="/profile"
              className={`nav-link ${
                isActive("/profile") ? "bg-light text-dark" : "text-white"
              } rounded px-3 py-2`}
            >
              Profile
            </Link>
          </li>
        </ul>
      </nav>

      <div className="border-top p-3 small text-center">
        <div className="mb-2">
          {user.name} ({user.role})
        </div>
        <button
          className="btn btn-outline-light btn-sm w-100"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
