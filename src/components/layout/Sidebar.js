import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [allNotifications, setAllNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("unread"); // 'unread' or 'read'

  const fetchNotifications = async () => {
    try {
      const response = await axios("http://127.0.0.1:8000/api/Notification");
      setAllNotifications(response.data.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/Notification/${id}`);
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.delete("http://127.0.0.1:8000/api/Notifications/markAllRead");
      setAllNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read" }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_exp");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser) {
        setUser(parsedUser);
        fetchNotifications();
      } else {
        navigate("/signin");
      }
    } catch {
      navigate("/signin");
    }
  }, [navigate]);

  const unreadCount = allNotifications.filter(
    (n) => n.status !== "read"
  ).length;

  const filteredNotifications = allNotifications.filter((n) =>
    tab === "unread" ? n.status !== "read" : n.status === "read"
  );

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
                    to="/dashboardAdmin"
                    className={`nav-link ${
                      isActive("/dashboardAdmin")
                        ? "bg-light text-dark"
                        : "text-white"
                    } rounded px-3 py-2`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/features"
                    className={`nav-link ${
                      isActive("/features")
                        ? "bg-light text-dark"
                        : "text-white"
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
                                    <li className="nav-item">
                      <Link
                        to="/profile"
                        className={`nav-link ${
                          isActive("/profile")
                            ? "bg-light text-dark"
                            : "text-white"
                        } rounded px-3 py-2`}
                      >
                        Profile
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
                      isActive("/dashboardEmployee")
                        ? "bg-light text-dark"
                        : "text-white"
                    } rounded px-3 py-2`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/meetings"
                    className={`nav-link ${
                      isActive("/meetings")
                        ? "bg-light text-dark"
                        : "text-white"
                    } rounded px-3 py-2`}
                  >
                    Meetings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/meetingCalendar"
                    className={`nav-link ${
                      isActive("/meetingCalendar")
                        ? "bg-light text-dark"
                        : "text-white"
                    } rounded px-3 py-2`}
                  >
                    Meetings Calendar
                  </Link>
                </li>
                {user.role === "Employee" && (
                  <>
                    <li className="nav-item">
                      <Link
                        to="/ActionItems"
                        className={`nav-link ${
                          isActive("/ActionItems")
                            ? "bg-light text-dark"
                            : "text-white"
                        } rounded px-3 py-2`}
                      >
                        Action Items
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/profile"
                        className={`nav-link ${
                          isActive("/profile")
                            ? "bg-light text-dark"
                            : "text-white"
                        } rounded px-3 py-2`}
                      >
                        Profile
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>
        </nav>

        <div className="border-top p-3 small text-center">
          <div className="mb-3">
            {user.name} ({user.role})
          </div>

            {(user.role === "Employee" || user.role === "Guest") && (
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
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill">
                {unreadCount}
              </span>
            )}
          </button>
            )}

          <button
            className="btn btn-outline-light btn-sm w-100"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Icon in Top-Right Corner */}
      <div
        style={{
          position: "fixed",
          top: "15px",
          right: "20px",
          zIndex: 1050,
          cursor: "pointer",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "white",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          boxShadow: "0 2px 6px #343a40",
        }}
        onClick={() => navigate("/profile")} // or any profile route
        title="Profile"
      >
        👤
      </div>

      {showModal && (
        <div
          className={`modal fade ${showModal ? "show d-block" : ""}`}
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          key={tab}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title">🔔 Notifications</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-3 d-flex justify-content-center gap-3">
                  <button
                    style={{
                      minHeight: "30px",
                      maxHeight: "30px",
                      border: "1px solid black",
                      backgroundColor: tab === "unread" ? "black" : "white",
                      color: tab === "unread" ? "white" : "black",
                      padding: "5px 15px",
                      borderRadius: "5px",
                    }}
                    onClick={() => setTab("unread")}
                  >
                    Unread
                  </button>
                  <button
                    style={{
                      minHeight: "30px",
                      maxHeight: "30px",
                      border: "1px solid black",
                      backgroundColor: tab === "read" ? "black" : "white",
                      color: tab === "read" ? "white" : "black",
                      padding: "5px 15px",
                      borderRadius: "5px",
                    }}
                    onClick={() => setTab("read")}
                  >
                    Read
                  </button>
                </div>

                {tab === "unread" && (
                  <div className="text-end mb-2">
                    {unreadCount !== 0 && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                )}

                <div className="list-group">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications
                      .sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at)
                      )
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className="list-group-item list-group-item-action"
                        >
                          <h6 className="mb-1">{notification.subject}</h6>
                          <p className="mb-1">{notification.content}</p>
                          <small className="text-muted mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </small>
                          {tab === "unread" && (
                            <button
                              className="btn btn-danger btn-sm float-end mb-2"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-muted">
                      No {tab} notifications.
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
