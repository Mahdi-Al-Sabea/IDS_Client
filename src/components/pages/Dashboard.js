import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';

export default function Dashboard() {

    const navigate = useNavigate();
    const [meetings, setMeetings] = useState(null);

    const getAllMeetings = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/Meeting?room_id=2&organiser_id=2');
            const responseData=response.data;
            setMeetings(responseData.data);
            console.log('Meetings fetched successfully:', responseData.data);
            }catch (error) {
            console.error('Error fetching meetings:', error);
        }
    }

    useEffect(() => {

        getAllMeetings();

    }, []);


    useEffect(() => {

        console.log('Meetings state updated:', meetings);

    }, [meetings]);

    


    if (!meetings) {
        return <div>Loading...</div>; // Show a loading state while fetching meetings
    }


  return (

    <div className="container mt-5">
      <h1>Welcome to the Dashboard</h1>
      <p>This is the dashboard where you can manage your tasks and projects.</p>
      {/* Add more content or components as needed */}
    </div>
  );
}

