import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FloorPlan from "../FloorPlan";

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
    if (start <= now && now <= end) ongoing.push(m);
    else if (start > now) upcoming.push(m);
    else previous.push(m);
  });

  ongoing.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  upcoming.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  previous.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  return { ongoing, upcoming, previous };
}

export default function MeetingsList() {
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

  const [step, setStep] = useState(1); // step 1 = date picker, step 2 = form
  const [selectedDate, setSelectedDate] = useState(null);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    room_id: "",
    agendas: [{ description: "" }],
    attendees: [], // updated from attendeesInput to an array
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
                  <button
                    className="reschedule-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReschedule(m);
                    }}
                  >
                    Reschedule
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(m.id);
                    }}
                  >
                    Cancel
                  </button>
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
    setUserId(localStorage.getItem("id"));
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

    const attendees = newMeeting.attendees;

    const payload = {
      title: newMeeting.title,
      description: newMeeting.description, // Assuming description is same as title
      startsAt: newMeeting.startsAt,
      endsAt: newMeeting.endsAt,
      room_id: newMeeting.room_id,
      agendas: newMeeting.agendas,
      attendees,
    };

    try {
      if (currentMeetingId) {
        await axios.put(
          `http://127.0.0.1:8000/api/Meeting/${currentMeetingId}`,
          payload,
          config
        );
      } else {
        await axios.post("http://127.0.0.1:8000/api/Meeting", payload, config);
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
      fetchMeetings();
      setCurrentMeetingId(null);
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.message) setFormError(err.response.data.message);
        else setFormError("Failed to create meeting.");
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
      alert("Meeting cancelled.");
      fetchMeetings();
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
          border-left: 6px solid #198754;
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

        .reschedule-btn,
        .cancel-btn {
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }

        .reschedule-btn {
          background-color: #0d6efd;
          color: white;
        }

        .cancel-btn {
          background-color: #dc3545;
          color: white;
        }
        .reschedule-btn:hover {
          opacity: 0.7;
          background-color: #0d6efd;
        }
        .cancel-btn:hover {
          opacity: 0.7;
          background-color: #dc3545;
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

        /* Upcoming */
        .meeting-upcoming {
          border-left: 6px solid #4c6ef5; /* Blue */
        }

        /* Past */
        .meeting-past {
          background-color: #f1f3f5;
          border-left: 6px solid #adb5bd; /* Gray */
        }

        /* Ongoing */
        .ongoing-highlight {
          background-color: #e6fcf5;
          border-left: 6px solid #20c997; /* Green */
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

      <FloorPlan></FloorPlan>

      <button
        className="btn-primary"
        onClick={() => {
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
        <h3 className="meetings-title" style={{ color: "#198754" }}>
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
        <h3 className="meetings-title" style={{ color: "#6c757d" }}>
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
    </>
  );
}
