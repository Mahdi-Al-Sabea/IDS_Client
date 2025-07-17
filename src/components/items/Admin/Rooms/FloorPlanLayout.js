import img from "../../../../assets/floorplan.jpg";


export default function FloorPlanLayout({ setFloorPlanPosition, scrollToTarget }) {


  const roomsPositions = [
    { id: "1", label: "1", top: "19%", left: "61%" },
    { id: "2", label: "2", top: "60%", left: "55%" },
    { id: "3", label: "3", top: "50%", left: "75%" },
    { id: "4", label: "4", top: "73%", left: "77%" },
    { id: "5", label: "5", top: "75%", left: "24%" },
    { id: "6", label: "6", top: "81%", left: "46%" },
  ];

;

  const handleClick = (roomId) => {
    console.log("Reserve room:", roomId);
    setFloorPlanPosition(roomId);
    scrollToTarget();
    // navigate to reservation flow or open modal
  };



  return (
    <div className="floorplan-wrapper container card shadow-lg mt-4">
      <div className="card-header text-center">
        <h4>🏢 Floor Rooms Layout (click on a position to initiate a new room)</h4>
      </div>

      <div className="floorplan-image-container">
        <img src={
            img
        } alt="Floor Plan" className="floorplan-image" />
        {roomsPositions.map((pos) => {
          return (
            <button
              key={pos.id}
              className="floorplan-btn"
              style={{ top: pos.top, left: pos.left }}
              onClick={() => handleClick(pos.id)}
            >
              { pos.label}
            </button>
          );
        })}
      </div>


    </div>
  );
}

