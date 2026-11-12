import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { InstrumentsPage } from './pages/InstrumentsPage';
import { InstrumentDetailPage } from './pages/InstrumentDetailPage';
import { SchedulePage } from './pages/SchedulePage';
import { CalibrationsPage } from './pages/CalibrationsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { ProductionUsagePage } from './pages/ProductionUsagePage';
import { AlertsPage } from './pages/AlertsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { ReportsPage } from './pages/ReportsPage';
import { ValidationPage } from './pages/ValidationPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        setActiveAlertCount(res.data.active_alerts || 0);
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      {/* 13-Section Enterprise Sidebar */}
      <Sidebar alertCount={activeAlertCount} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar alertCount={activeAlertCount} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/instruments" element={<InstrumentsPage />} />
            <Route path="/instruments/:id" element={<InstrumentDetailPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/calibrations" element={<CalibrationsPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="/production-usage" element={<ProductionUsagePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/audit-trail" element={<AuditTrailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/validation" element={<ValidationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
