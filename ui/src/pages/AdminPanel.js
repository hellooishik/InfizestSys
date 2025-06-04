// src/pages/AdminPanel.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', loginId: '', password: '' });
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error('403 or session expired');
      setError('Access denied or session expired.');
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', newUser, { withCredentials: true });
      setNewUser({ name: '', email: '', loginId: '', password: '' });
      loadUsers();
    } catch (err) {
      alert('Failed to add user. Make sure Login ID is unique.');
    }
  };

  const updateField = async (id, field, value) => {
    try {
      await axios.put(`/api/admin/users/${id}`, { [field]: value }, { withCredentials: true });
      loadUsers();
    } catch {
      alert('Failed to update user.');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { withCredentials: true });
      loadUsers();
    } catch {
      alert('Delete failed.');
    }
  };

  const approve = async (id) => {
    await axios.post(`/api/admin/approve/${id}`, {}, { withCredentials: true });
    loadUsers();
  };

  const deny = async (id) => {
    await axios.post(`/api/admin/deny/${id}`, {}, { withCredentials: true });
    loadUsers();
  };

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) {
      alert('You are not an admin.');
      return navigate('/dashboard');
    }
    loadUsers();
  }, [user]);

  return (
    <div className="container mt-5">
      <h3>Admin Panel</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <h5 className="mt-4">Add New Employee</h5>
      <form className="row g-2 mb-4" onSubmit={addUser}>
        <div className="col-md-3">
          <input type="text" className="form-control" placeholder="Name" required
            value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
        </div>
        <div className="col-md-3">
          <input type="email" className="form-control" placeholder="Email" required
            value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
        </div>
        <div className="col-md-2">
          <input type="text" className="form-control" placeholder="Login ID" required
            value={newUser.loginId} onChange={e => setNewUser({ ...newUser, loginId: e.target.value })} />
        </div>
        <div className="col-md-2">
          <input type="password" className="form-control" placeholder="Password" required
            value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100">Add User</button>
        </div>
      </form>

      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>Login ID</th>
            <th>Pending ($)</th>
            <th>Received ($)</th>
            <th>Break Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.loginId}</td>
              <td>
                <input
                  className="form-control"
                  value={u.monthlyPaymentPending}
                  onChange={e => updateField(u._id, 'monthlyPaymentPending', e.target.value)}
                />
              </td>
              <td>
                <input
                  className="form-control"
                  value={u.monthlyPaymentReceived}
                  onChange={e => updateField(u._id, 'monthlyPaymentReceived', e.target.value)}
                />
              </td>
              <td className={u.breakTimeToday > 60 ? 'text-danger fw-bold' : ''}>
                {u.breakTimeToday}
              </td>
              <td>
                <button className="btn btn-success btn-sm me-2" onClick={() => approve(u._id)}>Approve</button>
                <button className="btn btn-secondary btn-sm me-2" onClick={() => deny(u._id)}>Deny</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
