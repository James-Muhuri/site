import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // <- import uuid
import { useSearchParams } from 'react-router-dom';
const Profile = ({ organizationId, prefillName }) => {
    const [searchParams] = useSearchParams();
  const orgId = searchParams.get('orgId');
  const [adForm, setAdForm] = useState({
    wantsToAdvertise: false,
    adText: "",
  });

  const [form, setForm] = useState({
    organizationName: prefillName || "",
    website: "",
    email: "",
    about: "",
    achievements: "",
    uniqueness: "",
    courses: [
      {
        title: "",
        description: "",
        selfPacedPrice: "",
        semesterPrice: "",
        duration: "",
        targetAudience: "",
        courseType: "self-paced",
        timetable: {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
        },
      },
    ],
  });

  // Function to add IDs to each course and its lessons
  function addCourseAndLessonIds(courses) {
    return courses.map(course => {
      const courseId = uuidv4();
      course.id = courseId;

      if (course.courseType === "semester-live") {
        for (const day of Object.keys(course.timetable)) {
          course.timetable[day] = course.timetable[day].map(lesson => ({
            ...lesson,
            id: uuidv4(),
          }));
        }
      }

      return course;
    });
  }

  // Handle input changes for org fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle ad changes
  const handleAdChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle course field changes
  const handleCourseChange = (index, e) => {
    const { name, value } = e.target;
    const newCourses = [...form.courses];
    newCourses[index][name] = value;
    setForm({ ...form, courses: newCourses });
  };

  // Handle course type change (self-paced or semester)
  const handleCourseTypeChange = (index, e) => {
    const value = e.target.value;
    const newCourses = [...form.courses];
    newCourses[index].courseType = value;
    if (value === "self-paced") {
      newCourses[index].timetable = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      };
    }
    setForm({ ...form, courses: newCourses });
  };

  // Handle timetable changes: add/remove/edit lessons for each weekday
  const handleAddLesson = (courseIndex, day) => {
    const newCourses = [...form.courses];
    newCourses[courseIndex].timetable[day].push({
      startTime: "",
      endTime: "",
      lessonTitle: "",
    });
    setForm({ ...form, courses: newCourses });
  };

  const handleLessonChange = (courseIndex, day, lessonIndex, e) => {
    const { name, value } = e.target;
    const newCourses = [...form.courses];
    newCourses[courseIndex].timetable[day][lessonIndex][name] = value;
    setForm({ ...form, courses: newCourses });
  };

  const handleRemoveLesson = (courseIndex, day, lessonIndex) => {
    const newCourses = [...form.courses];
    newCourses[courseIndex].timetable[day].splice(lessonIndex, 1);
    setForm({ ...form, courses: newCourses });
  };

  // Add another course to the form
  const addCourse = () => {
    setForm({
      ...form,
      courses: [
        ...form.courses,
        {
          title: "",
          description: "",
          selfPacedPrice: "",
          semesterPrice: "",
          duration: "",
          targetAudience: "",
          courseType: "self-paced",
          timetable: {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
          },
        },
      ],
    });
  };

  // Submit the form to backend with IDs added
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add IDs to courses and lessons here before submit
    const coursesWithIds = addCourseAndLessonIds(form.courses);

    try {
      await axios.post(
        `http://localhost:5000/api/save-organization-profile`,
        {
          organizationId,orgId,
          ...form,
          courses: coursesWithIds,
          adData: adForm,
        }
      );
      alert("Profile and Ad preferences saved!");
    } catch (error) {
      alert("Error saving profile. Please try again.");
      console.error(error);
    }
  };

  return (
    <>
      <h3>📢 Advertise on Our Platform</h3>
      <label>
        <input
          type="checkbox"
          name="wantsToAdvertise"
          checked={adForm.wantsToAdvertise}
          onChange={handleAdChange}
        />{" "}
        I want to display ads ($30 per 1000 impressions)
      </label>

      {adForm.wantsToAdvertise && (
        <>
          <label>
            Ad Text / Headline:
            <input
              type="text"
              name="adText"
              value={adForm.adText}
              onChange={handleAdChange}
            />
          </label>
        </>
      )}

      <form onSubmit={handleSubmit}>
        <h2>Set Up Your Organization Profile</h2>

        <label>
          Organization Name:
          <input
            type="text"
            name="organizationName"
            value={form.organizationName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Website URL:
          <input
            type="url"
            name="website"
            value={form.website}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Contact Email:
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          About Us:
          <textarea
            name="about"
            value={form.about}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Achievements / Milestones:
          <textarea
            name="achievements"
            value={form.achievements}
            onChange={handleChange}
          />
        </label>

        <label>
          What Makes Your Courses Unique:
          <textarea
            name="uniqueness"
            value={form.uniqueness}
            onChange={handleChange}
          />
        </label>

        <h3>Courses You Offer</h3>
        {form.courses.map((course, index) => (
          <div
            key={index}
            style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "15px" }}
          >
            <label>
              Title:
              <input
                name="title"
                value={course.title}
                onChange={(e) => handleCourseChange(index, e)}
                required
              />
            </label>
            <label>
              Description:
              <input
                name="description"
                value={course.description}
                onChange={(e) => handleCourseChange(index, e)}
              />
            </label>

            {course.courseType === "self-paced" && (
              <label>
                Self-Paced Course Price ($):
                <input
                  name="selfPacedPrice"
                  type="number"
                  min="0"
                  value={course.selfPacedPrice}
                  onChange={(e) => handleCourseChange(index, e)}
                  required
                />
              </label>
            )}

            {course.courseType === "semester-live" && (
              <>
                <label>
                  Semester Course Price ($):
                  <input
                    name="semesterPrice"
                    type="number"
                    min="0"
                    value={course.semesterPrice}
                    onChange={(e) => handleCourseChange(index, e)}
                    required
                  />
                </label>
              </>
            )}

            <label>
              Duration:
              <input
                name="duration"
                value={course.duration}
                onChange={(e) => handleCourseChange(index, e)}
              />
            </label>
            <label>
              Target Audience:
              <input
                name="targetAudience"
                value={course.targetAudience}
                onChange={(e) => handleCourseChange(index, e)}
              />
            </label>

            <label>
              Course Type:
              <select
                value={course.courseType}
                onChange={(e) => handleCourseTypeChange(index, e)}
              >
                <option value="self-paced">Self-paced</option>
                <option value="semester-live">Semester (with live lessons)</option>
              </select>
            </label>

            {course.courseType === "semester-live" && (
              <div style={{ marginTop: "10px" }}>
                <h4>Weekly Timetable (Monday to Friday)</h4>

                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                  <div key={day} style={{ marginBottom: "10px" }}>
                    <strong>{day}</strong>
                    {course.timetable[day].map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          marginTop: "5px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Lesson Title"
                          name="lessonTitle"
                          value={lesson.lessonTitle}
                          onChange={(e) =>
                            handleLessonChange(index, day, lessonIndex, e)
                          }
                          required
                        />
                        <input
                          type="time"
                          name="startTime"
                          value={lesson.startTime}
                          onChange={(e) =>
                            handleLessonChange(index, day, lessonIndex, e)
                          }
                          required
                        />
                        <input
                          type="time"
                          name="endTime"
                          value={lesson.endTime}
                          onChange={(e) =>
                            handleLessonChange(index, day, lessonIndex, e)
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLesson(index, day, lessonIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddLesson(index, day)}
                      style={{ marginTop: "5px" }}
                    >
                      Add Lesson
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={addCourse}>
          Add Another Course
        </button>

        <br />
 <Link to={`/organizationcourses?orgId=${orgId}`}>
        <button type="submit">Submit Profile</button>
      </Link>
   
      </form>
      
 </> );
};

export default Profile;
