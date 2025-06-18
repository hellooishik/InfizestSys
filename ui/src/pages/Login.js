import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import './Login.css';

function Login() {
  const { setUser } = useContext(UserContext);
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.loginId || !form.password) {
      setError('Please enter both Login ID and Password');
      return;
    }

    try {
      // ✅ Use deployed backend URL
      const res = await axios.post('https://infizestsys.onrender.com/api/auth/login', form, {
        withCredentials: true
      });

      if (res.data.success) {
        const session = await axios.get('https://infizestsys.onrender.com/api/auth/session', {
          withCredentials: true
        });
        const currentUser = session.data.user;
        setUser(currentUser);
        navigate(currentUser.isAdmin ? '/admin' : '/dashboard');
      }
    } catch {
      setError('Invalid login credentials');
    }
  };

  return (
    <div className="login-hero">
      <div className="login-left">
        <h1 className="brand-name">Infizest Publishings</h1>
        <p className="tagline">Smart Employee Tracking, Redefined.</p>
        <ul className="features">
          <li>Real-time Time Logging</li>
          <li>Smart Analytics</li>
          <li>Secure Access</li>
          <li>Task & Project Assignment</li>
        </ul>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h3>Welcome Back</h3>
          <p className="subtext">Login to continue managing your day</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input
              className="form-control mb-3"
              placeholder="Login ID"
              value={form.loginId}
              onChange={(e) => setForm({ ...form, loginId: e.target.value })}
            />
            <input
              className="form-control mb-3"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button className="btn btn-primary w-100 mb-2" type="submit">Login</button>
          </form>
          <p className="footer-text">© {new Date().getFullYear()} Infizest Technologies</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
