import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Import pages
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Reservation from './pages/Reservation';
import Login from './pages/Login';
import Settings from './pages/Settings'; // 1. Tambahkan Import Settings di sini

// ==========================================
// KOMPONEN PROTECTED ROUTE (PENGAMAN JALUR)
// ==========================================
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const userStr = localStorage.getItem('user_session');
  
  // 1. Jika belum login (tidak ada sesi), lempar kembali ke halaman Login
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  
  // 2. Jika sudah login tapi rolenya tidak diizinkan mengakses halaman ini
  if (!allowedRoles.includes(user.role)) {
    // Bisa diarahkan ke halaman unauthorized atau ditendang kembali ke login
    return <Navigate to="/login" replace />;
  }

  // 3. Jika aman, izinkan masuk (render komponen anaknya)
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTE (Tanpa Layout Sidebar)
            ========================================== */}
        <Route path="/login" element={<Login />} />

        {/* ==========================================
            PROTECTED ROUTES (Dengan Layout Sidebar Admin)
            ========================================== */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/master-data" element={<MasterData />} />
                  <Route path="/verify" element={<Verification />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/audit-log" element={<AuditLog />} />
                  <Route path="/reservation" element={<Reservation />} />
                  {/* 2. Tambahkan Route Settings di sini */}
                  <Route path="/settings" element={<Settings />} /> 
                </Routes>
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}