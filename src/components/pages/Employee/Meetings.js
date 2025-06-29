import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    room_id: "",
    agendas: [{ description: "" }],
    attendees: [], // updated from attendeesInput to an array
  });

  const navigate = useNavigate();

  const token = "13|qR0X2wbQvVBZTShVBBz04ZpbbsooVxrh3j82QChc8d574f42"; // Replace with your token logic
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchMeetings = async () => {
    setError(null);
    try {
      setLoading(true);
      const profileRes = await axios.get("http://127.0.0.1:8000/api/User/Profile");
      const id = profileRes.data.data.id;
      const res = await axios.get(`http://127.0.0.1:8000/api/User/${id}/meetings`, config);
      setMeetings(res.data.data);
    } catch (err) {
      setError("Failed to fetch meetings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/UserNotPaginated", config); // Make sure this endpoint returns all users
      setUsers(res.data.data); // Adjust if data structure is different
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/Room", config); // Make sure this endpoint returns all users
      setRooms(res.data.data); // Adjust if data structure is different
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    fetchRooms();
  }, []);

  const handleAgendaChange = (index, value) => {
    const updated = [...newMeeting.agendas];
    updated[index].description = value;
    setNewMeeting((nm) => ({ ...nm, agendas: updated }));
  };

  const addAgenda = () => {
    setNewMeeting((nm) => ({ ...nm, agendas: [...nm.agendas, { description: "" }] }));
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

    // Build payload as backend expects
    const payload = {
      title: newMeeting.title,
      description : newMeeting.description, // Assuming description is same as title
      startsAt: newMeeting.startsAt,
      endsAt: newMeeting.endsAt,
      room_id: newMeeting.room_id,
      agendas: newMeeting.agendas,
      attendees,
    };

    try {
      await axios.post("http://127.0.0.1:8000/api/Meeting", payload, config);
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
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.message) setFormError(err.response.data.message);
        else setFormError("Failed to create meeting.");
      } else {
        setFormError("Failed to create meeting.");
      }
    }
  };

  const { ongoing, upcoming, previous } = splitMeetings(meetings);

  if (loading) return <p style={{ padding: 20 }}>Loading meetings...</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

  return (
    <>
      <style>{`
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
      `}</style>

      <button className="btn-primary" onClick={() => setShowModal(true)}>
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
            }}
          >
            <button
              aria-label="Close modal"
              onClick={() => setShowModal(false)}
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
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0d6efd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
            >
              &times;
            </button>

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

            <form onSubmit={handleCreateMeeting} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <input
                autoFocus
                type="text"
                placeholder="Title"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                required
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1.5px solid #ccc",
                  outlineOffset: "2px",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
              />

              <input
                type="text"
                placeholder="Description"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                required
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1.5px solid #ccc",
                  outlineOffset: "2px",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
              />

              <input
                type="datetime-local"
                value={newMeeting.startsAt}
                onChange={(e) => setNewMeeting({ ...newMeeting, startsAt: e.target.value })}
                required
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1.5px solid #ccc",
                  outlineOffset: "2px",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
              />

              <input
                type="datetime-local"
                value={newMeeting.endsAt}
                onChange={(e) => setNewMeeting({ ...newMeeting, endsAt: e.target.value })}
                required
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1.5px solid #ccc",
                  outlineOffset: "2px",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
              />
    
              <label style={{ marginTop: '1rem', fontWeight: 'bold' }}>Select Room:</label>
              <select
                value={newMeeting.room_id}
                onChange={(e) => setNewMeeting({ ...newMeeting, room_id: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
              >
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.roomname} (Capacity: {room.capacity})
                  </option>
                ))}
              </select>

              <label style={{ fontWeight: "600", color: "#555" }}>Agendas</label>
              {newMeeting.agendas.map((agenda, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Agenda description"
                    value={agenda.description}
                    onChange={(e) => handleAgendaChange(idx, e.target.value)}
                    required
                    style={{
                      flexGrow: 1,
                      padding: "0.6rem 1rem",
                      fontSize: "1rem",
                      borderRadius: "8px",
                      border: "1.5px solid #ccc",
                      outlineOffset: "2px",
                      transition: "border-color 0.3s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
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

              <select
                multiple
                value={newMeeting.attendees}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setNewMeeting({ ...newMeeting, attendees: selected });
                }}
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1.5px solid #ccc",
                  outlineOffset: "2px",
                  height: "150px",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "0.7rem 1.5rem",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "1.5px solid #ccc",
                    backgroundColor: "white",
                    color: "#555",
                    cursor: "pointer",
                    transition: "background-color 0.3s, border-color 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                    e.currentTarget.style.borderColor = "#0d6efd";
                    e.currentTarget.style.color = "#0d6efd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor = "#ccc";
                    e.currentTarget.style.color = "#555";
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
                    boxShadow: "0 4px 12px rgb(13 110 253 / 0.5)",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0b5ed7")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0d6efd")}
                >
                  Create
                </button>
              </div>
            </form>
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
          <div className="meetings-list ongoing-meetings">
            {ongoing.map(({ id, title, startsAt }) => (
              <div className="meeting-card ongoing-highlight" key={id} onClick={() => navigate(`/meeting/${id}`)}>
                <div className="meeting-circle" />
                <div className="meeting-texts">
                  <div className="meeting-title">{title}</div>
                  <div className="meeting-datetime">{formatDateTime(startsAt)} — ongoing</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="meetings-section">
        <h3 className="meetings-title" style={{ color: "#0d6efd" }}>
          Upcoming Meetings
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-muted">No upcoming meetings.</p>
        ) : (
          <div className="meetings-list upcoming-meetings">
            {upcoming.map(({ id, title, startsAt }) => (
              <div className="meeting-card" key={id} onClick={() => navigate(`/meeting/${id}`)}>
                <div className="meeting-circle" />
                <div className="meeting-texts">
                  <div className="meeting-title">{title}</div>
                  <div className="meeting-datetime">{formatDateTime(startsAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="meetings-section previous-meetings">
        <h3 className="meetings-title" style={{ color: "#6c757d" }}>
          Previous Meetings
        </h3>
        {previous.length === 0 ? (
          <p className="text-muted">No previous meetings.</p>
        ) : (
          <div className="meetings-list">
            {previous.map(({ id, title, startsAt }) => (
              <div className="meeting-card" key={id} onClick={() => navigate(`/meeting/${id}`)}>
                <div className="meeting-circle" />
                <div className="meeting-texts">
                  <div className="meeting-title">{title}</div>
                  <div className="meeting-datetime">{formatDateTime(startsAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
