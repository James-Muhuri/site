// ForgotPassword.js
import React, { useState } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';


function ForgotPassword() {
  const [validated, setValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!email || !/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      setValidated(true);
      return;
    }

    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      try {
        const response = await axios.post(
  `${process.env.REACT_APP_EXPRESS_API_URL}/api/forgot-password`,
  { email }
);
        if (response.data.success) {
          setSuccessMessage('A verification code has been sent to your email.');
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
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                required
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={handleChange}
              />
              <Form.Control.Feedback type="invalid">
                Please provide a valid email.
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