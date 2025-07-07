import CreateRoom from "../../items/Admin/Rooms/CreateRoom";
import RoomsTable from "../../items/Admin/Rooms/RoomsTable";
import FloorPlanLayout from "../../items/Admin/Rooms/FloorPlanLayout";
import FloorPlan from "../FloorPlan";
export default function Rooms() {
  return (
    <div className="container mt-5">
      <h1>Rooms Page</h1>
      <p>This is the rooms page where you can manage your rooms.</p>
      <FloorPlanLayout />
      <CreateRoom />
      <RoomsTable />
      <FloorPlan />

      {/* Add more content or components as needed */}
    </div>
  );
}