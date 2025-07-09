import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCalendarAlt, FaTasks, FaCheck } from "react-icons/fa";
import "./dashboard.css";
import MeetingsCalendar from './Employee/MeetingsCalendar';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const fetchData = async () => {
      try {
        const [meetingsRes, tasksRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/Meeting`),
          axios.get(`http://127.0.0.1:8000/api/ActionItem`),
        ]);

        setMeetings(meetingsRes.data.data || []);
        const now = new Date();

        const upcoming = meetingsRes.data.data
          .filter((m) => new Date(m.startsAt) >= now)
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)); // ascending

        const past = meetingsRes.data.data
          .filter((m) => new Date(m.endsAt) < now)
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
    return meetings.slice(0, 1).map((m) => (
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
      </div>

      <div className="section">
        <h2>📆 Next Meeting </h2>
        {upcomingMeetings.length === 0 ? (
          <p className="empty-message">You have no upcoming meetings.</p>
        ) : (
          renderMeetingsGroupedByDate(upcomingMeetings, "upcoming")
        )}
      </div>

      <div className="section">
        <h2>🕘 Last Meeting</h2>
        {pastMeetings.length === 0 ? (
          <p className="empty-message">No completed meetings yet.</p>
        ) : (
          renderMeetingsGroupedByDate(pastMeetings, "past")
        )}
      </div>
      <MeetingsCalendar />
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

export default Dashboard;
