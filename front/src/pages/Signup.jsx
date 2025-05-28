import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  const emailRegex = /^[\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usernameRegex.test(username)) {
      setErrorMessage('Username must be 3–30 characters, alphanumeric or underscores only.');
      return;
    }

    if (!passwordRegex.test(password)) {
      setErrorMessage('Password must be at least 6 characters with one letter and one number.');
      return;
    }

    if (!emailRegex.test(email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_EXPRESS_API_URL}/api/signup`, {
        username,
        password,
        contact: email,
      });

      if (response.data.success) {
        setSuccessMessage('🎉 Account created! Check your email for the verification code.');
        setErrorMessage('');
        setUsername('');
        setPassword('');
        setEmail('');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setErrorMessage(response.data.message || 'Signup failed.');
      }
    } catch (error) {
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