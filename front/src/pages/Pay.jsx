import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const Pay= () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const { token, error } = await stripe.createToken(cardElement);

    if (error) {
      setError(error.message);
    } else {
      // Send token to your backend to create a subscription
      const response = await fetch('http://localhost:5000/create-subscription', {
        method: 'POST',
        body: JSON.stringify({ token: token.id }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Handle successful subscription
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Subscribe
      </button>
      {error && <div>{error}</div>}
    </form>
  );
};

export default Pay;