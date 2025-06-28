import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

const CreateFeature = () => {




  const createFeature = async (values, { setErrors, setSubmitting, resetForm }) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/Feature",
        values
      );
      console.log("User created successfully:", response.data);
      //alert("User created successfully");
      toast.success("Feature created successfully");
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
    title: "",
    description: "",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required").max(255, "Title must be at most 255 characters"),
    description: Yup.string().required("Description is required"),
  });

  return (
    <>
    <ToastContainer />
    <div className="container mt-4">
      <div className="card shadow-lg mb-4">
        <div className="card-header text-center">
          <h4>👤 Create New Feature</h4>
        </div>
        <div className="card-body">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={createFeature}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="row g-3">
                  {/* Title */}
                  <div className="col-md-6">
                    <label className="form-label">Title</label>
                    <Field name="title" type="text" className="form-control" />
                    <div className="text-danger">
                      <ErrorMessage name="title" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-md-6">
                    <label className="form-label">Description</label>
                    <Field name="description" as="textarea" className="form-control" />
                    <div className="text-danger">
                      <ErrorMessage name="description" />
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
                    ➕ Create Feature
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

export default CreateFeature;
