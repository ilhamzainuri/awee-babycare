import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  ChevronRight,
  X,
  FileText,
  Map,
  MessageCircle,
  Info,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { cn, canStartService, startServiceBlockMessage, groupSchedulesByDate, formatGroupDate, formatDateRange, localDateKey } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Interface Data

interface TherapistCommissions {
  today: number;
  weekly: number;
  monthly: number;
  custom: number;
}

interface TherapistProfile {
  name: string;
  status: 'Standby' | 'On Process';
  weeklyCommission: number;
}

interface ActiveSchedule {
  id: number;
  childName: string;
  time: string;
  address: string;
  raw_address?: string;
  jenis_layanan?: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan' | string;
  status_db?: string;
  status_pembayaran?: string;
  alasan_penolakan?: string | null;
  waktu_penolakan?: string | null;
  phone?: string;
  mapLink?: string;
  complaint?: string;
  waktu_reservasi?: string;
  waktu_reservasi_raw?: string;
  usia?: string;
  bb?: string;
  services?: string;
}

interface HistoryItem {
  id: number;
  childName: string;
  serviceName: string;
  date: string; // Diasumsikan berformat standard SQL "YYYY-MM-DD HH:MM:SS"
  commission: number;
}

export default function TherapistDashboard() {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [schedules, setSchedules] = useState<ActiveSchedule[]>([]);
  const [weeklySchedules, setWeeklySchedules] = useState<ActiveSchedule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode Tampilan Jadwal: Hari Ini atau Perpekan
  const [scheduleView, setScheduleView] = useState<'today' | 'weekly'>('today');

  // State Filter Komisi Dinamis
  const [commissionRange, setCommissionRange] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // State Modal Semua Jadwal
  const [isAllSchedulesOpen, setIsAllSchedulesOpen] = useState(false);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'upcoming' | 'all'>('upcoming'); 
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // State Filter Tanggal Jadwal (Default Hari Ini)
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeDate, setActiveDate] = useState<string>(todayStr);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
  const apiUrl = `${baseUrl}/therapist_dashboard.php`;

  // 1. Fetch Dashboard Utama
  const fetchTherapistData = async (start = '', end = '', targetDate = activeDate) => {
    try {
      if (!start && !end) setIsLoading(true);
      setError(null);
      
      const sessionStr = localStorage.getItem('user_session');
      if (!sessionStr) throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      const user = JSON.parse(sessionStr);
      if (!user.id) throw new Error('ID User tidak valid di dalam sesi.');

      let url = `${apiUrl}?user_id=${user.id}&date=${targetDate}`;
      if (start && end) {
        url += `&start_date=${start}&end_date=${end}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok && result.status === 200) {
        setProfile(result.data.profile);
        setSchedules(result.data.schedules || []);
        setWeeklySchedules(result.data.weekly_schedules || []);
        setHistory(result.data.history || []);
      } else {
        throw new Error(result.message || 'Gagal memuat data dari server');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchTherapistData();
  }, [apiUrl]);

  useEffect(() => {
    if (activeDate) {
      setIsLoadingSchedules(true);
      fetchTherapistData(
        commissionRange === 'custom' ? customStartDate : '',
        commissionRange === 'custom' ? customEndDate : '',
        activeDate
      );
    }
  }, [activeDate]);

  useEffect(() => {
    if (commissionRange === 'custom' && customStartDate && customEndDate) {
      fetchTherapistData(customStartDate, customEndDate, activeDate);
    }
  }, [customStartDate, customEndDate, commissionRange]);
    
  // 2. Fetch Semua Jadwal
  useEffect(() => {
    if (isAllSchedulesOpen) {
      const fetchAllSchedules = async () => {
        setIsLoadingAll(true);
        try {
          const sessionStr = localStorage.getItem('user_session');
          if (!sessionStr) return;
          const user = JSON.parse(sessionStr);
          const response = await fetch(`${baseUrl}/appointments.php?user_id=${user.id}`);
          const result = await response.json();
          if (result.status === 200) setAllSchedules(result.data);
        } catch (error) {
          console.error("Gagal mengambil seluruh jadwal", error);
        } finally {
          setIsLoadingAll(false);
        }
      };
      fetchAllSchedules();
    }
  }, [isAllSchedulesOpen, baseUrl]);

  // Fungsi Kalkulasi Komisi Berdasarkan Range Terpilih
  

  // Fungsi Filter 7 Hari Kedepan
  const getDisplayedSchedules = () => {
    if (scheduleTab === 'all') return allSchedules;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    return allSchedules.filter(item => {
      const itemDate = new Date(item.waktu_reservasi.replace(' ', 'T'));
      return itemDate >= today && 
             itemDate <= nextWeek && 
             item.status_jadwal !== 'Selesai' && 
             item.status_jadwal !== 'Dibatalkan';
    });
  };

  const displayedAllSchedules = getDisplayedSchedules();

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString.replace(' ', 'T')).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Mendapatkan nilai komisi aktif berdasarkan filter terpilih
  const getActiveCommissionValue = () => {
    if (!profile) return 0;
    return profile.commissions[commissionRange] || 0;
  };

  const openStartModal = () => {
    navigate('/therapist/start-service', { state: { selectedDetail } });
  };

  const openReportModal = () => {
    navigate('/therapist/submit-report', { state: { selectedDetail } });
  };

  // Layanan baru bisa dimulai tepat pada/atau setelah waktu reservasi
  const canStartSchedule = (detail: ActiveSchedule | null): boolean => {
    if (!detail) return false;
    return canStartService(detail.waktu_reservasi_raw || detail.time);
  };

  const getStartBlockMessage = (detail: ActiveSchedule | null): string => {
    if (!detail) return '';
    return startServiceBlockMessage(detail.waktu_reservasi_raw || detail.time);
  };

  const weeklyGroups = groupSchedulesByDate(weeklySchedules);
  const weeklyStart = new Date();
  const weeklyEnd = new Date();
  weeklyEnd.setDate(weeklyStart.getDate() + 6);
  const weeklyRangeLabel = formatDateRange(localDateKey(weeklyStart), localDateKey(weeklyEnd));

  const renderScheduleCard = (schedule: ActiveSchedule, index: number) => {
    const isOverdue = schedule.status === 'Diproses' && schedule.waktu_reservasi_raw && (new Date(schedule.waktu_reservasi_raw.replace(' ', 'T')).getTime() < new Date().setHours(0,0,0,0));
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        key={schedule.id}
        className={cn(
          "bg-surface-container-lowest border rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group",
          isOverdue ? "border-error/40 bg-error-container/5" : "border-surface-container"
        )}
      >
        {/* Status Top Strip Bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-1 sm:h-1.5",
          schedule.status === 'Diproses' && "bg-warning",
          schedule.status === 'Menunggu' && "bg-outline",
          schedule.status === 'Selesai' && "bg-emerald-500",
          schedule.status === 'Dibatalkan' && "bg-red-400"
        )} />

        <div className="space-y-2.5 sm:space-y-3.5">
          {/* Header Card: Jam & Badges */}
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-on-surface tracking-wide bg-surface-container px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1.5">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" /> 
              {schedule.time}
            </span>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {schedule.jenis_layanan && (
                <span className={cn(
                  "text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border",
                  schedule.jenis_layanan.toLowerCase().includes('outlet') && schedule.jenis_layanan.toLowerCase().includes('homecare')
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                    : schedule.jenis_layanan.toLowerCase().includes('outlet')
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}>
                  {schedule.jenis_layanan}
                </span>
              )}

              <span className={cn(
                "text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl",
                schedule.status === 'Diproses' && "bg-warning-container/30 text-warning",
                schedule.status === 'Menunggu' && "bg-surface-container text-on-surface-variant",
                schedule.status === 'Selesai' && "bg-emerald-100 text-emerald-700",
                schedule.status === 'Dibatalkan' && "bg-red-100 text-red-600"
              )}>
                {schedule.status}
              </span>

              {schedule.status_pembayaran === 'Rejected' && (
                <span
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-error-container text-on-error-container border border-error/30"
                  title={schedule.alasan_penolakan || 'Pembayaran ditolak admin'}
                >
                  Bayar Ditolak
                </span>
              )}
            </div>
          </div>

          {/* Info Pasien & Layanan */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-black text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors truncate">
                {schedule.childName}
              </h3>
              {schedule.usia && (
                <span className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant shrink-0 bg-surface-container px-2 py-0.5 rounded-lg">
                  {schedule.usia}
                </span>
              )}
            </div>

            {schedule.services && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-primary truncate">
                <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{schedule.services}</span>
              </div>
            )}

            <div className="flex items-start gap-1.5 text-on-surface-variant text-[11px] sm:text-xs mt-2">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 shrink-0 text-outline" />
              <p className="line-clamp-2 leading-relaxed">{schedule.address}</p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Card */}
        <div className="pt-3 mt-2.5 sm:pt-4 sm:mt-3 border-t border-surface-container flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDetail(schedule)}
            className="w-full bg-surface-container hover:bg-primary hover:text-white text-on-surface text-[11px] sm:text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
          >
            <span>Detail & Mulai Pelayanan</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </motion.div>
    );
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="text-on-surface-variant font-bold animate-pulse text-sm">Memuat Data Dashboard...</div></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-0 relative">
      {error && <div className="p-4 bg-error-container text-on-error-container rounded-2xl font-bold text-sm">Gagal Memuat Dashboard: {error}</div>}

      {/* WIDGET RINGKASAN & SALUTATION */}
      <section className="bg-gradient-to-br from-primary/10 via-primary-container/5 to-surface-container-lowest p-6 rounded-3xl border border-primary-container/20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">Therapist Portal</span>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface mt-2">Halo, {profile?.name || 'Terapis'}! 👋</h1>
            <p className="text-xs text-on-surface-variant mt-1">Siap memberikan pelayanan terbaik untuk buah hati hari ini?</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Status Box */}
            <div className="flex-1 md:flex-none bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-2xl flex items-center gap-3 shadow-inner min-w-[140px]">
              <div className={cn("w-3 h-3 rounded-full animate-pulse", profile?.status === 'Standby' ? "bg-success" : "bg-warning")} />
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Status Anda</p>
                <p className="text-sm font-extrabold text-on-surface">{profile?.status}</p>
              </div>
            </div>

            {/* UPGRADED: Dynamic Commission Filter Box */}
            <div className="flex-1 md:w-72 bg-surface-container-lowest border border-surface-container p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-secondary-container/20 text-secondary rounded-xl"><DollarSign className="w-4 h-4" /></div>
                  <span className="text-[10px] uppercase font-black text-on-surface-variant tracking-wide">Total Komisi</span>
                </div>
                
                {/* Dropdown Filter Range */}
                <select
                  value={commissionRange}
                  onChange={(e) => setCommissionRange(e.target.value as any)}
                  className="text-[11px] font-bold bg-surface-container border border-surface-container-high text-on-surface rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer hover:bg-surface-container-high transition-all"
                >
                  <option value="today">Hari Ini</option>
                  <option value="weekly">7 Hari Terakhir</option>
                  <option value="monthly">Bulan Ini</option>
                  <option value="custom">Rentang Kustom</option>
                </select>
              </div>
              
              <div>
                <p className="text-xl font-black text-primary tracking-tight">
                  {formatRupiah(getActiveCommissionValue())}
                </p>
              </div>

              {/* Tampilkan Input Tanggal Jika Pilih Kustom Range */}
              <AnimatePresence>
                {commissionRange === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 mt-1 pt-2 border-t border-surface-container overflow-hidden"
                  >
                    <input 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="text-[10px] font-bold bg-surface-container border border-surface-container-high text-on-surface rounded-lg px-2 py-1 w-full focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-on-surface-variant">s/d</span>
                    <input 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="text-[10px] font-bold bg-surface-container border border-surface-container-high text-on-surface rounded-lg px-2 py-1 w-full focus:outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DAFTAR JADWAL: CARD HARI INI & PERPEKAN */}
        <section className="lg:col-span-2 space-y-5">
          {/* Header & Tabs */}
          <div className="bg-surface-container-lowest border border-surface-container p-4 sm:p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-on-surface">Jadwal Pelayanan Terapis</h2>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Pantau dan kelola jadwal tindakan pasien hari ini dan pekan ini
                  </p>
                </div>
              </div>

              {/* Tombol Akses Riwayat Lengkap */}
              <button 
                onClick={() => setIsAllSchedulesOpen(true)} 
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto shrink-0"
              >
                <span>Semua Jadwal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tab Selector: Hari Ini vs Perpekan */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container">
              <div className="inline-flex p-1 bg-surface-container rounded-2xl">
                <button
                  type="button"
                  onClick={() => setScheduleView('today')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                    scheduleView === 'today'
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Jadwal Hari Ini</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                    scheduleView === 'today' ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    {schedules.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleView('weekly')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                    scheduleView === 'weekly'
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Jadwal Perpekan (7 Hari)</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                    scheduleView === 'weekly' ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    {weeklySchedules.length}
                  </span>
                </button>
              </div>

              {/* Tanggal Picker untuk Hari Ini */}
              {scheduleView === 'today' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
                    <input
                      type="date"
                      value={activeDate}
                      onChange={(e) => setActiveDate(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-xl text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                      title="Pilih Tanggal Tertentu"
                    />
                  </div>
                  {activeDate !== todayStr && (
                    <button
                      type="button"
                      onClick={() => setActiveDate(todayStr)}
                      className="text-[11px] text-primary font-bold bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-xl transition-all"
                    >
                      Hari Ini
                    </button>
                  )}
                </div>
              )}

              {/* Keterangan Periode Pekan */}
              {scheduleView === 'weekly' && (
                <div className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-xl">
                  📅 {weeklyRangeLabel}
                </div>
              )}
            </div>
          </div>

          {/* GRID CARD JADWAL */}
          {isLoadingSchedules ? (
            <div className="bg-surface-container-lowest border border-surface-container p-12 text-center rounded-3xl text-sm text-on-surface-variant animate-pulse font-bold">
              Memuat data jadwal terapis...
            </div>
          ) : (scheduleView === 'today' ? schedules : weeklySchedules).length === 0 ? (
            <div className="bg-surface-container-lowest border border-dashed border-surface-container p-12 text-center rounded-3xl space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-container flex items-center justify-center text-outline">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {scheduleView === 'today'
                    ? `Tidak ada jadwal pada ${new Date(activeDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Tidak ada jadwal terdaftar untuk 7 hari ke depan.'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">
                  {scheduleView === 'today'
                    ? 'Pilih tanggal lain atau buka tab jadwal perpekan.'
                    : 'Jadwal baru akan muncul di sini setelah reservasi dikonfirmasi oleh admin.'}
                </p>
              </div>
            </div>
          ) : scheduleView === 'today' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {schedules.map(renderScheduleCard)}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {weeklyGroups.map(group => {
                const groupDate = new Date(`${group.dateKey}T00:00:00`);
                return (
                  <div key={group.dateKey} className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm sm:text-base font-black leading-none">{groupDate.getDate()}</span>
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase leading-none mt-0.5 sm:mt-1">
                          {groupDate.toLocaleDateString('id-ID', { month: 'short' })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-black text-on-surface truncate">{formatGroupDate(group.dateKey)}</h3>
                        <p className="text-[10px] sm:text-[11px] font-medium text-on-surface-variant">{group.items.length} jadwal</p>
                      </div>
                      <div className="flex-1 h-px bg-surface-container" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {group.items.map(renderScheduleCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIWAYAT SINGKAT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-black text-on-surface">Service History</h2></div>
          <div className="bg-surface-container-lowest border border-surface-container rounded-3xl p-4 shadow-sm divide-y divide-surface-container">
            {history.length === 0 ? (
              <p className="p-4 text-center text-xs text-on-surface-variant italic">Belum ada riwayat pelayanan baru-baru ini.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      <h4 className="font-bold text-xs text-on-surface truncate">{item.childName}</h4>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate mt-0.5 ml-5">{item.serviceName}</p>
                    <span className="text-[9px] text-outline font-medium ml-5">{item.date}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-success">+{formatRupiah(item.commission)}</span>
                    <p className="text-[9px] text-success font-bold uppercase tracking-widest opacity-80">Verified</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* MODAL 1: DAFTAR SELURUH JADWAL (DENGAN FILTER) */}
      <AnimatePresence>
        {isAllSchedulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="bg-surface-container-lowest w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-surface-container bg-surface-container-low">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h2 className="text-lg font-black text-on-surface">Jadwal & Riwayat Kunjungan</h2>
                    </div>
                  </div>
                  <button onClick={() => setIsAllSchedulesOpen(false)} className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-full transition-all"><X className="w-6 h-6"/></button>
                </div>

                <div className="flex gap-2 p-1 bg-surface-container rounded-xl w-max">
                  <button onClick={() => setScheduleTab('upcoming')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", scheduleTab === 'upcoming' ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface")}>Seminggu Kedepan</button>
                  <button onClick={() => setScheduleTab('all')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", scheduleTab === 'all' ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface")}>Semua Riwayat</button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-surface">
                {isLoadingAll ? (
                  <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                ) : displayedAllSchedules.length === 0 ? (
                  <div className="text-center py-12 text-on-surface-variant">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold">Tidak ada data jadwal untuk kategori ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedAllSchedules.map((item) => (
                      <div key={item.id} className="bg-surface-container-lowest border border-surface-container p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-on-surface text-base truncate">{item.nama_pasien}</h3>
                            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", item.status_jadwal === 'Menunggu' ? "bg-surface-container text-on-surface border-outline-variant" : item.status_jadwal === 'Diproses' ? "bg-warning-container/30 text-warning border-warning/20" : item.status_jadwal === 'Selesai' ? "bg-success-container/30 text-success border-success/20" : "bg-error-container/30 text-error border-error/20")}>{item.status_jadwal}</span>
                            {item.status_pembayaran === 'Rejected' && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-error-container text-on-error-container border-error/30" title={item.alasan_penolakan || 'Pembayaran ditolak admin'}>Bayar Ditolak</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mb-2 line-clamp-1 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {item.rincian_layanan || 'Pemeriksaan Umum'}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-on-surface-variant">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(item.waktu_reservasi)}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.alamat_lengkap}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                          <div className="bg-surface-container-low p-2.5 rounded-xl border border-surface-container text-right w-full sm:w-auto">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Komisi Estimasi</p>
                            <p className="text-sm font-black text-primary">{formatRupiah(item.total_komisi_kunjungan)}</p>
                          </div>
                          <button onClick={() => setSelectedDetail({
                            id: item.id, childName: item.nama_pasien, usia: item.usia_saat_ini, bb: item.bb_saat_ini, address: item.alamat_lengkap, time: formatDate(item.waktu_reservasi), waktu_reservasi_raw: item.waktu_reservasi, status: item.status_jadwal, phone: item.no_hp_ortu, mapLink: item.link_shareloc, complaint: item.keluhan_awal, services: item.rincian_layanan, status_pembayaran: item.status_pembayaran, alasan_penolakan: item.alasan_penolakan, waktu_penolakan: item.waktu_penolakan
                          })} className="text-[11px] font-bold text-primary hover:underline self-end flex items-center gap-1">
                            Lihat Detail <ArrowRight className="w-3 h-3"/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DETAIL SPESIFIK RESERVASI (LOKASI, KONTAK, DAN MULAI) */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[95vh]">
              
              <div className="p-5 border-b border-surface-container flex justify-between items-center bg-surface-container-low rounded-t-3xl shrink-0">
                <h3 className="font-black text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary"/> Detail #TRX-{selectedDetail.id}</h3>
                <button onClick={() => setSelectedDetail(null)} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full"><X className="w-5 h-5"/></button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {/* Info pasien */}
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-3">Informasi Pasien</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Nama Pasien</p>
                      <p className="font-black text-lg text-on-surface">{selectedDetail.childName || selectedDetail.nama_pasien}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Usia</p>
                      <p className="font-bold text-sm text-on-surface">{selectedDetail.usia || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Berat Badan (Awal)</p>
                      <p className="font-bold text-sm text-on-surface">{selectedDetail.bb ? `${selectedDetail.bb} kg` : '-'}</p>
                    </div>
                    {selectedDetail.complaint && (
                      <div className="col-span-2 mt-2 bg-error-container/20 border border-error-container p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-error mb-1">Keluhan Awal</p>
                        <p className="text-sm font-medium text-on-surface">{selectedDetail.complaint}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Jadwal & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Jadwal / Waktu</p>
                    <p className="font-bold text-sm text-on-surface">{selectedDetail.time}</p>
                  </div>
                  <div className="bg-surface-container p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Status</p>
                    <p className="font-black text-sm text-primary uppercase">{selectedDetail.status}</p>
                  </div>
                </div>

                {/* Pemberitahuan pembayaran ditolak admin */}
                {selectedDetail.status_pembayaran === 'Rejected' && (
                  <div className="bg-error-container/40 border border-error/30 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-sm text-error">Pembayaran Ditolak Admin</p>
                      <p className="text-xs font-medium text-on-surface mt-0.5">
                        {selectedDetail.alasan_penolakan || 'Tidak ada alasan yang dicatat.'}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Silakan koordinasi dengan admin untuk perbaikan bukti pembayaran.
                      </p>
                    </div>
                  </div>
                )}

                {/* Daftar Layanan */}
                <div>
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-primary"/> Daftar Layanan</h4>
                  <div className="bg-surface-container-low border border-surface-container p-3 rounded-xl">
                    <ul className="list-decimal list-inside space-y-1.5">
                      {selectedDetail.services ? selectedDetail.services.split('+').map((srv: string, idx: number) => (
                        <li key={idx} className="text-sm font-bold text-on-surface">{srv.trim()}</li>
                      )) : (
                        <li key={0} className="text-sm font-bold text-on-surface">Layanan Umum</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Alamat & Jenis Layanan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                      <MapPin className="w-3 h-3"/> Lokasi / Alamat Kunjungan
                    </p>
                    {selectedDetail.jenis_layanan && (
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                        selectedDetail.jenis_layanan.toLowerCase().includes('outlet') && selectedDetail.jenis_layanan.toLowerCase().includes('homecare')
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          : selectedDetail.jenis_layanan.toLowerCase().includes('outlet')
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      )}>
                        Pelayanan: {selectedDetail.jenis_layanan}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-on-surface bg-surface-container-low p-3 rounded-xl border border-surface-container">
                    {selectedDetail.address}
                  </p>
                  {selectedDetail.jenis_layanan?.toLowerCase().includes('outlet') && selectedDetail.raw_address && (
                    <p className="text-[11px] text-on-surface-variant mt-1.5 italic">
                      * Alamat domisili pasien: {selectedDetail.raw_address}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {selectedDetail.mapLink && selectedDetail.mapLink !== '-' && (
                      <button onClick={() => window.open(selectedDetail.mapLink, '_blank')} className="w-full bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1967D2] text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5">
                        <Map className="w-3.5 h-3.5"/> Buka Maps
                      </button>
                    )}
                    {selectedDetail.phone && (
                      <button onClick={() => window.open(`https://wa.me/${selectedDetail.phone.replace(/^0/, '62')}`, '_blank')} className="w-full bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5"/> Chat WhatsApp
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons Terapis */}
              <div className="p-5 border-t border-surface-container bg-surface-container-low rounded-b-3xl shrink-0 flex flex-col gap-3">
                {selectedDetail.status === 'Selesai' || selectedDetail.status_db === 'Selesai' ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-700">Layanan Telah Selesai</p>
                    <p className="text-xs text-emerald-600/80">Laporan sudah dikirim untuk jadwal ini.</p>
                  </div>
                ) : selectedDetail.status === 'Dibatalkan' || selectedDetail.status_db === 'Dibatalkan' ? (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
                    <p className="text-sm font-bold text-red-600">Reservasi Dibatalkan</p>
                  </div>
                ) : selectedDetail.status === 'Menunggu' ? (
                  <>
                    {!canStartSchedule(selectedDetail) && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold text-amber-700">{getStartBlockMessage(selectedDetail)}</p>
                      </div>
                    )}
                    <button
                      onClick={canStartSchedule(selectedDetail) ? openStartModal : undefined}
                      disabled={!canStartSchedule(selectedDetail)}
                      title={!canStartSchedule(selectedDetail) ? getStartBlockMessage(selectedDetail) : ''}
                      className={cn(
                        "w-full text-sm font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2",
                        canStartSchedule(selectedDetail)
                          ? "bg-primary hover:bg-primary/90 text-on-primary shadow-lg shadow-primary/30 active:scale-[0.98]"
                          : "bg-on-surface/10 text-on-surface/30 cursor-not-allowed"
                      )}
                    >
                      <Activity className="w-5 h-5"/>
                      {canStartSchedule(selectedDetail) ? 'Mulai Layanan Sekarang' : 'Belum Saatnya Dimulai'}
                    </button>
                  </>
                ) : selectedDetail.status === 'Diproses' ? (
                  <button onClick={openReportModal} className="w-full bg-success hover:bg-success/90 text-on-primary text-sm font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-success/30">
                    <CheckCircle2 className="w-5 h-5"/> Isi Laporan Selesai
                  </button>
                ) : (
                  <div className="bg-surface-container p-3 rounded-xl text-center">
                    <p className="text-xs font-bold text-on-surface-variant">Layanan sudah {selectedDetail.status}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}