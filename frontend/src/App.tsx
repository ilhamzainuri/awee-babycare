import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy load or import pages (I'll import them for now)
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Reservation from './pages/Reservation';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/verify" element={<Verification />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/reservation" element={<Reservation />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
