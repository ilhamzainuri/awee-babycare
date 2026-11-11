import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Landmark, 
  Banknote,
  CheckCircle2,
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  DollarSign,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Receipt,
  Pencil, // <-- Icon untuk tombol override
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface TaskData {
  id: number;
  patient: string;
  therapist: string;
  plan_method: string;
  actual_method: string;
  appointment_date: string;
  status_jadwal?: string;
  status_pembayaran?: string;
  alasan_penolakan?: string | null;
  waktu_penolakan?: string | null;
  type: 'mismatch' | 'pending' | 'verified' | 'waiting_therapist' | 'rejected';
}

interface AppointmentDetail {
  id: number;
  nama_pasien: string;
  usia_saat_ini: string;
  bb_saat_ini: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  alamat_lengkap: string;
  link_shareloc: string | null;
  no_hp_ortu: string;
  keluhan_awal: string | null;
  waktu_reservasi: string;
  status_jadwal: string;
  status_pembayaran?: string;
  alasan_penolakan?: string | null;
  waktu_penolakan?: string | null;
  metode_bayar_admin: string;
  metode_bayar_terapis: string | null;
  total_harga_kunjungan: number;
  total_komisi_kunjungan: number;
  catatan_terapis: string | null;
  bukti_bayar_url: string | null; // <-- TAMBAHAN UNTUK BUKTI BAYAR
  therapist: string;
  therapist_phone: string;
  service_name: string | null;
}

const getPaymentIcon = (method: string) => {
  if (!method) return Banknote;
  if (method.toLowerCase().includes('cash')) return Banknote;
  return Landmark; 
};

export default function Verification() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'unverified' | 'verified'>('unverified');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // State untuk modal override metode bayar terapis
  const [overrideModal, setOverrideModal] = useState<{ id: number; patient: string } | null>(null);
  const [overrideMethod, setOverrideMethod] = useState<string>('Cash');
  const [overrideLoading, setOverrideLoading] = useState<boolean>(false);

  // State untuk modal tolak pembayaran
  const [rejectModal, setRejectModal] = useState<{ id: number; patient: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);

  // BASE URL API
  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/verification.php` 
    : 'http://localhost/awee-babycare/backend/api/verification.php';

  // Aktor untuk audit log
  const sessionUser = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}'); } catch { return {}; }
  })();

  const overrideUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/override_payment_method.php`
    : 'http://localhost/awee-babycare/backend/api/override_payment_method.php';

  // BASE URL UPLOADS (Mengubah /api menjadi /uploads/payments)
  const uploadUrl = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/api', '/uploads/payments')
    : 'http://localhost/awee-babycare/backend/uploads/payments';

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        const result = await response.json();
        if (result.status !== 200) throw new Error(result.message || 'Terjadi kesalahan');
        setTasks(result.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [apiUrl]);

  const activeTasks = useMemo(() => {
    return tasks.filter(t => t.status_jadwal !== 'Dibatalkan');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      const matchesTab = activeTab === 'verified' 
        ? task.type === 'verified' 
        : task.type !== 'verified'; 

      const matchesSearch = 
        task.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.therapist.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = filterDate ? task.appointment_date?.startsWith(filterDate) : true;
      const matchesMonth = filterMonth ? task.appointment_date?.startsWith(filterMonth) : true;

      return matchesTab && matchesSearch && matchesDate && matchesMonth;
    });
  }, [activeTasks, activeTab, searchQuery, filterDate, filterMonth]);

  const isTaskOverdue = (dateString?: string, type?: string, status_jadwal?: string) => {
    if (type === 'verified') return false;
    if (status_jadwal === 'Dibatalkan') return false;
    if (!dateString) return false;
    const appDate = new Date(dateString.replace(' ', 'T'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appDay = new Date(appDate);
    appDay.setHours(0, 0, 0, 0);
    return appDay < today;
  };

  const unverifiedCount = activeTasks.filter(t => t.type !== 'verified').length;
  const verifiedCount = activeTasks.filter(t => t.type === 'verified').length;
  const overdueCount = activeTasks.filter(t => isTaskOverdue(t.appointment_date, t.type, t.status_jadwal)).length;
  const mismatchCount = activeTab === 'unverified' 
    ? filteredTasks.filter(task => task.type === 'mismatch').length 
    : 0;

  const handleOpenDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${apiUrl}?id=${id}`);
      if (!response.ok) throw new Error('Gagal mengambil detail dari server');
      const result = await response.json();
      if (result.status === 200) {
        setSelectedAppointment(result.data);
      } else {
        alert(result.message || "Gagal memuat detail.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat mengambil detail.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, user_id: sessionUser.id })
      });
      const result = await response.json();
      
      if (response.ok && result.status === 200) {
        setTasks((prevTasks) => 
          prevTasks.map(task => 
            task.id === id ? { ...task, type: 'verified', alasan_penolakan: null, waktu_penolakan: null } : task
          )
        );
        setSelectedAppointment(null); 
      } else {
        alert(result.message || "Gagal melakukan verifikasi di server.");
      }
    } catch (err) {
      console.error("Error verifying task:", err);
      alert("Terjadi kesalahan jaringan saat memverifikasi.");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const alasan = rejectReason.trim();
    if (!alasan) {
      toast.error('Alasan penolakan wajib diisi.');
      return;
    }
    const target = rejectModal;
    setRejectLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, action: 'reject', alasan_penolakan: alasan, user_id: sessionUser.id })
      });
      const result = await response.json();

      if (response.ok && result.status === 200) {
        const waktu = result.data?.waktu_penolakan || new Date().toISOString();
        setTasks(prev => prev.map(t => t.id === target.id ? {
          ...t,
          type: 'rejected',
          status_pembayaran: 'Rejected',
          alasan_penolakan: alasan,
          waktu_penolakan: waktu
        } : t));
        setSelectedAppointment(prev => prev && prev.id === target.id ? {
          ...prev,
          status_pembayaran: 'Rejected',
          alasan_penolakan: alasan,
          waktu_penolakan: waktu
        } : prev);
        toast.success('Pembayaran ditolak. Alasan akan terlihat oleh terapis.');
        setRejectModal(null);
        setRejectReason('');
      } else {
        toast.error(result.message || 'Gagal menolak pembayaran.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setRejectLoading(false);
    }
  };

  const openRejectModal = (id: number, patient: string) => {
    setRejectReason('');
    setRejectModal({ id, patient });
  };

  const handleOverride = async () => {
    if (!overrideModal) return;
    setOverrideLoading(true);
    try {
      const response = await fetch(overrideUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: overrideModal.id,
          metode_bayar_terapis: overrideMethod,
          user_id: sessionUser.id
        })
      });
      const result = await response.json();
      if (result.status === 200) {
        // Update state lokal: ubah type dari waiting_therapist → pending atau mismatch
        setTasks(prev => prev.map(t => {
          if (t.id !== overrideModal.id) return t;
          const isMismatch = t.plan_method !== overrideMethod;
          return {
            ...t,
            actual_method: overrideMethod,
            type: isMismatch ? 'mismatch' : 'pending'
          };
        }));
        toast.success(`Metode pembayaran berhasil diset ke "${overrideMethod}" oleh admin.`);
        setOverrideModal(null);
      } else {
        toast.error(result.message || 'Gagal mengubah metode pembayaran.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const formatDateForTable = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Financial Verification</h1>
        <p className="text-on-surface-variant mt-1">Reconcile planned payments with actual receipts from clinicians.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-2 rounded-2xl border border-surface-container shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama Pasien atau nama terapis..."
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-container transition-all outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="month"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setFilterDate(''); }}
            className="flex-1 px-4 py-3 bg-surface-container-low text-on-surface rounded-xl border border-surface-container text-sm font-bold outline-none cursor-pointer"
          />
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setFilterMonth(''); }}
            className="flex-1 px-4 py-3 bg-surface-container-low text-on-surface rounded-xl border border-surface-container text-sm font-bold outline-none cursor-pointer"
          />
          {(searchQuery || filterDate || filterMonth) && (
            <button 
              onClick={() => { setSearchQuery(''); setFilterDate(''); setFilterMonth(''); }}
              className="px-6 py-3 bg-error-container text-on-error-container rounded-xl border border-error/20 text-sm font-bold hover:brightness-95 transition-all"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* SISTEM NAVIGASI TAB */}
      <div className="flex gap-2 sm:gap-6 border-b border-surface-container overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('unverified')}
          className={cn(
            "flex items-center gap-2 pb-3 px-2 font-bold transition-all whitespace-nowrap",
            activeTab === 'unverified' ? "border-b-2 border-primary text-primary" : "border-b-2 border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Clock className="w-5 h-5" />
          Perlu Verifikasi
          {unverifiedCount > 0 && (
            <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{unverifiedCount}</span>
          )}
          {overdueCount > 0 && (
            <span className="bg-red-100 text-red-700 border border-red-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1" title={`${overdueCount} transaksi terlambat`}>
              {overdueCount} Terlambat
            </span>
          )}
        </button>
        
        <button 
          onClick={() => setActiveTab('verified')}
          className={cn(
            "flex items-center gap-2 pb-3 px-2 font-bold transition-all whitespace-nowrap",
            activeTab === 'verified' ? "border-b-2 border-primary text-primary" : "border-b-2 border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          <ShieldCheck className="w-5 h-5" />
          Riwayat Verifikasi
          <span className="bg-surface-container-high text-on-surface text-[10px] px-2 py-0.5 rounded-full ml-1">{verifiedCount}</span>
        </button>
      </div>

      {/* Loading & Error State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center text-sm font-bold border border-error/20">
          Error: {error}
        </div>
      )}

      {/* Data Table Area */}
      {!loading && !error && (
        <div className="space-y-4">
          
          <AnimatePresence>
            {mismatchCount > 0 && activeTab === 'unverified' && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-error-container text-on-error-container p-4 rounded-2xl flex items-start sm:items-center gap-4 border border-error/20 shadow-sm">
                  <div className="bg-error/10 p-2 rounded-full shrink-0">
                    <AlertTriangle className="w-6 h-6 text-error" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Perhatian! Terdapat {mismatchCount} transaksi Mismatch</h3>
                    <p className="text-sm opacity-90 mt-0.5">
                      Ada perbedaan antara metode pembayaran yang direncanakan Admin dengan aktual dari Terapis.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {overdueCount > 0 && activeTab === 'unverified' && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 text-red-900 p-4 rounded-2xl flex items-start sm:items-center gap-4 border border-red-200 shadow-sm">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>Peringatan! Terdapat {overdueCount} transaksi Terlambat</span>
                      <span className="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-extrabold rounded-full uppercase">Perlu Tindakan</span>
                    </h3>
                    <p className="text-sm text-red-700/90 mt-0.5">
                      Jadwal kunjungan telah melewati tanggal yang ditentukan namun verifikasi belum selesai. Gunakan tombol <strong>Override</strong> jika ingin menetapkan metode bayar secara manual.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant font-medium bg-surface-container-lowest rounded-3xl border border-surface-container flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-outline-variant opacity-50" />
              {activeTab === 'unverified' 
                ? "Kerja bagus! Semua pembayaran telah diverifikasi." 
                : "Belum ada riwayat verifikasi yang sesuai dengan filter Anda."}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-sm tracking-wide border-b border-surface-container">
                      <th className="p-5 font-bold">Tanggal</th>
                      <th className="p-5 font-bold">Nama Pasien</th>
                      <th className="p-5 font-bold">Terapis</th>
                      <th className="p-5 font-bold">Rencana (Admin)</th>
                      <th className="p-5 font-bold">Aktual (Terapis)</th>
                      <th className="p-5 font-bold">Status</th>
                      <th className="p-5 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const PlanIcon = getPaymentIcon(task.plan_method);
                      const ActualIcon = getPaymentIcon(task.actual_method);
                      const isMismatch = task.type === 'mismatch';
                      const isOverdue = isTaskOverdue(task.appointment_date, task.type, task.status_jadwal);

                      return (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={task.id}
                          className={cn(
                            "border-b last:border-0 border-surface-container transition-colors",
                            isOverdue && task.type !== 'verified' 
                              ? "bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500" 
                              : "hover:bg-surface-container/30"
                          )}
                        >
                          <td className="p-5 whitespace-nowrap text-sm text-on-surface-variant font-medium">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={cn(isOverdue && task.type !== 'verified' ? "font-bold text-red-950" : "")}>
                                {formatDateForTable(task.appointment_date)}
                              </span>
                              {isOverdue && task.type !== 'verified' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                                  <AlertTriangle className="w-2.5 h-2.5 text-red-600 shrink-0" />
                                  Terlambat
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface text-base">{task.patient}</span>
                              {isOverdue && task.type !== 'verified' && (
                                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                  Terlambat
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-bold uppercase tracking-wider">
                              {task.therapist}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                              <PlanIcon className="w-4 h-4 opacity-70" />
                              {task.plan_method}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className={cn(
                              "flex items-center gap-2 font-medium",
                              isMismatch ? "text-error font-bold" : "text-on-surface"
                            )}>
                              <ActualIcon className="w-4 h-4" />
                              {task.actual_method}
                            </div>
                          </td>
                          <td className="p-5">
                            {task.type === 'verified' ? (
                              <div className="flex items-center gap-2 text-primary font-bold text-sm bg-primary-container/30 w-max px-3 py-1.5 rounded-full">
                                🟢 Verified
                              </div>
                            ) : task.type === 'rejected' ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-error font-bold text-sm bg-error-container/40 w-max px-3 py-1.5 rounded-full">
                                  🔴 Ditolak
                                </div>
                                {task.alasan_penolakan && (
                                  <span className="text-xs text-error font-medium max-w-[220px] line-clamp-2" title={task.alasan_penolakan}>
                                    {task.alasan_penolakan}
                                  </span>
                                )}
                              </div>
                            ) : isMismatch ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-error font-bold text-sm bg-error-container/30 w-max px-3 py-1.5 rounded-full">
                                  🔴 Mismatch
                                </div>
                                {isOverdue && (
                                  <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Lewat Jadwal
                                  </span>
                                )}
                              </div>
                            ) : task.type === 'waiting_therapist' || !task.actual_method || task.actual_method === 'Belum Input' ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-500/15 border border-amber-500/30 font-bold text-xs w-max px-3 py-1.5 rounded-full">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                  Menunggu Terapis
                                </div>
                                {isOverdue && (
                                  <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Lewat Jadwal
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-secondary font-bold text-sm bg-secondary-container/30 w-max px-3 py-1.5 rounded-full">
                                  🟡 Siap Verifikasi
                                </div>
                                {isOverdue && (
                                  <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Lewat Jadwal
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-5">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                disabled={loadingDetail}
                                className="flex items-center gap-1.5 px-4 py-2 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-all text-sm font-bold shadow-sm border border-outline-variant/30 disabled:opacity-50"
                                onClick={() => handleOpenDetail(task.id)}
                              >
                                Detail
                              </button>
                              {task.type !== 'verified' && (
                                task.type === 'waiting_therapist' || !task.actual_method || task.actual_method === 'Belum Input' ? (
                                  <>
                                    <button 
                                      disabled
                                      className="flex items-center gap-1.5 bg-surface-container text-on-surface-variant/50 font-bold px-3.5 py-2 rounded-xl text-xs cursor-not-allowed border border-surface-container-high"
                                      title="Menunggu input metode pembayaran dari terapis di lapangan"
                                    >
                                      <Clock className="w-3.5 h-3.5" /> Belum Ada Input
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOverrideMethod('Cash');
                                        setOverrideModal({ id: task.id, patient: task.patient });
                                      }}
                                      className="flex items-center gap-1.5 bg-amber-100 text-amber-800 font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-amber-200 transition-all border border-amber-300"
                                      title="Admin input metode bayar sebagai pengganti terapis"
                                    >
                                      <Pencil className="w-3 h-3" /> Override
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => openRejectModal(task.id, task.patient)}
                                      className="flex items-center gap-1.5 bg-error-container text-on-error-container font-bold px-3.5 py-2 rounded-xl hover:brightness-95 transition-all text-xs border border-error/20"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Tolak
                                    </button>
                                    <button 
                                      onClick={() => handleVerify(task.id)}
                                      className="flex items-center gap-1.5 bg-primary-container text-on-primary-container font-bold px-5 py-2 rounded-xl hover:brightness-110 transition-all text-sm shadow-sm"
                                    >
                                      {task.type === 'rejected' ? 'Verifikasi Ulang' : 'Verify'}
                                    </button>
                                  </>
                                )
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POP-UP MODAL DETAIL */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedAppointment(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container-low">
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface">Detail Appointment</h2>
                  <p className="text-xs text-on-surface-variant">ID Transaksi: #{selectedAppointment.id}</p>
                </div>
                <button onClick={() => setSelectedAppointment(null)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-sm text-on-surface">
                {/* Alert jika jadwal dibatalkan */}
                {selectedAppointment.status_jadwal === 'Dibatalkan' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                    <div>
                      <p className="font-extrabold text-sm">Layanan Ini Telah Dibatalkan</p>
                      <p className="text-xs text-red-600/80">Jadwal layanan ini telah dibatalkan, sehingga tidak memerlukan verifikasi pembayaran.</p>
                    </div>
                  </div>
                )}

                {/* Alert jika pembayaran ditolak */}
                {selectedAppointment.status_pembayaran === 'Rejected' && (
                  <div className="bg-error-container/40 border border-error/30 p-4 rounded-2xl flex items-start gap-3 text-error">
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-sm">Pembayaran Ditolak</p>
                      <p className="text-xs font-medium mt-0.5 text-on-error-container">
                        {selectedAppointment.alasan_penolakan || 'Tidak ada alasan yang dicatat.'}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Ditolak pada {formatDateTime(selectedAppointment.waktu_penolakan)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Alert jika jadwal terlambat */}
                {selectedAppointment && isTaskOverdue(selectedAppointment.waktu_reservasi, selectedAppointment.status_pembayaran === 'Verified' ? 'verified' : '', selectedAppointment.status_jadwal) && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-sm">Transaksi Terlambat (Melewati Jadwal)</p>
                        <span className="text-[10px] bg-red-200 text-red-800 font-black px-2 py-0.5 rounded-full uppercase">Terlambat</span>
                      </div>
                      <p className="text-xs text-red-600/80 mt-0.5">
                        Jadwal kunjungan pada {formatDateForTable(selectedAppointment.waktu_reservasi)} telah lewat, namun verifikasi pembayaran belum selesai.
                      </p>
                    </div>
                  </div>
                )}

                {/* Alert jika belum ada input dari terapis */}
                {!selectedAppointment.metode_bayar_terapis && selectedAppointment.status_jadwal !== 'Dibatalkan' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
                    <Clock className="w-5 h-5 shrink-0 text-amber-600 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-sm">Menunggu Input dari Terapis</p>
                      <p className="text-xs text-amber-700/80">Terapis belum menginput metode pembayaran dari lapangan. Transaksi baru dapat disahkan & diverifikasi setelah laporan terapis diterima.</p>
                    </div>
                  </div>
                )}

                {/* 1. Informasi Pasien / Pasien */}
                <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-primary border-b border-surface-container pb-1.5">
                    <User className="w-4 h-4" /> Informasi Pasien & Orang Tua
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Nama Pasien</p>
                      <p className="font-semibold text-base text-on-surface">{selectedAppointment.nama_pasien}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Jenis Kelamin</p>
                      <p className="font-semibold">{selectedAppointment.jenis_kelamin}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Usia Saat Kunjungan</p>
                      <p className="font-semibold">{selectedAppointment.usia_saat_ini || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Berat Badan</p>
                      <p className="font-semibold">{selectedAppointment.bb_saat_ini ? `${selectedAppointment.bb_saat_ini} Kg` : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Layanan & Penugasan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-2 min-w-0">
                    <h3 className="font-bold flex items-center gap-2 text-secondary">
                      <Layers className="w-4 h-4 shrink-0" /> Layanan Medis
                    </h3>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedAppointment.service_name ? (
                        selectedAppointment.service_name.split('+').map((srv, idx) => (
                          <span
                            key={idx}
                            className="text-sm font-bold text-on-surface bg-surface-container px-3 py-1.5 rounded-xl border border-surface-container-high/60 inline-block break-words max-w-full"
                          >
                            {srv.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm font-semibold text-on-surface-variant">Tidak diketahui</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-2 min-w-0">
                    <h3 className="font-bold flex items-center gap-2 text-secondary">
                      <User className="w-4 h-4 shrink-0" /> Terapis Bertugas
                    </h3>
                    <p className="text-base font-bold text-on-surface break-words pt-1">{selectedAppointment.therapist}</p>
                  </div>
                </div>

                {/* 3. Rekonsiliasi Finansial & Pembayaran */}
                <div className={cn(
                  "border p-5 rounded-2xl space-y-4",
                  selectedAppointment.metode_bayar_admin !== selectedAppointment.metode_bayar_terapis 
                    ? "bg-error-container/10 border-error/20" 
                    : "bg-surface-container-lowest border-surface-container"
                )}>
                  <h3 className={cn(
                    "font-bold flex items-center gap-2 border-b pb-1.5",
                    selectedAppointment.metode_bayar_admin !== selectedAppointment.metode_bayar_terapis ? "text-error border-error/10" : "text-on-surface border-surface-container"
                  )}>
                    <DollarSign className="w-4 h-4" /> Perbandingan Pembayaran
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                      <p className="text-xs font-bold text-outline uppercase tracking-wider mb-1">Rencana (Admin)</p>
                      <div className="flex items-center gap-1.5 font-bold text-on-surface">
                        {React.createElement(getPaymentIcon(selectedAppointment.metode_bayar_admin), { className: "w-4 h-4 opacity-70" })}
                        {selectedAppointment.metode_bayar_admin}
                      </div>
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl border",
                      selectedAppointment.metode_bayar_admin !== selectedAppointment.metode_bayar_terapis 
                        ? "bg-error-container/20 border-error/30 text-error" 
                        : "bg-surface-container-low border-surface-container text-on-surface"
                    )}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1">Aktual (Terapis)</p>
                      <div className="flex items-center gap-1.5 font-bold">
                        {React.createElement(getPaymentIcon(selectedAppointment.metode_bayar_terapis || ''), { className: "w-4 h-4" })}
                        {selectedAppointment.metode_bayar_terapis || 'Belum Input'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. TAMPILAN GAMBAR BUKTI PEMBAYARAN */}
                {selectedAppointment.bukti_bayar_url && (
                  <div className="bg-surface-container-low/40 p-5 rounded-2xl border border-surface-container space-y-3">
                    <h3 className="font-bold flex items-center gap-2 text-on-surface border-b border-surface-container pb-1.5">
                      <Receipt className="w-4 h-4" /> Bukti Pembayaran Terapis
                    </h3>
                    <div className="flex items-start flex-col gap-2">
                      {/* Bungkus dengan tag <a> agar bisa diklik dan dibuka di tab baru */}
                      <a 
                        href={`${uploadUrl}/${selectedAppointment.bukti_bayar_url}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block w-full sm:w-1/2 overflow-hidden rounded-xl border border-surface-container hover:opacity-80 hover:ring-2 ring-primary transition-all bg-surface-container"
                      >
                        <img 
                          src={`${uploadUrl}/${selectedAppointment.bukti_bayar_url}`} 
                          alt="Bukti Pembayaran" 
                          className="w-full h-auto object-cover max-h-48 sm:max-h-64"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Gambar+Tidak+Ditemukan';
                          }}
                        />
                      </a>
                      <p className="text-xs text-on-surface-variant italic">Klik gambar untuk melihat ukuran penuh</p>
                    </div>
                  </div>
                )}
                
                {/* 5. Catatan Terapis */}
                {selectedAppointment.catatan_terapis && (
                  <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-1.5">
                    <h3 className="font-bold flex items-center gap-2 text-outline-variant">
                      <FileText className="w-4 h-4" /> Catatan Terapis dari Lapangan
                    </h3>
                    <p className="text-on-surface-variant italic bg-surface-container-lowest p-3 rounded-xl border border-surface-container">
                      "{selectedAppointment.catatan_terapis}"
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-surface-container flex justify-end gap-3 bg-surface-container-low">
                <button onClick={() => setSelectedAppointment(null)} className="px-5 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all text-sm">
                  Tutup
                </button>
                {selectedAppointment.status_pembayaran !== 'Verified' && selectedAppointment.status_jadwal !== 'Dibatalkan' && (
                  selectedAppointment.metode_bayar_terapis ? (
                    <>
                      <button
                        onClick={() => openRejectModal(selectedAppointment.id, selectedAppointment.nama_pasien)}
                        className="px-5 py-2.5 bg-error-container text-on-error-container font-bold rounded-xl hover:brightness-95 transition-all text-sm border border-error/20 flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                      <button onClick={() => handleVerify(selectedAppointment.id)} className="bg-primary-container text-on-primary-container font-bold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all text-sm shadow-sm">
                        {selectedAppointment.status_pembayaran === 'Rejected' ? 'Verifikasi Ulang' : 'Sahkan & Verifikasi'}
                      </button>
                    </>
                  ) : (
                    <button disabled className="bg-surface-container text-on-surface-variant/50 font-bold px-5 py-2.5 rounded-xl text-sm cursor-not-allowed border border-surface-container-high flex items-center gap-1.5" title="Terapis belum menginput metode bayar">
                      <Clock className="w-4 h-4" /> Menunggu Input Terapis
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL OVERRIDE METODE BAYAR — Admin Input Pengganti Terapis */}
      <AnimatePresence>
        {overrideModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setOverrideModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-surface-container bg-amber-50 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Pencil className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-amber-900">Override Metode Pembayaran</h2>
                  <p className="text-xs text-amber-700 mt-0.5">Pasien: <span className="font-bold">{overrideModal.patient}</span></p>
                </div>
                <button onClick={() => setOverrideModal(null)} className="ml-auto p-1.5 text-amber-700 hover:bg-amber-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Terapis belum menginput metode pembayaran. Admin dapat mengisi data ini sebagai pengganti.
                    Aksi ini akan dicatat di <span className="font-bold">Audit Log</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                    Metode Pembayaran Aktual
                  </label>
                  <select
                    value={overrideMethod}
                    onChange={(e) => setOverrideMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-low border border-surface-container rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-container transition-all"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="Transfer Bank">🏦 Transfer Bank</option>
                    <option value="QRIS">📱 QRIS</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-surface-container flex justify-end gap-3 bg-surface-container-low">
                <button
                  onClick={() => setOverrideModal(null)}
                  className="px-5 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleOverride}
                  disabled={overrideLoading}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all text-sm shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {overrideLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                  Simpan Override
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TOLAK PEMBAYARAN — Admin mengisi alasan penolakan */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => !rejectLoading && setRejectModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-surface-container bg-error-container/40 flex items-center gap-3">
                <div className="p-2 bg-error/10 rounded-full">
                  <XCircle className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-on-error-container">Tolak Pembayaran</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Pasien: <span className="font-bold">{rejectModal.patient}</span></p>
                </div>
                <button
                  onClick={() => setRejectModal(null)}
                  disabled={rejectLoading}
                  className="ml-auto p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-error-container/30 border border-error/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant">
                    Pembayaran akan ditandai <span className="font-bold text-error">Ditolak</span> dan alasan ini terlihat oleh terapis.
                    Admin tetap dapat memverifikasi ulang setelah bukti diperbaiki. Aksi ini dicatat di <span className="font-bold">Audit Log</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                    Alasan Penolakan <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai dengan tagihan."
                    className="w-full px-4 py-3 bg-surface-container-low border border-surface-container rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-error/40 transition-all resize-none"
                  />
                  <p className="text-[10px] text-on-surface-variant text-right mt-1">{rejectReason.length}/1000</p>
                </div>
              </div>

              <div className="p-4 border-t border-surface-container flex justify-end gap-3 bg-surface-container-low">
                <button
                  onClick={() => setRejectModal(null)}
                  disabled={rejectLoading}
                  className="px-5 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all text-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="px-6 py-2.5 bg-error hover:brightness-110 text-white font-bold rounded-xl transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {rejectLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Tolak Pembayaran
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
