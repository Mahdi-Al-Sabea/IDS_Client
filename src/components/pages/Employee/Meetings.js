import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FloorPlan from "../FloorPlan";
import { ToastContainer, toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "../../../hooks/UserContext";

function formatDateTime(dateStr) {
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateStr).toLocaleString(undefined, options);
}

function splitMeetings(meetings) {
  const now = new Date();
  const ongoing = [];
  const upcoming = [];
  const previous = [];

  meetings.forEach((m) => {
    const start = new Date(m.startsAt);
    const end = new Date(m.endsAt);
    if (start <= now && now <= end && m.status != "completed") ongoing.push(m);
    else if (start > now) upcoming.push(m);
    else previous.push(m);
  });

  ongoing.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  upcoming.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  previous.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  return { ongoing, upcoming, previous };
}

export default function MeetingsList() {
  const { user } = useUser();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]); // Store selected users
  const [userId, setUserId] = useState(null); // Store user ID
  const [currentMeetingId, setCurrentMeetingId] = useState(null); // null means it's a new meeting
  const [searchFeature, setSearchFeature] = useState("");
  const [meetingsByDate, setMeetingsByDate] = useState([]);
  const [step, setStep] = useState(1); // step 1 = date picker, step 2 = form
  const [selectedDate, setSelectedDate] = useState(null);
  const [features, setFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    room_id: "",
    agendas: [{ description: "" }],
    attendees: [], // updated from attendeesIn to an array
  });

  const errorRef = useRef(null);

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchMeetings = async () => {
    setError(null);
    try {
      setLoading(true);
      const profileRes = await axios.get(
        "http://127.0.0.1:8000/api/User/Profile"
      );
      const id = profileRes.data.data.id;
      const res = await axios.get(
        `http://127.0.0.1:8000/api/User/${id}/meetings`,
        config
      );
      setMeetings(res.data.data);
    } catch (err) {
      setError("Failed to fetch meetings.");
    } finally {
      setLoading(false);
    }
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

  const renderMeetingsGroupedByDate = (meetingsList, type = "upcoming") => {
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
                m.isOngoing
                  ? "ongoing-highlight"
                  : type === "past"
                  ? "meeting-past"
                  : "meeting-upcoming"
              }`}
              onClick={() => navigate(`/meeting/${m.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="meeting-card-header">
                <h3 className="meeting-title">{m.title}</h3>

                <div className="meeting-tags">
                  {m.organizer_id == userId && (
                    <span className="organizer-badge">
                      You are the Organizer
                    </span>
                  )}
                  {m.isOngoing && (
                    <span className="status-chip ongoing">Ongoing</span>
                  )}
                </div>
              </div>

              <div className="meeting-details">
                <p>
                  <strong>🕒 Time:</strong>{" "}
                  {new Date(m.startsAt).toLocaleTimeString()} -{" "}
                  {new Date(m.endsAt).toLocaleTimeString()}
                </p>
                <p>
                  <strong>🏢 Room:</strong> {m.room?.roomname}{" "}
                  <span className="room-floor">(Floor {m.room?.floor})</span>
                </p>

                <div className="agendas-section">
                  <strong>📝 Agendas:</strong>
                  {m.agendas.length > 0 ? (
                    <ul className="agenda-list">
                      {m.agendas.map((a) => (
                        <li key={a.id}>{a.description}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-agenda">No agendas</p>
                  )}
                </div>

                <p>
                  <strong>👥 Attendees:</strong>{" "}
                  {m.attendees.map((a) => a.name).join(", ")}
                </p>
              </div>

              {m.organizer_id == userId && type != "past" && (
                <div className="organizer-actions">
                  {!m.isOngoing && (
                    <button
                      className="reschedule-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReschedule(m);
                      }}
                    >
                      Reschedule
                    </button>
                  )}

                  <button
                    className="cancel-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(m.id);
                    }}
                  >
                    Cancel
                  </button>
                  {m.isOngoing && (
                    <button
                      className="complete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(m.id);
                      }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    fetchRooms();
    fetchFeatures();
    setUserId(user.id); // Assuming user ID is available in the UserContext
  }, []);

  useEffect(() => {
    if (formError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [formError]);

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

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!newMeeting.attendees.includes(userId)) {
      setNewMeeting({
        ...newMeeting,
        attendees: [...newMeeting.attendees, userId],
      });
    }

    let attendees = [...newMeeting.attendees];
    if (!attendees.includes(parseInt(userId))) {
      attendees.push(parseInt(userId));
    }

    const payload = {
      title: newMeeting.title,
      description: newMeeting.description,
      startsAt: dayjs(newMeeting.startsAt).format("YYYY-MM-DDTHH:mm"),
      endsAt: dayjs(newMeeting.endsAt).format("YYYY-MM-DDTHH:mm"),
      room_id: newMeeting.room_id,
      agendas: newMeeting.agendas,
      attendees,
    };

    try {
      let response;
      if (currentMeetingId) {
        response = await axios.put(
          `http://127.0.0.1:8000/api/Meeting/${currentMeetingId}`,
          payload,
          config
        );

        setMeetings((prev) =>
          prev.map((m) => (m.id === currentMeetingId ? response.data.data : m))
        );
        toast.success("Meeting Created Successfully");
        console.log("hello");
      } else {
        response = await axios.post(
          "http://127.0.0.1:8000/api/Meeting",
          payload,
          config
        );

        setMeetings((prev) => [...prev, response.data.data]);
        toast.success("Meeting Created Successfully");
        console.log("hello");
      }

      setShowModal(false);
      setNewMeeting({
        title: "",
        startsAt: "",
        endsAt: "",
        room_id: "",
        agendas: [{ description: "" }],
        attendees: [],
      });

      setCurrentMeetingId(null);
      setSelectedDate(null);
      setSelectedUsers([]);
    } catch (err) {
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError("Failed to create meeting.");
      }
    }
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
      fetchMeetings();
    } catch (error) {
      console.error("Cancel error", error);
      toast.error("Failed to cancel meeting.");
    }
  };

  const handleComplete = async (meetingId) => {
    if (!window.confirm("Mark this meeting as completed?")) return;

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/Meeting/${meetingId}/status`,
        { status: "completed" },
        config
      );
      toast.success("Meeting marked as completed.");
      fetchMeetings();
    } catch (error) {
      console.error("Status update error", error);
      toast.error("Failed to update status.");
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
    // You can reuse your modal form and populate it with `meeting`
    setShowModal(true);
    setStep(2); // go to form step
    setSelectedDate(meeting.startsAt.split("T")[0]);
    setCurrentMeetingId(meeting.id); // <--- add this

    setNewMeeting({
      ...meeting,
      room_id: meeting.room?.id || "",
      agendas: meeting.agendas.map((a) => ({ description: a.description })),
      attendees: meeting.attendees.map((a) => a.id), // backend expects IDs
    });

    setSelectedUsers(meeting.attendees); // to show selected attendee chips
  };

  const { ongoing, upcoming, previous } = splitMeetings(meetings);

  useEffect(() => {
    if (newMeeting.room_id && newMeeting.startsAt) {
      fetchMeetingByRoomandDate();
    }
  }, [newMeeting.room_id, newMeeting.startsAt]);

  useEffect(() => {
    const filtered = rooms.filter((room) => {
      const roomfeaturesIds = room.features.map((item) => item.id);
      return selectedFeatures.every((sf) => roomfeaturesIds.includes(sf));
    });

    setFilteredRooms(filtered);
  }, [selectedFeatures, rooms]); // 👈 Trigger on mount AND when rooms or features change

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

  return (
    <>
      <style>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #0d6efd;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .organizer-badge {
          background-color: #198754; /* Bootstrap's green */
          color: white;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 12px;
          margin-left: 8px;
          display: inline-block;
          font-weight: 500;
        }

        .meeting-tags {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 4px;
        }

        .meetings-section {
          margin-bottom: 2rem;
        }
        .meetings-title {
          font-weight: 700;
          font-size: 1.5rem;
          color: #212529;
          margin-bottom: 1rem;
          border-bottom: 3px solid #0d6efd;
          display: inline-block;
          padding-bottom: 0.3rem;
        }
        .meetings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .meeting-card {
          background: white;
          border-radius: 1.5rem;
          padding: 1rem 1.5rem;
          box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          user-select: none;
          transition: box-shadow 0.3s ease;
        }
        .meeting-card:hover {
          box-shadow: 0 6px 18px rgb(13 110 253 / 0.3);
          cursor: pointer;
        }
        .meeting-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #0d6efd;
          border: 3px solid white;
          box-shadow: 0 0 0 3px #0d6efd;
          flex-shrink: 0;
        }
        .meeting-title {
          font-weight: 600;
          font-size: 1.1rem;
          color: #212529;
        }
        .meeting-datetime {
          font-size: 0.9rem;
          color: #6c757d;
        }
        .meeting-texts {
          display: flex;
          flex-direction: column;
        }
        .previous-meetings .meeting-card {
          opacity: 0.5;
        }
        .ongoing-highlight {
          background-color: #e6f4ea;
        }
        .btn-primary {
          background-color: #0d6efd;
          color: white;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          margin-bottom: 2rem;
          font-weight: bold;
          cursor: pointer;
        }
        .meeting-card-grid {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .organizer-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        /* Common Button Styles */
        .reschedule-btn,
        .cancel-btn,
        .complete-btn {
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 2px solid;
          background-color: white;
          cursor: pointer;
          transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;
        }

        /* Specific Colors */
        .reschedule-btn {
          color: #0d6efd;
          border-color: #0d6efd;
        }
        .reschedule-btn:hover {
          background-color: #0d6efd;
          color: white;
          transform: scale(1.05);
        }

        .cancel-btn {
          color: #dc3545;
          border-color: #dc3545;
        }
        .cancel-btn:hover {
          background-color: #dc3545;
          color: white;
          transform: scale(1.05);
        }

        .complete-btn {
          color: green;
          border-color: green;
          opacity: 0.7;
        }
        .complete-btn:hover {
          background-color: green;
          color: white;
          opacity: 1;
          transform: scale(1.05);
        }


        /* Default Card */
        .meeting-card-ui {
          background: #fff;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          transition: 0.3s ease;
        }

        /* Past */
        .meeting-past {
          background-color: #f1f3f5;
        }

        /* Ongoing */
        .ongoing-highlight {
          background-color: #e6fcf5;
        }

        /* Ongoing Tag */
        .status-chip.ongoing {
          background-color: #20c997;
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 5px;
          font-size: 0.75rem;
        }

        /* Organizer badge */
        .organizer-badge {
          background-color: #ffd43b;
          color: #000;
          padding: 0.2rem 0.5rem;
          border-radius: 5px;
          font-size: 0.75rem;
          margin-left: 0.5rem;
        }


      `}</style>

      <button
        className="btn-primary"
        onClick={() => {
          setStep(1);
          setShowModal(true);
          setCurrentMeetingId(null);
        }}
      >
        + New Meeting
      </button>

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
              maxWidth: "80%",
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
                  onSubmit={(e) => {
                    handleCreateMeeting(e);
                  }}
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
                    onChange={(e) => {
                      setNewMeeting({
                        ...newMeeting,
                        startsAt: e.target.value,
                      });
                      setSelectedDate(e.target.value);
                    }}
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

                  <FloorPlan
                    meeting={newMeeting}
                    setMeeting={setNewMeeting}
                  ></FloorPlan>

                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Search by Feature:
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {features.map((feature) => {
                      const isSelected = selectedFeatures.includes(feature.id); // Use id to track selection

                      return (
                        <button
                          type="button"
                          key={feature.id}
                          onClick={() => {
                            setSelectedFeatures((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== feature.id)
                                : [...prev, feature.id]
                            );
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "999px",
                            border: "1px solid #ccc",
                            backgroundColor: isSelected ? "#007bff" : "#f1f1f1",
                            color: isSelected ? "#fff" : "#333",
                            cursor: "pointer",
                          }}
                        >
                          {feature.title}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
                  >
                    {filteredRooms.length === 0 ? (
                      <p style={{ fontStyle: "italic", color: "#888" }}>
                        ❌ No rooms match the selected features.
                      </p>
                    ) : (
                      filteredRooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() =>
                            setNewMeeting({ ...newMeeting, room_id: room.id })
                          }
                          style={{
                            flex: "1 1 calc(33.333% - 1rem)",
                            cursor: "pointer",
                            padding: "1rem",
                            borderRadius: "8px",
                            border:
                              parseInt(newMeeting.room_id) === room.id
                                ? "2px solid #0d6efd"
                                : "1px solid #ccc",
                            backgroundColor:
                              parseInt(newMeeting.room_id) === room.id
                                ? "#e7f1ff"
                                : "#fff",
                            transition: "0.3s ease",
                          }}
                        >
                          <h6>{room.roomname}</h6>
                          <p>Capacity: {room.capacity}</p>
                          <ul
                            style={{ paddingLeft: "1rem", fontSize: "0.9rem" }}
                          >
                            {room.features.map((f) => (
                              <li key={f.id}>✅ {f.title}</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>

                  {meetingsByDate && meetingsByDate.length > 0 && (
                    <>
                      <h6 style={{ marginBottom: "0.5rem" }}>
                        Meetings on{" "}
                        {new Date(newMeeting.startsAt).toLocaleDateString()} in{" "}
                        {rooms.find(
                          (r) => r.id === parseInt(newMeeting.room_id)
                        )?.roomname ?? "Unknown Room"}
                      </h6>

                      {meetingsByDate.some((meeting) => {
                        const newStart = new Date(newMeeting.startsAt);
                        const newEnd = new Date(newMeeting.endsAt);
                        const existingStart = new Date(meeting.startsAt);
                        const existingEnd = new Date(meeting.endsAt);

                        return (
                          newStart < existingEnd &&
                          newEnd > existingStart &&
                          newMeeting.id !== meeting.id
                        );
                      }) && (
                        <p
                          style={{
                            color: "red",
                            fontSize: "0.85rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          ❌ You cannot reserve during the times below —
                          conflict detected.
                        </p>
                      )}

                      {meetingsByDate.map((meeting, index) => {
                        const newStart = new Date(newMeeting.startsAt);
                        const newEnd = new Date(newMeeting.endsAt);
                        const existingStart = new Date(meeting.startsAt);
                        const existingEnd = new Date(meeting.endsAt);

                        const isConflict =
                          newStart < existingEnd &&
                          newEnd > existingStart &&
                          meeting.id !== newMeeting.id; // Time overlap check

                        return (
                          <div
                            key={index}
                            style={{
                              backgroundColor: isConflict
                                ? "#ffe6e6"
                                : "#f1f1f1",
                              padding: "0.75rem",
                              borderRadius: "8px",
                              marginBottom: "0.5rem",
                              borderLeft: `3px solid ${
                                isConflict ? "#dc3545" : "#0d6efd"
                              }`,
                              fontSize: "0.85rem",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                                color: isConflict ? "#b02a37" : "#333",
                              }}
                            >
                              {meeting.title}
                            </div>

                            <div style={{ color: "#555" }}>
                              🕒{" "}
                              {new Date(meeting.startsAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}{" "}
                              -{" "}
                              {new Date(meeting.endsAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

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
                      {selectedUsers
                        .filter((u) => u.id !== parseInt(userId))
                        .map((user) => (
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
                                margin: 0,
                                padding: 0,
                                background: "transparent",
                                border: "none",
                                color: "#0d6efd",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontSize: "1.2rem",
                                lineHeight: "0.7",
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
                            !selectedUsers.find((u) => u.id === user.id) &&
                            user.id !== parseInt(userId)
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
                      {currentMeetingId ? "Update Meeting" : "Create Meeting"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <section className="meetings-section">
        <h3 className="meetings-title" style={{ color: "#0d6efd" }}>
          Ongoing Meetings
        </h3>
        {ongoing.length === 0 ? (
          <p className="text-muted">No ongoing meetings.</p>
        ) : (
          renderMeetingsGroupedByDate(
            ongoing.map((m) => ({ ...m, isOngoing: true })),
            "upcoming"
          )
        )}
      </section>

      <section className="meetings-section">
        <h3 className="meetings-title" style={{ color: "#0d6efd" }}>
          Upcoming Meetings
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-muted">No upcoming meetings.</p>
        ) : (
          renderMeetingsGroupedByDate(
            upcoming.map((m) => ({ ...m, isOngoing: false })),
            "upcoming"
          )
        )}
      </section>

      <section className="meetings-section">
        <h3 className="meetings-title" style={{ color: "#0d6efd" }}>
          Previous Meetings
        </h3>
        {previous.length === 0 ? (
          <p className="text-muted">No previous meetings.</p>
        ) : (
          renderMeetingsGroupedByDate(
            previous.map((m) => ({ ...m, isOngoing: false })),
            "past"
          )
        )}
      </section>
      <ToastContainer />
    </>
  );
}
