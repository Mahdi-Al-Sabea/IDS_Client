import React from 'react';
import { useEffect } from 'react';
import CreateUser from '../../items/Admin/Users/CreateUser';
import axios from 'axios';
import UsersTable from '../../items/Admin/Users/UsersTable';
import { useState } from 'react';

export default function Users() {
  const [toggle, setToggle] = useState(false);





    return (
    <div className="container mt-5">
      <h1>Users Page</h1>
      <p>This is the users page where you can manage your users.</p>
      <CreateUser toggle={toggle} setToggle={setToggle} />
      <UsersTable toggle={toggle} setToggle={setToggle} />
        {/* Add more content or components as needed */}

    </div>
  );
}