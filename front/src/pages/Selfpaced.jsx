import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function Selfpaced() {
  const {  organizationId,courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await axios.get(`http://localhost:5000/api/self-paced-course/${organizationId}/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        setError("Failed to load course data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  if (loading) return <div>Loading course materials...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!course) return <div>No course found.</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ borderBottom: "2px solid #333", paddingBottom: "0.5rem" }}>{course.title}</h1>
      <p style={{ fontSize: "1.1rem", color: "#555" }}>{course.description}</p>

      <h2 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#222" }}>Course Materials</h2>
      {course.materials && course.materials.length > 0 ? (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {course.materials.map((material, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
              }}
            >
              <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.3rem" }}>
                {material.title}
              </strong>

              {material.type === "video" && (
                <video
                  controls
                  width="100%"
                  style={{ borderRadius: "6px" }}
                  src={material.url}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {material.type === "pdf" && (
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline" }}
                >
                  View PDF Document
                </a>
              )}

              {material.type === "link" && (
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline" }}
                >
                  Visit Resource
                </a>
              )}

              {/* Add more types if needed */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No materials available for this course yet.</p>
      )}
    </div>
  );
}

export default Selfpaced;
