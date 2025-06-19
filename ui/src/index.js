import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from 'axios'; // ✅ Add this line

// ✅ Ensure every axios call includes credentials (cookies)
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'https://infizestsys.onrender.com'; // ✅ Set API base URL directly

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
