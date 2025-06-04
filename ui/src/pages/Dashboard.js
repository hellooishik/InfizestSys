// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [breakTime, setBreakTime] = useState(0);
  const [workedTime, setWorkedTime] = useState(0);
  const [approved, setApproved] = useState(false);
  const [timer, setTimer] = useState(null);

  const fetchSession = async () => {
    const res = await axios.get('/api/log/session', { withCredentials: true });
    const data = res.data.data;
    setStatus(data.status);
    setBreakTime(data.break_time);
    setWorkedTime(data.worked_seconds);
    setApproved(data.approveness === 'Approved');
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

  useEffect(() => {
    if (!user) return navigate('/');
    fetchSession();
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

  const isBlocked = status === 'auto-paused' && !approved;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Dashboard</h3>
        <button onClick={handleLogout} className="btn btn-outline-danger">Logout</button>
      </div>
      <p><strong>Welcome:</strong> {user?.name}</p>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Worked Time:</strong> {formatTime(workedTime)}</p>
      <p><strong>Break Time:</strong> <span className={breakTime > 60 ? 'text-danger fw-bold' : ''}>{breakTime} min</span></p>

      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={() => handleAction('start')} disabled={isBlocked}>Start</button>
        <button className="btn btn-warning me-2" onClick={() => handleAction('pause', { break: 5 })} disabled={isBlocked}>Pause</button>
        <button className="btn btn-danger me-2" onClick={() => handleAction('end')} disabled={isBlocked}>End</button>
        <button className="btn btn-info" onClick={requestApproval}>Ask for Approval</button>
      </div>

      {isBlocked && <p className="text-danger">⏳ Waiting for admin approval to resume...</p>}
      {approved && <p className="text-success">✅ Approved by admin. You may continue.</p>}
    </div>
  );
}

export default Dashboard;
