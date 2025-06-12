import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

function Studenttimetabledisplay() {
  const {  organizationId,courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        if (!organizationId) {
          console.error("organizationId is missing");
          setLoading(false);
          return;
        }

        const res = await axios.get(`http://localhost:5000/api/course/${organizationId}/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [organizationId, courseId]);

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found</div>;

  const now = new Date();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <h3>Class Schedule</h3>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {(course.timetable || []).map((lesson, index) => {
          const lessonStart = new Date(lesson.startTime);
          const classStarted = lesson.classStarted;
          const canJoin = classStarted && lessonStart <= now;

          return (
            <li
              key={index}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <strong>{lesson.title}</strong>
              <div>
                <span>🕒 {lessonStart.toLocaleString()}</span>
              </div>

              {lesson.notice && (
                <div style={{ color: '#d9534f', marginTop: '0.5rem' }}>
                  📢 <em>{lesson.notice}</em>
                </div>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                {canJoin ? (
                  <Link
                    to={`/class/${organizationId}/${courseId}/${index}`}
                    className="btn btn-primary"
                    style={{ marginRight: '10px' }}
                  >
                    Join Class
                  </Link>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Class Not Started
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Studenttimetabledisplay;
