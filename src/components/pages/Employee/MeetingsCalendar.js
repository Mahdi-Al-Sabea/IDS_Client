import React, { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function MeetingsCalendar() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchMeetings = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log(user);
    console.log(user.role);
    setError(null);
    try {
      setLoading(true);
      const profileRes = await axios.get(
        "http://127.0.0.1:8000/api/User/Profile"
      );
      const id = profileRes.data.data.id;

      if (user.role === "Admin") {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/Meeting`,
          config
        );
        setMeetings(res.data.data);
      } else {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/User/${id}/meetings`,
          config
        );
        setMeetings(res.data.data);
      }
    } catch (err) {
      setError("Failed to fetch meetings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Convert meetings to calendar events, title always "Meeting"
  const events = meetings.map((meeting) => ({
    id: meeting.id,
    start: meeting.startsAt,
    end: meeting.endsAt,
  }));

  const closeModal = () => setSelectedMeeting(null);

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
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Meetings Calendar</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={(info) => {
          const meetingId = info.event.id;
          const meeting = meetings.find(
            (m) => m.id.toString() === meetingId.toString()
          );
          if (meeting) setSelectedMeeting(meeting);
        }}
        height="auto"
      />

      {selectedMeeting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              position: "relative",
              overflow: "hidden",
              padding: "2rem",
              fontFamily: "Arial, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                color: "#999",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              &times;
            </button>

            <h2
              style={{
                marginBottom: "1.5rem",
                fontSize: "1.5rem",
                color: "#333",
              }}
            >
              {selectedMeeting.title}
            </h2>

            {/* Grid Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                rowGap: "1rem",
                columnGap: "1rem",
              }}
            >
              <div>
                <strong>Description:</strong>
              </div>
              <div>{selectedMeeting.description}</div>

              <div>
                <strong>Room:</strong>
              </div>
              <div>
                {selectedMeeting.room.roomname} (floor{" "}
                {selectedMeeting.room.floor})
              </div>

              <div>
                <strong>Status:</strong>
              </div>
              <div>
                <span
                  style={{
                    padding: "4px 10px",
                    backgroundColor:
                      selectedMeeting.status === "Scheduled"
                        ? "#d1e7dd"
                        : selectedMeeting.status === "Ongoing"
                        ? "#fff3cd"
                        : "#f8d7da",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    display: "inline-block",
                    minWidth: "80px",
                    textAlign: "center",
                  }}
                >
                  {selectedMeeting.status}
                </span>
              </div>

              <div>
                <strong>Start:</strong>
              </div>
              <div>{new Date(selectedMeeting.startsAt).toLocaleString()}</div>

              <div>
                <strong>End:</strong>
              </div>
              <div>{new Date(selectedMeeting.endsAt).toLocaleString()}</div>
            </div>

            <div style={{ textAlign: "right", marginTop: "2rem" }}>
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
