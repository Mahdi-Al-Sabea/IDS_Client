import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

const CreateUser = () => {




  const createUser = async (values, { setErrors, setSubmitting, resetForm }) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/User",
        values
      );
      console.log("User created successfully:", response.data);
      //alert("User created successfully");
      toast.success("User created successfully");
      resetForm(); // Reset the form after successful submission
    } catch (error) {
      if (error.response?.data?.message === "Validation Error") {
        console.error("Validation errors:");
        const errors = error.response.data.data;
        setErrors(errors); // setFormikErrors expects an object with field names as keys
        const messages = Object.values(errors).flat(); // flatten all error arrays
        toast.error(messages.join("\n"));
      }
      //console.error("Error creating user:", error);
    }
  };

   const initialValues = {
    name: "",
    email: "",
    role: "",
    password: "",
    password_confirmation: "",
  }; 

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    role: Yup.string()
      .oneOf(["Admin", "Employee", "Guest"], "Select a valid role")
      .required("Role is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Please confirm password"),
  });

  return (
    <>
    <ToastContainer />
    <div className="container mt-4">
      <div className="card shadow-lg mb-4">
        <div className="card-header text-center">
          <h4>👤 Create New User</h4>
        </div>
        <div className="card-body">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={createUser}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="row g-3">
                  {/* Full Name */}
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <Field name="name" type="text" className="form-control" />
                    <div className="text-danger">
                      <ErrorMessage name="name" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <Field name="email" type="email" className="form-control" />
                    <div className="text-danger">
                      <ErrorMessage name="email" />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-md-6">
                    <label className="form-label">Role</label>
                    <Field name="role" as="select" className="form-select">
                      <option value="">Select Role</option>
                      <option value="Admin">Admin</option>
                      <option value="Employee">Employee</option>
                      <option value="Guest">Guest</option>
                    </Field>
                    <div className="text-danger">
                      <ErrorMessage name="role" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <Field
                      name="password"
                      type="password"
                      className="form-control"
                    />
                    <div className="text-danger">
                      <ErrorMessage name="password" />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="col-md-6">
                    <label className="form-label">Confirm Password</label>
                    <Field
                      name="password_confirmation"
                      type="password"
                      className="form-control"
                    />
                    <div className="text-danger">
                      <ErrorMessage name="password_confirmation" />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="d-flex justify-content-center mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting}
                  >
                    ➕ Create User
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
    </>
  );
};

export default CreateUser;
