import React, { useState, useEffect } from 'react';
import {
  Calendar, Search, Phone, MapPin,
  Baby, Receipt, X, Eye, CalendarDays, ExternalLink, MessageCircle, Clock, ShieldAlert,
  Edit3, Save, Loader2, Ban, AlertTriangle, RotateCcw, CheckCircle2, Lock, AlertOctagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  'Menunggu': { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  'Diproses': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  'Selesai': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  'Dibatalkan': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', dot: 'bg-red-500' }
};

const CANCEL_REASONS = [
  'Permintaan Pasien / Ortu',
  'Pasien Sakit / Berhalangan',
  'Terapis Berhalangan',
  'Jadwal Dobel / Salah Input',
  'Kendala Lokasi / Cuaca',
  'Lainnya'
];

export default function AdminSchedules() {
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTherapist, setFilterTherapist] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Detail & Reschedule State
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    status: 'Menunggu',
    reason: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal Konfirmasi Pembatalan State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Ambil current user session untuk keperluan Audit Log
  const getUserSession = () => {
    try {
      const sessionStr = localStorage.getItem('user_session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch {
      return null;
    }
  };

  const fetchSchedules = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      const response = await fetch(`${baseUrl}/admin_schedules.php?date=${activeDate}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
      if (!response.ok) throw new Error('Gagal memuat jadwal terapis');
      const result = await response.json();

      if (result.status === 200) {
        setSchedules(result.data || []);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSchedules(true);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [activeDate, searchQuery, statusFilter]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
        const response = await fetch(`${baseUrl}/admin_schedules.php?date=${activeDate}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
        const result = await response.json();
        if (result.status === 200) {
          setSchedules(result.data || []);
        }
      } catch (err) {
        console.error("Real-time polling schedules error:", err);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeDate, searchQuery, statusFilter]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const totalCount = schedules.length;
  const waitingCount = schedules.filter(s => s.status_jadwal === 'Menunggu').length;
  const processCount = schedules.filter(s => s.status_jadwal === 'Diproses').length;
  const completedCount = schedules.filter(s => s.status_jadwal === 'Selesai').length;
  const canceledCount = schedules.filter(s => s.status_jadwal === 'Dibatalkan').length;

  const handleCloseModal = () => {
    setSelectedSchedule(null);
    setIsEditingSchedule(false);
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  const handleOpenEdit = () => {
    if (!selectedSchedule) return;
    
    // Aturan bisnis: Jika status sudah 'Selesai', tidak bisa di-reschedule lagi
    if (selectedSchedule.status_jadwal === 'Selesai') {
      toast.error("Layanan yang sudah 'Selesai' tidak dapat di-reschedule lagi.");
      return;
    }

    const datetimeString = selectedSchedule.waktu_reservasi || '';
    const [datePart, timePart] = datetimeString.split(' ');

    setEditForm({
      date: datePart || activeDate,
      time: timePart ? timePart.substring(0, 5) : selectedSchedule.jam_reservasi || '',
      status: selectedSchedule.status_jadwal || 'Menunggu',
      reason: ''
    });
    setIsEditingSchedule(true);
  };

  // Simpan perubahan dari box Reschedule
  const submitReschedule = async () => {
    if (!selectedSchedule) return;

    if (selectedSchedule.status_jadwal === 'Selesai') {
      toast.error("Layanan yang sudah 'Selesai' tidak dapat diubah lagi.");
      return;
    }

    if (!editForm.date || !editForm.time) {
      toast.error("Tanggal dan waktu tidak boleh kosong.");
      return;
    }

    setIsUpdating(true);
    try {
      const currentUser = getUserSession();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      const response = await fetch(`${baseUrl}/update_schedule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trx_id: selectedSchedule.id,
          new_date: editForm.date,
          new_time: editForm.time,
          status_jadwal: editForm.status,
          alasan_batal: editForm.status === 'Dibatalkan' ? (editForm.reason || 'Dibatalkan saat reschedule') : '',
          user_id: currentUser?.id || 1
        })
      });

      const result = await response.json();
      
      if (result.status === 200) {
        toast.success(result.message || "Jadwal berhasil diperbarui!");
        
        const newWaktuReservasi = `${editForm.date} ${editForm.time}:00`;
        const updatedStatus = editForm.status;

        // Update state jadwal utama
        setSchedules(prev => {
          if (editForm.date !== activeDate) {
            return prev.filter(s => s.id !== selectedSchedule.id);
          }
          return prev.map(s => s.id === selectedSchedule.id ? {
            ...s,
            waktu_reservasi: newWaktuReservasi,
            jam_reservasi: editForm.time,
            status_jadwal: updatedStatus,
            catatan_terapis: result.data?.catatan_terapis || s.catatan_terapis
          } : s);
        });

        // Update data di modal yang terbuka
        setSelectedSchedule((prev: any) => ({
          ...prev,
          waktu_reservasi: newWaktuReservasi,
          jam_reservasi: editForm.time,
          status_jadwal: updatedStatus,
          catatan_terapis: result.data?.catatan_terapis || prev.catatan_terapis
        }));

        setIsEditingSchedule(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast.error(`Gagal merubah jadwal: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Ubah status cepat ('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan')
  const handleUpdateStatus = async (newStatus: string, reason = '') => {
    if (!selectedSchedule) return;

    // Aturan bisnis: Jika status saat ini sudah 'Selesai', tidak bisa diubah lagi
    if (selectedSchedule.status_jadwal === 'Selesai') {
      toast.error("Layanan yang sudah 'Selesai' tidak dapat diubah statusnya lagi.");
      return;
    }

    // Jika ingin membatalkan, arahkan ke modal konfirmasi pembatalan khusus
    if (newStatus === 'Dibatalkan') {
      setCancelReason('');
      setIsCancelModalOpen(true);
      return;
    }

    setIsUpdating(true);
    try {
      const currentUser = getUserSession();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      const response = await fetch(`${baseUrl}/update_schedule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trx_id: selectedSchedule.id,
          status_jadwal: newStatus,
          alasan_batal: reason,
          user_id: currentUser?.id || 1
        })
      });

      const result = await response.json();
      if (result.status === 200) {
        toast.success(result.message || `Status jadwal diubah menjadi ${newStatus}`);

        // Update list
        setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? {
          ...s,
          status_jadwal: newStatus,
          catatan_terapis: result.data?.catatan_terapis || s.catatan_terapis
        } : s));

        // Update modal
        setSelectedSchedule((prev: any) => ({
          ...prev,
          status_jadwal: newStatus,
          catatan_terapis: result.data?.catatan_terapis || prev.catatan_terapis
        }));
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(`Gagal mengubah status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Eksekusi Pembatalan Layanan
  const submitCancellation = async () => {
    if (!selectedSchedule) return;

    if (selectedSchedule.status_jadwal === 'Selesai') {
      toast.error("Layanan yang sudah 'Selesai' tidak dapat dibatalkan.");
      return;
    }

    setIsCancelling(true);
    try {
      const currentUser = getUserSession();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      const response = await fetch(`${baseUrl}/update_schedule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trx_id: selectedSchedule.id,
          status_jadwal: 'Dibatalkan',
          alasan_batal: cancelReason.trim() || 'Dibatalkan oleh Admin',
          user_id: currentUser?.id || 1
        })
      });

      const result = await response.json();
      if (result.status === 200) {
        toast.success(result.message || "Layanan berhasil dibatalkan!");

        // Update data list
        setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? {
          ...s,
          status_jadwal: 'Dibatalkan',
          catatan_terapis: result.data?.catatan_terapis || s.catatan_terapis
        } : s));

        // Update modal
        setSelectedSchedule((prev: any) => ({
          ...prev,
          status_jadwal: 'Dibatalkan',
          catatan_terapis: result.data?.catatan_terapis || prev.catatan_terapis
        }));

        setIsCancelModalOpen(false);
        setCancelReason('');
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(`Gagal membatalkan layanan: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 relative text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary-container" />
            Monitoring Jadwal Terapis
          </h1>
          <p className="text-on-surface-variant mt-1">
            Pantau seluruh kunjungan bidan & terapis secara real-time, atur reschedule, dan kelola status pembatalan layanan.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="p-4 rounded-3xl border border-surface-container-high bg-surface-container-lowest flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Hari Ini</span>
          <h2 className="text-2xl md:text-3xl font-black text-on-surface mt-2">{totalCount}</h2>
        </div>
        <div className="p-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Menunggu
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-amber-700 mt-2">{waitingCount}</h2>
        </div>
        <div className="p-4 rounded-3xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Diproses
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-blue-700 mt-2">{processCount}</h2>
        </div>
        <div className="p-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Selesai
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-emerald-700 mt-2">{completedCount}</h2>
        </div>
        <div className="p-4 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Dibatalkan
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-red-700 mt-2">{canceledCount}</h2>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-surface-container-low p-4 rounded-3xl shadow-inner">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama Pasien, terapis, atau ID TRX..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container outline-none font-bold text-on-surface-variant cursor-pointer transition-all"
            />
          </div>
        </div>

        <div className="flex bg-surface-container-lowest border border-surface-container p-1.5 rounded-2xl gap-1 overflow-x-auto">
          {['All', 'Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                statusFilter === status
                  ? "bg-primary-container text-on-primary-container shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Schedules List Grid */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-surface-container border-t-primary"></div>
          <span className="text-on-surface-variant font-bold text-sm">Menyelaraskan data jadwal...</span>
        </div>
      ) : error ? (
        <div className="p-5 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3 shadow-sm">
          <ShieldAlert className="w-6 h-6" />
          <span className="font-bold text-sm">Gagal memuat jadwal: {error}</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container p-16 text-center rounded-[2.5rem] shadow-sm">
          <CalendarDays className="w-20 h-20 text-outline-variant mx-auto mb-5 opacity-40" />
          <h3 className="text-xl font-black text-on-surface">Tidak Ada Jadwal</h3>
          <p className="text-on-surface-variant text-sm mt-2 max-w-md mx-auto">
            Tidak ditemukan jadwal pelayanan bidan/terapis untuk filter pencarian dan tanggal yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {schedules.map((item) => {
              const statusStyle = STATUS_COLORS[item.status_jadwal] || STATUS_COLORS['Menunggu'];
              const isItemCompleted = item.status_jadwal === 'Selesai';
              const isItemCanceled = item.status_jadwal === 'Dibatalkan';

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className={cn(
                    "bg-surface-container-lowest border border-surface-container rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group",
                    isItemCanceled && "border-red-500/20 bg-red-500/[0.015]",
                    isItemCompleted && "border-emerald-500/20"
                  )}
                >
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5", statusStyle.dot)} />
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">#TRX-{item.id}</p>
                        <p className="text-sm font-bold text-on-surface-variant mt-1 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {item.jam_reservasi}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isItemCompleted && (
                          <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-600" title="Terkunci: Sudah Selesai">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider shrink-0 flex items-center gap-1.5",
                          statusStyle.bg, statusStyle.text, statusStyle.border
                        )}>
                          {item.status_jadwal === 'Diproses' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          {item.status_jadwal}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pasien</span>
                        <h4 className={cn(
                          "font-black text-lg text-on-surface truncate mt-0.5",
                          isItemCanceled && "line-through text-on-surface/60"
                        )}>
                          {item.nama_pasien}
                        </h4>
                        <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
                          Usia: {item.usia_saat_ini || '-'} • BB: {item.bb_saat_ini ? `${item.bb_saat_ini} kg` : '-'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 p-3.5 bg-surface-container-low rounded-2xl border border-surface-container">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0">
                          {item.initials || <Baby className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Terapis Bertugas</span>
                          <span className="font-extrabold text-sm text-on-surface truncate block">{item.nama_terapis}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Layanan</span>
                          {item.jenis_layanan && (
                            <span className={cn(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                              item.jenis_layanan.toLowerCase().includes('outlet') && item.jenis_layanan.toLowerCase().includes('homecare')
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                : item.jenis_layanan.toLowerCase().includes('outlet')
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            )}>
                              {item.jenis_layanan}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.services && item.services.map((srv: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-tertiary-container/10 border border-tertiary/10 text-tertiary font-bold text-[10px] rounded-lg">
                              {srv.nama_layanan}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-on-surface-variant pt-1">
                        <MapPin className="w-3.5 h-3.5 text-outline mt-0.5 shrink-0" />
                        <span className="line-clamp-1 font-medium">{item.lokasi_kunjungan || item.alamat_lengkap}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-surface-container flex gap-3">
                    <button
                      onClick={() => setSelectedSchedule(item)}
                      className={cn(
                        "flex-1 py-2.5 px-4 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2",
                        isItemCompleted
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/20"
                          : isItemCanceled
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20"
                          : "bg-primary-container/10 hover:bg-primary-container/20 text-primary-container"
                      )}
                    >
                      <Eye className="w-4 h-4" /> 
                      {isItemCompleted ? "Detail Pelayanan (Selesai)" : "Detail dan Reschedule"}
                    </button>
                    {item.link_shareloc && item.link_shareloc !== '-' && (
                      <a
                        href={item.link_shareloc}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-secondary-container/10 hover:bg-secondary-container/20 text-secondary border border-secondary/15 rounded-xl text-xs transition-all flex items-center justify-center"
                        title="Buka Peta Shareloc"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <a
                      href={`https://wa.me/${item.no_hp_ortu.replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] border border-[#CEEAD6]/20 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                      title="Hubungi Orang Tua"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ==========================================
          MODAL DETAIL JADWAL KUNJUNGAN & RESCHEDULE
          ========================================== */}
      <AnimatePresence>
        {selectedSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl flex flex-col hide-scrollbar"
            >
              {/* Header Modal */}
              <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur-md px-6 py-5 border-b border-surface-container flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-on-surface tracking-tight flex items-center gap-2">
                    Detail Pelayanan <span className="px-2 py-1 bg-primary-container/10 text-primary-container rounded-lg text-sm">#TRX-{selectedSchedule.id}</span>
                  </h2>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider flex items-center gap-1.5",
                    STATUS_COLORS[selectedSchedule.status_jadwal]?.bg,
                    STATUS_COLORS[selectedSchedule.status_jadwal]?.text,
                    STATUS_COLORS[selectedSchedule.status_jadwal]?.border
                  )}>
                    {selectedSchedule.status_jadwal === 'Selesai' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {selectedSchedule.status_jadwal === 'Dibatalkan' && <Ban className="w-3.5 h-3.5" />}
                    {selectedSchedule.status_jadwal}
                  </span>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Isi Modal */}
              <div className="p-6 md:p-8 space-y-6 text-sm text-left">

                {/* Banner Jika Status 'Selesai' (Terkunci) */}
                {selectedSchedule.status_jadwal === 'Selesai' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start sm:items-center gap-3 text-emerald-800"
                  >
                    <div className="p-2 bg-emerald-500/20 text-emerald-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Layanan Telah Selesai Dilaksanakan (Terkunci)</p>
                      <p className="text-xs text-emerald-700/80 mt-0.5">
                        Jadwal dan status telah terkunci permanen demi integritas laporan & komisi. Layanan ini tidak dapat di-reschedule ataupun dibatalkan lagi.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Banner Jika Status 'Dibatalkan' */}
                {selectedSchedule.status_jadwal === 'Dibatalkan' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-500/20 text-red-600 rounded-xl shrink-0 mt-0.5">
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm">Layanan Ini Telah Dibatalkan</p>
                        <p className="text-xs text-red-600/80 mt-0.5">
                          Slot waktu terapis telah dibebaskan dan transaksi ini dikecualikan dari perhitungan omzet & komisi laporan.
                        </p>
                        {selectedSchedule.catatan_terapis && (
                          <div className="mt-2 text-xs bg-red-500/15 p-2.5 rounded-xl font-medium whitespace-pre-line text-red-800 border border-red-500/20">
                            {selectedSchedule.catatan_terapis}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateStatus('Menunggu')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Pulihkan Jadwal
                    </button>
                  </motion.div>
                )}

                {/* Reschedule Box (Hanya Muncul Saat Mode Edit) */}
                <AnimatePresence>
                  {isEditingSchedule && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-primary-container/10 border border-primary-container/20 p-5 rounded-2xl overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarDays className="w-5 h-5 text-primary-container" />
                        <h3 className="font-bold text-primary-container text-base">Atur Ulang Jadwal & Status (Reschedule)</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant mb-1.5 block">Tanggal Baru</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full p-3 bg-surface-container-lowest border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant mb-1.5 block">Waktu Baru</label>
                          <input
                            type="time"
                            value={editForm.time}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            className="w-full p-3 bg-surface-container-lowest border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant mb-1.5 block">Status Jadwal</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full p-3 bg-surface-container-lowest border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container transition-all font-bold text-on-surface"
                          >
                            <option value="Menunggu">Menunggu</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                        </div>
                      </div>

                      {/* Input Alasan Pembatalan Tambahan jika status dipilih Dibatalkan */}
                      {editForm.status === 'Dibatalkan' && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                          <label className="text-xs font-bold text-red-600 block">Alasan Pembatalan Layanan</label>
                          <input
                            type="text"
                            placeholder="Tulis alasan pembatalan..."
                            value={editForm.reason}
                            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                            className="w-full p-2.5 bg-surface-container-lowest border border-red-500/30 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setIsEditingSchedule(false)}
                          className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-sm font-bold hover:bg-surface-container-high transition-all"
                          disabled={isUpdating}
                        >
                          Batal
                        </button>
                        <button
                          onClick={submitReschedule}
                          className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Simpan Perubahan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kiri: Info Pasien & Lokasi */}
                  <div className="space-y-6">
                    {/* Data Pasien */}
                    <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                      <div className="flex items-center gap-2 border-b border-surface-container pb-3 mb-4">
                        <Baby className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-on-surface text-base">Data Pasien</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Nama Pasien</span>
                          <span className={cn(
                            "font-black text-on-surface text-base",
                            selectedSchedule.status_jadwal === 'Dibatalkan' && "line-through text-on-surface/70"
                          )}>
                            {selectedSchedule.nama_pasien}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Gender</span>
                            <span className="font-semibold text-on-surface">{selectedSchedule.jenis_kelamin}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Usia</span>
                            <span className="font-semibold text-on-surface">{selectedSchedule.usia_saat_ini || '-'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">No. WhatsApp Ortu</span>
                          <span className="font-semibold text-on-surface flex items-center gap-2">
                            {selectedSchedule.no_hp_ortu}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 bg-surface-container p-3 rounded-xl">
                          <div>
                            <span className="text-on-surface-variant text-[10px] uppercase font-bold block">BB (Admin)</span>
                            <span className="font-black text-on-surface">{selectedSchedule.bb_saat_ini ? `${selectedSchedule.bb_saat_ini} kg` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[10px] uppercase font-bold block">BB (Terapis)</span>
                            <span className="font-black text-primary">{selectedSchedule.bb_real_terapis ? `${selectedSchedule.bb_real_terapis} kg` : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lokasi & Keluhan */}
                    <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                      <div className="flex items-center justify-between border-b border-surface-container pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-tertiary" />
                          <h3 className="font-bold text-on-surface text-base">Lokasi & Keluhan</h3>
                        </div>
                        {selectedSchedule.jenis_layanan && (
                          <span className={cn(
                            "text-xs font-black px-3 py-1 rounded-full border tracking-wide uppercase",
                            selectedSchedule.jenis_layanan.toLowerCase().includes('outlet') && selectedSchedule.jenis_layanan.toLowerCase().includes('homecare')
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                              : selectedSchedule.jenis_layanan.toLowerCase().includes('outlet')
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}>
                            Pelayanan: {selectedSchedule.jenis_layanan}
                          </span>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block mb-1">
                            Lokasi / Alamat Kunjungan
                          </span>
                          <p className="font-bold text-on-surface leading-relaxed text-sm bg-surface-container p-3 rounded-xl border border-surface-container-high/50">
                            {selectedSchedule.lokasi_kunjungan || selectedSchedule.alamat_lengkap}
                          </p>
                          {selectedSchedule.jenis_layanan?.toLowerCase().includes('outlet') && selectedSchedule.alamat_lengkap && (
                            <p className="text-[11px] text-on-surface-variant mt-1.5 italic">
                              * Alamat domisili pasien: {selectedSchedule.alamat_lengkap}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block mb-1">Keluhan Awal</span>
                          <p className="font-medium text-on-surface bg-surface-container p-3 rounded-xl text-sm border border-surface-container-high/50">
                            {selectedSchedule.keluhan_awal || 'Tidak ada keluhan.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kanan: Penugasan & Pembatalan / Status */}
                  <div className="space-y-6">
                    <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container h-full flex flex-col">
                      <div className="flex items-center justify-between border-b border-surface-container pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-secondary" />
                          <h3 className="font-bold text-on-surface text-base">Penugasan & Biaya</h3>
                        </div>

                        {/* Tombol Aksi di Header Penugasan */}
                        <div className="flex items-center gap-2">
                          {selectedSchedule.status_jadwal === 'Selesai' ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-500/20">
                              <Lock className="w-3.5 h-3.5" /> Selesai & Terkunci
                            </span>
                          ) : (
                            <>
                              {!isEditingSchedule && (
                                <button
                                  onClick={handleOpenEdit}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container/10 text-primary-container hover:bg-primary-container/20 rounded-xl text-xs font-bold transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Reschedule
                                </button>
                              )}

                              {selectedSchedule.status_jadwal !== 'Dibatalkan' ? (
                                <button
                                  onClick={() => {
                                    setCancelReason('');
                                    setIsCancelModalOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition-colors"
                                >
                                  <Ban className="w-3.5 h-3.5" /> Batalkan
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus('Menunggu')}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3 p-3 bg-secondary-container/10 rounded-xl border border-secondary-container/20">
                          <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm">
                            {selectedSchedule.initials || <Baby className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[10px] uppercase tracking-wider font-bold block">Terapis Bertugas</span>
                            <span className="font-black text-on-surface text-base">{selectedSchedule.nama_terapis}</span>
                          </div>
                        </div>

                        {/* Pengubah Status Jadwal Langsung */}
                        <div className="bg-surface-container p-3.5 rounded-xl border border-surface-container-high/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">
                              Ubah Status Jadwal
                            </span>
                            {selectedSchedule.status_jadwal === 'Selesai' && (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Terkunci
                              </span>
                            )}
                          </div>

                          {selectedSchedule.status_jadwal === 'Selesai' ? (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-700 flex items-center justify-between">
                              <span>Status: Selesai</span>
                              <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded">Terkunci</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {(['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'] as const).map((status) => {
                                const isCurrent = selectedSchedule.status_jadwal === status;
                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleUpdateStatus(status)}
                                    disabled={isUpdating || isCurrent}
                                    className={cn(
                                      "py-2 px-2 rounded-lg text-xs font-bold transition-all border text-center",
                                      isCurrent
                                        ? status === 'Dibatalkan'
                                          ? "bg-red-600 text-white border-red-600 shadow-sm"
                                          : status === 'Selesai'
                                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                          : status === 'Diproses'
                                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                          : "bg-amber-600 text-white border-amber-600 shadow-sm"
                                        : "bg-surface-container-lowest text-on-surface hover:bg-surface-container border-surface-container-high"
                                    )}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Waktu Reservasi</span>
                            <span className="font-black text-on-surface">{selectedSchedule.waktu_reservasi}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Status Jadwal</span>
                            <span className={cn(
                              "font-black uppercase inline-flex items-center gap-1",
                              STATUS_COLORS[selectedSchedule.status_jadwal]?.text
                            )}>
                              {selectedSchedule.status_jadwal}
                            </span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Bayar (Admin)</span>
                            <span className="font-semibold text-on-surface">{selectedSchedule.metode_bayar_admin}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Bayar (Terapis)</span>
                            <span className="font-semibold text-on-surface">{selectedSchedule.metode_bayar_terapis || '-'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Status Verifikasi</span>
                          <span className={cn(
                            "inline-block mt-1 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider",
                            selectedSchedule.status_pembayaran === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {selectedSchedule.status_pembayaran}
                          </span>
                        </div>
                      </div>

                      {/* Rincian Layanan & Harga */}
                      <div className="border-t border-surface-container pt-4 mt-4">
                        <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block mb-2">Rincian Layanan</span>
                        <div className="space-y-2 mb-4">
                          {selectedSchedule.services && selectedSchedule.services.map((srv: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm bg-surface-container p-2.5 rounded-xl">
                              <span className="font-semibold text-on-surface">{srv.nama_layanan}</span>
                              <span className="font-bold text-on-surface-variant">{formatRupiah(srv.harga_snapshot)}</span>
                            </div>
                          ))}
                        </div>

                        <div className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border transition-all",
                          selectedSchedule.status_jadwal === 'Dibatalkan'
                            ? "bg-red-500/10 border-red-500/20 opacity-80"
                            : "bg-primary-container/15 border-primary-container/20"
                        )}>
                          <div>
                            <span className="text-[11px] text-primary-container font-black uppercase tracking-wider block">
                              Total Biaya {selectedSchedule.status_jadwal === 'Dibatalkan' && "(Dibatalkan)"}
                            </span>
                            <h4 className={cn(
                              "text-xl font-black mt-0.5",
                              selectedSchedule.status_jadwal === 'Dibatalkan' ? "text-red-700 line-through" : "text-primary-container"
                            )}>
                              {formatRupiah(selectedSchedule.total_harga_kunjungan)}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Komisi Terapis</span>
                            <span className={cn(
                              "text-base font-black",
                              selectedSchedule.status_jadwal === 'Dibatalkan' ? "text-red-600 line-through" : "text-secondary"
                            )}>
                              {formatRupiah(selectedSchedule.total_komisi_kunjungan)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL KONFIRMASI PEMBATALAN LAYANAN
          ========================================== */}
      <AnimatePresence>
        {isCancelModalOpen && selectedSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !isCancelling && setIsCancelModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-red-500/20 text-left space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface tracking-tight">Batalkan Jadwal Layanan</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Konfirmasi pembatalan kunjungan <span className="font-bold text-red-600">#TRX-{selectedSchedule.id}</span>
                  </p>
                </div>
              </div>

              {/* Ringkasan Singkat Jadwal */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Pasien:</span>
                  <span className="font-extrabold text-on-surface">{selectedSchedule.nama_pasien}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Terapis:</span>
                  <span className="font-bold text-on-surface">{selectedSchedule.nama_terapis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Waktu:</span>
                  <span className="font-bold text-on-surface">{selectedSchedule.waktu_reservasi}</span>
                </div>
                <div className="flex justify-between border-t border-surface-container pt-2 mt-2">
                  <span className="text-on-surface-variant">Total Biaya:</span>
                  <span className="font-black text-red-600">{formatRupiah(selectedSchedule.total_harga_kunjungan)}</span>
                </div>
              </div>

              {/* Pilihan Cepat Alasan Pembatalan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface block">
                  Pilih Alasan Pembatalan (Opsional):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CANCEL_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReason(reason)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
                        cancelReason === reason
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-surface-container text-on-surface-variant border-surface-container hover:bg-surface-container-high"
                      )}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Detail Alasan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant block">
                  Catatan Pembatalan Tambahan:
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Pasien mendadak demam tinggi dan minta dibatalkan..."
                  className="w-full p-3 bg-surface-container-lowest border border-surface-container rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-on-surface transition-all"
                />
              </div>

              {/* Peringatan Dampak */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-700">
                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="leading-relaxed">
                  Jadwal ini akan berstatus <strong>Dibatalkan</strong>. Slot terapis akan dibebaskan kembali dan transaksi ini dikecualikan dari omzet & komisi laporan. Aktivitas dicatat ke Audit Log.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2.5 bg-surface-container text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={submitCancellation}
                  disabled={isCancelling}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20"
                >
                  {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Ya, Batalkan Layanan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}