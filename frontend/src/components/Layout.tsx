import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  ShieldCheck,
  BarChart3,
  History,
  Bell,
  Menu,
  Plus,
  CalendarPlus,
  Settings,
  LogOut,
  User, // Import icon User untuk fallback gambar
  CheckCircle2,
  FileEdit,
  Trash2,
  RefreshCw,
  Activity,
  Calendar1,
  
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import logo from "../assets/logo.jpg";
import { scheduler } from 'timers/promises';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar1, label: 'Schedules', path: '/admin-schedule'},
  { icon: Database, label: 'Master Data', path: '/master-data' },
  { icon: ShieldCheck, label: 'Verify', path: '/verify' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: History, label: 'Audit Log', path: '/audit-log' },
  { icon: Settings, label: 'Settings', path: '/settings' }, 
];

// Helper untuk format UI berdasarkan jenis Aksi
const getUiConfig = (aksi: string, tabel: string) => {
  switch (aksi) {
    case 'create':
      return {
        action: `Input ${tabel}`,
        icon: CheckCircle2,
        color: "bg-tertiary-container/10 text-tertiary",
        descriptionPrefix: "Menambahkan data baru di tabel"
      };
    case 'update':
      return {
        action: `Update ${tabel}`,
        icon: FileEdit,
        color: "bg-secondary-container/20 text-secondary",
        descriptionPrefix: "Memperbarui data di tabel"
      };
    case 'delete':
      return {
        action: `Hapus ${tabel}`,
        icon: Trash2,
        color: "bg-error-container/20 text-error",
        descriptionPrefix: "Menghapus data di tabel"
      };
    case 'restore':
      return {
        action: `Restore ${tabel}`,
        icon: RefreshCw,
        color: "bg-primary-container/20 text-primary",
        descriptionPrefix: "Mengembalikan data yang dihapus di tabel"
      };
    default:
      return {
        action: `Aktivitas ${tabel}`,
        icon: Activity,
        color: "bg-surface-container text-on-surface",
        descriptionPrefix: "Aktivitas pada tabel"
      };
  }
};

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // State untuk menyimpan data user yang sedang login
  const [userName, setUserName] = useState('Admin');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // Fungsi untuk memuat data user dari Local Storage
  useEffect(() => {
    const loadUserData = () => {
      const sessionStr = localStorage.getItem('user_session');
      if (sessionStr) {
        try {
          const user = JSON.parse(sessionStr);
          if (user.username) setUserName(user.username);

          // Cek apakah user punya foto di database
          if (user.foto) {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
            // Ubah path /api menjadi /uploads
            const uploadsUrl = baseUrl.replace('/api', '/uploads');
            setUserPhoto(`${uploadsUrl}/${user.foto}`);
          } else {
            setUserPhoto(null); // Kosongkan agar pakai fallback (inisial/icon)
          }
        } catch (error) {
          console.error("Gagal membaca session data");
        }
      }
    };

    loadUserData(); // Panggil saat pertama render

    // Listen event 'storage' agar layout ikut update kalau foto diganti di Settings.tsx
    window.addEventListener('storage', loadUserData);
    return () => {
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
  };

  // State untuk notifikasi dropdown
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);

  // Ambil data audit log terbaru untuk notifikasi
  useEffect(() => {
    const fetchRecentLogs = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
        const response = await fetch(`${baseUrl}/auditlog.php`);
        const result = await response.json();
        if (result.status === 200) {
          // Ambil 5 log terbaru saja
          setRecentLogs(result.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Gagal mengambil data log untuk notifikasi", error);
      }
    };

    fetchRecentLogs();
    
    // Polling setiap 30 detik
    const interval = setInterval(fetchRecentLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Komponen Helper untuk merender foto profil (mencegah kode berulang)
  const ProfileImage = () => {
    if (userPhoto) {
      return <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />;
    }
    // Fallback jika belum punya foto: Pakai inisial nama menggunakan ui-avatars
    return <img src={`https://ui-avatars.com/api/?name=${userName}&background=random`} alt={userName} className="w-full h-full object-cover" />;
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-surface-container-lowest border-r border-surface-container-high transition-all sticky top-0 h-screen">
        <div className="p-8 border-b border-surface-container">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container flex items-center justify-center bg-surface-container-high">
              {/* Render Foto User di Sini */}
              <ProfileImage />
            </div>
            <div>
              {/* Render Nama User di Sini */}
              <h2 className="font-bold text-on-surface text-sm capitalize">{userName}</h2>
              <p className="text-xs text-on-surface-variant">Awee Babycare</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-primary-container/10 text-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "fill-primary-container/20" : "")} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}

          <div className="flex-1 min-h-[2rem]"></div>

          <NavLink
            to="/login"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-error hover:bg-error/10 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </NavLink>
        </nav>

        <div className="p-4 mt-auto border-t border-surface-container">
          <NavLink
            to="/reservation"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-secondary-container text-on-secondary-container font-bold rounded-2xl hover:brightness-105 hover:scale-[1.02] active:scale-95 shadow-sm transition-all"
          >
            <CalendarPlus className="w-5 h-5" />
            <span>Book Reservation</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-container h-16 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-primary-container hover:bg-primary-container/10 rounded-full transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>

            <img
              src={logo}
              alt="Logo Admin"
              className="w-10 h-10 rounded-full object-cover"
            />

            <h1 className="text-xl font-bold text-primary-container tracking-tight">
              Admin
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setHasNewNotifications(false); // Hilangkan tanda notifikasi saat dibuka
                }}
                className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all"
              >
                <Bell className="w-6 h-6" />
                {hasNewNotifications && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    {/* Transparent Click-away Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationOpen(false)}
                    />
                    
                    {/* Dropdown Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                      {/* Header Dropdown */}
                      <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
                        <span className="font-extrabold text-sm text-on-surface">Notifikasi Aktivitas</span>
                        <span className="text-[10px] bg-primary-container/10 text-primary-container font-black px-2 py-0.5 rounded-full">
                          LENGKAP
                        </span>
                      </div>

                      {/* List Item Dropdown */}
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-surface-container">
                        {recentLogs.length === 0 ? (
                          <div className="p-8 text-center text-xs text-on-surface-variant font-medium">
                            Belum ada aktivitas terbaru.
                          </div>
                        ) : (
                          recentLogs.map((log) => {
                            const config = getUiConfig(log.aksi, log.nama_tabel);
                            const Icon = config.icon;
                            
                            // Hitung waktu relatif atau sederhana
                            const logTime = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                            
                            return (
                              <NavLink
                                key={log.id}
                                to="/audit-log"
                                onClick={() => setIsNotificationOpen(false)}
                                className="flex gap-3 p-4 hover:bg-surface-container-low transition-all text-left"
                              >
                                <div className={cn("w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs", config.color)}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className="text-xs font-black text-on-surface capitalize truncate">
                                      {log.user}
                                    </span>
                                    <span className="text-[9px] font-bold text-on-surface-variant shrink-0">
                                      {logTime}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant font-medium leading-normal line-clamp-2">
                                    {config.descriptionPrefix} <span className="font-bold capitalize">{log.nama_tabel}</span> (#ID:{log.record_id})
                                  </p>
                                </div>
                              </NavLink>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Dropdown */}
                      <NavLink
                        to="/audit-log"
                        onClick={() => setIsNotificationOpen(false)}
                        className="block w-full py-3.5 bg-surface-container text-center text-xs font-bold text-primary hover:bg-surface-container-high transition-all border-t border-surface-container"
                      >
                        Lihat Seluruh Audit Log
                      </NavLink>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <NavLink to="/settings">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-surface-container-highest cursor-pointer hover:opacity-80 transition-all flex items-center justify-center bg-surface-container-high">
                  {/* Render Foto User di Header */}
                  <ProfileImage />
                </div>
            </NavLink>
          </div>
        </header>

        {/* Konten */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8">
            {children}
          </div>
        </div>

        <NavLink
          to="/reservation"
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
        >
          <Plus className="w-8 h-8" />
        </NavLink>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-surface-container flex items-center justify-around px-2 z-40 overflow-x-auto">
          {navItems.filter(item => item.label !== 'Settings').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 p-2 transition-all min-w-[64px]",
                isActive ? "text-primary-container font-bold" : "text-on-surface-variant"
              )}
            >
              <item.icon className={cn("w-6 h-6", location.pathname === item.path ? "fill-primary-container/20" : "")} />
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
          <NavLink
            to="/reservation"
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 transition-all min-w-[64px]",
              isActive ? "text-primary-container font-bold" : "text-on-surface-variant"
            )}
          >
            <CalendarPlus className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Book</span>
          </NavLink>
        </nav>
      </main>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-surface-container-lowest shadow-2xl z-[70] md:hidden rounded-r-3xl flex flex-col py-8"
            >
              <div className="px-8 mb-8">
                <h1 className="text-2xl font-bold text-primary-container mb-6">Awee Babycare Admin</h1>
                <div className="flex items-center gap-4 p-4 bg-surface-container rounded-2xl">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-surface-container-high border-2 border-primary/20">
                    {/* Render Foto User di Drawer Mobile */}
                    <ProfileImage />
                  </div>
                  <div>
                    {/* Render Nama User di Drawer Mobile */}
                    <h2 className="font-bold text-on-surface text-sm capitalize">{userName}</h2>
                    <p className="text-xs text-on-surface-variant">Awee Babycare</p>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto pb-8">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all",
                      isActive ? "bg-primary-container text-on-primary font-bold shadow-lg shadow-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                <div className="flex-1 min-h-[2rem]"></div>

                <NavLink
                  to="/login"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-error hover:bg-error/10 font-bold"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Logout</span>
                </NavLink>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}