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
  Receipt // <-- Icon tambahan untuk bukti bayar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TaskData {
  id: number;
  patient: string;
  therapist: string;
  plan_method: string;
  actual_method: string;
  appointment_date: string;
  type: 'mismatch' | 'pending' | 'verified';
}

interface AppointmentDetail {
  id: number;
  nama_anak: string;
  usia_saat_ini: string;
  bb_saat_ini: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  alamat_lengkap: string;
  link_shareloc: string | null;
  no_hp_ortu: string;
  keluhan_awal: string | null;
  waktu_reservasi: string;
  status_jadwal: string;
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

  // BASE URL API
  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/verification.php` 
    : 'http://localhost/awee-babycare/backend/api/verification.php';

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, activeTab, searchQuery, filterDate, filterMonth]);

  const unverifiedCount = tasks.filter(t => t.type !== 'verified').length;
  const verifiedCount = tasks.filter(t => t.type === 'verified').length;
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
        body: JSON.stringify({ id: id, user_id: 1 }) // user_id admin dummy
      });
      const result = await response.json();
      
      if (response.ok && result.status === 200) {
        setTasks((prevTasks) => 
          prevTasks.map(task => 
            task.id === id ? { ...task, type: 'verified' } : task
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

  const formatDateForTable = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
            placeholder="Cari nama anak atau nama terapis..."
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
                      <th className="p-5 font-bold">Nama Anak</th>
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

                      return (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={task.id}
                          className="border-b last:border-0 border-surface-container hover:bg-surface-container/30 transition-colors"
                        >
                          <td className="p-5 whitespace-nowrap text-sm text-on-surface-variant font-medium">
                            {formatDateForTable(task.appointment_date)}
                          </td>
                          <td className="p-5">
                            <span className="font-bold text-on-surface text-base">{task.patient}</span>
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
                            ) : isMismatch ? (
                              <div className="flex items-center gap-2 text-error font-bold text-sm bg-error-container/30 w-max px-3 py-1.5 rounded-full">
                                🔴 Mismatch
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-secondary font-bold text-sm bg-secondary-container/30 w-max px-3 py-1.5 rounded-full">
                                🟡 Pending
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
                                <button 
                                  onClick={() => handleVerify(task.id)}
                                  className="flex items-center gap-1.5 bg-primary-container text-on-primary-container font-bold px-5 py-2 rounded-xl hover:brightness-110 transition-all text-sm shadow-sm"
                                >
                                  Verify
                                </button>
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
                {/* 1. Informasi Anak / Pasien */}
                <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-primary border-b border-surface-container pb-1.5">
                    <User className="w-4 h-4" /> Informasi Anak & Orang Tua
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Nama Anak</p>
                      <p className="font-semibold text-base text-on-surface">{selectedAppointment.nama_anak}</p>
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
                  <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-2">
                    <h3 className="font-bold flex items-center gap-2 text-secondary">
                      <Layers className="w-4 h-4" /> Layanan Medis
                    </h3>
                    <p className="text-base font-bold text-on-surface bg-surface-container px-3 py-1.5 rounded-xl w-max">
                      {selectedAppointment.service_name || 'Tidak diketahui'}
                    </p>
                  </div>
                  <div className="bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container space-y-2">
                    <h3 className="font-bold flex items-center gap-2 text-secondary">
                      <User className="w-4 h-4" /> Terapis Bertugas
                    </h3>
                    <p className="text-base font-bold text-on-surface">{selectedAppointment.therapist}</p>
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
                {selectedAppointment.status_pembayaran !== 'Verified' && (
                  <button onClick={() => handleVerify(selectedAppointment.id)} className="bg-primary-container text-on-primary-container font-bold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all text-sm shadow-sm">
                    Sahkan & Verifikasi
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}