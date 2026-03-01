import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import FacultyLayout from './FacultyLayout';
import Dashboard from './Dashboard';
import MyActivities from './MyActivities';
import AddEditActivity from './AddEditActivity';
import PerformanceReport from './PerformanceReport';

const FacultyApp = () => {
  return (
    <Routes>
      <Route element={<FacultyLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="activities" element={<MyActivities />} />
        <Route path="add-activity" element={<AddEditActivity />} />
        <Route path="report" element={<PerformanceReport />} />
        <Route path="chatbot" element={<Navigate to="/faculty/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default FacultyApp;
