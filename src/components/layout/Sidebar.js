import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axios("http://127.0.0.1:8000/api/Notification");
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/Notification/${id}`);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser) {
        setUser(parsedUser);
        fetchNotifications(); // Fetch notifications when user is set
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
    <>
    <div
      className="d-flex flex-column bg-dark text-white vh-100 shadow position-fixed"
      style={{ width: "240px" }}
    >
      <div className="p-3 border-bottom text-center">
        <h5 className="mb-0">📝 Room Manager</h5>
      </div>

      <nav className="flex-grow-1 p-3">
        <ul className="nav flex-column gap-1">
          {user.role === "Admin" && (
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
                  to="/features"
                  className={`nav-link ${
                    isActive("/features") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Features
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/rooms"
                  className={`nav-link ${
                    isActive("/rooms") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Rooms
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/users"
                  className={`nav-link ${
                    isActive("/users") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Users
                </Link>
              </li>
            </>
          )}

          {(user.role === "Employee" || user.role === "Guest") && (
            <>
              <li className="nav-item">
                <Link
                  to="/dashboardEmployee"
                  className={`nav-link ${
                    isActive("/dashboardEmployee") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/meetings"
                  className={`nav-link ${
                    isActive("/meetings") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Meetings
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/meetingCalendar"
                  className={`nav-link ${
                    isActive("/meetingCalendar") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Meetings Calendar
                </Link>
              </li>
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
              <li className="nav-item">
                <Link
                  to="/ActionItems"
                  className={`nav-link ${
                    isActive("/ActionItems") ? "bg-light text-dark" : "text-white"
                  } rounded px-3 py-2`}
                >
                  Action Items
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="border-top p-3 small text-center">
        <div className="mb-3">
          {user.name} ({user.role})
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-outline-light btn-sm w-100 d-flex justify-content-between align-items-center mb-2"
        >
          <span className="d-flex align-items-center gap-2">
            <span
              role="img"
              aria-label="Notifications"
              style={{ fontSize: "1.25rem" }}
            >
              🔔
            </span>
            Notifications
          </span>
          {notifications.length > 0 && (
            <span className="badge bg-danger rounded-pill">{notifications.length}</span>
          )}
        </button>

        <button
          className="btn btn-outline-light btn-sm w-100"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>






          {showModal && (
                  <div
                    className={`modal fade ${showModal ? "show d-block" : ""}`}
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    role="dialog"
                  >
                    <div className="modal-dialog modal-lg">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">🔔 Notifications</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowModal(false)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <div className="list-group">
                            {notifications.length > 0 ? (
                              notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className="list-group-item list-group-item-action"
                                >
                                  <h6 className="mb-1">
                                    {notification.subject}
                                  </h6>
                                  <p className="mb-1">
                                    {notification.content}
                                  </p>
                                  <small className="text-muted">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </small>
                                  <button
                                    className="btn btn-danger btn-sm float-end "
                                    onClick={() => deleteNotification(notification.id)}
                                  >
                                    Mark as read
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-muted">
                                No notifications available.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}










    </>
  );
}
