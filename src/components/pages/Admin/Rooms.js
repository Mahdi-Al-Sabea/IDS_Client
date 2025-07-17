import CreateRoom from "../../items/Admin/Rooms/CreateRoom";
import RoomsTable from "../../items/Admin/Rooms/RoomsTable";
import FloorPlanLayout from "../../items/Admin/Rooms/FloorPlanLayout";
import FloorPlan from "../FloorPlan";
import { useState } from "react";
import { useRef } from "react";


export default function Rooms() {
  const [toggle, setToggle] = useState(false);
  const [floorPlanPosition, setFloorPlanPosition] = useState(null);


  
  const targetRef = useRef(null);

  const scrollToTarget = () => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };



  return (
    <div className="container mt-5">
      <h1>Rooms Page</h1>
      <p>This is the rooms page where you can manage your rooms.</p>
      <FloorPlanLayout setFloorPlanPosition={setFloorPlanPosition} scrollToTarget={scrollToTarget} />
      <CreateRoom toggle={toggle} setToggle={setToggle} floorPlanPosition={floorPlanPosition} targetRef={targetRef} />
      <RoomsTable toggle={toggle} setToggle={setToggle} />
      <FloorPlan toggle={toggle} setToggle={setToggle} />

      {/* Add more content or components as needed */}
    </div>
  );
}