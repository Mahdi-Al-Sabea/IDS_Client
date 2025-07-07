import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaList,
  FaEdit,
  FaPaperclip,
  FaCheckCircle,
  FaPlus,
} from "react-icons/fa";
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
  const Navigate = useNavigate();
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserOrganizer, setIsUserOrganizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1: select
  const [selectedDate, setSelectedDate] = useState("");
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    room_id: "",
    agendas: [{ description: "" }],
    attendees: [], // updated from attendeesInput to an array
  });
  const [selectedUsers, setSelectedUsers] = useState([]); // to store selected attendees
  const [rooms, setRooms] = useState([]);
  const [formError, setFormError] = useState("");
  const errorRef = React.useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalType, setModalType] = useState(null);
  const [minutesData, setMinutesData] = useState({
    decisions: "",
    discussedPoints: "",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [actionItemData, setActionItemData] = useState({
    description: "",
    status: "Pending",
    dueDate: "",
    assignedTo: "",
  });
  const [agendas, setAgendas] = useState([]);
  const [users, setUsers] = useState([]);

  const token = localStorage.getItem("token");
  async function fetchData() {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/Meeting/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const fetchedMeeting = response.data.data;
      setMeeting(fetchedMeeting);
      setIsUserOrganizer(
        String(fetchedMeeting.organizer_id) === localStorage.getItem("id")
      );
      setAgendas(fetchedMeeting.agendas || []);
      setMinutesData({
        decisions: fetchedMeeting.minutes?.decisions || "",
        discussedPoints: fetchedMeeting.minutes?.discussedPoints || "",
      });
      setSelectedUsers(fetchedMeeting.attendees || []);
    } catch {
      setError("Failed to fetch meeting details.");
    } finally {
      setLoading(false);
    }
  }

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchRooms();
  }, []);

  const openModal = (type) => {
    setModalType(type);
    console.log("Modal type set to:", type);
  };
  const closeModal = () => setModalType(null);

  async function handleSaveAgendas() {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/Meeting/${meeting.id}`,
        {
          room_id: meeting.room_id,
          title: meeting.title,
          description: meeting.description,
          startsAt: meeting.startsAt,
          endsAt: meeting.endsAt,
          agendas,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Agendas updated.");
      window.location.reload();
    } catch (err) {
      alert("Failed to update agendas.");
    }
  }

  const handleAgendaChange = (index, value) => {
    const updated = [...newMeeting.agendas];
    updated[index].description = value;
    setNewMeeting((nm) => ({ ...nm, agendas: updated }));
  };

  const addAgenda = () => {
    setNewMeeting((nm) => ({
      ...nm,
      agendas: [...nm.agendas, { description: "" }],
    }));
  };

  const removeAgenda = (index) => {
    if (newMeeting.agendas.length === 1) return; // Always at least one agenda
    const updated = [...newMeeting.agendas];
    updated.splice(index, 1);
    setNewMeeting((nm) => ({ ...nm, agendas: updated }));
  };

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
    if (!attachmentFile || !meeting.minutes?.id)
      return alert("File or minutes missing.");
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
    if (!meeting.minutes?.id)
      return alert("Minutes not found for this meeting.");
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

  async function handleDeleteAttachment(id) {
    if (!window.confirm("Are you sure you want to delete this attachment?"))
      return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/Attachment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Attachment deleted.");
      window.location.reload();
    } catch (err) {
      alert("Failed to delete attachment.");
    }
  }

  async function handleDeleteActionItem(id) {
    if (!window.confirm("Are you sure you want to delete this action item?"))
      return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/ActionItem/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Action item deleted.");
      window.location.reload();
    } catch (err) {
      alert("Failed to delete action item.");
    }
  }

  const isImageFile = (fileName) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
  };

  const handleCancel = async (meetingId) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?"))
      return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/Meeting/${meetingId}`,
        config
      );
      alert("Meeting cancelled.");
      Navigate("/meetings");
    } catch (error) {
      console.error("Cancel error", error);
      alert("Failed to cancel meeting.");
    }
  };

  function toDatetimeLocal(dateStr) {
    const d = new Date(dateStr);
    const pad = (num) => num.toString().padStart(2, "0");

    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());

    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  const handleReschedule = (meeting) => {
    console.log("Rescheduling meeting:", meeting);
    setShowModal(true);
    setStep(2);
    setSelectedDate(meeting.startsAt.split("T")[0]);

    setNewMeeting({
      ...meeting,
      room_id: meeting.room?.id || "",
      agendas: meeting.agendas.map((a) => ({ description: a.description })),
      attendees: meeting.attendees.map((a) => a.id), // backend expects IDs
    });

    setSelectedUsers(meeting.attendees); // to show selected attendee chips
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/UserNotPaginated",
        config
      ); // Make sure this endpoint returns all users
      setUsers(res.data.data); // Adjust if data structure is different
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/RoomNotPaginated",
        config
      ); // Make sure this endpoint returns all users
      setRooms(res.data.data); // Adjust if data structure is different
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setFormError(null);

    const attendees = newMeeting.attendees;

    const payload = {
      title: newMeeting.title,
      description: newMeeting.description,
      startsAt: newMeeting.startsAt,
      endsAt: newMeeting.endsAt,
      room_id: newMeeting.room_id,
      agendas: newMeeting.agendas,
      attendees,
    };

    console.log("Creating meeting with payload:", payload);

    try {
      await axios.put(`http://127.0.0.1:8000/api/Meeting/${id}`, payload, config);
      setShowModal(false);
      setNewMeeting({
        title: "",
        startsAt: "",
        endsAt: "",
        room_id: "",
        agendas: [{ description: "" }],
        attendees: [],
      });
      fetchData();
    } catch (err) {
      console.log("Create meeting error", err);
      if (err.response && err.response.data) {
        if (err.response.data.message) setFormError(err.response.data.message);
        else setFormError("Failed to create meeting.");
      } else {
        setFormError("Failed to create meeting.");
      }
    }
  };

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</p>;
  if (error)
    return (
      <p style={{ textAlign: "center", marginTop: "2rem", color: "red" }}>
        {error}
      </p>
    );
  if (!meeting) return null;

  return (
    <div className="meeting-container">
      <div className="meeting-sidebar">
        {isUserOrganizer && (
          <p style={{ color: "red", fontStyle: "italic" }}>
            You are the organizer of this meeting.
          </p>
        )}
        <div className="card">
          <h3>{meeting.title}</h3>
          <p>{meeting.description}</p>
          <p>
            <strong>Status:</strong> {meeting.status}
          </p>
          <p>
            <strong>Starts:</strong> {formatDateTime(meeting.startsAt)}
          </p>
          <p>
            <strong>Ends:</strong> {formatDateTime(meeting.endsAt)}
          </p>
        </div>

        <div className="card">
          <h3>Room</h3>
          <p>
            {meeting.room
              ? `${meeting.room.roomname} - ${meeting.room.capacity}`
              : "No room assigned"}
          </p>
        </div>

        <div className="card">
          <h3>Attendees</h3>
          <ul>
            {selectedUsers.map((user) => (
              <li
                key={user.id}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FaUser />
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        </div>

        {isUserOrganizer && (
          <div className="organizer-actions" style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="reschedule-btn"
              style={{
                backgroundColor: "#ffc107",
                color: "#fff",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleReschedule(meeting);
              }}
            >
              Reschedule
            </button>
            <button
              className="cancel-btn"
              style={{
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",

              }}
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(meeting.id);
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="meeting-content">
        <div className="card">
          <h3>Agendas</h3>
          <ul>
            {agendas.map((a, i) => (
              <li
                key={i}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FaList /> {a.description}
              </li>
            ))}
          </ul>
          {isUserOrganizer && (
            <button onClick={() => openModal("agenda")}>
              <FaEdit /> Edit Agendas
            </button>
          )}
        </div>

        <div className="card">
          <h3>Minutes</h3>
          {meeting.minutes ? (
            <>
              <p>
                <strong>Decisions:</strong> {meeting.minutes.decisions}
              </p>
              <p>
                <strong>Discussed:</strong> {meeting.minutes.discussedPoints}
              </p>
            </>
          ) : (
            <p>No minutes</p>
          )}
          {isUserOrganizer && (
            <button onClick={() => openModal("minutes")}>
              <FaEdit /> {meeting.minutes ? "Edit Minutes" : "Add Minutes"}
            </button>
          )}
        </div>

        <div className="card">
          <h3>Attachments</h3>
          <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
            {meeting.minutes?.attachments?.map((file) => {
              const fileUrl = `http://127.0.0.1:8000/${file.filePath}`;

              return (
                <li
                  key={file.id}
                  style={{
                    marginBottom: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FaPaperclip /> {file.fileName}
                    {isUserOrganizer && (
                      <button
                        onClick={() => handleDeleteAttachment(file.id)}
                        style={{
                          marginLeft: "auto",
                          background: "transparent",
                          border: "none",
                          color: "red",
                          fontWeight: "bold",
                          fontSize: "1.2rem",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {isImageFile(file.fileName) && (
                    <img
                      src={fileUrl}
                      alt={file.fileName}
                      style={{
                        maxWidth: "200px",
                        marginTop: "0.5rem",
                        borderRadius: "6px",
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {isUserOrganizer && meeting.minutes && (
            <button onClick={() => openModal("attachment")}>
              <FaPlus /> Upload Attachment
            </button>
          )}
        </div>
        <div className="card">
          <h3>Action Items</h3>
          <ul>
            {meeting.minutes?.action_items?.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FaCheckCircle
                    color={item.status === "Completed" ? "green" : "orange"}
                  />
                  <strong>{item.description}</strong>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontStyle: "italic",
                      fontSize: "0.9rem",
                    }}
                  >
                    Status: {item.status}
                  </span>
                  {isUserOrganizer && (
                    <button
                      onClick={() => handleDeleteActionItem(item.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "red",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#555",
                    paddingLeft: "24px" /* to align under description */,
                  }}
                >
                  Assigned to: {item.assignee?.name || "Unassigned"} | Due:{" "}
                  {item.dueDate
                    ? new Date(item.dueDate).toLocaleDateString()
                    : "No due date"}
                </div>
              </li>
            ))}
          </ul>
          {isUserOrganizer && meeting.minutes && (
            <button onClick={() => openModal("actionItem")}>
              <FaPlus /> Add Action Item
            </button>
          )}
        </div>
      </div>

      {modalType === "agenda" && (
        <Modal>
          <h3>Edit Agendas</h3>
          {agendas.map((agenda, index) => (
            <div
              key={index}
              style={{ position: "relative", marginBottom: "1rem" }}
              className="agenda-item-wrapper"
            >
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

      {modalType === "minutes" && (
        <Modal>
          <h3>{meeting.minutes ? "Edit Minutes" : "Add Minutes"}</h3>
          <textarea
            autoFocus
            placeholder="Decisions"
            value={minutesData.decisions}
            onChange={(e) =>
              setMinutesData({ ...minutesData, decisions: e.target.value })
            }
            rows={3}
          />
          <textarea
            autoFocus
            placeholder="Discussed Points"
            value={minutesData.discussedPoints}
            onChange={(e) =>
              setMinutesData({
                ...minutesData,
                discussedPoints: e.target.value,
              })
            }
            rows={3}
          />
          <button onClick={handleSubmitMinutes}>
            <FaCheckCircle /> Save
          </button>
        </Modal>
      )}

      {modalType === "attachment" && (
        <Modal>
          <h3>Upload Attachment</h3>
          <input
            type="file"
            onChange={(e) => setAttachmentFile(e.target.files[0])}
          />
          <button onClick={handleUploadAttachment}>
            <FaPaperclip /> Upload
          </button>
        </Modal>
      )}

      {modalType === "actionItem" && (
        <Modal>
          <h3>Add Action Item</h3>
          <input
            autoFocus
            type="text"
            placeholder="Description"
            value={actionItemData.description}
            onChange={(e) =>
              setActionItemData({
                ...actionItemData,
                description: e.target.value,
              })
            }
          />
          <select
            value={actionItemData.status}
            onChange={(e) =>
              setActionItemData({ ...actionItemData, status: e.target.value })
            }
          >
            <option>Pending</option>
            <option>Completed</option>
          </select>
          <input
            type="date"
            value={actionItemData.dueDate}
            onChange={(e) =>
              setActionItemData({ ...actionItemData, dueDate: e.target.value })
            }
          />
          <select
            value={actionItemData.assignedTo}
            onChange={(e) =>
              setActionItemData({
                ...actionItemData,
                assignedTo: e.target.value,
              })
            }
          >
            <option value="">Select Assignee</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddActionItem}>
            <FaPlus /> Add
          </button>
        </Modal>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflowY: "auto",
              scrollbarWidth: "none" /* Firefox */,
              msOverflowStyle: "none" /* IE and Edge */,
            }}
          >
            <button
              aria-label="Close modal"
              onClick={() => {
                setShowModal(false);
                setStep(1);
                setSelectedDate(null);
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                fontSize: "1.8rem",
                fontWeight: "700",
                color: "#999",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            {step === 1 && (
              <>
                <h3
                  style={{
                    marginBottom: "1.5rem",
                    fontSize: "1.8rem",
                    fontWeight: "700",
                    color: "#0d6efd",
                  }}
                >
                  Select Meeting Date
                </h3>

                <input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    border: "1.5px solid #ccc",
                    marginBottom: "1.5rem",
                  }}
                />

                <button
                  onClick={() => {
                    const defaultStartTime = `${selectedDate}T09:00`;
                    const defaultEndTime = `${selectedDate}T10:00`;
                    setNewMeeting({
                      ...newMeeting,
                      startsAt: defaultStartTime,
                      endsAt: defaultEndTime,
                    });
                    setStep(2);
                  }}
                  disabled={!selectedDate}
                  style={{
                    backgroundColor: "#0d6efd",
                    color: "white",
                    padding: "0.75rem 1.5rem",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "none",
                    cursor: selectedDate ? "pointer" : "not-allowed",
                    opacity: selectedDate ? 1 : 0.6,
                  }}
                >
                  Continue to Form
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3
                  style={{
                    marginBottom: "1.5rem",
                    fontSize: "1.8rem",
                    fontWeight: "700",
                    color: "#0d6efd",
                  }}
                >
                  Create New Meeting
                </h3>

                {formError && (
                  <p
                    ref={errorRef}
                    style={{
                      color: "red",
                      marginBottom: "1rem",
                      fontWeight: "600",
                      backgroundColor: "#ffe0e0",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                    }}
                  >
                    {formError}
                  </p>
                )}

                <form
                  onSubmit={handleCreateMeeting}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Title"
                    value={newMeeting.title}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, title: e.target.value })
                    }
                    required
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      borderRadius: "8px",
                      border: "1.5px solid #ccc",
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={newMeeting.description}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        description: e.target.value,
                      })
                    }
                    required
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      borderRadius: "8px",
                      border: "1.5px solid #ccc",
                    }}
                  />

                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(newMeeting.startsAt)}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, startsAt: e.target.value })
                    }
                    required
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      borderRadius: "8px",
                      border: "1.5px solid #ccc",
                    }}
                  />

                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(newMeeting.endsAt)}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, endsAt: e.target.value })
                    }
                    required
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      borderRadius: "8px",
                      border: "1.5px solid #ccc",
                    }}
                  />

                  <label style={{ fontWeight: "bold" }}>Select Room:</label>
                  <select
                    value={newMeeting.room_id}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, room_id: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "1rem",
                      borderRadius: "8px",
                      border: "1.5px solid #ccc",
                    }}
                  >
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomname} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>

                  <label style={{ fontWeight: "600", color: "#555" }}>
                    Agendas
                  </label>
                  {newMeeting.agendas.map((agenda, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Agenda description"
                        value={agenda.description}
                        onChange={(e) =>
                          handleAgendaChange(idx, e.target.value)
                        }
                        required
                        style={{
                          flexGrow: 1,
                          padding: "0.6rem 1rem",
                          fontSize: "1rem",
                          borderRadius: "8px",
                          border: "1.5px solid #ccc",
                        }}
                      />
                      {newMeeting.agendas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAgenda(idx)}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "1rem",
                            height: "38px",
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAgenda}
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#0d6efd",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginTop: "-0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    + Add Agenda
                  </button>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <label style={{ fontWeight: "bold" }}>
                      Select Attendees:
                    </label>

                    {/* Selected users chips */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          style={{
                            backgroundColor: "#e0f0ff",
                            padding: "0.3rem 0.75rem",
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.95rem",
                          }}
                        >
                          {user.name}
                          <button
                            onClick={() => {
                              setSelectedUsers((prev) =>
                                prev.filter((u) => u.id !== user.id)
                              );
                              setNewMeeting((prev) => ({
                                ...prev,
                                attendees: prev.attendees.filter(
                                  (id) => id !== user.id
                                ),
                              }));
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#0d6efd",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "1.2rem",
                              lineHeight: "1",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        padding: "0.6rem 1rem",
                        fontSize: "1rem",
                        borderRadius: "8px",
                        border: "1.5px solid #ccc",
                      }}
                    />

                    {/* Filtered user dropdown */}
                    <div
                      style={{
                        maxHeight: "120px",
                        overflowY: "auto",
                        borderRadius: "8px",
                      }}
                    >
                      {users
                        .filter(
                          (user) =>
                            user.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) &&
                            !selectedUsers.find((u) => u.id === user.id)
                        )
                        .map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUsers((prev) => [...prev, user]);
                              setNewMeeting((prev) => ({
                                ...prev,
                                attendees: [...prev.attendees, user.id],
                              }));
                              setSearchTerm("");
                            }}
                            style={{
                              padding: "0.5rem 1rem",
                              cursor: "pointer",
                              borderBottom: "1px solid #eee",
                              backgroundColor: "#f9f9f9",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#e6f0ff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#f9f9f9")
                            }
                          >
                            {user.name} ({user.email})
                          </div>
                        ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "1rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setStep(1);
                        setSelectedDate(null);
                      }}
                      style={{
                        padding: "0.7rem 1.5rem",
                        fontWeight: "600",
                        borderRadius: "8px",
                        border: "1.5px solid #ccc",
                        backgroundColor: "white",
                        color: "#555",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      style={{
                        padding: "0.7rem 1.5rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#0d6efd",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Update
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
