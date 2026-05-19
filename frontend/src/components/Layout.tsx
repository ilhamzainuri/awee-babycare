import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import logo from "../assets/logo.jpg";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Database, label: 'Master Data', path: '/master-data' },
  { icon: ShieldCheck, label: 'Verify', path: '/verify' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: History, label: 'Audit Log', path: '/audit-log' },
];

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar (Diubah menjadi sticky, top-0, dan h-screen) */}
      <aside className="hidden md:flex flex-col w-72 bg-surface-container-lowest border-r border-surface-container-high transition-all sticky top-0 h-screen">
        <div className="p-8 border-b border-surface-container">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container">
              {/* TODO: Ganti sama foto user yang login */}
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71f153282a?auto=format&fit=crop&q=80&w=200"
                alt="Foto Admin"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              {/* TODO: Ganti sama user yang login */}
              <h2 className="font-bold text-on-surface text-sm">Nama user</h2>
              <p className="text-xs text-on-surface-variant">Awee Babycare</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
        </nav>

        {/* Tombol Book - Desktop */}
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

            {/* Logo */}
            <img
              src={logo}
              alt="Logo Admin"
              className="w-10 h-10 rounded-full object-cover"
            />

            <h1 className="text-xl font-bold text-primary-container tracking-tight">
              Admin
            </h1>
          </div>

          {/*fungsi bell belum jalan*/}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-surface-container-highest cursor-pointer hover:opacity-80 transition-all">
              {/*ganti sama foto user yang login*/}
              <img
                src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=150"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Konten */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8">
            {children}
          </div>
        </div>

        {/* Tombol Aaction - Mobile */}
        <NavLink
          to="/reservation"
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
        >
          <Plus className="w-8 h-8" />
        </NavLink>

        {/*Navigation bawah - Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-surface-container flex items-center justify-around px-2 z-40">
          {navItems.map((item) => (
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
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {/* TODO: Ganti sama foto user yang login */}
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71f153282a?auto=format&fit=crop&q=80&w=200"
                      alt="Foto User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    {/* TODO: Ganti sama user yang login */}
                    <h2 className="font-bold text-on-surface text-sm">Nama user</h2>
                    <p className="text-xs text-on-surface-variant">Awee Babycare</p>
                  </div>
                </div>
              </div>
              <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
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
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}