import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCalendarAlt, FaTasks, FaCheck } from "react-icons/fa";
import "./dashboardEmployee.css";

const EmployeeDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [user, setUser] = useState({});
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const fetchData = async () => {
      try {
        const profileRes = await axios.get(
          "http://127.0.0.1:8000/api/User/Profile"
        );
        const id = profileRes.data.data.id;

        const [meetingsRes, tasksRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/User/${id}/meetings`),
          axios.get(`http://127.0.0.1:8000/api/User/${id}/ActionItems`),
        ]);

        setMeetings(meetingsRes.data.data || []);
        const now = new Date();

        const upcoming = meetingsRes.data.data
          .filter((m) => new Date(m.startsAt) >= now)
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)); // ascending

        const past = meetingsRes.data.data
          .filter((m) => new Date(m.endsAt) < now || m.status === "completed")
          .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt)); // descending

        setUpcomingMeetings(upcoming);
        setPastMeetings(past);

        setTasks(tasksRes.data.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    setUser(JSON.parse(localStorage.getItem("user")));
  }, []);

  const pendingTasks = tasks.filter((t) => !t.status || t.status === "Pending");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  if (loading)
    return (
      <div
        style={{
          height: "100vh", // full viewport height
          padding: "3rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "5px solid #f3f3f3",
            borderTop: "5px solid #0d6efd",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    );
  const renderMeetingsGroupedByDate = (meetingsList, type) => {
    const grouped = meetingsList.reduce((acc, meeting) => {
      const dateKey = new Date(meeting.startsAt).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(meeting);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, items]) => (
      <div key={date} className="meeting-date-group">
        <h4 className="meeting-date-title">📅 {date}</h4>
        <div className="meeting-card-grid">
          {items.map((m) => (
            <div
              key={m.id}
              className={`meeting-card-ui ${
                type === "upcoming" ? "meeting-upcoming" : "meeting-past"
              }`}
            >
              <div className="meeting-card-header">
                <h3 className="meeting-title">{m.title}</h3>
                <span className={`status-chip ${m.status}`}>{m.status}</span>
              </div>

              <div className="meeting-details">
                <p>
                  <strong>🕒 Time:</strong>{" "}
                  {new Date(m.startsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(m.endsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <strong>🏢 Room:</strong> {m.room?.roomname || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">👋 Welcome Back</h1>

      <div className="stats-grid">
        <StatCard
          icon={<FaCalendarAlt />}
          label="Upcoming Meetings"
          count={upcomingMeetings.length}
          color="#4c6ef5"
        />
        {user.role === "Employee" && (
          <>
            <StatCard
              icon={<FaTasks />}
              label="Pending Tasks"
              count={pendingTasks.length}
              color="#f59f00"
            />
            <StatCard
              icon={<FaCheck />}
              label="Completed Tasks"
              count={completedTasks.length}
              color="#40c057"
            />
          </>
        )}
      </div>

      <div className="section">
        <h2>📆 Upcoming Meetings</h2>
        {upcomingMeetings.length === 0 ? (
          <p className="empty-message">You have no upcoming meetings.</p>
        ) : (
          renderMeetingsGroupedByDate(upcomingMeetings, "upcoming")
        )}
      </div>

      <div className="section">
        <h2>🕘 Past Meetings</h2>
        {pastMeetings.length === 0 ? (
          <p className="empty-message">No past meetings found.</p>
        ) : (
          renderMeetingsGroupedByDate(pastMeetings, "past")
        )}
      </div>

      {user.role === "Employee" && (
        <>
          {" "}
          <h2>My Action Items</h2>
          {tasks.length === 0 ? (
            <p className="empty-message">No action items assigned.</p>
          ) : (
            <div className="modern-task-grid">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className={`modern-task-card ${
                    t.status === "Completed" ? "task-completed" : "task-pending"
                  }`}
                >
                  <div className="status-indicator" />
                  <div className="task-content">
                    <h3 className="task-title">{t.description}</h3>
                    <p className="task-due">
                      <FaCalendarAlt className="calendar-icon" />
                      Due:{" "}
                      {new Date(t.dueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <span
                      className={`task-status-label ${
                        t.status === "Completed" ? "green" : "yellow"
                      }`}
                    >
                      {t.status === "Completed" ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, count, color }) => (
  <div className="stat-card" style={{ borderLeft: `5px solid ${color}` }}>
    <div className="stat-icon" style={{ color }}>
      {icon}
    </div>
    <div>
      <h3>{count}</h3>
      <p>{label}</p>
    </div>
  </div>
);

export default EmployeeDashboard;
