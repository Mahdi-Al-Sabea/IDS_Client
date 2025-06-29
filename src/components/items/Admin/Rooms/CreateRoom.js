import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateRoom = () => {
  const [features, setFeatures] = useState([]);

  const fetchFeatures = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/Feature");
        console.log("Features fetched:", response.data.data);
      setFeatures(response.data.data.data);
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to load features");
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const initialValues = {
    roomname: "",
    floor: "",
    capacity: "",
    features: [],
  };

  const validationSchema = Yup.object().shape({
    roomname: Yup.string().required("Room name is required"),
    floor: Yup.number()
      .required("Floor is required")
      .integer("Floor must be an integer"),
    capacity: Yup.number()
      .required("Capacity is required")
      .integer("Capacity must be an integer")
      .min(10, "Minimum capacity is 10")
      .max(1000, "Maximum capacity is 1000"),
    features: Yup.array()
      .of(Yup.number().integer())
      .nullable(),
  });

  const createRoom = async (values, { setErrors, setSubmitting, resetForm }) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/Room",
        values
      );
      console.log("Room created successfully:", response.data);
      toast.success("Room created successfully");
      resetForm();
    } catch (error) {
      if (error.response?.data?.message === "Validation Error") {
        const errors = error.response.data.data;
        setErrors(errors);
        const messages = Object.values(errors).flat();
        toast.error(messages.join("\n"));
      } else {
        console.error("Error creating room:", error.response?.data || error);
        toast.error("Failed to create room");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="container mt-4">
        <div className="card shadow-lg mb-4">
          <div className="card-header text-center">
            <h4>🏨 Create New Room</h4>
          </div>
          <div className="card-body">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={createRoom}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form>
                  <div className="row g-3">
                    {/* Room Name */}
                    <div className="col-md-4">
                      <label className="form-label">Room Name</label>
                      <Field name="roomname" type="text" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="roomname" />
                      </div>
                    </div>

                    {/* Floor */}
                    <div className="col-md-4">
                      <label className="form-label">Floor</label>
                      <Field name="floor" type="number" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="floor" />
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="col-md-4">
                      <label className="form-label">Capacity</label>
                      <Field name="capacity" type="number" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="capacity" />
                      </div>
                    </div>

                    {/* Features Multi-select */}
                    <div className="col-12">
                      <label className="form-label">Features</label>
                      <Field
                        as="select"
                        name="features"
                        className="form-select"
                        multiple
                        value={values.features}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions).map((opt) =>
                            parseInt(opt.value)
                          );
                          setFieldValue("features", selected);
                        }}
                      >
                        {features.map((feature) => (
                          <option key={feature.id} value={feature.id}>
                            {feature.title}
                          </option>
                        ))}
                      </Field>
                      <div className="text-danger">
                        <ErrorMessage name="features" />
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
                      ➕ Create Room
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

export default CreateRoom;
