// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // 👈 Include your dashboard styles

function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [breakTime, setBreakTime] = useState(0);
  const [workedTime, setWorkedTime] = useState(0);
  const [approved, setApproved] = useState(false);
  const [timer, setTimer] = useState(null);
  const [tasks, setTasks] = useState([]);

  const fetchSession = async () => {
    const res = await axios.get('/api/log/session', { withCredentials: true });
    const data = res.data.data;
    setStatus(data.status);
    setBreakTime(data.break_time);
    setWorkedTime(data.worked_seconds);
    setApproved(data.approveness === 'Approved');
  };

  const fetchTasks = async () => {
    const res = await axios.get('/api/tasks/my', { withCredentials: true });
    setTasks(res.data);
  };

  const handleAction = async (status, extra = {}) => {
    await axios.post('/api/log', { status, ...extra }, { withCredentials: true });
    fetchSession();
  };

  const requestApproval = async () => {
    await axios.post('/api/log/ask', {}, { withCredentials: true });
    fetchSession();
  };

  const handleLogout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
    navigate('/');
  };

  const submitTask = async (id) => {
    await axios.post(`/api/tasks/${id}/submit`, {}, { withCredentials: true });
    fetchTasks();
  };

  const rejectTask = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    await axios.post(`/api/tasks/${id}/reject`, { reason }, { withCredentials: true });
    fetchTasks();
  };

  useEffect(() => {
    if (!user) return navigate('/');
    fetchSession();
    fetchTasks();
    const interval = setInterval(fetchSession, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (status === 'running') {
      const interval = setInterval(() => {
        setWorkedTime(prev => prev + 1);
      }, 1000);
      setTimer(interval);
      return () => clearInterval(interval);
    } else {
      if (timer) clearInterval(timer);
    }
  }, [status]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCountdown = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return '⏰ Deadline passed';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  const isBlocked = status === 'auto-paused' && !approved;

  return (
    <div className="dashboard-container animate__animated animate__fadeIn">
      <div className="dashboard-header">
        <h3>{greeting()}, <span className="username">{user?.name}</span></h3>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="status-cards">
        <div className="card status-card running">{status.toUpperCase()}</div>
        <div className="card status-card worked">Worked: {formatTime(workedTime)}</div>
        <div className={`card status-card break ${breakTime > 60 ? 'danger' : ''}`}>
          Break: {breakTime} min
        </div>
      </div>

      <div className="actions">
        <button className="action-btn start" onClick={() => handleAction('start')} disabled={isBlocked}>Start</button>
        <button className="action-btn break-btn" onClick={() => handleAction('pause', { break: 5 })} disabled={isBlocked}>Take a Break</button>
        <button className="action-btn end" onClick={() => handleAction('end')} disabled={isBlocked}>End Day</button>
        <button className="action-btn ask" onClick={requestApproval}>Ask for Approval</button>
      </div>

      {isBlocked && <p className="approval-pending">⏳ Waiting for admin approval...</p>}
      {approved && <p className="approved">✅ Approved by admin</p>}

      <h4 className="task-header">📝 Assigned Tasks</h4>
      <div className="task-table-wrapper">
        <table className="table task-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Deadline</th>
              <th>Attachments</th>
              <th>Docs</th>
              <th>Submit</th>
              <th>Reject</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id}>
                <td>{task.jobId}</td>
                <td>{formatCountdown(task.deadline)}</td>
                <td>{task.files?.map(f => (
                  <a key={f} href={`/uploads/${f}`} target="_blank" rel="noreferrer" className="file-link">📎 {f}</a>
                ))}</td>
                <td><a href={task.googleDocsLink} target="_blank" rel="noreferrer">View</a></td>
                <td>
                  {task.status !== 'submitted' && task.status !== 'rejected' ? (
                    <button className="btn btn-success btn-sm" onClick={() => submitTask(task._id)}>Submit</button>
                  ) : '—'}
                </td>
                <td>
                  {task.status !== 'submitted' && task.status !== 'rejected' ? (
                    <button className="btn btn-danger btn-sm" onClick={() => rejectTask(task._id)}>Reject</button>
                  ) : task.reason || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
