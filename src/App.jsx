import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import InventoryPage from './pages/inventory/InventoryPage';
import FleetPage from './pages/fleet/FleetPage';
import TeamPage from './pages/TeamPage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import ConfigurationPage from './pages/ConfigurationPage';
import DriverPortalPage from './pages/DriverPortalPage';
import ToastContainer from './components/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="configuration" element={<ConfigurationPage />} />
          <Route path="driver" element={<DriverPortalPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
