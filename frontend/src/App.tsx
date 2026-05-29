import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layouts
import Layout from './components/Layout'; // Layout khusus Admin
import TherapistLayout from './components/TherapistLayout'; // Layout khusus Therapist/Bidan

// Import Halaman Admin
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Reservation from './pages/Reservation';
import Settings from './pages/Settings'; 

// Import Halaman Public
import Login from './pages/Login';

// Import Halaman Therapist / Bidan
import TherapistDashboard from './pages/therapist/TherapistDashboard';

// ==========================================
// KOMPONEN PROTECTED ROUTE (PENGAMAN JALUR)
// ==========================================
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[]; 
}) => {
  const userStr = localStorage.getItem('user_session');
  
  // 1. Jika belum login (tidak ada sesi), lempar kembali ke halaman Login
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // 2. Jika sudah login tapi rolenya tidak diizinkan mengakses halaman ini
    if (!allowedRoles.includes(user.role)) {
      // Tendang ke halaman utama masing-masing role agar tidak tersesat
      if (user.role === 'therapist') {
        return <Navigate to="/therapist" replace />;
      }
      if (user.role === 'admin') {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    // Jika data session corrupt/rusak, bersihkan dan tendang ke login
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // 3. Jika aman dan role sesuai, izinkan masuk (render komponen anaknya)
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTE (Tanpa Layout/Sidebar)
            ========================================== */}
        <Route path="/login" element={<Login />} />

        {/* ==========================================
            PROTECTED ROUTES KHUSUS THERAPIST / BIDAN
            ========================================== */}
        <Route 
          path="/therapist/*" 
          element={
            <ProtectedRoute allowedRoles={['therapist']}>
              <TherapistLayout>
                <Routes>
                  {/* Base path /therapist akan merender Dashboard Terapis */}
                  <Route path="/" element={<TherapistDashboard />} />
                  
                  {/* Anda bisa menambahkan halaman internal terapis lainnya di sini, contoh: */}
                  {/* <Route path="/history" element={<TherapistHistory />} /> */}
                </Routes>
              </TherapistLayout>
            </ProtectedRoute>
          } 
        />

        {/* ==========================================
            PROTECTED ROUTES KHUSUS ADMIN
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
                  <Route path="/settings" element={<Settings />} /> 
                  
                  {/* Catch-all jika route admin tidak ditemukan */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}