import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ActionItems.css";
import { toast, ToastContainer } from "react-toastify";

const ActionItemsPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [nextStatus, setNextStatus] = useState("");

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

  const confirmToggleTask = (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    setSelectedTask(task);
    setNextStatus(newStatus);
    setShowModal(true);
  };

  const handleToggleConfirmed = async () => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/ActionItem/${selectedTask.id}/toggle`,
        {
          status: nextStatus,
        }
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id ? { ...t, status: nextStatus } : t
        )
      );
      toast.success("Task status changed successfully");
    } catch (error) {
      toast.error("Error updating task");
    } finally {
      setShowModal(false);
      setSelectedTask(null);
      setNextStatus("");
    }
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
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
    <>
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
                <button className="toggle-btn" onClick={() => confirmToggleTask(t)}>
                  {t.status === "Completed"
                    ? "Mark as Pending"
                    : "Mark as Complete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Action</h3>
            <p>
              Are you sure you want to mark this task as{" "}
              <strong>{nextStatus}</strong>?
            </p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleToggleConfirmed}>
                Yes
              </button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
};

export default ActionItemsPage;
