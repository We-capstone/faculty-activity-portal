import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import FacultyApp from './faculty/FacultyApp';
import AdminApp from './admin/AdminApp';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/faculty/*" element={<FacultyApp />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
