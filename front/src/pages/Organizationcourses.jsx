import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
const useQuery = () => new URLSearchParams(useLocation().search);

const Organizationcourses = () => {
   const query = useQuery();
  const orgId = query.get('orgId'); // ✅ now available

  const [courses, setCourses] = useState([]);
  


  useEffect(() => {
      if (!orgId) return; // ✅ Only fetch if orgId exists
    const fetchCourses = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/organizations/${orgId}/courses`);
    setCourses(response.data);
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
};

    
  

    fetchCourses();
  }, [orgId]);

  return (
    <div className="container">
      <h2>Courses Offered by Your Organization</h2>
      <div className="list-group">
        {courses.map((course) => (
          <div key={course.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <h5>{course.title}</h5>
              <p>{course.description}</p>
            </div>
            <div>
              <span className={`badge ${course.type === 'self-paced' ? 'bg-primary' : 'bg-success'}`}>
                {course.type === 'self-paced' ? 'Self-Paced' : 'Semester Live'}
              </span>
              <Link
                to={`/${course.type === 'self-paced' ? 'selfpaced' : 'studenttimetabledisplay'}/${course.organizationId}/${course.id}`}
                className="btn btn-info ms-2"
              >
                Visit Course
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Organizationcourses;
