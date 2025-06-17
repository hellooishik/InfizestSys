import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [loginForm, setLoginForm] = useState({ loginId: '', password: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios.get('/api/tasks/public', { withCredentials: true })
      .then(res => setTasks(res.data))
      .catch(err => console.error('Failed to load public tasks', err));
  }, []);

  const handleLoginAndRequest = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Login
      await axios.post('/api/auth/login', loginForm, { withCredentials: true });

      // Step 2: Submit task request
      await axios.post('/api/tasks/request', { taskId: selectedTaskId }, { withCredentials: true });

      alert('✅ Task requested successfully!');
      setShowModal(false);
      setLoginForm({ loginId: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.message || '❌ Login or request failed');
    }
  };

  const openLoginModal = (taskId) => {
    setSelectedTaskId(taskId);
    setShowModal(true);
  };

  return (
    <div className="container mt-4">
      {/* 🔗 Top Nav Buttons */}
      <div className="d-flex justify-content-end gap-2 mb-3">
        <Link to="/login" className="btn btn-outline-primary">Login</Link>
        <Link to="/register" className="btn btn-outline-secondary">Register</Link>
        <Link to="/dashboard" className="btn btn-outline-success">Dashboard</Link>
        <Link to="/admin" className="btn btn-outline-dark">Admin Panel</Link>
      </div>

      <h2 className="mb-4 text-center fw-bold">Available Public Tasks</h2>

      <div className="row">
        {tasks.length === 0 ? (
          <p className="text-muted text-center">No public tasks available at the moment.</p>
        ) : (
          tasks.map(task => (
            <div className="col-md-4 mb-3" key={task._id}>
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary">{task.topic}</h5>
                  <p className="card-text">
                    <strong>Task ID:</strong> {task.taskId}<br />
                    <strong>Word Count:</strong> {task.wordCount} words<br />
                    <strong>Estimated Quote:</strong> ₹{task.estimatedQuote}<br />
                    <strong>Uploaded:</strong> {new Date(task.createdAt).toLocaleString()}
                  </p>
                  {task.documentPath && (
                    <a href={`/${task.documentPath}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info mb-2">
                      View Document
                    </a>
                  )}
                  <button className="btn btn-success mt-auto" onClick={() => openLoginModal(task.taskId)}>
                    Request to Do
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🔒 Login Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleLoginAndRequest}>
                <div className="modal-header">
                  <h5 className="modal-title">Login to Request Task</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Login ID"
                    value={loginForm.loginId}
                    onChange={(e) => setLoginForm({ ...loginForm, loginId: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Submit & Request</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
