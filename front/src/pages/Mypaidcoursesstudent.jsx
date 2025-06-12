import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function Mycoursespaidstudent() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCourseDetails() {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to access your courses.");
        navigate("/");
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/purchased-course-details/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { courseType, organizationId } = res.data;

        if (courseType === "self-paced") {
          navigate(`/selfpaced/${organizationId}/${courseId}`);
        } else if (courseType === "semester-live") {
          navigate(`/studenttimetabledisplay/${organizationId}/${courseId}`);
        } else {
          alert("Unknown course type.");
        }
      } catch (error) {
        console.error("Failed to resolve course route:", error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          alert("You are not authorized to access this course.");
          navigate("/login");
        } else {
          alert("Unable to access course. Please try again.");
        }
      }
    }

    fetchCourseDetails();
  }, [courseId, navigate]);

  return <div>Redirecting to your course...</div>;
}

export default Mycoursespaidstudent;
