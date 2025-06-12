// components/ConsentFormInner.jsx
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const ConsentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) {
      return alert("You must agree to continue");
    }

    if (!stripe || !elements) {
      return alert("Stripe has not loaded yet.");
    }

    try {
      // Step 1: Create Stripe Customer
      const customerRes = await axios.post(
        `http://localhost:5000/api/create-customer`,
        { email, orgName }
      );
      const customerId = customerRes.data.customerId;

      // Step 2: Create Payment Method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
        billing_details: {
          email,
          name: orgName,
        },
      });

      if (error) {
        return alert(`Card Error: ${error.message}`);
      }

      // Step 3: Attach Payment Method to Customer
      await axios.post(
        `http://localhost:5000/api/attach-payment-method`,
        {
          customerId,
          paymentMethodId: paymentMethod.id,
        }
      );

      // Step 4: Submit Consent
      const orgId = orgName.toLowerCase().replace(/\s/g, "_");

      await axios.post(
        `http://localhost:5000/api/submit-consent`,
        {
          organizationId: orgId,
          customerId,
          agreed: true,
          email,
        }
      );

      setMessage("✅ Consent accepted and payment method saved. Thank you!");

      // Step 5: Navigate to Profile
      navigate(`/profile?orgId=${orgId}`);
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <Link to="/welcomeorganizations">
        <button className="btn btn-secondary mb-3">← Back</button>
      </Link>

      <form onSubmit={handleSubmit} className="card p-4 shadow">
        <h2>Welcome to Our Platform</h2>
        <p>We're excited to help your organization grow through high-quality courses.</p>

        <h3>Revenue Agreement</h3>
        <ul>
          <li>30% commission on each course purchase made through our platform</li>
          <li>$0.50 fee for every user who shows interest in your courses via our app</li>
          <li>$0.25 will be charged for every 1,000 minutes spent in live semester courses</li>
          <li>Payments will be deducted automatically via your credit card</li>
        </ul>

        <div className="mb-3">
          <label className="form-label">Organization Name:</label>
          <input
            type="text"
            className="form-control"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contact Email:</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label className="form-check-label">
            I agree to the above terms
          </label>
        </div>

        <h4>Credit Card Information</h4>
        <div className="mb-3 p-2 border rounded">
          <CardElement />
        </div>

        <button type="submit" className="btn btn-primary" disabled={!stripe}>
          Submit and Agree
        </button>

        {message && <p className="mt-3 alert alert-success">{message}</p>}
      </form>
    </div>
  );
};

export default ConsentForm;
