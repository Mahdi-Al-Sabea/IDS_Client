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
import { toast, ToastContainer } from "react-toastify";
import dayjs from "dayjs";
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
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [showAddActionItemForm, setShowAddActionItemForm] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const toggle = () => setIsOn(!isOn);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    room_id: "",
    agendas: [{ description: "" }],
    attendees: [],
    minutes: {
      decisions: "",
      discussedPoints: "",
      attachments: [],
      action_items: [],
    },
  });
  const [selectedUsers, setSelectedUsers] = useState([]); // to store selected attendees
  const [rooms, setRooms] = useState([]);
  const [formError, setFormError] = useState("");
  const errorRef = React.useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFeature, setSearchFeature] = useState("");
  const [meetingsByDate, setMeetingsByDate] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [features, setFeatures] = useState([]);
  const [onGoing, setOnGoing] = useState(false);
  const [past, setPast] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState([]); // from backend
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
  useEffect(() => {
    const filtered = rooms.filter((room) => {
      const roomfeaturesIds = room.features.map((item) => item.id);
      return selectedFeatures.every((sf) => roomfeaturesIds.includes(sf));
    });

    setFilteredRooms(filtered);
  }, [selectedFeatures, rooms]); // 👈 Trigger on mount AND when rooms or features change

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
      const now = new Date();
      const start = new Date(fetchedMeeting.startsAt);
      const end = new Date(fetchedMeeting.endsAt);

      if (start <= now && now < end) {
        setOnGoing(true); // Meeting is currently happening
      } else if (now >= end) {
        setPast(true); // Meeting has ended
      }

      console.log(fetchedMeeting);
      setIsUserOrganizer(
        String(fetchedMeeting.organizer_id) === localStorage.getItem("id")
      );
      setAgendas(fetchedMeeting.agendas || []);
      setMinutesData({
        decisions: fetchedMeeting.minutes?.decisions || "",
        discussedPoints: fetchedMeeting.minutes?.discussedPoints || "",
      });
      setSelectedUsers(fetchedMeeting.attendees || []);
      if (fetchedMeeting.minutes && fetchedMeeting.minutes.attachments) {
        setExistingAttachments(fetchedMeeting.minutes.attachments);
      }
    } catch {
      setError("Failed to fetch meeting details.");
    } finally {
      setLoading(false);
    }
  }

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const handleToggle = async (id) => {
    const updatedAttendees = meeting.attendees.map((attendee) =>
      attendee.id === id
        ? {
            ...attendee,
            pivot: {
              ...attendee.pivot,
              Attended: !attendee.pivot.Attended,
            },
          }
        : attendee
    );

    // Update UI
    setMeeting((prev) => ({
      ...prev,
      attendees: updatedAttendees,
    }));

    // Convert to Laravel's expected sync format
    const attendeesPayload = {};
    updatedAttendees.forEach((attendee) => {
      attendeesPayload[attendee.id] = {
        Attended: attendee.pivot.Attended,
      };
    });

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/Meeting/${meeting.id}`,
        {
          attendees: attendeesPayload,
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to handle participation status.");
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/FeatureNotPaginated",
        config
      ); // Make sure this endpoint returns all users
      setFeatures(res.data.data); // Adjust if data structure is different
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchRooms();
    fetchFeatures();
  }, []);

  const closeModal = () => setModalType(null);

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

  async function handleUploadAttachment() {
    if (!attachmentFiles.length || !meeting.minutes?.id) {
      toast.error("No files selected");
      return;
    }

    try {
      const formData = new FormData();
      attachmentFiles.forEach((file) => formData.append("files[]", file));
      formData.append("minutes_of_meeting_id", meeting.minutes.id);

      await axios.post("http://127.0.0.1:8000/api/Attachment/bulk", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Attachments uploaded.");
      window.location.reload();
    } catch (err) {
      toast.error("Failed to upload attachments.");
    }
  }

  async function handleAddActionItem() {
    console.log("clicked");
    if (!meeting.minutes?.id) {
      toast.error("Minutes not found for this meeting.");
      return;
    }
    if (
  !actionItemData.description?.trim() ||
  !actionItemData.dueDate ||
  !actionItemData.assignedTo
)
 {
      toast.error("Fill all the fields please");
      return;
    }
    try {
      const payload = {
        ...actionItemData,
        minutes_of_meeting_id: meeting.minutes.id,
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/ActionItem",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newItem = response.data.data; // adjust if your API wraps it differently

      // ✅ Update state without reloading
      setMeeting((prev) => ({
        ...prev,
        minutes: {
          ...prev.minutes,
          action_items: [...(prev.minutes?.action_items || []), newItem],
        },
      }));

      setActionItemData({
        description: "",
        status: "Pending",
        dueDate: "",
        assignedTo: "",
      }); // reset form
      toast.success("Action item added.");
    } catch (err) {
      toast.error("Failed to add action item.");
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
    
    try {
      await axios.delete(`http://127.0.0.1:8000/api/Attachment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewMeeting((prev) => ({
        ...prev,
        minutes: {
          ...prev.minutes,
          attachments: prev.minutes.attachments.filter((att) => att.id !== id),
        },
      }));

      setExistingAttachments((prev) => prev.filter((att) => att.id !== id));
      setAttachmentFiles((prev) => prev.filter((att) => att.id !== id));
      toast.success("Attachment Deleted Successfully");
    } catch (err) {
      toast.error("Failed to delete attachment.");
    }
  }

  async function handleDeleteActionItem(id) {

    try {
      await axios.delete(`http://127.0.0.1:8000/api/ActionItem/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Update state instead of reloading
      setMeeting((prev) => ({
        ...prev,
        minutes: {
          ...prev.minutes,
          action_items: prev.minutes.action_items.filter(
            (item) => item.id !== id
          ),
        },
      }));
      toast.success("Action Item Deleted Successfully");
    } catch (err) {
      toast.error("Failed to delete action item.");
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
      toast.success("Meeting cancelled.");
      Navigate("/meetings");
    } catch (error) {
      console.error("Cancel error", error);
      toast.error("Failed to cancel meeting.");
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
    setShowModal(true);
    if (onGoing || past) {
      setStep(3);
    } else {
      setStep(2);
    }
    setSelectedDate(meeting.startsAt.split("T")[0]);

    setNewMeeting({
      ...meeting,
      startsAt: meeting.startsAt,
      endsAt: meeting.endsAt,
      room_id: meeting.room?.id || "",
      agendas: meeting.agendas.map((a) => ({ description: a.description })),
      attendees: meeting.attendees.map((a) => a.id), // backend expects IDs
      minutes: meeting.minutes,
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

  const fetchMeetingByRoomandDate = async () => {
    if (newMeeting.room_id != null && selectedDate != null) {
      console.log("room : " + newMeeting.room_id);
      console.log("date : " + selectedDate);
      const selectedDatelocal = toDatetimeLocal(selectedDate).split("T")[0];
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/MeetingByDate/${selectedDatelocal}/${newMeeting.room_id}`,
          config
        );
        setMeetingsByDate(res.data.data); // Adjust if data structure is different
        console.log(res.data.data);
      } catch (error) {
        console.error("Cancel error", error);
        toast.error("Failed to fetch meetings.");
      }
    }
  };

  useEffect(() => {
    if (newMeeting.room_id && newMeeting.startsAt) {
      fetchMeetingByRoomandDate();
    }
  }, [newMeeting.room_id, newMeeting.startsAt]);

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
      startsAt: dayjs(newMeeting.startsAt).format("YYYY-MM-DDTHH:mm"),
      endsAt: dayjs(newMeeting.endsAt).format("YYYY-MM-DDTHH:mm"),
      room_id: newMeeting.room_id,
      agendas: newMeeting.agendas.map((agenda) => ({
        id: agenda.id,
        description: agenda.description,
      })),
      attendees, // array of user IDs

      minutes: {
        id: newMeeting.minutes?.id,
        discussedPoints: newMeeting.minutes?.discussedPoints,
        decisions: newMeeting.minutes?.decisions,

        action_items:
          newMeeting.minutes?.action_items?.map((item) => ({
            id: item.id,
            description: item.description,
            status: item.status,
            assignee_id: item.assignee?.id, // backend will likely expect ID
          })) || [],

        attachments:
          newMeeting.minutes?.attachments?.map((att) => ({
            id: att.id,
            fileName: att.fileName,
            filePath: att.filePath,
            uploader_id: att.uploader?.id, // same here
          })) || [],
      },
    };

    console.log("Creating meeting with payload:", payload);

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/Meeting/${id}`,
        payload,
        config
      );
      setShowModal(false);
      setNewMeeting({
        title: "",
        startsAt: "",
        endsAt: "",
        room_id: "",
        agendas: [{ description: "" }],
        attendees: [],
      });
      toast.success("Meeting Editted Successfully");
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

  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;
  if (!meeting) return null;

  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };

  const headingStyle = {
    fontSize: "1.25rem",
    marginBottom: "1rem",
    color: "blue",
  };

  const ulStyle = {
    paddingLeft: "0",
    listStyle: "none",
  };

  const liFlex = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  };

  const attachmentItemStyle = {
    marginBottom: "1rem",
    position: "relative",
  };

  const actionItemStyle = {
    border: "1px solid grey",
    padding: "8px",
    borderRadius: "20px",
    marginBottom: "1rem",
  };

  const imgStyle = {
    height: "150px",
    width: "150px",
    marginTop: "0.5rem",
    borderRadius: "6px",
  };

  const yellowBtn = {
    backgroundColor: "#ffc107",
    border: "none",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const redBtn = {
    backgroundColor: "#dc3545",
    border: "none",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const editBtn = {
    marginTop: "1rem",
    backgroundColor: "#0d6efd",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const addBtn = {
    marginTop: "1rem",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const deleteBtn = {
    background: "transparent",
    border: "none",
    color: "red",
    fontSize: "1.2rem",
    fontWeight: "bold",
    marginLeft: "auto",
    cursor: "pointer",
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "2rem",
          padding: "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* LEFT COLUMN */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* General Info */}
          <div className="card shadow" style={cardStyle}>
            {isUserOrganizer && (
              <p
                style={{
                  color: "#b91c1c",
                  backgroundColor: "#ffe0e0",
                  fontStyle: "italic",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
              >
                You are the organizer of this meeting.
              </p>
            )}
            <h2 style={{ ...headingStyle, marginBottom: "0.5rem" }}>
              {meeting.title}
            </h2>
            <p style={{ marginBottom: "0.75rem" }}>{meeting.description}</p>
            <p>
              <strong>Status:</strong> {meeting.status}
            </p>
            <p>
              <strong>Starts:</strong> {formatDateTime(meeting.startsAt)}
            </p>
            <p>
              <strong>Ends:</strong> {formatDateTime(meeting.endsAt)}
            </p>

            {isUserOrganizer && (
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1.5rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  style={yellowBtn}
                  onClick={() => handleReschedule(meeting)}
                >
                  {onGoing || past ? "Edit" : "Reschedule"}
                </button>
                <button style={redBtn} onClick={() => handleCancel(meeting.id)}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Room */}
          <div className="card shadow" style={cardStyle}>
            <h3 style={headingStyle}>Room</h3>
            <p style={{ fontSize: "1rem", color: "#444" }}>
              {meeting.room
                ? `${meeting.room.roomname} (Capacity: ${meeting.room.capacity})`
                : "No room assigned"}
            </p>
          </div>

          {/* Agendas */}
          <div className="card shadow" style={cardStyle}>
            <h3 style={headingStyle}>Agendas</h3>
            <ul style={ulStyle}>
              {agendas.map((a, i) => (
                <li key={i} style={liFlex}>
                  <FaList /> {a.description}
                </li>
              ))}
            </ul>
          </div>

          <div className="card shadow" style={cardStyle}>
            <h3 style={headingStyle}>Attendees</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {meeting.attendees.map((user) => (
                <div
                  key={"i" + user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f8f9fa",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                    width: "100%",
                  }}
                >
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      backgroundColor: "#f8f9fa",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      width: "100%",
                    }}
                  >
                    <img
                      src={
                        `http://127.0.0.1:8000/${user.profile_picture}` ||
                        "https://via.placeholder.com/40"
                      }
                      alt={user.name}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1.5px solid #ddd",
                      }}
                    />
                    <div>
                      <strong>{user.name}</strong>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          color: "#666",
                        }}
                      >
                        {user.role || "Attendee"}
                      </p>
                    </div>
                  </div>
                  {isUserOrganizer && (
                    <div>
                      <form>
                        <label style={switchStyle}>
                          <input
                            type="checkbox"
                            checked={user.pivot.Attended}
                            onChange={() => handleToggle(user.id)}
                            style={{ display: "none" }}
                          />
                          <span
                            style={{
                              ...sliderStyle,
                              backgroundColor: user.pivot.Attended
                                ? "#0d6efd"
                                : "#ccc",
                            }}
                          >
                            <span
                              style={{
                                ...dotStyle,
                                transform: user.pivot.Attended
                                  ? "translateX(22px)"
                                  : "translateX(2px)",
                              }}
                            />
                          </span>
                        </label>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Minutes */}
          <div className="card shadow" style={cardStyle}>
            <h3 style={headingStyle}>Minutes</h3>
            {meeting.minutes ? (
              <>
                <p>
                  <strong>Decisions:</strong>{" "}
                  {meeting.minutes.decisions ? (
                    meeting.minutes.decisions
                  ) : (
                    <i>No decisions taken yet</i>
                  )}
                </p>
                <p>
                  <strong>Discussed:</strong>{" "}
                  {meeting.minutes.discussedPoints ? (
                    meeting.minutes.discussedPoints
                  ) : (
                    <i>No Discussed points entered yet</i>
                  )}
                </p>
              </>
            ) : (
              <i>No minutes available</i>
            )}
          </div>

          {/* Attachments */}
          <div className="card shadow" style={cardStyle}>
            <h3 style={headingStyle}>Attachments</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {existingAttachments?.map((file) => {
                const fileUrl = `http://127.0.0.1:8000/${file.filePath}`;
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: "1rem",
                    }}
                  >
                    {isImageFile(file.fileName) && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={fileUrl}
                          alt={file.fileName}
                          style={imgStyle}
                        />
                        <a
                          href={fileUrl}
                          download={file.fileName}
                          style={{ marginTop: "0.5rem" }}
                        >
                          View
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!existingAttachments || existingAttachments.length === 0) && (
                <i>No Attachments uploaded yet</i>
              )}
            </div>
          </div>

          {/* Action Items */}
          <div className="card shadow" style={cardStyle}>
            <h3 style={headingStyle}>Action Items</h3>
            <ul style={ulStyle}>
              {meeting.minutes?.action_items?.map((item) => (
                <li key={item.id} style={actionItemStyle}>
                  <div style={liFlex}>
                    <FaCheckCircle
                      color={item.status === "Completed" ? "green" : "orange"}
                    />
                    <strong>{item.description}</strong>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.85rem",
                        fontStyle: "italic",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div
                    style={{
                      paddingLeft: "24px",
                      color: "#666",
                      fontSize: "0.9rem",
                    }}
                  >
                    Assigned to: {item.assignee?.name || "Unassigned"} | Due:{" "}
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString()
                      : "No due date"}
                  </div>
                </li>
              ))}
              {(!meeting.minutes ||
                meeting.minutes?.action_items?.length === 0) && (
                <i>No Action Items Assigned yet </i>
              )}
            </ul>
          </div>
        </div>

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

              {/* Step 1: Select Meeting Date */}
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

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "1rem",
                    }}
                  >
                    <button
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
                      onClick={() => {
                        if (selectedDate) {
                          const defaultStartTime = `${selectedDate}T09:00`;
                          const defaultEndTime = `${selectedDate}T10:00`;
                          setNewMeeting({
                            ...newMeeting,
                            startsAt: defaultStartTime,
                            endsAt: defaultEndTime,
                          });
                          setStep(2);
                        }
                      }}
                      disabled={!selectedDate}
                      style={{
                        backgroundColor: selectedDate ? "#0d6efd" : "#ccc",
                        color: "white",
                        padding: "0.75rem 1.5rem",
                        fontWeight: "600",
                        borderRadius: "8px",
                        border: "none",
                        cursor: selectedDate ? "pointer" : "not-allowed",
                        opacity: selectedDate ? 1 : 0.6,
                      }}
                    >
                      Next
                    </button>
                  </div>
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
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStep(3);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        htmlFor="meeting-title"
                        style={{ fontWeight: "600", color: "#333" }}
                      >
                        Meeting Title
                      </label>
                      <input
                        id="meeting-title"
                        type="text"
                        placeholder="e.g. Budget Review"
                        value={newMeeting.title}
                        onChange={(e) =>
                          setNewMeeting({
                            ...newMeeting,
                            title: e.target.value,
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
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        htmlFor="meeting-description"
                        style={{ fontWeight: "600", color: "#333" }}
                      >
                        Description
                      </label>
                      <input
                        id="meeting-description"
                        type="text"
                        placeholder="e.g. Discussion on quarterly spending"
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
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        htmlFor="start-time"
                        style={{ fontWeight: "600", color: "#333" }}
                      >
                        Start Time
                      </label>
                      <input
                        id="start-time"
                        type="datetime-local"
                        value={toDatetimeLocal(newMeeting.startsAt)}
                        onChange={(e) => {
                          setNewMeeting({
                            ...newMeeting,
                            startsAt: e.target.value,
                          });
                          setSelectedDate(e.target.value.split("T")[0]);
                        }}
                        required
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "1rem",
                          borderRadius: "8px",
                          border: "1.5px solid #ccc",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        htmlFor="end-time"
                        style={{ fontWeight: "600", color: "#333" }}
                      >
                        End Time
                      </label>
                      <input
                        id="end-time"
                        type="datetime-local"
                        value={toDatetimeLocal(newMeeting.endsAt)}
                        onChange={(e) =>
                          setNewMeeting({
                            ...newMeeting,
                            endsAt: e.target.value,
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
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "1rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setStep(1)}
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
                        Back
                      </button>

                      {!onGoing && !past ? (
                        <button
                          type="button"
                          onClick={handleCreateMeeting}
                          style={{
                            padding: "0.7rem 1.5rem",
                            fontWeight: "600",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "#0d6efd",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="submit"
                          style={{
                            padding: "0.7rem 1.5rem",
                            fontWeight: "600",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "#0d6efd",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}

              {step === 3 && (
                <>
                  <h3
                    style={{
                      marginBottom: "1.5rem",
                      fontSize: "1.8rem",
                      fontWeight: "700",
                      color: "#0d6efd",
                    }}
                  >
                    Finalize Meeting Details
                  </h3>

                  {/* Agendas Section */}
                  <div style={{ marginBottom: "2rem" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "rows",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4
                        style={{
                          marginBottom: "1rem",
                          fontWeight: "600",
                          color: "#333",
                        }}
                      >
                        Agendas
                      </h4>
                      <button
                        type="button"
                        onClick={addAgenda}
                        style={{
                          marginBottom: "1rem",
                          backgroundColor: "#0d6efd",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "0.5rem 1rem",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>

                    {newMeeting.agendas.map((agenda, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <label htmlFor={`agenda-${idx}`} className="sr-only">
                          Agenda {idx + 1}
                        </label>
                        <input
                          id={`agenda-${idx}`}
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
                  </div>

                  {/* Meeting Members */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h4
                      style={{
                        marginBottom: "0.75rem",
                        fontWeight: "600",
                        color: "#333",
                      }}
                    >
                      Meeting Members
                    </h4>

                    {/* Selected users */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.6rem",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        key={"you"}
                        style={{
                          backgroundColor: "#d6e4ff",
                          padding: "0.3rem 0.75rem",
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.95rem",
                          minWidth: "70px",
                        }}
                      >
                        You
                      </div>
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          style={{
                            backgroundColor: "#d6e4ff",
                            padding: "0.4rem 1rem",
                            borderRadius: "9999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            fontSize: "1rem",
                            color: "#1a3fbb",
                            boxShadow: "0 1px 3px rgba(0, 49, 151, 0.3)",
                            userSelect: "none",
                          }}
                          title={user.email}
                        >
                          <span>{user.name}</span>
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
                              color: "#0d47a1",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "1.3rem",
                              lineHeight: "1",
                              padding: 0,
                              margin: 0,
                              width: "24px",
                              height: "24px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "white";
                              e.currentTarget.style.backgroundColor = "#0d47a1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#0d47a1";
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                            aria-label={`Remove ${user.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      id="user-search"
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem 1rem",
                        fontSize: "1rem",
                        borderRadius: "8px",
                        border: "1.5px solid #ccc",
                        marginBottom: "0.75rem",
                      }}
                    />

                    <div
                      style={{
                        minHeight: "120px",
                        maxHeight: "120px",
                        overflowY: "auto",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff",
                        padding: "0.5rem",
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
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.5rem",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              backgroundColor: "#f9f9f9",
                              borderRadius: "6px",
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
                            <img
                              src={
                                `http://127.0.0.1:8000/${user.profile_picture}` ||
                                "https://via.placeholder.com/40"
                              }
                              alt={user.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #ccc",
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: "bold" }}>
                                {user.name}
                              </div>
                              <div
                                style={{ fontSize: "0.85rem", color: "#666" }}
                              >
                                {user.email}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "1rem",
                      marginTop: "1rem",
                    }}
                  >
                    {!onGoing && !past && (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
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
                        Back
                      </button>
                    )}
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
                      type="button"
                      onClick={handleCreateMeeting}
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
                      Submit
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      style={{
                        padding: "0.7rem 1.5rem",
                        fontWeight: "600",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#0d6efd",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {step === 4 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                  }}
                >
                  {/* Meeting Minutes */}
                  <section style={sectionStyle}>
                    <h3 style={sectionHeading}>📝 Meeting Minutes</h3>

                    <div style={formGroup}>
                      <label htmlFor="decisions" style={labelStyle}>
                        Decisions
                      </label>
                      <textarea
                        id="decisions"
                        autoFocus
                        placeholder="Write the decisions taken in the meeting..."
                        value={newMeeting.minutes.decisions}
                        onChange={(e) =>
                          setNewMeeting((prev) => ({
                            ...prev,
                            minutes: {
                              ...prev.minutes,
                              decisions: e.target.value,
                            },
                          }))
                        }
                        rows={4}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={formGroup}>
                      <label htmlFor="discussedPoints" style={labelStyle}>
                        Discussed Points
                      </label>
                      <textarea
                        id="discussedPoints"
                        placeholder="Mention discussed topics, challenges or outcomes..."
                        value={newMeeting.minutes.discussedPoints}
                        onChange={(e) =>
                          setNewMeeting((prev) => ({
                            ...prev,
                            minutes: {
                              ...prev.minutes,
                              discussedPoints: e.target.value,
                            },
                          }))
                        }
                        rows={4}
                        style={textareaStyle}
                      />
                    </div>
                  </section>

                  {/* Attachments */}
                  <section style={sectionStyle}>
                    <h3 style={sectionHeading}>Attachments</h3>

                    {/* Existing attachments */}
                    {existingAttachments.map((file) => {
                      const fileUrl = `http://127.0.0.1:8000/${file.filePath}`;
                      return (
                        <>
                          <div
                            style={{ ...liFlex, ...attachmentItemStyle }}
                            key={file.id}
                          >
                            <FaPaperclip /> {file.fileName}
                            {isUserOrganizer && (
                              <button
                                style={deleteBtn}
                                onClick={() => handleDeleteAttachment(file.id)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          {isImageFile(file.fileName) && (
                            <img
                              src={fileUrl}
                              alt={file.fileName}
                              style={imgStyle}
                            />
                          )}
                        </>
                      );
                    })}

                    {/* New files (not uploaded yet) */}
                    {attachmentFiles.map((file, index) => (
                      <>
                        <div style={liFlex} key={`new-${index}`}>
                          <FaPaperclip /> {file.name}
                          <button
                            style={deleteBtn}
                            onClick={() =>
                              setAttachmentFiles((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                        {isImageFile(file.name) && (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={imgStyle}
                          />
                        )}
                      </>
                    ))}

                    <div style={formGroup}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const newFiles = Array.from(e.target.files);
                          setAttachmentFiles((prevFiles) => {
                            const existing = new Set(
                              prevFiles.map((f) => f.name + f.size)
                            );
                            return [
                              ...prevFiles,
                              ...newFiles.filter(
                                (f) => !existing.has(f.name + f.size)
                              ),
                            ];
                          });
                        }}
                        style={{ marginBottom: "0.5rem", marginTop: "0.5rem" }}
                      />

                      <button
                        onClick={handleUploadAttachment}
                        style={primaryBtn}
                      >
                        <FaPaperclip /> Upload
                      </button>
                    </div>
                  </section>

                  {/* Action Items */}
                  <section style={sectionStyle}>
                    <h3 style={sectionHeading}>Action Items</h3>

                    <ul style={ulStyle}>
                      {meeting.minutes?.action_items?.map((item) => (
                        <li key={item.id} style={actionItemStyle}>
                          <div style={liFlex}>
                            <FaCheckCircle
                              color={
                                item.status === "Completed" ? "green" : "orange"
                              }
                            />
                            <strong>{item.description}</strong>
                            <span style={statusStyle}>{item.status}</span>
                            {isUserOrganizer && (
                              <button
                                style={deleteBtn}
                                onClick={() => handleDeleteActionItem(item.id)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <div style={itemMetaStyle}>
                            Assigned to: {item.assignee?.name || "Unassigned"} |
                            Due:{" "}
                            {item.dueDate
                              ? new Date(item.dueDate).toLocaleDateString()
                              : "No due date"}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {isUserOrganizer && meeting.minutes && (
                      <>
                        {!showAddActionItemForm && (
                          <div style={formGroup}>
                            <button
                              onClick={() => setShowAddActionItemForm(true)}
                              style={primaryBtn}
                            >
                              <FaPlus /> Add Action Item
                            </button>
                          </div>
                        )}

                        {showAddActionItemForm && (
                          <div style={formCard}>
                            <h4>Add Action Item</h4>

                            <div style={formGroup}>
                              <label>Description</label>
                              <input
                                autoFocus
                                type="text"
                                value={actionItemData.description}
                                onChange={(e) =>
                                  setActionItemData({
                                    ...actionItemData,
                                    description: e.target.value,
                                  })
                                }
                                style={inputStyle}
                                placeholder="e.g., Submit final report"
                              />
                            </div>

                            <div style={formGroup}>
                              <label>Status</label>
                              <select
                                value={actionItemData.status}
                                onChange={(e) =>
                                  setActionItemData({
                                    ...actionItemData,
                                    status: e.target.value,
                                  })
                                }
                                style={inputStyle}
                              >
                                <option>Pending</option>
                                <option>Completed</option>
                              </select>
                            </div>

                            <div style={formGroup}>
                              <label>Due Date</label>
                              <input
                                type="date"
                                value={actionItemData.dueDate}
                                onChange={(e) =>
                                  setActionItemData({
                                    ...actionItemData,
                                    dueDate: e.target.value,
                                  })
                                }
                                style={inputStyle}
                              />
                            </div>

                            <div style={formGroup}>
                              <label>Assign To</label>
                              <select
                                value={actionItemData.assignedTo}
                                onChange={(e) =>
                                  setActionItemData({
                                    ...actionItemData,
                                    assignedTo: e.target.value,
                                  })
                                }
                                style={inputStyle}
                              >
                                <option value="">Select Assignee</option>
                                {users
                                  .filter((u) => u.role !== "Guest")
                                  .map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div style={{ display: "flex", gap: "1rem" }}>
                              <button
                                onClick={()=>handleAddActionItem()}
                                style={primaryBtn}
                              >
                                <FaPlus /> Add
                              </button>
                              <button
                                onClick={() => setShowAddActionItemForm(false)}
                                style={secondaryBtn}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  {/* Footer Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "2rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      style={secondaryBtn}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateMeeting}
                      style={primaryBtn}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  );
}

const sectionStyle = {
  backgroundColor: "#fff",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
};

const sectionHeading = {
  color: "#0d6efd",
  fontWeight: "700",
  marginBottom: "1rem",
};

const formGroup = {
  marginBottom: "1.25rem",
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontWeight: "500",
  marginBottom: "0.5rem",
};

const inputStyle = {
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  borderRadius: "8px",
  border: "1.5px solid #ccc",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
};

const primaryBtn = {
  backgroundColor: "#0d6efd",
  color: "white",
  border: "none",
  padding: "0.6rem 1.2rem",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const secondaryBtn = {
  backgroundColor: "#eaeaea",
  color: "#333",
  border: "none",
  padding: "0.6rem 1.2rem",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
};

const formCard = {
  marginTop: "1rem",
  padding: "1rem",
  border: "1px solid #ccc",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const addBtn = {
  ...primaryBtn,
  marginTop: "1rem",
};

const deleteBtn = {
  backgroundColor: "transparent",
  color: "red",
  border: "none",
  marginLeft: "1rem",
  cursor: "pointer",
};

const ulStyle = {
  padding: 0,
  listStyle: "none",
  marginTop: "1rem",
};

const actionItemStyle = {
  borderBottom: "1px solid #eee",
  paddingBottom: "1rem",
  marginBottom: "1rem",
};

const liFlex = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const statusStyle = {
  marginLeft: "auto",
  fontSize: "0.85rem",
  fontStyle: "italic",
  color: "#555",
};

const itemMetaStyle = {
  paddingLeft: "24px",
  color: "#666",
  fontSize: "0.9rem",
};

const attachmentItemStyle = {
  marginBottom: "1rem",
};

const imgStyle = {
  marginTop: "0.5rem",
  maxWidth: "100%",
  borderRadius: "8px",
};

const switchStyle = {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};

const sliderStyle = {
  width: "50px",
  height: "26px",
  borderRadius: "15px",
  backgroundColor: "#ccc",
  position: "relative",
  transition: "0.3s",
};

const dotStyle = {
  position: "absolute",
  top: "2px",
  left: "2px",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  background: "#fff",
  transition: "0.3s",
};
