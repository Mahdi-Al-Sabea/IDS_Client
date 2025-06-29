import React, { use, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

const FeaturesTable = () => {
  const [features, setFeatures] = useState(null);
  const [searchParams, setSearchParams] = useState({
    title: "",

  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of features per page
  const [totalPages, setTotalPages] = useState(1);

  //##################################################
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [edit, setEditing] = useState(false);

  const viewFeature = (feature) => {
    setSelectedFeature(feature);
    setEditing(false); // Start in view-only mode
    setShowModal(true);
  };

  const handleUpdate = async (values, { setErrors, setSubmitting }, featureId) => {
    try {
      

      const response = await axios.put(
        `http://127.0.0.1:8000/api/Feature/${featureId}`,
        values
      );

      console.log("Feature updated:", response.data);
      setSelectedFeature(response.data.data);
      toast.success("Feature updated successfully!");
      setEditing(false);
      fetchFeatures(); // refresh the main table
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
    title: Yup.string().required("Title is required").max(255, "Title must be at most 255 characters"),
    description: Yup.string().required("Description is required"),
  });


  //#################################

  const deleteFeature = async(id) => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      try{
        const response = await axios.delete(`http://127.0.0.1:8000/api/Feature/${id}`);
        console.log("Feature deleted:", response.data);
        setFeatures((prevFeatures) => prevFeatures.filter((f) => f.id !== id));
        //alert("Feature deleted successfully!");
        toast.success("Feature deleted successfully!");
      }catch (error) {
        console.error("Error deleting feature:", error);
        toast.error("Failed to delete feature. Please try again later.");
      }
    }
  };

  const fetchFeatures = async () => {
    try {
      const queryParams = {
        ...searchParams,
        page: currentPage,
        per_page: pageSize,
      };

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `http://127.0.0.1:8000/api/Feature?${queryString}`;

      const response = await axios.get(url);
      console.log("Features fetched:", response.data.data);
      setFeatures(response.data.data.data); // data.data comes from your sendResponse wrapping the paginator
      setTotalPages(response.data.data.last_page); // Laravel paginator metadata
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to fetch features. Please try again later.");
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [currentPage]); // refetch when page changes

  if (!features) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <ToastContainer />
      <div className="container mt-4">
        <div className="card shadow-lg mb-4">
          <div className="card-header text-center">
            <h4>👥 Feature List</h4>
          </div>
          <div className="card-body">
            {/* User Search Form */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <input
                type="text"
                placeholder="Search by Title"
                value={searchParams.title}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, title: e.target.value })
                }
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  setCurrentPage(1);
                  fetchFeatures();
                }}
              >
                Search
              </button>
            </div>

            {/* Feature Table */}
            <div className="table-responsive mt-4">
              <table className="table table-bordered table-striped table-hover text-center align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {features.length > 0 ? (
                    features.map((feature) => (
                      <tr key={feature.id}>
                        <td>{feature.title}</td>
                        <td>{feature.description}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => viewFeature(feature)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteFeature(feature.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No features found.</td>
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

      {selectedFeature && (
        <div
          className={`modal fade ${showModal ? "show d-block" : ""}`}
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">👤 View / Edit Feature</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <Formik
                  initialValues={{
                    title: selectedFeature.title || "",
                    description: selectedFeature.description || "",
                  }}
                  validationSchema={validationSchema}
                  onSubmit={(values, actions) =>
                    handleUpdate(values, actions, selectedFeature.id)
                  }
                  enableReinitialize
                >
                  {({ isSubmitting, setFieldValue }) => (
                    <Form>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <Field
                          name="title"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="title" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <Field
                          name="description"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="description" />
                        </div>
                      </div>


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

export default FeaturesTable;
