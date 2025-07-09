import img from "../../assets/floorplan.jpg";
import "./FloorPlan.css";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FloorPlan({toggle, setToggle}) {
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
    } catch (error) {
      console.error("Error fetching floor rooms:", error);
      setFloorRooms([]); // prevent infinite loading if error happens
    }
  };

  useEffect(() => {
    fetchFloorRooms(currentFloor);
  }, [currentFloor]);

  useEffect(() => {
    console.log("Toggle changed, refetching floor rooms");
    fetchFloorRooms(currentFloor);
  }, [toggle]);

  const handleClick = (roomId) => {
    console.log("Reserve room:", roomId);
    // navigate to reservation flow or open modal
  };

  if (!floorRooms) return <div>Loading...</div>;

  return (
    <div className="floorplan-wrapper container card shadow-lg ">
      <div className="card-header text-center">
        
        <h4>🏢 Rooms Mapped to Floors</h4>
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
              onClick={() => handleClick(room.id)}
            >
              {room.roomname || pos.label}
            </button>
          );
        })}
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3 p-3">
        <button
          className="btn btn-outline-primary"
          disabled={currentFloor <= -10}
          onClick={() => setCurrentFloor((prev) => prev - 1)}
        >
          ⬅ Previous
        </button>
        <span>
          Floor {currentFloor} of {totalFloors}
        </span>
        <button
          className="btn btn-outline-primary"
          disabled={currentFloor >= totalFloors}
          onClick={() =>
            setCurrentFloor((prev) => Math.min(prev + 1, totalFloors))
          }
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}
