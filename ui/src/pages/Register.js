// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  return (
    <div className="container mt-5">
      <div className="alert alert-warning text-center">
        <strong>Notice:</strong> Infizest is currently operating as an internal platform. <br />
        Interested in joining us as a writer? Send your resume to <a href="mailto:contact@infizestpublishings.com">contact@infizestpublishings.com</a> — we’d love to hear from passionate storytellers!
      </div>
    </div>
  );
}

export default Register;
