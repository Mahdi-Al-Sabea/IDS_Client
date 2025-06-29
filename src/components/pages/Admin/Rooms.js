import CreateRoom from "../../items/Admin/Rooms/CreateRoom";
import RoomsTable from "../../items/Admin/Rooms/RoomsTable";
export default function Rooms() {
  return (
    <div className="container mt-5">
      <h1>Rooms Page</h1>
      <p>This is the rooms page where you can manage your rooms.</p>
      <CreateRoom />
      <RoomsTable />
      {/* Add more content or components as needed */}
    </div>
  );
}