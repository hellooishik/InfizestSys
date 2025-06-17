import React, { useState } from 'react';

const PostPublicTask = () => {
  const [task, setTask] = useState({
    taskId: '',
    topic: '',
    wordCount: '',
    estimatedQuote: '',
    document: null
  });

  const handleChange = e => {
    const { name, value, files } = e.target;
    setTask(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    for (let key in task) {
      formData.append(key, task[key]);
    }

    const res = await fetch('/api/admin/public-task', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    const data = await res.json();
    alert(data.message || 'Posted');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h5>Post Public Task</h5>
      <input name="taskId" placeholder="Task ID" onChange={handleChange} required />
      <input name="topic" placeholder="Project Topic" onChange={handleChange} required />
      <input name="wordCount" type="number" placeholder="Word Count" onChange={handleChange} required />
      <input name="estimatedQuote" type="number" placeholder="Quote (₹)" onChange={handleChange} required />
      <input name="document" type="file" onChange={handleChange} />
      <button className="btn btn-primary mt-2">Post Task</button>
    </form>
  );
};

export default PostPublicTask;
