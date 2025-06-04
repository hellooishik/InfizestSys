import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import "./Dashboard.css";

function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [breakTime, setBreakTime] = useState(0);
  const [workedTime, setWorkedTime] = useState(0);
  const [approved, setApproved] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [timer, setTimer] = useState(null);

  const currentStatus = useRef('');

  const fetchSession = async () => {
    try {
      const res = await axios.get('/api/log/session', { withCredentials: true });
      const data = res.data.data;
      setStatus(data.status);
      setBreakTime(data.break_time);
      setWorkedTime(data.worked_seconds);
      setApproved(data.approveness === 'Approved');
      currentStatus.current = data.status;
    } catch (err) {
      console.error('Failed to fetch session', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks/my', { withCredentials: true });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  const handleAction = async (actionStatus, extra = {}) => {
    await axios.post('/api/log', { status: actionStatus, ...extra }, { withCredentials: true });
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

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatCountdown = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return '⏰ Deadline passed';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Inactivity tracking (auto-pause after 30 sec)
  const startInactivityMonitor = () => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (currentStatus.current === 'running') {
          handleAction('auto-pause');
        }
      }, 30000);
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  };

  useEffect(() => {
    if (!user) return navigate('/');
    fetchSession();
    fetchTasks();
    const sessionInterval = setInterval(fetchSession, 10000);
    const cleanup = startInactivityMonitor();
    return () => {
      clearInterval(sessionInterval);
      cleanup();
    };
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

  const isBlocked = status === 'auto-pause' && !approved;
  const breakExceeded = breakTime >= 60;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{greeting()}, {user?.name}</h3>
        <button onClick={handleLogout} className="btn btn-outline-danger">Logout</button>
      </div>

      <div className="mb-2">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Worked Time:</strong> {formatTime(workedTime)}</p>
        <p>
          <strong>Break Time:</strong>{' '}
          <span className={breakExceeded ? 'text-danger fw-bold' : ''}>
            {breakTime} min
          </span>
        </p>
      </div>

      <div className="mb-4">
        <button className="btn btn-success me-2" onClick={() => handleAction('start')} disabled={isBlocked}>Start</button>
        <button className="btn btn-warning me-2" onClick={() => handleAction('pause', { break: 5 })} disabled={breakExceeded || isBlocked}>Take a Break</button>
        <button className="btn btn-danger me-2" onClick={() => handleAction('end')} disabled={isBlocked}>End Day</button>
        <button className="btn btn-info" onClick={requestApproval}>Ask for Approval</button>
      </div>

      {isBlocked && <p className="text-danger">⏳ Timer paused due to inactivity. Waiting for admin approval.</p>}
      {approved && <p className="text-success">✅ Approved by admin. You may resume.</p>}

      <h5 className="mt-4">📝 Assigned Tasks</h5>
      <table className="table table-bordered">
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
              <td>
                {task.files?.map(file => (
                  <div key={file}>
                    <a href={`/uploads/${file}`} target="_blank" rel="noreferrer">📎 {file}</a>
                  </div>
                ))}
              </td>
              <td><a href={task.googleDocsLink} target="_blank" rel="noreferrer">View</a></td>
              <td>
                {task.status !== 'submitted' && task.status !== 'rejected' ? (
                  <button className="btn btn-sm btn-success" onClick={() => submitTask(task._id)}>Submit</button>
                ) : '—'}
              </td>
              <td>
                {task.status !== 'submitted' && task.status !== 'rejected' ? (
                  <button className="btn btn-sm btn-danger" onClick={() => rejectTask(task._id)}>Reject</button>
                ) : (task.reason || '—')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
