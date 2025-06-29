import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaCalendarAlt, FaClock, FaUser, FaList, FaEdit, FaPaperclip, FaCheckCircle, FaPlus } from "react-icons/fa";
import "./MeetingDetails.css";
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateStr).toLocaleString(undefined, options);
}

export default function MeetingDetails() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalType, setModalType] = useState(null);
  const [minutesData, setMinutesData] = useState({ decisions: "", discussedPoints: "" });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [actionItemData, setActionItemData] = useState({
    description: "",
    status: "Pending",
    dueDate: "",
    assignedTo: "",
  });
  const [agendas, setAgendas] = useState([]);
  const [users, setUsers] = useState([]);

  const token = "13|qR0X2wbQvVBZTShVBBz04ZpbbsooVxrh3j82QChc8d574f42";

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/Meeting/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedMeeting = response.data.data;
        setMeeting(fetchedMeeting);
        setAgendas(fetchedMeeting.agendas || []);
        setMinutesData({
          decisions: fetchedMeeting.minutes?.decisions || "",
          discussedPoints: fetchedMeeting.minutes?.discussedPoints || "",
        });
        setUsers(fetchedMeeting.attendees || []);
      } catch {
        setError("Failed to fetch meeting details.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const openModal = (type) => {
    setModalType(type);
    console.log("Modal type set to:", type);

  }
  const closeModal = () => setModalType(null);

  async function handleSaveAgendas() {
    try {
      await axios.put(`http://127.0.0.1:8000/api/Meeting/${meeting.id}`, {
        room_id: meeting.room_id,
        title: meeting.title,
        description: meeting.description,
        startsAt: meeting.startsAt,
        endsAt: meeting.endsAt,
        agendas,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Agendas updated.");
      window.location.reload();
    } catch (err) {
      alert("Failed to update agendas.");
    }
  }

  async function handleSubmitMinutes() {
    try {
      const endpoint = meeting.minutes
        ? `http://127.0.0.1:8000/api/Minutes/${meeting.minutes.id}`
        : `http://127.0.0.1:8000/api/Minutes`;

      const method = meeting.minutes ? "put" : "post";
      const payload = {
        meeting_id: meeting.id,
        decisions: minutesData.decisions,
        discussedPoints: minutesData.discussedPoints,
      };

      await axios[method](endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Minutes saved successfully.");
      window.location.reload();
    } catch (err) {
      alert("Failed to save minutes.");
    }
  }

  async function handleUploadAttachment() {
    if (!attachmentFile || !meeting.minutes?.id) return alert("File or minutes missing.");
    try {
      const formData = new FormData();
      formData.append("file", attachmentFile);
      formData.append("minutes_of_meeting_id", meeting.minutes.id);

      await axios.post("http://127.0.0.1:8000/api/Attachment", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Attachment uploaded.");
      window.location.reload();
    } catch (err) {
      alert("Failed to upload attachment.");
    }
  }

  async function handleAddActionItem() {
    if (!meeting.minutes?.id) return alert("Minutes not found for this meeting.");
    try {
      const payload = {
        ...actionItemData,
        minutes_of_meeting_id: meeting.minutes.id,
      };

      await axios.post("http://127.0.0.1:8000/api/ActionItem", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Action item added.");
      window.location.reload();
    } catch (err) {
      alert("Failed to add action item.");
    }
  }

  function Modal({ children }) {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent overlay click close when clicking inside modal
      >
        {children}
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
}


  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{error}</p>;
  if (!meeting) return null;

  return (
    <div className="meeting-container">
      <div className="meeting-sidebar">
        <div className="card">
          <h3>{meeting.title}</h3>
          <p>{meeting.description}</p>
          <p><strong>Status:</strong> {meeting.status}</p>
          <p><strong>Starts:</strong> {formatDateTime(meeting.startsAt)}</p>
          <p><strong>Ends:</strong> {formatDateTime(meeting.endsAt)}</p>
        </div>

        <div className="card">
          <h3>Room</h3>
          <p>{meeting.room ? `${meeting.room.roomname} - ${meeting.room.capacity}` : "No room assigned"}</p>
        </div>

        <div className="card">
          <h3>Attendees</h3>
          <ul>
            {users.map((user) => (
              <li key={user.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaUser />
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="meeting-content">
        <div className="card">
          <h3>Agendas</h3>
          <ul>
            {agendas.map((a, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaList /> {a.description}
              </li>
            ))}
          </ul>
          <button onClick={() => openModal('agenda')}><FaEdit /> Edit Agendas</button>
        </div>

        <div className="card">
          <h3>Minutes</h3>
          {meeting.minutes ? (
            <>
              <p><strong>Decisions:</strong> {meeting.minutes.decisions}</p>
              <p><strong>Discussed:</strong> {meeting.minutes.discussedPoints}</p>
            </>
          ) : <p>No minutes</p>}
          <button onClick={() => openModal('minutes')}><FaEdit /> {meeting.minutes ? 'Edit Minutes' : 'Add Minutes'}</button>
        </div>

        <div className="card">
          <h3>Attachments</h3>
          <ul>
            {meeting.minutes?.attachments?.map((file) => (
              <li key={file.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><FaPaperclip /> {file.fileName}</li>
            ))}
          </ul>
          {meeting.minutes && <button onClick={() => openModal('attachment')}><FaPlus /> Upload Attachment</button>}
        </div>

        <div className="card">
          <h3>Action Items</h3>
          <ul>
            {meeting.minutes?.action_items?.map((item) => (
              <li key={item.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FaCheckCircle color={item.status === "Completed" ? "green" : "orange"} />
                  <strong>{item.description}</strong>
                  <span style={{ marginLeft: "auto", fontStyle: "italic", fontSize: "0.9rem" }}>
                    Status: {item.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "#555", paddingLeft: "24px" /* to align under description */ }}>
                  Assigned to: {item.assignee?.name || "Unassigned"} | Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date"}
                </div>
              </li>
            ))}
          </ul>
          {meeting.minutes && <button onClick={() => openModal('actionItem')}><FaPlus /> Add Action Item</button>}
        </div>

      </div>

      {modalType === 'agenda' && (
        <Modal>
          <h3>Edit Agendas</h3>
          {agendas.map((agenda, index) => (
            <div key={index} style={{ position: "relative", marginBottom: "1rem" }} className="agenda-item-wrapper">
              <textarea
                value={agenda.description}
                onChange={(e) => {
                  const updated = [...agendas]; // copy array
                  updated[index].description = e.target.value; // update description at current index
                  setAgendas(updated); // save updated array to state
                }}
                rows={3}
                style={{ width: "100%", paddingRight: "30px" }} // right padding to make space for the "×" button
              />
              <button
                onClick={() => {
                  // Remove agenda at index
                  const filtered = agendas.filter((_, i) => i !== index);
                  setAgendas(filtered);
                }}
                style={{
                  position: "absolute",
                  right: "5px",
                  top: "5px",
                  background: "transparent",
                  border: "none",
                  color: "red",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
                aria-label={`Remove agenda ${index + 1}`}
                title="Remove agenda"
                type="button"
              >
                ×
              </button>
            </div>
          ))}

          <button onClick={() => setAgendas([...agendas, { description: "" }])}>
            <FaPlus /> Add Agenda
          </button>
          <button onClick={handleSaveAgendas}>
            <FaCheckCircle /> Save
          </button>
        </Modal>
      )}


      {modalType === 'minutes' && (
        <Modal>
          <h3>{meeting.minutes ? 'Edit Minutes' : 'Add Minutes'}</h3>
          <textarea
            placeholder="Decisions"
            value={minutesData.decisions}
            onChange={(e) => setMinutesData({ ...minutesData, decisions: e.target.value })}
            rows={3}
          />
          <textarea
            placeholder="Discussed Points"
            value={minutesData.discussedPoints}
            onChange={(e) => setMinutesData({ ...minutesData, discussedPoints: e.target.value })}
            rows={3}
          />
          <button onClick={handleSubmitMinutes}><FaCheckCircle /> Save</button>
        </Modal>
      )}

      {modalType === 'attachment' && (
        <Modal>
          <h3>Upload Attachment</h3>
          <input type="file" onChange={(e) => setAttachmentFile(e.target.files[0])} />
          <button onClick={handleUploadAttachment}><FaPaperclip /> Upload</button>
        </Modal>
      )}

      {modalType === 'actionItem' && (
        <Modal>
          <h3>Add Action Item</h3>
          <input
            type="text"
            placeholder="Description"
            value={actionItemData.description}
            onChange={(e) => setActionItemData({ ...actionItemData, description: e.target.value })}
          />
          <select
            value={actionItemData.status}
            onChange={(e) => setActionItemData({ ...actionItemData, status: e.target.value })}
          >
            <option>Pending</option>
            <option>Completed</option>
          </select>
          <input
            type="date"
            value={actionItemData.dueDate}
            onChange={(e) => setActionItemData({ ...actionItemData, dueDate: e.target.value })}
          />
          <select
            value={actionItemData.assignedTo}
            onChange={(e) => setActionItemData({ ...actionItemData, assignedTo: e.target.value })}
          >
            <option value="">Select Assignee</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <button onClick={handleAddActionItem}><FaPlus /> Add</button>
        </Modal>
      )}


    </div>
  );
}
