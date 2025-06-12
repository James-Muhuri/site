// components/WelcomeScreen.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Welcomeorganizations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Simulate auth: get org ID from localStorage (or however you handle login)
  const token = localStorage.getItem("token");
  const organizationId = localStorage.getItem("organizationId");

  useEffect(() => {
    const checkOrganizationProfile = async () => {
      if (!token || !organizationId) {
        alert("Please log in first.");
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(`/api/check-organization-profile/${organizationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.exists) {
          // Org has already submitted profile — redirect to dashboard/profile page
          navigate("/profile");
        } else {
          setLoading(false); // Allow normal Welcome screen if not registered
        }
      } catch (error) {
        console.error("Error checking organization profile:", error);
        setLoading(false); // Show the welcome page if error occurs
      }
    };

    checkOrganizationProfile();
  }, [navigate, token, organizationId]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-5 text-center">
      <div className="card p-5 shadow-lg">
        <h1>Welcome to LanVai</h1>
        <p className="lead mt-3">
          Your gateway to reaching more learners, growing your course impact, and earning more through a flexible, automated platform.
        </p>

        <hr className="my-4" />

        <h4>Why Partner with Us?</h4>
        <ul className="list-unstyled text-start mt-3 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <li>✅ Expand your course reach with zero upfront cost</li>
          <li>✅ Earn revenue through a simple 70/30 profit-sharing model</li>
          <li>✅ Pay only for real engagement — $0.50 per interested user</li>
          <li>✅ Monetize live sessions — $0.25 per 1,000 minutes attended</li>
          <li>✅ Get paid automatically — we handle secure Stripe billing</li>
        </ul>

        <p>
          Whether you're a training company, an independent educator, or an academic institution, LanVai makes it easy to grow your learning community and monetize your content with confidence.
        </p>

        <Link to="/consentform">
          <button className="btn btn-success mt-4 px-4 py-2">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Welcomeorganizations;
