import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [loginForm, setLoginForm] = useState({ loginId: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ loginId: '', password: '' });
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  useEffect(() => {
    axios.get('https://infizestsys.onrender.com/api/tasks/public', { withCredentials: true })
      .then(res => setTasks(res.data))
      .catch(err => console.error('Failed to load public tasks', err));
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://infizestsys.onrender.com/api/auth/admin-login', adminForm, { withCredentials: true });
      alert('✅ Admin verified');
      setShowAdminModal(false);
      setAdminForm({ loginId: '', password: '' });
      navigate('/admin');
    } catch (err) {
      alert(err.response?.data?.message || '❌ Invalid admin credentials');
    }
  };

  const handleLoginAndRequest = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTaskId && !isAdminLogin) {
        alert('❌ No task selected');
        return;
      }

      // Login attempt
      const loginRes = await axios.post('https://infizestsys.onrender.com/api/auth/login', loginForm, { withCredentials: true });
      if (!loginRes.data.success) throw new Error('Login failed');

      const session = await axios.get('https://infizestsys.onrender.com/api/auth/session', { withCredentials: true });
      const currentUser = session.data.user;

      if (isAdminLogin) {
        if (currentUser.isAdmin) {
          navigate('/admin');
        } else {
          alert('❌ You are not authorized as admin');
        }
      } else {
        // Request to do task
        const res = await axios.post('https://infizestsys.onrender.com/api/tasks/request', { taskId: selectedTaskId }, { withCredentials: true });
        alert(res.data.message || '✅ Task requested successfully!');
      }

      setShowModal(false);
      setLoginForm({ loginId: '', password: '' });

    } catch (err) {
      alert(err.response?.data?.message || '❌ Login or Task Request failed');
    }
  };

  const openLoginModal = (taskId) => {
    setSelectedTaskId(taskId);
    setIsAdminLogin(false);
    setShowModal(true);
  };

  const openAdminLoginModal = () => {
    setIsAdminLogin(true);
    setShowModal(true);
  };

  return (
    <div className="task-wrapper">
      <nav className="navbar">
        <div className="brand">
          <img
            src="https://home.infizestpublishings.com/wp-content/themes/infizest%20Publishings/Assets/fulllogo_transparent.png"
            alt="Infizest Logo"
            style={{ height: '45px', marginRight: '10px', verticalAlign: 'middle' }}
          />
          Infizest Publishing
        </div>
        <div className="nav-actions">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">Dashboard</Link>
          <button className="admin-link" onClick={openAdminLoginModal}>Admin</button>
        </div>
      </nav>

      <header className="feed-header">
        <h2>Trending Task</h2>
        <p className="subtext">Hand-picked, real-time tasks curated just for you.</p>
      </header>

      <div className="task-grid">
        {tasks.length === 0 ? (
          <p className="no-tasks">No public tasks available at the moment.</p>
        ) : (
          tasks.map((task) => (
            <div className="task-card" key={task._id}>
              <div className="card-top">
                <h4 className="task-topic">{task.topic}</h4>
                <span className="timestamp">{new Date(task.createdAt).toLocaleString()}</span>
              </div>
              <div className="card-body">
                <p><strong>Project ID:</strong> {task.taskId}</p>
                <p><strong>Estimated Words:</strong> {task.wordCount}</p>
                <p><strong>Quote:</strong> ₹{task.estimatedQuote}</p>
              </div>
              {task.documentPath && (
                <a
  className="doc-link"
  href={`http://localhost:5000/${task.documentPath}`}
  target="_blank"
  rel="noopener noreferrer"
>
  View Document
</a>
              )}
              <button className="cta-button" onClick={() => openLoginModal(task.taskId)}>
                Request to Do
              </button>
            </div>
          ))
        )}
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="login-modal">
            <form onSubmit={handleAdminLogin}>
              <div className="modal-header">
                <h3>🛡️ Admin Verification</h3>
                <span className="close-btn" onClick={() => setShowAdminModal(false)}>&times;</span>
              </div>
              <div className="modal-content">
                <input
                  type="text"
                  placeholder="Admin Login ID"
                  value={adminForm.loginId}
                  onChange={(e) => setAdminForm({ ...adminForm, loginId: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary">Verify & Enter</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAdminModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Login Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="login-modal">
            <form onSubmit={handleLoginAndRequest}>
              <div className="modal-header">
                <h3>Login Required</h3>
                <span className="close-btn" onClick={() => setShowModal(false)}>&times;</span>
              </div>
              <div className="modal-content">
                <input
                  type="text"
                  placeholder="Login ID"
                  value={loginForm.loginId}
                  onChange={(e) => setLoginForm({ ...loginForm, loginId: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary">Submit & Request</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
