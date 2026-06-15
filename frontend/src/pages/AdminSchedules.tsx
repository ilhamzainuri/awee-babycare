import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Phone, MapPin, 
  Baby, Receipt, X, Eye, CalendarDays, ExternalLink, MessageCircle, Clock, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  'Menunggu': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500'
  },
  'Diproses': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500'
  },
  'Selesai': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  'Dibatalkan': {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500/20',
    dot: 'bg-red-500'
  }
};

export default function AdminSchedules() {
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Detail State
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

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

  // Polling real-time update setiap 15 detik
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

  // Helper stats
  const totalCount = schedules.length;
  const processCount = schedules.filter(s => s.status_jadwal === 'Diproses').length;
  const completedCount = schedules.filter(s => s.status_jadwal === 'Selesai').length;
  const waitingCount = schedules.filter(s => s.status_jadwal === 'Menunggu').length;

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
        <div className="p-4 rounded-3xl border border-surface-container-high bg-surface-container-lowest flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Jadwal Hari Ini</span>
          <h2 className="text-2xl font-black text-on-surface mt-2">{totalCount} Kunjungan</h2>
        </div>
        <div className="p-4 rounded-3xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Sedang Diproses
          </span>
          <h2 className="text-2xl font-black text-blue-700 mt-2">{processCount} Pasien</h2>
        </div>
        <div className="p-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            Selesai Pelayanan
          </span>
          <h2 className="text-2xl font-black text-emerald-700 mt-2">{completedCount} Sesi</h2>
        </div>
        <div className="p-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            Menunggu Terapis
          </span>
          <h2 className="text-2xl font-black text-amber-700 mt-2">{waitingCount} Antrean</h2>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-surface-container-low p-4 rounded-3xl shadow-inner">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama anak / terapis / ID TRX..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container outline-none"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-outline pointer-events-none" />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container outline-none font-bold text-on-surface-variant cursor-pointer"
            />
          </div>
        </div>

        {/* Status Tab Filters */}
        <div className="flex bg-surface-container-lowest border border-surface-container p-1 rounded-2xl gap-1 overflow-x-auto">
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <span className="text-on-surface-variant font-bold text-sm">Menyelaraskan data jadwal...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span className="font-bold text-sm">Gagal memuat jadwal: {error}</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container p-12 text-center rounded-[2.5rem]">
          <CalendarDays className="w-16 h-16 text-outline-variant mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-black text-on-surface">Tidak Ada Jadwal Kunjungan</h3>
          <p className="text-on-surface-variant text-sm mt-1 max-w-md mx-auto">
            Tidak ditemukan jadwal pelayanan bidan/terapis untuk filter pencarian dan tanggal yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="bg-surface-container-lowest border border-surface-container rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Status Bar Indicator */}
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5", statusStyle.dot)} />

                  <div>
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">#TRX-{item.id}</p>
                        <p className="text-xs font-bold text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.jam_reservasi}
                        </p>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider shrink-0 flex items-center gap-1", statusStyle.bg, statusStyle.text, statusStyle.border)}>
                        {item.status_jadwal === 'Diproses' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        {item.status_jadwal}
                      </span>
                    </div>

                    {/* Patient & Therapist details */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Pasien Anak</span>
                        <h4 className="font-black text-lg text-on-surface truncate mt-0.5">{item.nama_anak}</h4>
                        <p className="text-xs text-on-surface-variant font-semibold">Usia: {item.usia_saat_ini || '-'} • BB: {item.bb_saat_ini ? `${item.bb_saat_ini} kg` : '-'}</p>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-surface-container">
                        <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0">
                          {item.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider block">Terapis Bertugas</span>
                          <span className="font-extrabold text-sm text-on-surface truncate block">{item.nama_terapis}</span>
                        </div>
                      </div>

                      {/* Service tags */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Layanan Kunjungan</span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {item.services && item.services.map((srv: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-tertiary-container/10 border border-tertiary/10 text-tertiary font-bold text-[10px] rounded-lg">
                              {srv.nama_layanan}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Alamat & Location */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-outline" /> Alamat Kunjungan
                        </span>
                        <p className="text-xs text-on-surface font-semibold line-clamp-2 leading-relaxed bg-surface-container-low/50 p-2.5 rounded-xl border border-surface-container">
                          {item.alamat_lengkap}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-surface-container flex gap-3">
                    <button
                      onClick={() => setSelectedSchedule(item)}
                      className="flex-1 py-2.5 px-3 bg-primary-container/10 hover:bg-primary-container/20 text-primary-container font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> Detail
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSchedule(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col"
            >
              {/* Header Modal */}
              <div className="sticky top-0 z-10 bg-surface-container-lowest/90 backdrop-blur-md px-6 py-4 border-b border-surface-container flex items-center justify-between">
                <h2 className="text-xl font-black text-on-surface tracking-tight">
                  Detail Pelayanan <span className="text-primary-container">#TRX-{selectedSchedule.id}</span>
                </h2>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="p-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Isi Modal */}
              <div className="p-6 md:p-8 space-y-6 text-sm text-left">
                {/* Section Pasien */}
                <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container space-y-4">
                  <div className="flex items-center gap-2 border-b border-surface-container pb-2">
                    <Baby className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-on-surface">Data Pasien & Orang Tua</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-on-surface-variant text-xs block">Nama Lengkap</span>
                      <span className="font-bold text-on-surface text-base">{selectedSchedule.nama_anak}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Jenis Kelamin</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.jenis_kelamin}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Usia</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.usia_saat_ini || '-'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">No. HP Orang Tua</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.no_hp_ortu}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Berat Badan (Rencana Admin)</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.bb_saat_ini ? `${selectedSchedule.bb_saat_ini} kg` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Berat Badan (Fakta Terapis)</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.bb_real_terapis ? `${selectedSchedule.bb_real_terapis} kg` : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Section Lokasi & Keluhan */}
                <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container space-y-4">
                  <div className="flex items-center gap-2 border-b border-surface-container pb-2">
                    <MapPin className="w-5 h-5 text-tertiary" />
                    <h3 className="font-bold text-on-surface">Lokasi & Keluhan</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-on-surface-variant text-xs block">Alamat Kunjungan</span>
                      <span className="font-bold text-on-surface leading-relaxed">{selectedSchedule.alamat_lengkap}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Keluhan Awal</span>
                      <p className="font-medium text-on-surface bg-surface-container p-3 rounded-xl mt-1">{selectedSchedule.keluhan_awal || 'Tidak ada keluhan.'}</p>
                    </div>
                  </div>
                </div>

                {/* Section Penugasan & Pembayaran */}
                <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container space-y-4">
                  <div className="flex items-center gap-2 border-b border-surface-container pb-2">
                    <Receipt className="w-5 h-5 text-secondary" />
                    <h3 className="font-bold text-on-surface">Penugasan & Biaya</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-on-surface-variant text-xs block">Terapis Bertugas</span>
                      <span className="font-bold text-on-surface text-base">{selectedSchedule.nama_terapis}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Waktu Reservasi</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.waktu_reservasi}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Metode Bayar (Rencana Admin)</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.metode_bayar_admin}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Metode Bayar (Fakta Terapis)</span>
                      <span className="font-bold text-on-surface">{selectedSchedule.metode_bayar_terapis || '-'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Status Jadwal</span>
                      <span className="font-bold text-on-surface uppercase">{selectedSchedule.status_jadwal}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-xs block">Status Verifikasi Bayar</span>
                      <span className={cn("font-black uppercase text-xs tracking-wider", selectedSchedule.status_pembayaran === 'Verified' ? 'text-emerald-600' : 'text-amber-500')}>
                        {selectedSchedule.status_pembayaran}
                      </span>
                    </div>
                  </div>

                  {/* Layanan detail & total biaya */}
                  <div className="border-t border-surface-container pt-3 space-y-2">
                    <span className="text-on-surface-variant text-xs block font-bold">Rincian Layanan & Harga</span>
                    <div className="space-y-1.5">
                      {selectedSchedule.services && selectedSchedule.services.map((srv: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-on-surface">• {srv.nama_layanan}</span>
                          <span className="font-bold text-on-surface-variant">{formatRupiah(srv.harga_snapshot)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center bg-primary-container/10 p-3 rounded-xl border border-primary-container/15 mt-3">
                      <div>
                        <span className="text-xs text-primary-container font-black uppercase">Total Biaya Kunjungan</span>
                        <h4 className="text-lg font-black text-primary-container mt-0.5">{formatRupiah(selectedSchedule.total_harga_kunjungan)}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant font-bold block">Komisi Terapis</span>
                        <span className="text-sm font-black text-secondary">{formatRupiah(selectedSchedule.total_komisi_kunjungan)}</span>
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
