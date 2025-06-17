import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Register from './pages/Register';
import HomePage from './pages/HomePage'; // ✅ new import
import { UserProvider } from './context/UserContext';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />            {/* ✅ Public Homepage */}
          <Route path="/login" element={<Login />} />          {/* ✅ Moved login */}
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
