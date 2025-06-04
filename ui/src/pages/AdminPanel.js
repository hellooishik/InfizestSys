import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import io from 'socket.io-client';
import './AdminPanel.css';

function AdminPanel() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', loginId: '', password: '' });
  const [taskForm, setTaskForm] = useState({ jobId: '', loginId: '', deadline: '', googleDocsLink: '', files: [] });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    socket.on('approval_request', (data) => {
      Toastify({
        text: `⚠️ Approval request from ${data.name} (${data.loginId}) at ${data.time}`,
        backgroundColor: '#ff6600',
        duration: 5000
      }).showToast();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) return navigate('/dashboard');
    loadUsers();
    loadTasks();
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', { withCredentials: true });
      setUsers(res.data);
    } catch {
      Toastify({ text: '⚠️ Failed to load users', backgroundColor: 'red' }).showToast();
    }
  };

  const loadTasks = async () => {
    try {
      const res = await axios.get('/api/admin/tasks', { withCredentials: true });
      setTasks(res.data);
      setFilteredTasks(res.data);
    } catch {
      Toastify({ text: '⚠️ Failed to load tasks', backgroundColor: 'red' }).showToast();
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    const filtered = tasks.filter(
      t => t.jobId.toLowerCase().includes(query) || t.assignedTo?.name?.toLowerCase().includes(query)
    );
    setFilteredTasks(filtered);
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = ['Job ID', 'Employee', 'Deadline', 'Status'];
    const rows = filteredTasks.map(t => [
      t.jobId,
      t.assignedTo?.name || '',
      new Date(t.deadline).toLocaleString(),
      t.status
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = 'tasks.csv';
    a.click();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/tasks/${id}/status`, { status: newStatus }, { withCredentials: true });
      Toastify({ text: '✅ Status updated', backgroundColor: 'blue' }).showToast();
      loadTasks();
    } catch {
      Toastify({ text: '❌ Failed to update status', backgroundColor: 'red' }).showToast();
    }
  };

  const assignTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(taskForm).forEach(([key, value]) => {
      if (key === 'files') {
        for (let file of value) formData.append('files', file);
      } else {
        formData.append(key, value);
      }
    });

    try {
      await axios.post('/api/tasks', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Toastify({ text: '📌 Task assigned', backgroundColor: 'green' }).showToast();
      setTaskForm({ jobId: '', loginId: '', deadline: '', googleDocsLink: '', files: [] });
      loadTasks();
    } catch {
      Toastify({ text: '❌ Task assignment failed', backgroundColor: 'red' }).showToast();
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', newUser, { withCredentials: true });
      Toastify({ text: '👤 User added', backgroundColor: 'green' }).showToast();
      setNewUser({ name: '', email: '', loginId: '', password: '' });
      loadUsers();
    } catch {
      Toastify({ text: '❌ Failed to add user', backgroundColor: 'red' }).showToast();
    }
  };

  const ChangePassword = ({ userId }) => {
    const [editing, setEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const savePassword = async () => {
      try {
        await axios.put(`/api/admin/users/${userId}`, { password: newPassword }, { withCredentials: true });
        Toastify({ text: '🔐 Password updated', backgroundColor: 'green' }).showToast();
        setEditing(false);
      } catch {
        Toastify({ text: '❌ Failed to update password', backgroundColor: 'red' }).showToast();
      }
    };

    return editing ? (
      <div className="d-flex">
        <input type="password" className="form-control form-control-sm me-2" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button className="btn btn-sm btn-success" onClick={savePassword}>Save</button>
      </div>
    ) : (
      <button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(true)}>Change Password</button>
    );
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  return (
    <div className="admin-panel container mt-4 animated-panel">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-gradient">🛠 Admin Dashboard</h3>
        <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
        <input className="form-control w-50" placeholder="🔍 Search by Job ID or Employee" value={search} onChange={handleSearch} />
        <button className="btn btn-outline-dark ms-3" onClick={exportCSV}>📁 Export CSV</button>
      </div>

      {/* Add User & Assign Task */}
      <div className="row fade-in">
        <div className="col-md-6">
          <div className="card p-3 mb-4 shadow-sm">
            <h5 className="text-primary">➕ Add New User</h5>
            <form onSubmit={addUser}>
              {['name', 'email', 'loginId', 'password'].map((field, idx) => (
                <input
                  key={field}
                  className="form-control mb-2"
                  type={field === 'password' ? 'password' : 'text'}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={newUser[field]}
                  onChange={e => setNewUser({ ...newUser, [field]: e.target.value })}
                />
              ))}
              <button className="btn btn-primary w-100">Add User</button>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-3 mb-4 shadow-sm">
            <h5 className="text-success">📌 Assign Task</h5>
            <form onSubmit={assignTask}>
              <input className="form-control mb-2" placeholder="Job ID" value={taskForm.jobId} onChange={e => setTaskForm({ ...taskForm, jobId: e.target.value })} />
              <input className="form-control mb-2" placeholder="Login ID" value={taskForm.loginId} onChange={e => setTaskForm({ ...taskForm, loginId: e.target.value })} />
              <input className="form-control mb-2" placeholder="Google Docs Link" value={taskForm.googleDocsLink} onChange={e => setTaskForm({ ...taskForm, googleDocsLink: e.target.value })} />
              <input type="datetime-local" className="form-control mb-2" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
              <input type="file" className="form-control mb-2" multiple onChange={e => setTaskForm({ ...taskForm, files: e.target.files })} />
              <button className="btn btn-success w-100">Assign Task</button>
            </form>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <h5 className="mt-4">📋 Assigned Tasks</h5>
      <div className="table-responsive animated-table">
        <table className="table table-hover table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Job ID</th>
              <th>Employee</th>
              <th>Deadline</th>
              <th>Google Doc</th>
              <th>Files</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Reason</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.map(task => (
              <tr key={task._id}>
                <td>{task.jobId}</td>
                <td>{task.assignedTo?.name || '—'}</td>
                <td>{new Date(task.deadline).toLocaleString()}</td>
                <td><a href={task.googleDocsLink} target="_blank" rel="noreferrer">View</a></td>
                <td>{task.files.map(f => <a key={f} href={`/uploads/${f}`} target="_blank" rel="noreferrer">📎 {f}</a>)}</td>
                <td>{task.status}</td>
                <td>{task.submittedAt ? new Date(task.submittedAt).toLocaleString() : '—'}</td>
                <td>{task.reason || '—'}</td>
                <td>
                  <select className="form-select" value={task.status} onChange={e => updateStatus(task._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="working">Working</option>
                    <option value="submitted">Submitted</option>
                    <option value="done">Done</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Password Management */}
      <h5 className="mt-5">👥 Employee User List</h5>
      <table className="table table-bordered table-hover table-striped">
        <thead className="table-secondary">
          <tr>
            <th>Name</th>
            <th>Login ID</th>
            <th>Change Password</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u._id || i}>
              <td>{u.name}</td>
              <td>{u.loginId}</td>
              <td><ChangePassword userId={u._id} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-3 fade-in">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={`btn btn-sm ${i + 1 === currentPage ? 'btn-primary' : 'btn-outline-primary'} mx-1`} onClick={() => setCurrentPage(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
