// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

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
      const res = await axios.post('/api/auth/login', form, { withCredentials: true });
      if (res.data.success) {
        const session = await axios.get('/api/auth/session', { withCredentials: true });
        const currentUser = session.data.user;
        setUser(currentUser);

        if (currentUser.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Invalid login credentials');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h3 className="mb-3">Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Login ID"
          value={form.loginId}
          onChange={e => setForm({ ...form, loginId: e.target.value })}
        />
        <input
          className="form-control mb-3"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn btn-primary w-100" type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
