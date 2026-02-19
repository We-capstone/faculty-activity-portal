import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import ApprovalQueue from './ApprovalQueue';
import FacultyRanking from './FacultyRanking';
import DepartmentAnalytics from './DepartmentAnalytics';

const AdminApp = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="approvals" element={<ApprovalQueue />} />
        <Route path="ranking" element={<FacultyRanking />} />
        <Route path="analytics" element={<DepartmentAnalytics />} />
      </Route>
    </Routes>
  );
};

export default AdminApp;
