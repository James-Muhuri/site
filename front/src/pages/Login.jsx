import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🧠 On component mount, check if device is already authenticated
  useEffect(() => {
    const deviceAuthenticated = localStorage.getItem('deviceAuthenticated');
    if (deviceAuthenticated) {
      // 🚀 Skip login, go directly to the app
      navigate('/app');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // 🔐 Send login credentials
     const res = await axios.post(`${process.env.REACT_APP_EXPRESS_API_URL}/api/login`, { username, password });

      // 🪪 Save token and user ID for session
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);

      // ✅ Mark this device as authenticated forever (until cleared manually)
      localStorage.setItem('deviceAuthenticated', 'true');

      alert('Login successful!');
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <form onSubmit={handleLogin} style={styles.form}>
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
          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
        <p style={styles.links}>
          No account? <Link to="/signup">Sign up</Link><br />
          Forgot password? <Link to="/forgot-password">Reset</Link>
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
    color: 'red',
    textAlign: 'center',
  },
  links: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  }
};

export default Login;