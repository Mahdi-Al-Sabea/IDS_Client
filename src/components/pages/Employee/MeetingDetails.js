// Full rewritten MeetingDetails.jsx with modals
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

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

  const [modalType, setModalType] = useState(null); // 'minutes' | 'agenda' | 'attachment' | 'actionItem'

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
        const meetingRes = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/Meeting/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const fetchedMeeting = meetingRes.data.data;

        setMeeting(fetchedMeeting);
        setAgendas(fetchedMeeting.agendas || []);
        setMinutesData({
          decisions: fetchedMeeting.minutes?.decisions || "",
          discussedPoints: fetchedMeeting.minutes?.discussedPoints || "",
        });
        setUsers(meetingRes.data.data.attendees || []);
      } catch {
        setError("Failed to fetch meeting details.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const openModal = (type) => setModalType(type);
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
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', maxWidth: '600px', width: '90%' }}>
          {children}
          <button onClick={closeModal} style={{ marginTop: '1rem', background: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px' }}>Close</button>
        </div>
      </div>
    );
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!meeting) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2>{meeting.title}</h2>

      <p>{meeting.description}</p>
      <p>Status: {meeting.status}</p>
      <p>Starts: {formatDateTime(meeting.startsAt)}</p>
      <p>Ends: {formatDateTime(meeting.endsAt)}</p>

      <h3>Agendas</h3>
      {meeting.agendas?.map((a) => <p key={a.id}>- {a.description}</p>)}
      <button onClick={() => openModal('agenda')}>Edit Agendas</button>

      <h3>Minutes</h3>
      {meeting.minutes ? (
        <>
          <p><strong>Decisions:</strong> {meeting.minutes.decisions}</p>
          <p><strong>Discussed Points:</strong> {meeting.minutes.discussedPoints}</p>
        </>
      ) : <p>No minutes</p>}
      <button onClick={() => openModal('minutes')}>{meeting.minutes ? 'Edit Minutes' : 'Add Minutes'}</button>

      <h3>Attachments</h3>
      {meeting.minutes?.attachments?.length ? (
        <ul>
          {meeting.minutes.attachments.map((file) => (
            <li key={file.id}>{file.fileName}</li>
          ))}
        </ul>
      ) : <p>No attachments</p>}
      {meeting.minutes && <button onClick={() => openModal('attachment')}>Upload Attachment</button>}

      <h3>Action Items</h3>
      {meeting.minutes?.action_items?.map((item) => (
        <div key={item.id}>
          <p><strong>{item.description}</strong> (Status: {item.status})</p>
        </div>
      ))}
      {meeting.minutes && <button onClick={() => openModal('actionItem')}>Add Action Item</button>}

      {modalType === 'agenda' && (
        <Modal>
          <h3>Edit Agendas</h3>
          {agendas.map((agenda, index) => (
            <textarea
              key={index}
              value={agenda.description}
              onChange={(e) => {
                const updated = [...agendas];
                updated[index].description = e.target.value;
                setAgendas(updated);
              }}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
          ))}
          <button onClick={() => setAgendas([...agendas, { description: "" }])}>+ Add Agenda</button>
          <button onClick={handleSaveAgendas} style={{ marginLeft: '1rem' }}>Save</button>
        </Modal>
      )}

      <h3>Attendees</h3>
      {meeting.attendees && meeting.attendees.length > 0 ? (
        <ul>
          {meeting.attendees.map((att) => {
            const user = users.find((u) => u.id === att.id); // adjust field name if necessary
            return (
              <li key={att.id}>
                {user ? `${user.name} (${user.email})` : `User ID: ${att.user_id}`}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No attendees</p>
      )}

      <h3>Room</h3>
      {meeting.room && (
        <p>{meeting.room.roomname} - {meeting.room.capacity}</p>
      ) || (<p>No room assigned</p>
      )}


      {modalType === 'minutes' && (
        <Modal>
          <h3>{meeting.minutes ? 'Edit Minutes' : 'Add Minutes'}</h3>
          <textarea
            placeholder="Decisions"
            value={minutesData.decisions}
            onChange={(e) => setMinutesData({ ...minutesData, decisions: e.target.value })}
            rows={3}
            style={{ width: '100%' }}
          />
          <textarea
            placeholder="Discussed Points"
            value={minutesData.discussedPoints}
            onChange={(e) => setMinutesData({ ...minutesData, discussedPoints: e.target.value })}
            rows={3}
            style={{ width: '100%' }}
          />
          <button onClick={handleSubmitMinutes}>Save</button>
        </Modal>
      )}

      {modalType === 'attachment' && (
        <Modal>
          <h3>Upload Attachment</h3>
          <input type="file" onChange={(e) => setAttachmentFile(e.target.files[0])} />
          <button onClick={handleUploadAttachment}>Upload</button>
        </Modal>
      )}

      {modalType === 'actionItem' && (
        <Modal>
          <h3>Add Action Item</h3>
          <input
            placeholder="Description"
            value={actionItemData.description}
            onChange={(e) => setActionItemData({ ...actionItemData, description: e.target.value })}
            style={{ width: '100%' }}
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
          <button onClick={handleAddActionItem}>Add</button>
        </Modal>
      )}
    </div>
  );
}
