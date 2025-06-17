import React, { useEffect, useState } from 'react';

const ApprovePublicRequests = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const res = await fetch('/api/requests/all', {
      credentials: 'include'
    });
    const data = await res.json();
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (id) => {
    const res = await fetch('/api/admin/approve-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId: id })
    });
    const data = await res.json();
    alert(data.message || 'Approved');
    fetchRequests(); // refresh list
  };

  return (
    <div>
      <h5>Pending Public Task Requests</h5>
      <ul>
        {requests.map(req => (
          <li key={req._id}>
            Task: <strong>{req.taskId}</strong> | User: {req.userId?.username}
            <button onClick={() => approveRequest(req._id)} className="btn btn-sm btn-success ms-2">Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApprovePublicRequests;
