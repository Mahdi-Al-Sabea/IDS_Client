import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const UsersTable = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Alice Smith",
      email: "alice@example.com",
      role: "Admin",
    },
    {
      id: 2,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Employee",
    },
  ]);
  const [selectedUser, setSelectedUser] = useState(null);

  const viewUser = (user) => {
    setSelectedUser(user);
    alert(`Viewing user:\n\n${user.name}\n${user.email}\nRole: ${user.role}`);
  };

  const deleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
    }
  };




  return (
    <div className="container mt-4">
      <div className="card shadow-lg mb-4">
        <div className="card-header text-center">
          <h4>👥 User List</h4>
        </div>
        <div className="card-body">
          {/* User Form */}
          

          {/* User Table */}
          <div className="table-responsive mt-4">
            <table className="table table-bordered table-striped table-hover text-center align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === "Admin"
                              ? "bg-primary"
                              : user.role === "Employee"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => viewUser(user)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
