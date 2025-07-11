import img from "../../assets/floorplan.jpg";
import "./FloorPlan.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../../hooks/UserContext";
import { ToastContainer, toast } from 'react-toastify';

export default function FloorPlan({ toggle, setToggle, setMeeting, meeting }) {
  const { user } = useUser();
  const [floorRooms, setFloorRooms] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const totalFloors = 10; // set your actual total floors

  const roomsPositions = [
    { id: "1", label: "1", top: "19%", left: "61%" },
    { id: "2", label: "2", top: "60%", left: "55%" },
    { id: "3", label: "3", top: "50%", left: "75%" },
    { id: "4", label: "4", top: "73%", left: "77%" },
    { id: "5", label: "5", top: "75%", left: "24%" },
    { id: "6", label: "6", top: "81%", left: "46%" },
  ];

  const fetchFloorRooms = async (floor) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/Room?floor=${floor}`
      );
      setFloorRooms(response.data.data.data);
      console.log("Fetched floor rooms:", response.data.data.data);
    } catch (error) {
      console.error("Error fetching floor rooms:", error);
      setFloorRooms([]); // prevent infinite loading if error happens
    }
  };

  useEffect(() => {
    console.log(user.role);

    fetchFloorRooms(currentFloor);
  }, [currentFloor]);

  useEffect(() => {
    console.log("Toggle changed, refetching floor rooms");
    fetchFloorRooms(currentFloor);
  }, [toggle]);

  const handleClick = (roomId) => {
    console.log("Reserve room:", roomId);
    if (user.role === "Employee") {
      // Navigate to reservation flow or open modal
      console.log("Navigating to reservation flow for room:", roomId);
      // You can implement the logic to navigate to the reservation page or open a modal here
      setMeeting({ ...meeting, room_id: roomId });
      toast.success("Room selected successfully!");
    } else {
      console.log("Admin clicked on room:", roomId);
    }
    // navigate to reservation flow or open modal
  };

  if (!floorRooms) return <div>Loading...</div>;

  return (
    <div className="floorplan-wrapper container card shadow-lg ">
      <ToastContainer />
      <div className="card-header text-center">
        {user.role === "Admin" && <h4>🏢 Rooms Mapped to Floors</h4>}
        {user.role === "Employee" && <h4>🏢 Select a room to book</h4>}
      </div>

      <div className="floorplan-image-container">
        <img src={img} alt="Floor Plan" className="floorplan-image" />
        {floorRooms.map((room) => {
          const pos = roomsPositions.find(
            (p) => parseInt(p.id) === parseInt(room.position)
          );
          if (!pos) return null;

          return (
            <button
              key={room.id}
              className="floorplan-btn"
              style={{ top: pos.top, left: pos.left }}
              onClick={(e) => {
                e.preventDefault();
                handleClick(room.id);
              }}
            >
              {room.roomname || pos.label}
              <span className="tooltip">
                <div
                  style={{
                    flex: "1 1 calc(33.333% - 1rem)",
                    cursor: "pointer",
                    padding: "1rem",
                    borderRadius: "8px",

                    backgroundColor: "#fff",

                    boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
                  }}
                >
                  <h6>{room.roomname}</h6>
                  <p>Capacity: {room.capacity}</p>
                  <ul style={{ paddingLeft: "1rem", fontSize: "0.9rem" }}>
                    {room.features.map((f) => (
                      <li key={f.id}>✅ {f.title}</li>
                    ))}
                  </ul>
                </div>
              </span>
            </button>
          );
        })}
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3 p-3">
        <button
          className="btn btn-outline-primary"
          disabled={currentFloor <= -10}
          onClick={(e) => {
            e.preventDefault();
            setCurrentFloor((prev) => prev - 1);
          }}
        >
          ⬅ Previous
        </button>
        <span>
          Floor {currentFloor} of {totalFloors}
        </span>
        <button
          className="btn btn-outline-primary"
          disabled={currentFloor >= totalFloors}
          onClick={(e) => {
            e.preventDefault();
            setCurrentFloor((prev) => Math.min(prev + 1, totalFloors));
          }}
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}
