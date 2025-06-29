import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCalendarAlt, FaTasks, FaCheck } from "react-icons/fa";
import "./dashboardEmployee.css";

const EmployeeDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const fetchData = async () => {
      try {
        const profileRes = await axios.get("http://127.0.0.1:8000/api/User/Profile");
        const id = profileRes.data.data.id;

        const [meetingsRes, tasksRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/User/${id}/meetings`),
          axios.get(`http://127.0.0.1:8000/api/User/${id}/ActionItems`),
        ]);

        setMeetings(meetingsRes.data.data || []);
        setTasks(tasksRes.data.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">👋 Welcome Back</h1>

        <div className="stats-grid">
            <StatCard icon={<FaCalendarAlt />} label="Meetings" count={meetings.length} color="#4c6ef5" />
            <StatCard icon={<FaTasks />} label="Pending Tasks" count={pendingTasks.length} color="#f59f00" />
            <StatCard icon={<FaCheck />} label="Completed Tasks" count={completedTasks.length} color="#40c057" />
        </div>

        <div className="section">
        <h2>📆 Upcoming Meetings</h2>
        {meetings.length === 0 ? (
            <p className="empty-message">You have no upcoming meetings.</p>
        ) : (
            Object.entries(
            meetings.reduce((acc, meeting) => {
                const dateKey = new Date(meeting.startsAt).toLocaleDateString();
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(meeting);
                return acc;
            }, {})
            ).map(([date, items]) => (
            <div key={date} className="meeting-date-group">
                <h4 className="meeting-date">{date}</h4>
                {items.map((m) => (
                <div key={m.id} className={`meeting-card ${m.status}`}>
                    <div className="meeting-header">
                        <strong>{m.title}</strong>
                        <span className={`status-badge ${m.status}`}>{m.status}</span>
                    </div>
                    <p><strong>Time:</strong> {new Date(m.startsAt).toLocaleTimeString()} - {new Date(m.endsAt).toLocaleTimeString()}</p>
                    <p><strong>Room:</strong> {m.room?.roomname} (Floor {m.room?.floor})</p>
                    <p><strong>Agendas:</strong> {m.agendas.length > 0 ? (
                        <ul className="agenda-list">
                        {m.agendas.map((a) => <li key={a.id}>• {a.description}</li>)}
                        </ul>
                    ) : "No agendas"}</p>
                    <p><strong>Attendees:</strong> {m.attendees.map(a => a.name).join(", ")}</p>
                </div>
                ))}
            </div>
            ))
        )}
        </div>

        <h2>My Action Items</h2>
        {tasks.length === 0 ? (
            <p className="empty-message">No action items assigned.</p>
        ) : (
            <div className="card-grid">
            {tasks.map((t) => (
                <div key={t.id} className="info-card">
                <div className="card-header">
                    <FaTasks className="card-icon" />
                    <h3>{t.description}</h3>
                </div>
                <p><strong>Due:</strong> {new Date(t.dueDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${t.completed ? "completed" : "pending"}`}>{t.completed ? "Completed" : "Pending"}</span></p>
                </div>
            ))}
            </div>
        )}
    </div>
  );
};

const StatCard = ({ icon, label, count, color }) => (
  <div className="stat-card" style={{ borderLeft: `5px solid ${color}` }}>
    <div className="stat-icon" style={{ color }}>{icon}</div>
    <div>
      <h3>{count}</h3>
      <p>{label}</p>
    </div>
  </div>
);


export default EmployeeDashboard;
