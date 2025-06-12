import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const stripePromise = loadStripe(
  "pk_test_51RVa1JFmLNDCwbfjn79iaxD4b9hXQelrEyZCB8G4KtRX0v8eygLQAspuPVb4vX8C0BTGxtUuq83hZl0CtPswxIXy00QKw04V"
);

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Buycourse = () => {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);
  const query = useQuery();
  const searchTerm = query.get("search") || "";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await axios.get(`/api/organization/${orgId}`);
        setOrganization(res.data);
      } catch (error) {
        console.error("Failed to fetch organization", error);
      }
    };
    fetchOrg();
  }, [orgId]);

  useEffect(() => {
    const sessionId = query.get("session_id");
    if (!sessionId) return;

    const verifyPurchase = async () => {
      try {
        const res = await axios.post("/api/verify-purchase", { sessionId });
        if (res.data.success) {
          const purchasedCourse = res.data.purchasedCourse;
          if (!purchasedCourse) {
            alert("Purchase info missing.");
            return;
          }

          if (purchasedCourse.type === "semester-live") {
navigate(`/studenttimetabledisplay/${purchasedCourse.organizationId}/${purchasedCourse.courseId}`);

          } else if (purchasedCourse.type === "self-paced") {
navigate(`/selfpaced/${purchasedCourse.organizationId}/${purchasedCourse.courseId}`);
          } else {
            alert("Unknown course type.");
          }
        } else {
          alert("Purchase could not be verified.");
        }
      } catch (error) {
        console.error("Error verifying purchase:", error);
        alert("Error verifying payment. Please contact support.");
      }
    };

    verifyPurchase();
  }, [query, navigate]);

  const handleBuy = async (course) => {
    try {
      const stripe = await stripePromise;

      // ✅ Get userId from localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      const userId = userData?.uid || userData?.userId;

      if (!userId) {
        alert("User not logged in.");
        return;
      }

      let price = 0;
      if (course.courseType === "self-paced") {
        price = course.selfPacedPrice ?? 0;
      } else if (course.courseType === "semester-live") {
        price = course.semesterPrice ?? 0;
      } else if (course.price) {
        price = course.price;
      }

      if (price <= 0) {
        alert("Invalid course price.");
        return;
      }

      const response = await axios.post("/create-checkout-session", {
        price,
        courseTitle: course.title,
        orgId,
        courseId: course.id,
        userId, // ✅ Added here
      });

      const sessionId = response.data.id;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Error in checkout:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  if (!organization) return <div>Loading...</div>;

  const filteredCourses = organization.courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2>{organization.organizationName}</h2>

      <p>
        <strong>About:</strong> {organization.about}
      </p>
      <p>
        <strong>Achievements:</strong> {organization.achievements}
      </p>
      <p>
        <strong>Why Choose Them:</strong> {organization.uniqueness}
      </p>

      <h3>Courses Matching "{searchTerm}"</h3>
      {filteredCourses.length === 0 && <p>No courses found matching your search.</p>}
      <ul>
        {filteredCourses.map((course, index) => {
          const price =
            course.courseType === "self-paced"
              ? course.selfPacedPrice
              : course.courseType === "semester-live"
              ? course.semesterPrice
              : course.price ?? "N/A";

          return (
            <li key={index}>
              <strong>{course.title}</strong> - Duration: {course.duration} - Price: $
              {price} - Type: {course.courseType || course.type || "Unknown"} &nbsp;
              <button onClick={() => handleBuy(course)}>Buy</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Buycourse;
