import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import FacultyLayout from './FacultyLayout';
import Dashboard from './Dashboard';
import MyActivities from './MyActivities';
import AddEditActivity from './AddEditActivity';
import PerformanceReport from './PerformanceReport';
import FloatingChatbot from '../Chatbot';

const FacultyApp = () => {
  return (
    <Routes>
      <Route element={<FacultyLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="activities" element={<MyActivities />} />
        <Route path="add-activity" element={<AddEditActivity />} />
        <Route path="report" element={<PerformanceReport />} />
        <Route path="chatbot" element={<FloatingChatbot />} />
      </Route>
    </Routes>
  );
};

export default FacultyApp;
