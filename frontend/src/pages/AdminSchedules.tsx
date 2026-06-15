import React, { useState, useEffect } from 'react';
import {
  Calendar, Search, Phone, MapPin,
  Baby, Receipt, X, Eye, CalendarDays, ExternalLink, MessageCircle, Clock, ShieldAlert, Edit3, Save, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Catatan: Jika error, ubah kembali ke 'motion/react' sesuai versi Framer Motion Anda
import { motion, AnimatePresence } from 'framer-motion';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  'Menunggu': { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  'Diproses': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  'Selesai': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  'Dibatalkan': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', dot: 'bg-red-500' }
};

export default function AdminSchedules() {
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editForm, setEditForm] = useState({ date: '', time: '' });
  const [isUpdating, setIsUpdating] = useState(false);

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
  const processCount = schedules.filter(s => s.status_jadwal === 'Diproses').length;
  const completedCount = schedules.filter(s => s.status_jadwal === 'Selesai').length;
  const waitingCount = schedules.filter(s => s.status_jadwal === 'Menunggu').length;

  const handleCloseModal = () => {
    setSelectedSchedule(null);
    setIsEditingSchedule(false);
  };

  const handleOpenEdit = () => {
    const datetimeString = selectedSchedule.waktu_reservasi || '';
    const [datePart, timePart] = datetimeString.split(' ');

    setEditForm({
      date: datePart || activeDate,
      time: timePart ? timePart.substring(0, 5) : selectedSchedule.jam_reservasi || ''
    });
    setIsEditingSchedule(true);
  };

  const submitReschedule = async () => {
    if (!editForm.date || !editForm.time) {
      alert("Tanggal dan waktu tidak boleh kosong.");
      return;
    }

    setIsUpdating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      const response = await fetch(`${baseUrl}/update_schedule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trx_id: selectedSchedule.id,
          new_date: editForm.date,
          new_time: editForm.time
        })
      });

      const result = await response.json();
      if (result.status === 200) {
        // PERBAIKAN: Update state lokal secara optimis agar UI langsung berubah
        const newWaktuReservasi = `${editForm.date} ${editForm.time}:00`;

        // 1. Update data pada state jadwal utama
        setSchedules(prev => {
          // Jika dipindah ke tanggal lain, hilangkan dari layar hari ini
          if (editForm.date !== activeDate) {
            return prev.filter(s => s.id !== selectedSchedule.id);
          }
          // Jika masih di hari yang sama, update datanya
          return prev.map(s => s.id === selectedSchedule.id ? {
            ...s,
            waktu_reservasi: newWaktuReservasi,
            jam_reservasi: editForm.time
          } : s);
        });

        // 2. Update data di Modal yang sedang terbuka
        setSelectedSchedule((prev: any) => ({
          ...prev,
          waktu_reservasi: newWaktuReservasi,
          jam_reservasi: editForm.time
        }));

        setIsEditingSchedule(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      alert(`Gagal merubah jadwal: ${error.message}`);
    } finally {
      setIsUpdating(false);
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
            Pantau seluruh kunjungan bidan & terapis secara real-time dan kelola pembagian jadwal.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="p-5 rounded-3xl border border-surface-container-high bg-surface-container-lowest flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Hari Ini</span>
          <h2 className="text-3xl font-black text-on-surface mt-2">{totalCount}</h2>
        </div>
        <div className="p-5 rounded-3xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Diproses
          </span>
          <h2 className="text-3xl font-black text-blue-700 mt-2">{processCount}</h2>
        </div>
        <div className="p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            Selesai
          </span>
          <h2 className="text-3xl font-black text-emerald-700 mt-2">{completedCount}</h2>
        </div>
        <div className="p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            Menunggu
          </span>
          <h2 className="text-3xl font-black text-amber-700 mt-2">{waitingCount}</h2>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-surface-container-low p-4 rounded-3xl shadow-inner">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama anak, terapis, atau ID TRX..."
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
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
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
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
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
                      <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider shrink-0 flex items-center gap-1.5", statusStyle.bg, statusStyle.text, statusStyle.border)}>
                        {item.status_jadwal === 'Diproses' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        {item.status_jadwal}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pasien Anak</span>
                        <h4 className="font-black text-lg text-on-surface truncate mt-0.5">{item.nama_anak}</h4>
                        <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Usia: {item.usia_saat_ini || '-'} • BB: {item.bb_saat_ini ? `${item.bb_saat_ini} kg` : '-'}</p>
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
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Layanan</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.services && item.services.map((srv: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-tertiary-container/10 border border-tertiary/10 text-tertiary font-bold text-[10px] rounded-lg">
                              {srv.nama_layanan}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-surface-container flex gap-3">
                    <button
                      onClick={() => setSelectedSchedule(item)}
                      className="flex-1 py-2.5 px-4 bg-primary-container/10 hover:bg-primary-container/20 text-primary-container font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Detail dan Reschedule
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
          MODAL DETAIL JADWAL KUNJUNGAN
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
                <div>
                  <h2 className="text-xl font-black text-on-surface tracking-tight flex items-center gap-2">
                    Detail Pelayanan <span className="px-2 py-1 bg-primary-container/10 text-primary-container rounded-lg text-sm">#TRX-{selectedSchedule.id}</span>
                  </h2>
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
                        <h3 className="font-bold text-primary-container text-base">Atur Ulang Jadwal (Reschedule)</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                      </div>
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
                          Simpan Jadwal
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
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Nama Anak</span>
                          <span className="font-black text-on-surface text-base">{selectedSchedule.nama_anak}</span>
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
                      <div className="flex items-center gap-2 border-b border-surface-container pb-3 mb-4">
                        <MapPin className="w-5 h-5 text-tertiary" />
                        <h3 className="font-bold text-on-surface text-base">Lokasi & Keluhan</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block mb-1">Alamat Kunjungan</span>
                          <p className="font-medium text-on-surface leading-relaxed text-sm">{selectedSchedule.alamat_lengkap}</p>
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

                  {/* Kanan: Penugasan & Pembayaran */}
                  <div className="space-y-6">
                    <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container h-full flex flex-col">
                      <div className="flex items-center justify-between border-b border-surface-container pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-secondary" />
                          <h3 className="font-bold text-on-surface text-base">Penugasan & Biaya</h3>
                        </div>
                        {!isEditingSchedule && (
                          <button
                            onClick={handleOpenEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container/10 text-primary-container hover:bg-primary-container/20 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Reschedule
                          </button>
                        )}
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

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Waktu Reservasi</span>
                            <span className="font-black text-on-surface">{selectedSchedule.waktu_reservasi}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold block">Status Jadwal</span>
                            <span className="font-black text-on-surface uppercase">{selectedSchedule.status_jadwal}</span>
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

                        <div className="flex justify-between items-center bg-primary-container/15 p-4 rounded-2xl border border-primary-container/20">
                          <div>
                            <span className="text-[11px] text-primary-container font-black uppercase tracking-wider block">Total Biaya</span>
                            <h4 className="text-xl font-black text-primary-container mt-0.5">{formatRupiah(selectedSchedule.total_harga_kunjungan)}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Komisi Terapis</span>
                            <span className="text-base font-black text-secondary">{formatRupiah(selectedSchedule.total_komisi_kunjungan)}</span>
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
    </div>
  );
}