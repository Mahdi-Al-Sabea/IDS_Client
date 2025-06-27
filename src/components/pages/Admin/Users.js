import React from 'react';
import { useEffect } from 'react';
import CreateUser from '../../items/Admin/Rooms/CreateUser';
import axios from 'axios';
import UsersTable from '../../items/Admin/Rooms/UsersTable';


export default function Users() {







    return (
    <div className="container mt-5">
      <h1>Users Page</h1>
      <p>This is the users page where you can manage your users.</p>
      <CreateUser />
        <UsersTable />
        {/* Add more content or components as needed */}

    </div>
  );
}