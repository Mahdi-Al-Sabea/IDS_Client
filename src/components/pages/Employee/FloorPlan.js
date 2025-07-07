import img from '../../../assets/floorplan.jpg';

export default function FloorPlan() {
  const rooms = [
    { id: 'conf1', label: 'Conference 1', top: '15%', left: '25%' },
    { id: 'conf2', label: 'Conference 2', top: '20%', left: '58%' },
    { id: 'huddle1', label: 'Huddle Room', top: '40%', left: '30%' },
    { id: 'focus1', label: 'Focus Room', top: '60%', left: '70%' },
    { id: 'exec1', label: 'Exec Office', top: '30%', left: '80%' },
    // add as many rooms as your floor plan requires
  ];

  const handleClick = roomId => {
    // navigate to reservation flow or open modal
    console.log('Reserve room:', roomId);
  };

  return (
    <div style={{ backgroundColor: '#ddd' ,width: '1000px', height: '800px', position: 'relative' ,backgroundImage: `url(${img})`, backgroundSize: 'cover' ,sha}} className="floorplan-container">
      {rooms.map(room => (
        <button key={room.id} className="" style={{ top: room.top, left: room.left ,position: 'absolute'}} onClick={() => handleClick(room.id)}>
          {room.label}
        </button>
      ))}
    </div>

  );
}

