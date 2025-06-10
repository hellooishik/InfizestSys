import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import io from 'socket.io-client';
import '../css/AdminPanel.css';

// ... (your imports remain unchanged)
import { Moon, Sun } from 'lucide-react'; // Optional: use react-icons if you prefer

function AdminPanel() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', loginId: '', password: '' });
  const [taskForm, setTaskForm] = useState({ jobId: '', loginId: '', deadline: '', googleDocsLink: '', files: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [visibleSections, setVisibleSections] = useState({
    addUser: false,
    assignTask: false,
    approvals: true,
    userList: true
  });

  const itemsPerPage = 10;

  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });
    socket.on('approval_request', (data) => {
      Toastify({
        text: `⚠️ Approval request from ${data.name} (${data.loginId}) at ${data.time}`,
        backgroundColor: '#ff6600',
        duration: 5000
      }).showToast();
      loadLogs();
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) return navigate('/dashboard');
    loadUsers();
    loadTasks();
    loadLogs();
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const loadUsers = async () => {
    const res = await axios.get('/api/admin/users', { withCredentials: true });
    setUsers(res.data);
  };

  const loadTasks = async () => {
    const res = await axios.get('/api/admin/tasks', { withCredentials: true });
    setTasks(res.data);
    setFilteredTasks(res.data);
  };

  const loadLogs = async () => {
    const res = await axios.get('/api/admin/logs/today', { withCredentials: true });
    setLogs(res.data);
  };

  const toggleSection = (section) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
    navigate('/');
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`/api/tasks/${id}/status`, { status: newStatus }, { withCredentials: true });
    loadTasks();
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

  const assignTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(taskForm).forEach(([key, val]) => {
      if (key === 'files') [...val].forEach(f => formData.append('files', f));
      else formData.append(key, val);
    });
  try {
  await axios.post('/api/tasks', formData, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  Toastify({
    text: `Task "${taskForm.jobId}" assigned to "${taskForm.loginId}"`,
    backgroundColor: 'linear-gradient(to right, #007991, #78ffd6)',
    duration: 3000
  }).showToast();
  setTaskForm({ jobId: '', loginId: '', deadline: '', googleDocsLink: '', files: [] });
  loadTasks();
} catch (error) {
  Toastify({
    text: `Failed to assign task: ${error.response?.data?.message || error.message}`,
    backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
    duration: 4000
  }).showToast();
}
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
  await axios.post('/api/admin/users', newUser, { withCredentials: true });
  Toastify({
    text: `User "${newUser.name}" added successfully!`,
    backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
    duration: 3000
  }).showToast();
  setNewUser({ name: '', email: '', loginId: '', password: '' });
  loadUsers();
} catch (error) {
  Toastify({
    text: `Failed to add user: ${error.response?.data?.message || error.message}`,
    backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
    duration: 4000
  }).showToast();
}

  };

  const updateApproval = async (userId, action) => {
    await axios.put(`/api/admin/approval/${userId}`, { action }, { withCredentials: true });
    Toastify({
      text: `Approval ${action === 'approve' ? 'granted' : 'rejected'} for user`,
      backgroundColor: action === 'approve' ? 'green' : 'red',
      duration: 3000
    }).showToast();
    loadLogs();
  };

  const ChangePassword = ({ userId }) => {
    const [editing, setEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const savePassword = async () => {
      await axios.put(`/api/admin/users/${userId}`, { password: newPassword }, { withCredentials: true });
      Toastify({ text: 'Password updated', backgroundColor: 'green' }).showToast();
      setEditing(false);
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

  const getStatus = (userId) => {
    const log = logs.find(log => log.userId === userId);
    if (!log) return 'Offline';
    return log.status === 'running' ? 'Online' : 'Offline';
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  return (
    <div className="d-flex">
     {/* The main module is been set to the main frame of the hierkey  */}
      {/* Sidebar */}
      <div className="sidebar">
        <h4 className="mb-4">Admin</h4>
        <div className="toggle-btn" onClick={() => toggleSection('addUser')}>Add New User</div>
        <div className="toggle-btn" onClick={() => toggleSection('assignTask')}>Assign Task</div>
        <div className="toggle-btn" onClick={() => toggleSection('approvals')}>Approval Requests</div>
        <div className="toggle-btn" onClick={() => toggleSection('userList')}>User List</div>
        <div className="mt-4">
          <button className="btn btn-outline-secondary w-100" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        <div className="mt-3">
          <button className="btn btn-outline-danger w-100" onClick={handleLogout}>Logout</button>
        </div>
      </div>
     {/* the main module is been set to the main frame of the total hierkey  */}

      {/* Main Content */}
      <div className="container mt-4">
          <h2 className="text-center mb-4 fw-bold">Infizest Admin Panel</h2>
        {visibleSections.addUser && (
          <div className="card p-3 mb-4 shadow-sm">
            <h5 className="text-primary">Add New User</h5>
            <form onSubmit={addUser}>
              {['name', 'email', 'loginId', 'password'].map((field) => (
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
        )}

        {visibleSections.assignTask && (
          <div className="card p-3 mb-4 shadow-sm">
            <h5 className="text-success">Assign Task</h5>
            <form onSubmit={assignTask}>
              <input className="form-control mb-2" placeholder="Job ID" value={taskForm.jobId} onChange={e => setTaskForm({ ...taskForm, jobId: e.target.value })} />
              <input className="form-control mb-2" placeholder="Login ID" value={taskForm.loginId} onChange={e => setTaskForm({ ...taskForm, loginId: e.target.value })} />
              <input className="form-control mb-2" placeholder="Google Docs Link" value={taskForm.googleDocsLink} onChange={e => setTaskForm({ ...taskForm, googleDocsLink: e.target.value })} />
              <input type="datetime-local" className="form-control mb-2" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
              <input type="file" className="form-control mb-2" multiple onChange={e => setTaskForm({ ...taskForm, files: e.target.files })} />
              <button className="btn btn-success w-100">Assign Task</button>
            </form>
          </div>
        )}

        {/* Search + Table */}
        <div className="d-flex mb-3">
          <input className="form-control w-50" placeholder="Search Job ID or Employee" value={search} onChange={(e) => {
            const query = e.target.value.toLowerCase();
            setSearch(query);
            const filtered = tasks.filter(t => t.jobId.toLowerCase().includes(query) || t.assignedTo?.name?.toLowerCase().includes(query));
            setFilteredTasks(filtered);
          }} />
          <button className="btn btn-outline-secondary ms-2" onClick={exportCSV}>Export CSV</button>
        </div>

      {/* Task Table */}
<table className="table table-bordered table-hover">
  <thead>
    <tr>
      <th>Job ID</th>
      <th>Employee</th>
      <th>Deadline</th>
      <th>Google Docs</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {currentTasks.map(task => (
      <tr key={task._id}>
        <td>{task.jobId}</td>
        <td>{task.assignedTo?.name}</td>
        <td>{new Date(task.deadline).toLocaleString()}</td>
        <td><a href={task.googleDocsLink} target="_blank" rel="noreferrer">View</a></td>
        <td>
          <span className={`badge ${
            task.status === 'pending' ? 'bg-warning text-dark' :
            task.status === 'working' ? 'bg-info' :
            task.status === 'submitted' ? 'bg-primary' :
            task.status === 'done' ? 'bg-success' :
            task.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
          }`}>
            {task.status}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>

        {visibleSections.approvals && (
          <>
            <h5 className="mt-5">Approval Requests</h5>
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Approveness</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(log => log.approveness === 'Pending').map(log => {
                  const u = users.find(u => u._id === log.userId);
                  return (
                    <tr key={log._id}>
                      <td>{u?.name} ({u?.loginId})</td>
                      <td>{log.status}</td>
                      <td className="text-warning fw-bold">Pending</td>
                      <td>
                        <button className="btn btn-sm btn-success me-2" onClick={() => updateApproval(log.userId, 'approve')}>Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => updateApproval(log.userId, 'reject')}>Reject</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {visibleSections.userList && (
          <>
            <h5 className="mt-5">Employee User List</h5>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Login ID</th>
                  <th>Status</th>
                  <th>Change Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.loginId}</td>
                    <td className={getStatus(u._id) === 'Online' ? 'text-success' : 'text-muted'}>{getStatus(u._id)}</td>
                    <td><ChangePassword userId={u._id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Pagination */}
        <div className="d-flex justify-content-center mt-3">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`btn btn-sm ${i + 1 === currentPage ? 'btn-primary' : 'btn-outline-primary'} mx-1`} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </button>
          ))}
        </div>
          <footer className="text-center mt-5 mb-3 ">
  © {new Date().getFullYear()} Infizest. All rights reserved.
</footer>
      </div>
    

    </div>
    
  );
}

export default AdminPanel;
