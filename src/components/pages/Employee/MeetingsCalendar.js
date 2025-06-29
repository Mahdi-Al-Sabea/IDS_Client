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

  const config = {
    headers: {
      Authorization: `Bearer YOUR_TOKEN_HERE`,
    },
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

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Convert meetings to calendar events, title always "Meeting"
  const events = meetings.map((meeting) => ({
    id: meeting.id,
    title: "Meeting",  // show generic "Meeting"
    start: meeting.startsAt,
    end: meeting.endsAt,
  }));

  const closeModal = () => setSelectedMeeting(null);

  if (loading) return <p>Loading meetings...</p>;
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
          const meeting = meetings.find((m) => m.id.toString() === meetingId.toString());
          if (meeting) setSelectedMeeting(meeting);
        }}
        height="auto"
      />

      {/* Modal for meeting details */}
      {selectedMeeting && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "white",
              padding: "1rem 2rem",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent modal close on inner click
          >
            <h3>{selectedMeeting.title}</h3>
            <p><strong>Description:</strong> {selectedMeeting.description}</p>
            <p><strong>Status:</strong> {selectedMeeting.status}</p>
            <p><strong>Start:</strong> {new Date(selectedMeeting.startsAt).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(selectedMeeting.endsAt).toLocaleString()}</p>
            {/* Add more details as you want */}
            <button onClick={closeModal} style={{ marginTop: "1rem" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
