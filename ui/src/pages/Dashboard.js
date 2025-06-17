import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [breakTime, setBreakTime] = useState(0);
  const [workedTime, setWorkedTime] = useState(0);
  const [approved, setApproved] = useState(false);
  const [timer, setTimer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [onBreak, setOnBreak] = useState(false);
  const breakStartRef = useRef(null);
  const [publicRequests, setPublicRequests] = useState([]);

  const inactivityTimeoutRef = useRef(null);
  const statusRef = useRef(status);

  useEffect(() => { statusRef.current = status; }, [status]);
  const fetchPublicRequests = async () => {
  try {
    const res = await axios.get('/api/user/my-public-requests', { withCredentials: true });
    setPublicRequests(res.data);
  } catch (err) {
    console.error('Failed to fetch public task requests', err);
  }
};
useEffect(() => {
  if (!user) return navigate('/');
  fetchSession();
  fetchTasks();
  fetchPublicRequests(); // 👈 Important for requests to show
  const interval = setInterval(fetchSession, 10000);
  const cleanup = startInactivityMonitor();
  return () => {
    clearInterval(interval);
    cleanup();
  };
}, [user]);



  const fetchSession = async () => {
    try {
      const res = await axios.get('/api/log/session', { withCredentials: true });
      const data = res.data.data;
      setStatus(data.status);
      setBreakTime(data.break_time);
      setWorkedTime(data.worked_seconds);
      setApproved(data.approveness === 'Approved');
      setShowModal(data.status === 'auto-paused' && data.approveness !== 'Approved');
      setStartTime(data.start_time);
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

const handleAction = async (actionStatus) => {
  let extra = {};

  if (actionStatus === 'pause') {
    breakStartRef.current = new Date();      // Record the start of the break
    setOnBreak(true);                        // UI state flag
  }

  if (actionStatus === 'start' && onBreak && breakStartRef.current) {
    const now = new Date();
    const breakDuration = Math.ceil((now - breakStartRef.current) / 60000); // in minutes
    extra.break = breakDuration;

    // Immediately update the UI with new break time 
    setBreakTime(prev => prev + breakDuration);

    breakStartRef.current = null;
    setOnBreak(false);
  }

  await axios.post('/api/log', { status: actionStatus, ...extra }, { withCredentials: true });

  if (actionStatus === 'end') {
    alert(`  Work Summary:\nWorked Time: ${formatTime(workedTime)}\nBreak Time: ${breakTime} min`);
  }

  fetchSession(); // Sync with backend after update
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
    if (!seconds || seconds <= 0) return "Day not started";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatCountdown = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return 'Deadline passed';
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

  const startInactivityMonitor = () => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

    const resetTimer = () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => {
        if (statusRef.current === 'running') handleAction('auto-pause');
      }, 60000);
    };

    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  };

  useEffect(() => {
    if (!user) return navigate('/');
    fetchSession();
    fetchTasks();
    const interval = setInterval(fetchSession, 10000);
    const cleanup = startInactivityMonitor();
    return () => {
      clearInterval(interval);
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

  const isBlocked = status === 'auto-paused' && !approved;
  const breakExceeded = breakTime >= 60;
  const showStart = status === 'none' || status === 'ended';
  const showBreak = status === 'running';
  const showEnd = workedTime >= 10800;
  const showApprovalBtn = showModal;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">{greeting()}, {user?.name}</h2>
        <button className="btn btn-outline-dark" onClick={handleLogout}>Logout</button>
      </div>

      <div className="info-cards row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h6>Status</h6>
            <span className={`badge ${status === 'running' ? 'bg-success' : 'bg-secondary'}`}>{status}</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h6>Worked Time</h6>
            <p className="mb-0">{formatTime(workedTime)}</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h6>Break Time</h6>
            <p className={`mb-0 ${breakExceeded ? 'text-danger fw-bold' : ''}`}>{breakTime} min</p>
          </div>
        </div>
      </div>

    <div className="button-group d-flex flex-wrap gap-2 mb-4">
  {showStart && !onBreak && (
    <button className="btn btn-success" onClick={() => handleAction('start')} disabled={isBlocked}>
      Start
    </button>
  )}

  {showBreak && !onBreak && (
    <button className="btn btn-warning" onClick={() => handleAction('pause')} disabled={breakExceeded || isBlocked}>
      Take a Break
    </button>
  )}

  {onBreak && (
    <button className="btn btn-primary" onClick={() => handleAction('start')} disabled={isBlocked}>
      Resume to Work
    </button>
  )}

  {showEnd && !showStart && !onBreak && (
    <button className="btn btn-danger" onClick={() => handleAction('end')} disabled={isBlocked}>
      End Day
    </button>
  )}

  {showApprovalBtn && (
    <button className="btn btn-info" onClick={requestApproval}>
      Ask for Approval
    </button>
  )}
</div>
{/* the main module will be set to the main frame of hierkey  */}

      {isBlocked && <p className="text-danger mb-3">Timer paused due to inactivity. Waiting for admin approval.</p>}
      {approved && <p className="text-success mb-3">Approved by admin. You may resume.</p>}

      <h5 className="mb-3">Assigned Tasks</h5>
      <div className="table-responsive">
        <table className="table table-hover table-bordered">
          <thead className="table-light">
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
                <td>{task.files?.map(file => (
                  <div key={file}><a href={`/uploads/${file}`} target="_blank" rel="noreferrer">📎 {file}</a></div>
                ))}</td>
                <td><a href={task.googleDocsLink} target="_blank" rel="noreferrer">View</a></td>
                <td>{task.status !== 'submitted' && task.status !== 'rejected' ? (
                  <button className="btn btn-sm btn-outline-success" onClick={() => submitTask(task._id)}>Submit</button>
                ) : '—'}</td>
                <td>{task.status !== 'submitted' && task.status !== 'rejected' ? (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => rejectTask(task._id)}>Reject</button>
                ) : (task.reason || '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
<h5 className="mt-5 mb-3">Public Task Requests</h5>
<div className="table-responsive">
  <table className="table table-bordered table-striped">
    <thead className="table-light">
      <tr>
        <th>Task ID</th>
        <th>Topic</th>
        <th>Word Count</th>
        <th>Quote (₹)</th>
        <th>Document</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {publicRequests.length === 0 ? (
        <tr>
          <td colSpan="6" className="text-muted text-center">No public requests yet.</td>
        </tr>
      ) : (
        publicRequests.map(req => (
          <tr key={req._id}>
            <td>{req.task?.taskId || '—'}</td>
            <td>{req.task?.topic || '—'}</td>
            <td>{req.task?.wordCount || 0}</td>
            <td>₹{req.task?.estimatedQuote || 0}</td>
            <td>
              {req.task?.documentPath ? (
                <a href={`/${req.task.documentPath}`} target="_blank" rel="noreferrer">📄 View</a>
              ) : '—'}
            </td>
            <td>
              <span className={`badge ${
                req.status === 'Pending' ? 'bg-warning text-dark' :
                req.status === 'Approved' ? 'bg-success' :
                req.status === 'Rejected' ? 'bg-danger' :
                'bg-secondary'
              }`}>
                {req.status}
              </span>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>


      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box text-center">
            <h4>Inactivity Detected</h4>
            <p>We stopped your timer due to inactivity. Please contact your admin for permission to resume.</p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button className="btn btn-info" onClick={requestApproval}>Ask for Approval</button>
              <button className="btn btn-danger" onClick={() => handleAction('end')}>End My Day</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
