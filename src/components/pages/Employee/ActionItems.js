import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ActionItems.css";

const ActionItemsPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const fetchTasks = async () => {
      try {
        const profileRes = await axios.get(
          "http://127.0.0.1:8000/api/User/Profile"
        );
        const userId = profileRes.data.data.id;

        const res = await axios.get(
          `http://127.0.0.1:8000/api/User/${userId}/ActionItems`
        );
        setTasks(res.data.data || []);
      } catch (err) {
        console.error("Error fetching action items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const toggleTask = async (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/ActionItem/${task.id}/toggle`,
        {
          status: newStatus,
        }
      );

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

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
  return (
    <div className="action-items-container">
      <h1>My Action Items</h1>

      {tasks.length === 0 ? (
        <p className="empty-message">No action items assigned.</p>
      ) : (
        <div className="task-cards">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`task-card ${
                t.status === "Completed" ? "completed" : ""
              }`}
            >
              <div className="task-card-body">
                <h3>{t.description}</h3>
                <p>
                  <strong>Due:</strong>{" "}
                  {new Date(t.dueDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Assigned to:</strong> {t.assignee?.name} (
                  {t.assignee?.email})
                </p>
              </div>
              <button className="toggle-btn" onClick={() => toggleTask(t)}>
                {t.status === "Completed"
                  ? "Mark as Pending"
                  : "Mark as Complete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionItemsPage;
