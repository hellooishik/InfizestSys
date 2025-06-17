import React, { useEffect, useState } from 'react';

const PublicTaskBoard = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('/api/tasks/public')
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  const handleRequest = (taskId) => {
    fetch('/api/tasks/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // ensures session is passed
      body: JSON.stringify({ taskId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else alert("Request submitted");
      });
  };

  return (
    <div className="task-board">
      <h2>Available Public Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li key={task._id} className="task-card">
            <h4>{task.topic}</h4>
            <p><strong>Task ID:</strong> {task.taskId}</p>
            <p><strong>Word Count:</strong> {task.wordCount}</p>
            <p><strong>Estimated Quote:</strong> ₹{task.estimatedQuote}</p>
            <button onClick={() => handleRequest(task.taskId)}>Request to Do</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PublicTaskBoard;
