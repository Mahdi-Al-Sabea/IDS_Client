import React, { use, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

const UsersTable = () => {
  const [users, setUsers] = useState(null);
  const [searchParams, setSearchParams] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of users per page
  const [totalPages, setTotalPages] = useState(1);

  //##################################################
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [edit, setEditing] = useState(false);

  const viewUser = (user) => {
    setSelectedUser(user);
    setEditing(false); // Start in view-only mode
    setImagePreview(user.profile_picture_url || null);
    setShowModal(true);
  };

  const handleUpdate = async (values, { setErrors, setSubmitting }, userId) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("role", values.role);
      formData.append("_method", "PUT");
      if (values.password) {
        formData.append("password", values.password);
        formData.append("password_confirmation", values.password_confirmation);
      }
      if (values.profile_picture) {
        formData.append("profile_picture", values.profile_picture);
      }

      const response = await axios.post(
        `http://127.0.0.1:8000/api/User/${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("User updated:", response.data);
      setSelectedUser(response.data.data);
      toast.success("Profile updated successfully!");
      setEditing(false);
      fetchUsers(); // refresh the main table
      setShowModal(false);
    } catch (error) {
      if (error.response?.data?.message === "Validation Error") {
        const errors = error.response.data.data;
        setErrors(errors);
        const messages = Object.values(errors).flat();
        //alert(messages.join("\n"));
        toast.error(messages.join("\n"));
        setEditing(true);
      }
      console.error("Update failed:", error.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    role: Yup.string()
      .oneOf(["Admin", "Employee", "Guest"], "Invalid role")
      .required("Role is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .nullable(),
    password_confirmation: Yup.string().oneOf(
      [Yup.ref("password"), null],
      "Passwords must match"
    ),
    profile_picture: Yup.mixed().nullable(),
  });

  //#################################

  const deleteUser = async(id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try{
        const response = await axios.delete(`http://127.0.0.1:8000/api/User/${id}`);
        console.log("User deleted:", response.data);
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
        //alert("User deleted successfully!");
        toast.success("User deleted successfully!");
      }catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user. Please try again later.");
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const queryParams = {
        ...searchParams,
        page: currentPage,
        per_page: pageSize,
      };

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `http://127.0.0.1:8000/api/User?${queryString}`;

      const response = await axios.get(url);

      setUsers(response.data.data.data); // data.data comes from your sendResponse wrapping the paginator
      setTotalPages(response.data.data.last_page); // Laravel paginator metadata
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users. Please try again later.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]); // refetch when page changes

  if (!users) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <ToastContainer />
      <div className="container mt-4">
        <div className="card shadow-lg mb-4">
          <div className="card-header text-center">
            <h4>👥 User List</h4>
          </div>
          <div className="card-body">
            {/* User Search Form */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <input
                type="text"
                placeholder="Search by name"
                value={searchParams.name}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Search by email"
                value={searchParams.email}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, email: e.target.value })
                }
              />
              <select
                value={searchParams.role}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, role: e.target.value })
                }
              >
                <option value="">Select role</option>
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
                <option value="Guest">Guest</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setCurrentPage(1);
                  fetchUsers();
                }}
              >
                Search
              </button>
            </div>

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

            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                className="btn btn-outline-primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                ⬅ Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next ➡
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div
          className={`modal fade ${showModal ? "show d-block" : ""}`}
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">👤 View / Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <Formik
                  initialValues={{
                    name: selectedUser.name || "",
                    email: selectedUser.email || "",
                    role: selectedUser.role || "Employee",
                    password: "",
                    password_confirmation: "",
                    profile_picture: null,
                  }}
                  validationSchema={validationSchema}
                  onSubmit={(values, actions) =>
                    handleUpdate(values, actions, selectedUser.id)
                  }
                  enableReinitialize
                >
                  {({ isSubmitting, setFieldValue }) => (
                    <Form>
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <Field
                          name="name"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="name" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <Field
                          type="email"
                          name="email"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="email" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <Field
                          as="select"
                          name="role"
                          className="form-select"
                          disabled={!edit}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Employee">Employee</option>
                          <option value="Guest">Guest</option>
                        </Field>
                        <div className="text-danger">
                          <ErrorMessage name="role" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <Field
                          type="password"
                          name="password"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="password" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <Field
                          type="password"
                          name="password_confirmation"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="password_confirmation" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Profile Picture</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          disabled={!edit}
                          onChange={(event) => {
                            setFieldValue(
                              "profile_picture",
                              event.currentTarget.files[0]
                            );
                            setImagePreview(
                              URL.createObjectURL(event.currentTarget.files[0])
                            );
                          }}
                        />
                      </div>

                      {imagePreview && (
                        <div className="mb-3">
                          <label className="form-label">Preview:</label>
                          <br />
                          <img src={imagePreview} alt="Preview" height="100" />
                        </div>
                      )}

                      <div className="d-flex justify-content-end gap-2">
                        {edit ? (
                          <>
                            <button
                              type="submit"
                              className="btn btn-success"
                              disabled={isSubmitting}
                            >
                              💾 Save Changes
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setEditing(false)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditing(true);
                            }}
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersTable;
