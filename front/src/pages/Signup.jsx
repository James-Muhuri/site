import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;
 const passwordRegex = /^.{8,}$/;

  const emailRegex = /^[\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^\+?[1-9]\d{9,14}$/; // Basic E.164 validation

  
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!usernameRegex.test(username)) {
    setErrorMessage('Username must be 3–30 characters, alphanumeric or underscores only.');
    return;
  }

  if (!passwordRegex.test(password)) {
    setErrorMessage('Password must be at least 8 characters.');
    return;
  }

  if (!emailRegex.test(email)) {
    setErrorMessage('Enter a valid email address.');
    return;
  }

  if (!phoneRegex.test(phone)) {
    setErrorMessage('Enter a valid phone number in international format (e.g., +1234567890).');
    return;
  }

  try {
const response = await axios.post('/api/signup', {


      username,
      password,
      email,    // send email here
      phone     // send phone here
    });

    if (response.data.success) {
      setSuccessMessage('🎉 Account created! Check your phone for the verification code.');
      setErrorMessage('');
      setUsername('');
      setPassword('');
      setEmail('');
      setPhone('');
      setTimeout(() => navigate('/login'), 2500);
    } else {
      setErrorMessage(response.data.message || 'Signup failed.');
    }
  } catch (error) {
    console.error(error.response || error);  // Log full error for debugging
    setErrorMessage('Server error. Please try again.');
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Your Account</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="tel"
            placeholder="Phone Number (e.g. +1234567890)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Sign Up</button>
        </form>

        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        {successMessage && <p style={{ ...styles.success, ...styles.error }}>{successMessage}</p>}

        <p style={styles.links}>
          Already have an account? <Link to="/">Login</Link><br />
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)',
    padding: 20,
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: 30,
    boxSizing: 'border-box',
  },
  title: {
    textAlign: 'center',
    marginBottom: 25,
    fontSize: '1.8rem',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  input: {
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    border: '1px solid #ccc',
    outline: 'none',
  },
  button: {
    padding: 12,
    fontSize: 16,
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  error: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: 'red',
  },
  success: {
    color: 'green',
  },
  links: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  }
};

export default Signup;