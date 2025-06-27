import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

export default function Profile() {
  const [edit, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/User/Profile",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUser(response.data.data);
      if (response.data.data.profile_picture) {
        setImagePreview(
          `http://127.0.0.1:8000/${response.data.data.profile_picture}`
        );
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
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

  const handleUpdate = async (values, {setErrors, setSubmitting }) => {
    
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
        `http://127.0.0.1:8000/api/User/${user.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("User updated:", response.data);
      setUser(response.data.data);
      alert("Profile updated successfully!");
      setEditing(false);
    } catch (error) {

        if (error.response?.data?.message === "Validation Error") {
            console.error("Validation errors:");
        const errors = error.response.data.data;
        setErrors(errors); // setFormikErrors expects an object with field names as keys
        const messages = Object.values(errors).flat(); // flatten all error arrays
        alert(messages.join("\n"));
        setEditing(true); // Keep the form in edit mode
        }
      console.error("Update failed:", error.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="container mt-4">
        <p>Loading profile...</p>
      </div>
    );
  if (!user)
    return (
      <div className="container mt-4">
        <p>User not found.</p>
      </div>
    );

  return (
    <div className="container mt-4">
      <h2 className="mb-4">👤 My Profile</h2>

      <div className="card shadow-sm p-4">
        <Formik
          initialValues={{
            name: user.name || "",
            email: user.email || "",
            role: user.role || "Employee",
            password: "",
            password_confirmation: "",
            profile_picture: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleUpdate}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <Field name="name" className="form-control" disabled={!edit} />
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
                  name="profile_picture"
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

              {edit ? (
                <button type="submit" className="btn btn-primary">
                  💾 Save Changes
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {e.preventDefault(); setEditing(true); console.log("Edit button clicked"); }}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

