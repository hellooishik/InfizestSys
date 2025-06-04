// src/pages/AdminPanel.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import './AdminPanel.css';


function AdminPanel() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', loginId: '', password: '' });
  const [taskForm, setTaskForm] = useState({ jobId: '', loginId: '', deadline: '', googleDocsLink: '', files: [] });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      setError('Access denied or session expired.');
    }
  };

  const loadTasks = async () => {
    try {
      const res = await axios.get('/api/admin/tasks', { withCredentials: true });
      setTasks(res.data);
      setFilteredTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) return navigate('/dashboard');
    loadUsers();
    loadTasks();
  }, [user]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    const filtered = tasks.filter(
      t =>
        t.jobId.toLowerCase().includes(query) ||
        t.assignedTo?.name?.toLowerCase().includes(query)
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
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/tasks/${id}/status`, { status: newStatus }, { withCredentials: true });
      Toastify({ text: 'Status updated!', backgroundColor: 'blue' }).showToast();
      loadTasks();
    } catch {
      Toastify({ text: 'Failed to update status', backgroundColor: 'red' }).showToast();
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  return (
    <div className="container mt-5">
      <h3 className="mb-4 text-success"><i className="bi bi-speedometer2 me-2"></i>Admin Panel</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search & Export */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <input className="form-control w-50" placeholder="Search Job ID or Employee" value={search} onChange={handleSearch} />
       <button className="btn btn-outline-secondary ms-3" onClick={exportCSV}>
  <i className="bi bi-download me-1"></i> Export CSV
</button>
      </div>

      {/* User and Task Forms */}
      <div className="row mb-4">
        <div className="col-md-6">
          <h5>Add New Employee</h5>
          <form className="row g-2" onSubmit={async e => {
            e.preventDefault();
            try {
              await axios.post('/api/admin/users', newUser, { withCredentials: true });
              Toastify({ text: 'User added', backgroundColor: 'green' }).showToast();
              setNewUser({ name: '', email: '', loginId: '', password: '' });
              loadUsers();
            } catch {
              Toastify({ text: 'Failed to add user', backgroundColor: 'red' }).showToast();
            }
          }}>
            {['name', 'email', 'loginId', 'password'].map((f, i) => (
              <div className="col-md-6" key={f}>
                <input type={f === 'password' ? 'password' : 'text'} className="form-control" placeholder={f} value={newUser[f]} onChange={e => setNewUser({ ...newUser, [f]: e.target.value })} />
              </div>
            ))}
            <div className="col-md-12"><button className="btn btn-primary w-100">Add User</button></div>
          </form>
        </div>

        <div className="col-md-6">
          <h5>Assign Task to Employee</h5>
          <form className="row g-2" onSubmit={async e => {
            e.preventDefault();
            const formData = new FormData();
            Object.entries(taskForm).forEach(([k, v]) => {
              if (k === 'files') for (let file of v) formData.append('files', file);
              else formData.append(k, v);
            });
            try {
              await axios.post('/api/tasks', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              Toastify({ text: 'Task assigned!', backgroundColor: 'green' }).showToast();
              setTaskForm({ jobId: '', loginId: '', deadline: '', googleDocsLink: '', files: [] });
              loadTasks();
            } catch {
              Toastify({ text: 'Task assignment failed', backgroundColor: 'red' }).showToast();
            }
          }}>
            {['jobId', 'loginId', 'googleDocsLink'].map(f => (
              <div className="col-md-6" key={f}>
                <input className="form-control" placeholder={f} value={taskForm[f]} onChange={e => setTaskForm({ ...taskForm, [f]: e.target.value })} />
              </div>
            ))}
            <div className="col-md-6">
              <input type="datetime-local" className="form-control" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
            </div>
            <div className="col-md-12">
              <input type="file" className="form-control" multiple onChange={e => setTaskForm({ ...taskForm, files: e.target.files })} />
            </div>
            <div className="col-md-12"><button className="btn btn-success w-100">Assign Task</button></div>
          </form>
        </div>
      </div>

      {/* Task Table */}
      <h5 className="mt-4">📋 All Assigned Tasks</h5>
      <table className="table table-striped table-bordered">
        <thead className="table-light">
          <tr>
            <th>Job ID</th>
            <th>Employee</th>
            <th>Deadline</th>
            <th>Google Doc</th>
            <th>Attachments</th>
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
              <td>{task.files.map(f => (
                <div key={f}><a href={`/uploads/${f}`} target="_blank">📎 {f}</a></div>
              ))}</td>
              <td>{task.status}</td>
              <td>{task.submittedAt ? new Date(task.submittedAt).toLocaleString() : '—'}</td>
              <td>{task.reason || '—'}</td>
              <td>
                <select className="form-select form-select-sm" value={task.status} onChange={e => updateStatus(task._id, e.target.value)}>
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

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-3">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={`btn btn-sm ${i + 1 === currentPage ? 'btn-primary' : 'btn-outline-primary'} mx-1`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
