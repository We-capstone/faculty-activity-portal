import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import FacultyRanking from './FacultyRanking';
import DepartmentAnalytics from './DepartmentAnalytics';

const AdminApp = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="ranking" element={<FacultyRanking />} />
        <Route path="analytics" element={<DepartmentAnalytics />} />
        <Route path="chatbot" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminApp;
