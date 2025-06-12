// ForgotPassword.js
import React, { useState } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';


function ForgotPassword() {
  const [validated, setValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [phone, setPhone] = useState('');

  const handleChange = (e) => {
    setPhone(e.target.value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!phone || !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      setErrorMessage('Please enter a valid phone number.');
      setValidated(true);
      return;
    }

    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      try {
        const response = await axios.post(
          `http://localhost:5000/api/forgot-password`,
          { phone }
        );
        if (response.data.success) {
          setSuccessMessage('A verification code has been sent to your phone.');
          setErrorMessage('');
        } else {
          setErrorMessage(response.data.message);
          setSuccessMessage('');
        }
      } catch (error) {
        setErrorMessage('An error occurred. Please try again.');
        setSuccessMessage('');
      }
    }

    setValidated(true);
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6}>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group controlId="phone">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                required
                type="tel"
                placeholder="Enter your registered phone number"
                value={phone}
                onChange={handleChange}
              />
              <Form.Control.Feedback type="invalid">
                Please provide a valid phone number.
              </Form.Control.Feedback>
            </Form.Group>

            {errorMessage && (
              <Alert variant="danger" className="mt-3">
                {errorMessage}
              </Alert>
            )}
            {successMessage && (
              <Alert variant="success" className="mt-3">
                {successMessage}
              </Alert>
            )}

            <Button variant="primary" type="submit" className="mt-3 w-100">
              Send Reset Code
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPassword;