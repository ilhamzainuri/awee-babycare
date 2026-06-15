import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Activity,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  CalendarPlus,
  FileEdit,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import logo from "../assets/logo.jpg";

interface LayoutProps {
  children: React.ReactNode;
}

const therapistNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/therapist' },
  { icon: Calendar, label: 'Jadwal Saya', path: '/therapist/Schedule' },
  { icon: Activity, label: 'Pemeriksaan Klinis', path: '/therapist/start-service' },
  { icon: ClipboardList, label: 'Laporan Selesai', path: '/therapist/submit-report' },
  { icon: BarChart3, label: 'Reports', path: '/therapist/TherapistReport' },
  { icon: Settings, label: 'Settings', path: '/therapist/settings' }, // Path disesuaikan
];

// Helper untuk format UI Notifikasi Terapis
const getNotificationConfig = (type: string) => {
  switch (type) {
    case 'reservation':
      return {
        icon: CalendarPlus,
        color: "bg-tertiary-container/10 text-tertiary",
        title: "Reservasi Masuk"
      };
    case 'status_change':
      return {
        icon: Activity,
        color: "bg-primary-container/20 text-primary",
        title: "Perubahan Status Layanan"
      };
    case 'data_update':
      return {
        icon: FileEdit,
        color: "bg-secondary-container/20 text-secondary",
        title: "Perubahan Data"
      };
    default:
      return {
        icon: Info,
        color: "bg-surface-container text-on-surface",
        title: "Informasi Sistem"
      };
  }
};

export default function TherapistLayout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // State User Profile
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Therapist');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // State Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Ambil data user terapis dari Local Storage
  useEffect(() => {
    const loadUserData = () => {
      const sessionStr = localStorage.getItem('user_session');
      if (sessionStr) {
        try {
          const user = JSON.parse(sessionStr);
          if (user.id) setUserId(user.id); 
          if (user.username) setUserName(user.username);

          if (user.foto) {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
            const uploadsUrl = baseUrl.replace('/api', '/uploads');
            setUserPhoto(`${uploadsUrl}/${user.foto}`);
          } else {
            setUserPhoto(null);
          }
        } catch (error) {
          console.error("Gagal membaca session data");
        }
      }
    };

    loadUserData();
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, []);

  // Polling data notifikasi khusus terapis berdasarkan ID
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return; 

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
        const response = await fetch(`${baseUrl}/therapist_notifications.php?terapist_id=${userId}`);
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setNotifications(result.data.slice(0, 5)); 
          if (result.data.length > 0) {
            setHasNewNotifications(true);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data notifikasi", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
  };

  const ProfileImage = () => {
    if (userPhoto) {
      return <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />;
    }
    return <img src={`https://ui-avatars.com/api/?name=${userName}&background=random`} alt={userName} className="w-full h-full object-cover" />;
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-surface-container-lowest border-r border-surface-container-high transition-all sticky top-0 h-screen">
        <div className="p-8 border-b border-surface-container">
          {/* Tambahkan NavLink ke Settings jika area Profil di-klik */}
          <NavLink 
            to="/therapist/settings" 
            className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer"
            title="Buka Pengaturan Profil"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container flex items-center justify-center bg-surface-container-high">
              <ProfileImage />
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-sm capitalize">{userName}</h2>
              <p className="text-xs text-primary font-bold">Official Therapist</p>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {therapistNavItems.map((item) => (
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

          <div className="flex-1"></div>

          <NavLink
            to="/login"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-error hover:bg-error/10 font-medium mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </NavLink>
        </nav>
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

            <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
            <h1 className="text-lg font-black text-primary-container tracking-tight">
              Therapist Portal
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown Terapis */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setHasNewNotifications(false);
                }}
                className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all"
              >
                <Bell className="w-6 h-6" />
                {hasNewNotifications && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-warning rounded-full border-2 border-surface-container-lowest animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
                        <span className="font-extrabold text-sm text-on-surface">Pemberitahuan Baru</span>
                        <span className="text-[10px] bg-primary-container/10 text-primary-container font-black px-2 py-0.5 rounded-full">
                          TERBARU
                        </span>
                      </div>

                      <div className="max-h-[320px] overflow-y-auto divide-y divide-surface-container">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-on-surface-variant font-medium italic">
                            Belum ada pemberitahuan baru.
                          </div>
                        ) : (
                          notifications.map((notif, index) => {
                            const config = getNotificationConfig(notif.type); 
                            const Icon = config.icon;
                            const notifTime = new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                            return (
                              <NavLink
                                key={index}
                                to={notif.link || "/therapist"}
                                onClick={() => setIsNotificationOpen(false)}
                                className="p-4 hover:bg-surface-container-low transition-all text-left flex gap-3 items-start"
                              >
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", config.color)}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-black text-on-surface truncate">{config.title}</span>
                                    <span className="text-[9px] font-bold text-on-surface-variant shrink-0">{notifTime}</span>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant line-clamp-2 font-medium">
                                    {notif.message} 
                                  </p>
                                </div>
                              </NavLink>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* Foto Profil pada Header juga akan diarahkan ke Settings */}
            <NavLink to="/therapist/settings" title="Pengaturan Akun">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-surface-container-highest cursor-pointer hover:opacity-80 transition-all flex items-center justify-center bg-surface-container-high">
                <ProfileImage />
              </div>
            </NavLink>
          </div>
        </header>

        {/* Workspace Content Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32 md:pb-8">
            {children}
          </div>
        </div>

        {/* Bottom Navigation Khusus Mobile View */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-surface-container flex items-center justify-around px-4 z-40">
          {therapistNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 p-2 transition-all min-w-[72px]",
                isActive ? "text-primary font-bold" : "text-on-surface-variant"
              )}
            >
              <item.icon className={cn("w-6 h-6", location.pathname === item.path ? "fill-primary/10" : "")} />
              <span className="text-[11px] font-bold tracking-wide">{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/login"
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 text-error"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[11px] font-bold tracking-wide">Logout</span>
          </NavLink>
        </nav>
      </main>

      {/* Mobile Sidebar Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-surface-container-lowest shadow-2xl z-[70] md:hidden rounded-r-3xl flex flex-col py-8"
            >
              <div className="px-8 mb-8">
                <h1 className="text-xl font-black text-primary mb-6">Awee Therapist Portal</h1>
                {/* Tautan Profil di Mobile Drawer */}
                <NavLink 
                  to="/therapist/settings" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-4 bg-surface-container hover:bg-surface-container-high transition-colors rounded-2xl cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-surface-container-high border-2 border-primary/20">
                    <ProfileImage />
                  </div>
                  <div>
                    <h2 className="font-bold text-on-surface text-sm capitalize">{userName}</h2>
                    <p className="text-xs text-primary font-bold">On-Duty</p>
                  </div>
                </NavLink>
              </div>
              
              <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto pb-8">
                {therapistNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all",
                      isActive ? "bg-primary text-white font-bold shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                <div className="flex-1"></div>

                <NavLink
                  to="/login"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-error hover:bg-error/10 font-bold mt-auto"
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