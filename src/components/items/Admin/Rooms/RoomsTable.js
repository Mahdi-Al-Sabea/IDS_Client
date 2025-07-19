import React, { use, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';


const RoomsTable = ({toggle,setToggle}) => {
  const [rooms, setRooms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    roomname: "",
    floor: "",
    minCapacity: "",
    maxCapacity: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of rooms per page
  const [totalPages, setTotalPages] = useState(1);

  const [features, setFeatures] = useState([]);

    const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/FeatureNotPaginated");
        console.log("Features fetched:", response.data);
      setFeatures(response.data.data);
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  //##################################################
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEditing] = useState(false);

  const viewRoom = (room) => {
    setSelectedRoom(room);
    setEditing(false); // Start in view-only mode
    setShowModal(true);
  };

  const handleUpdate = async (values, { setErrors, setSubmitting }, roomId) => {
    try {
      

      const response = await axios.put(
        `http://127.0.0.1:8000/api/Room/${roomId}`,
        values
      );

      console.log("Room updated:", response.data);
      setSelectedRoom(response.data.data);
      toast.success("Room updated successfully!");
      setEditing(false);
      fetchRooms(); // refresh the main table
      setToggle(!toggle);
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
    roomname: Yup.string().required("Room Name is required").max(255, "Room Name must be at most 255 characters"),
    floor: Yup.number().required("Floor is required"),
    capacity: Yup.number().required("Capacity is required").min(10, "Capacity must be at least 10").max(1000, "Capacity must be at most 1000"),
    position: Yup.number()
      .required("Position is required")
      .min(1, "Position must be at least 1")
      .max(6, "Position must be at most 6"),
  });


  //#################################

  const deleteRoom = async(id) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try{
        const response = await axios.delete(`http://127.0.0.1:8000/api/Room/${id}`);
        console.log("Room deleted:", response.data);
        setRooms((prevRooms) => prevRooms.filter((r) => r.id !== id));
        //alert("Room deleted successfully!");
        toast.success("Room deleted successfully!");
        setToggle(!toggle);
      }catch (error) {
        console.error("Error deleting room:", error);
        toast.error("Failed to delete room. Please try again later.");
      }
    }
  };

  const fetchRooms = async () => {
    try {
      const queryParams = {
        ...searchParams,
        page: currentPage,
        per_page: pageSize,
      };

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `http://127.0.0.1:8000/api/Room?${queryString}`;

      const response = await axios.get(url);
      console.log("Rooms fetched:", response.data.data);
      setRooms(response.data.data.data); // data.data comes from your sendResponse wrapping the paginator
      setTotalPages(response.data.data.last_page); // Laravel paginator metadata
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to fetch rooms. Please try again later.");
    }
  };

  useEffect(() => {
    fetchFeatures(); // Fetch features on component mount
    fetchRooms();
  }, [currentPage]); // refetch when page changes

  useEffect(() => {
    console.log("Toggle changed, refetching rooms");
    fetchRooms();
  }, [toggle]); // refetch when toggle changes

  if (loading ||!rooms) {
     return (
      <div
        style={{
          height: "100vh", // full viewport height
          padding: "3rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "5px solid #f3f3f3",
            borderTop: "5px solid #0d6efd",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    );
  }

  return (
    <>
    <ToastContainer />
      <div className="container mt-4">
        <div className="card shadow-lg mb-4">
          <div className="card-header text-center">
            <h4>👥 Room List</h4>
          </div>
          <div className="card-body">
            {/* User Search Form */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <input
                type="text"
                placeholder="Search by Room Name"
                value={searchParams.roomname}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, roomname: e.target.value })
                }
              />
                <input
                type="number"
                placeholder="Search by Room Floor"
                value={searchParams.floor}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, floor: e.target.value })
                }
              />

              <button
                className="btn btn-primary"
                onClick={() => {
                  setCurrentPage(1);
                  fetchRooms();
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
                    <th>Room Name</th>
                    <th>Floor</th>
                    <th>Capacity</th>
                    <th>Position</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.length > 0 ? (
                    rooms.map((room) => (
                      <tr key={room.id}>
                        <td>{room.roomname}</td>
                        <td>{room.floor}</td>
                        <td>{room.capacity}</td>
                        <td>{room.position}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => viewRoom(room)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteRoom(room.id)}
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

      {selectedRoom && (
        <div
          className={`modal fade ${showModal ? "show d-block" : ""}`}
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">👤 View / Edit Room</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <Formik
                  initialValues={{
                    roomname: selectedRoom.roomname || "",
                    floor: selectedRoom.floor || "",
                    capacity: selectedRoom.capacity || "",
                    position: selectedRoom.position || "", // Default to "" if not set
                    features: selectedRoom.features ? selectedRoom.features.map(f => f.id) : [],
                  }}
                  validationSchema={validationSchema}
                  onSubmit={(values, actions) =>
                    handleUpdate(values, actions, selectedRoom.id)
                  }
                  enableReinitialize
                >
                  {({ values,isSubmitting, setFieldValue }) => (
                    <Form>
                      <div className="mb-3">
                        <label className="form-label">Room Name</label>
                        <Field
                          name="roomname"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="roomname" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Floor</label>
                        <Field
                          name="floor"
                          type="number"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="floor" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Capacity</label>
                        <Field
                          name="capacity"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="capacity" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Position</label>
                        <Field
                          name="position"
                          type="number"
                          className="form-control"
                          disabled={!edit}
                        />
                        <div className="text-danger">
                          <ErrorMessage name="position" />
                        </div>
                      </div>

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
                        disabled={!edit}
                        
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

export default RoomsTable;
