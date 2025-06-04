// src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', loginId: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const register = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/user/register', form);
      if (res.data.success) {
        setMessage('Registration successful. Please log in.');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setMessage('Error: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="container mt-5">
      <h3>Register</h3>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={register}>
        <input className="form-control mb-2" placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="form-control mb-2" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="form-control mb-2" placeholder="Login ID" onChange={e => setForm({ ...form, loginId: e.target.value })} />
        <input className="form-control mb-2" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-success w-100">Register</button>
      </form>
    </div>
  );
}

export default Register;
