import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import io from 'socket.io-client';
import '../css/AdminPanel.css';
import { Moon, Sun } from 'lucide-react'; // Optional

function AdminPanel() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    approvals: false,
    userList: true,
    postPublicTask: false,
    approvePublicRequests: false,
    managePublicPosts: false
  });

  const itemsPerPage = 10;

  useEffect(() => {
    const socket = io('https://infizestsys.onrender.com', { withCredentials: true });
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
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const loadUsers = async () => {
    const res = await axios.get('https://infizestsys.onrender.com/api/admin/users', { withCredentials: true });
    setUsers(res.data);
  };

  const loadTasks = async () => {
    const res = await axios.get('https://infizestsys.onrender.com/api/admin/tasks', { withCredentials: true });
    setTasks(res.data);
    setFilteredTasks(res.data);
  };

  const loadLogs = async () => {
    const res = await axios.get('https://infizestsys.onrender.com/api/admin/logs/today', { withCredentials: true });
    setLogs(res.data);
  };

  // The main Functions of the admin panel
  const handleLogout = async () => {
    await axios.post('https://infizestsys.onrender.com/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
    navigate('/');
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`https://infizestsys.onrender.com/api/tasks/${id}/status`, { status: newStatus }, { withCredentials: true });
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
      await axios.post('https://infizestsys.onrender.com/api/tasks', formData, {
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
      await axios.post('https://infizestsys.onrender.com/api/admin/users', newUser, { withCredentials: true });
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

  const [publicRequests, setPublicRequests] = useState([]);
  const [publicTasks, setPublicTasks] = useState([]);
  const [publicTaskForm, setPublicTaskForm] = useState({
    taskId: '',
    topic: '',
    wordCount: '',
    estimatedQuote: '',
    document: null
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedPublicTask, setEditedPublicTask] = useState({ topic: '', wordCount: '', estimatedQuote: '' });

const loadPublicTasks = async () => {
  try {
    const res = await axios.get('https://infizestsys.onrender.com/api/tasks/public', { withCredentials: true });
    console.log("✅ Public Tasks Fetched:", res.data);
    setPublicTasks(res.data);
  } catch (err) {
    console.error('❌ Failed to load public tasks:', err);
  }
};
const [activeSection, setActiveSection] = useState('');
const toggleSection = (section) => {
  setVisibleSections(prev => ({
    ...Object.fromEntries(Object.entries(prev).map(([key]) => [key, false])),
    [section]: true
  }));
  setActiveSection(section);
};

const loadPublicRequests = async () => {
  try {
    const res = await axios.get('https://infizestsys.onrender.com/api/admin/public-requests', { withCredentials: true });
    console.log("✅ Public Requests Fetched:", res.data);
    setPublicRequests(res.data);
  } catch (err) {
    console.error('❌ Failed to fetch public requests:', err);
  }
};


  const handleEditPublicTask = (task) => {
    setEditingTaskId(task._id);
    setEditedPublicTask({
      topic: task.topic,
      wordCount: task.wordCount,
      estimatedQuote: task.estimatedQuote
    });
  };

  const saveEditedPublicTask = async () => {
    try {
      await axios.put(`https://infizestsys.onrender.com/api/admin/public-tasks/${editingTaskId}`, editedPublicTask, { withCredentials: true });
      Toastify({ text: '✅ Task updated!', backgroundColor: 'green' }).showToast();
      setEditingTaskId(null);
      loadPublicTasks();
    } catch (err) {
      Toastify({ text: '❌ Update failed', backgroundColor: 'red' }).showToast();
    }
  };

  const deletePublicTask = async (taskId) => {
    try {
      await axios.delete(`https://infizestsys.onrender.com/api/admin/public-tasks/${taskId}`, { withCredentials: true });
      Toastify({ text: '🗑️ Task deleted!', backgroundColor: 'red' }).showToast();
      loadPublicTasks();
    } catch (err) {
      Toastify({ text: '❌ Delete failed', backgroundColor: 'orange' }).showToast();
    }
  };

  const handlePostPublicTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('taskId', publicTaskForm.taskId);
    formData.append('topic', publicTaskForm.topic);
    formData.append('wordCount', publicTaskForm.wordCount);
    formData.append('estimatedQuote', publicTaskForm.estimatedQuote);
    formData.append('document', publicTaskForm.document);

    try {
      await axios.post('https://infizestsys.onrender.com/api/admin/public-task', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Toastify({
        text: '✅ Public Task posted successfully!',
        backgroundColor: 'green',
        duration: 3000
      }).showToast();
      setPublicTaskForm({ taskId: '', topic: '', wordCount: '', estimatedQuote: '', document: null });
      loadPublicTasks();
    } catch (err) {
      Toastify({
        text: `❌ Failed to post: ${err.response?.data?.message || err.message}`,
        backgroundColor: 'red',
        duration: 4000
      }).showToast();
    }
  };

  const updateApproval = async (userId, action) => {
    await axios.put(`https://infizestsys.onrender.com/api/admin/approval/${userId}`, { action }, { withCredentials: true });
    Toastify({
      text: `Approval ${action === 'approve' ? 'granted' : 'rejected'} for user`,
      backgroundColor: action === 'approve' ? 'green' : 'red',
      duration: 3000
    }).showToast();
    loadLogs();
  };
const updatePublicRequest = async (id, action) => {
  try {
    await axios.put(`https://infizestsys.onrender.com/api/admin/public-requests/${id}`, { action }, { withCredentials: true });
    Toastify({
      text: `Public task ${action}d successfully!`,
      backgroundColor: action === 'approve' ? 'green' : 'red',
      duration: 3000
    }).showToast();
    loadPublicRequests();
  } catch (error) {
    Toastify({
      text: `Error: ${error.response?.data?.message || error.message}`,
      backgroundColor: 'orange',
      duration: 3000
    }).showToast();
  }
};


  const ChangePassword = ({ userId }) => {
    const [editing, setEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const savePassword = async () => {
      await axios.put(`https://infizestsys.onrender.com/api/admin/users/${userId}`, { password: newPassword }, { withCredentials: true });
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

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) return navigate('/dashboard');
    loadUsers();
    loadTasks();
    loadLogs();
    loadPublicTasks();
    loadPublicRequests();
  }, [user]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // The Main 
  return (
    <div className="d-flex">
     {/* The main module is been set to the main frame of the hierkey  */}
      {/* Sidebar */}
     {/* Hamburger button (mobile only) */}
<button className="hamburger-btn d-md-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
  ☰
</button>

{/* Sidebar */}
<div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
  <h4 className="mb-4">Admin</h4>

  {[
    { label: 'Add New User', key: 'addUser' },
    { label: 'Assign Task', key: 'assignTask' },
    { label: 'Approval Requests', key: 'approvals' },
    { label: 'User List', key: 'userList' },
    { label: 'Post Public Task', key: 'postPublicTask' },
    { label: 'Public Task Requests', key: 'approvePublicRequests' },
    { label: 'Manage Public Posts', key: 'managePublicPosts' },
  ].map(({ label, key }) => (
    <div
      key={key}
      className={`toggle-btn ${activeSection === key ? 'active' : ''}`}
      onClick={() => {
        toggleSection(key);
        setSidebarOpen(false); // auto-close sidebar on mobile
      }}
    >
      {label}
    </div>
  ))}

  <div className="mt-4">
    <button className="btn btn-outline-secondary w-100" onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  </div>

  <div className="mt-3">
    <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
      Logout
    </button>
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
{visibleSections.postPublicTask && (
  <div className="card p-3 mb-4 shadow-sm">
    <h5 className="text-info">Post Public Task</h5>
    <form onSubmit={handlePostPublicTask}>
      <input
        className="form-control mb-2"
        placeholder="Task ID"
        value={publicTaskForm.taskId}
        onChange={e => setPublicTaskForm({ ...publicTaskForm, taskId: e.target.value })}
        required
      />
      <input
        className="form-control mb-2"
        placeholder="Topic"
        value={publicTaskForm.topic}
        onChange={e => setPublicTaskForm({ ...publicTaskForm, topic: e.target.value })}
        required
      />
      <input
        className="form-control mb-2"
        type="number"
        placeholder="Word Count"
        value={publicTaskForm.wordCount}
        onChange={e => setPublicTaskForm({ ...publicTaskForm, wordCount: e.target.value })}
        required
      />
      <input
        className="form-control mb-2"
        type="number"
        placeholder="Estimated Quote (₹)"
        value={publicTaskForm.estimatedQuote}
        onChange={e => setPublicTaskForm({ ...publicTaskForm, estimatedQuote: e.target.value })}
        required
      />
      <input
        type="file"
        className="form-control mb-3"
        onChange={e => setPublicTaskForm({ ...publicTaskForm, document: e.target.files[0] })}
        required
      />
      <button className="btn btn-info w-100">Post Task</button>
    </form>
  </div>
)}
{visibleSections.managePublicPosts && (
  <div className="card p-3 mb-4 shadow-sm">
    <h5 className="text-warning">Manage Public Posts</h5>
    {publicTasks.length === 0 ? (
      <p className="text-muted">No public tasks posted yet.</p>
    ) : (
      <table className="table-responsive table table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            <th>Task ID</th>
            <th>Topic</th>
            <th>Words</th>
            <th>Quote (₹)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {publicTasks.map((task) => (
            <tr key={task._id}>
              <td>{task.taskId}</td>
              <td>{task.topic}</td>
              <td>{task.wordCount}</td>
              <td>{task.estimatedQuote}</td>
              <td>
                <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEditPublicTask(task)}>
                  Edit
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => deletePublicTask(task._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}



{visibleSections.approvePublicRequests && (
  <>
    <h5 className="mt-5 text-danger">Public Task Requests</h5>
    <table className="table-responsive table table-bordered">
      <thead className="table-light">
        <tr>
          <th>Task ID</th>
          <th>User</th>
          <th>Topic</th>
          <th>Word Count</th>
          <th>Estimated Quote (₹)</th>
          <th>Document</th>
          <th>Requested</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {publicRequests.filter(req => req.status === 'Pending').length === 0 ? (
          <tr>
            <td colSpan="8" className="text-center text-muted">No pending public task requests</td>
          </tr>
        ) : (
          publicRequests
            .filter(req => req.status === 'Pending')
            .map((req) => {
              const task = req.taskId || {};
              const user = req.userId || {};

              return (
                <tr key={req._id}>
                  <td>{task.taskId || '—'}</td>
                  <td>{user.name} ({user.loginId})</td>
                  <td>{task.topic || 'N/A'}</td>
                  <td>{task.wordCount || '—'} words</td>
                  <td>₹{task.estimatedQuote || 0}</td>
                  <td>
                    {task.documentPath ? (
                      <a
                        href={`/${task.documentPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-info"
                      >
                        View
                      </a>
                    ) : '—'}
                  </td>
                  <td>{new Date(req.requestedAt).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-sm btn-success me-2" onClick={() => updatePublicRequest(req._id, 'approve')}>
                      Approve
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => updatePublicRequest(req._id, 'reject')}>
                      Reject
                    </button>
                  </td>
                </tr>
              );
            })
        )}
      </tbody>
    </table>
  </>
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
<table className="table-responsive table table-bordered table-hover">
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
            <table className="table-responsive table table-bordered">
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
            <table className="table-responsive table table-striped">
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
