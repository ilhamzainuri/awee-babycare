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
  Thermometer,
  Scale,
  ClipboardList,
  UploadCloud,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Interface Data
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
  status: 'Pending' | 'Confirmed' | 'On Process';
  phone?: string;
  mapLink?: string;
  complaint?: string;
  waktu_reservasi?: string;
  usia?: string;
  bb?: string;
  services?: string;
}

interface HistoryItem {
  id: number;
  childName: string;
  serviceName: string;
  date: string;
  commission: number;
}

export default function TherapistDashboard() {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [schedules, setSchedules] = useState<ActiveSchedule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Modal Semua Jadwal
  const [isAllSchedulesOpen, setIsAllSchedulesOpen] = useState(false);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'upcoming' | 'all'>('upcoming'); 

  // State Modal Detail Lokasi
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // State Start Service (Pemeriksaan Awal) telah dipindah ke halaman terpisah


  // State Laporan Selesai telah dipindah ke halaman terpisah


  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
  const apiUrl = `${baseUrl}/therapist_dashboard.php`;

  // 1. Fetch Dashboard Utama
  useEffect(() => {
    const fetchTherapistData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
        const user = JSON.parse(sessionStr);
        if (!user.id) throw new Error('ID User tidak valid di dalam sesi.');

        const response = await fetch(`${apiUrl}?user_id=${user.id}`);
        const result = await response.json();
        
        if (response.ok && result.status === 200) {
          setProfile(result.data.profile);
          setSchedules(result.data.schedules || []);
          setHistory(result.data.history || []);
        } else {
          throw new Error(result.message || 'Gagal memuat data dari server');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTherapistData();
  }, [apiUrl]);

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

  // Fungsi Filter 7 Hari Kedepan
  const getDisplayedSchedules = () => {
    if (scheduleTab === 'all') return allSchedules;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    return allSchedules.filter(item => {
      // Safely parse SQL datetime string by replacing space with 'T'
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

  const openStartModal = () => {
    navigate('/therapist/start-service', { state: { selectedDetail } });
  };

  const openReportModal = () => {
    navigate('/therapist/submit-report', { state: { selectedDetail } });
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="text-on-surface-variant font-bold animate-pulse text-sm">Menyelaraskan Tugas Hari Ini...</div></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-0 relative">
      {error && <div className="p-4 bg-error-container text-on-error-container rounded-2xl font-bold text-sm">Terjadi Kesalahan: {error}</div>}

      {/* WIDGET RINGKASAN & SALUTATION */}
      <section className="bg-gradient-to-br from-primary/10 via-primary-container/5 to-surface-container-lowest p-6 rounded-3xl border border-primary-container/20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">Therapist Portal</span>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface mt-2">Halo, {profile?.name || 'Terapis'}! 👋</h1>
            <p className="text-xs text-on-surface-variant mt-1">Siap memberikan pelayanan terbaik untuk buah hati hari ini?</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className={cn("w-3 h-3 rounded-full animate-pulse", profile?.status === 'Standby' ? "bg-success" : "bg-warning")} />
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Status Anda</p>
                <p className="text-sm font-extrabold text-on-surface">{profile?.status}</p>
              </div>
            </div>
            <div className="flex-1 md:flex-none bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="p-2 bg-secondary-container/20 text-secondary rounded-xl"><DollarSign className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Komisi (Minggu Ini)</p>
                <p className="text-sm font-extrabold text-primary">{formatRupiah(profile?.weeklyCommission || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DAFTAR JADWAL HARI INI */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black text-on-surface">Jadwal Kunjungan Hari Ini</h2>
            </div>
            <button onClick={() => setIsAllSchedulesOpen(true)} className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-full transition-all">
              Semua Jadwal <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.length === 0 ? (
              <div className="col-span-2 bg-surface-container-lowest border border-dashed border-surface-container p-8 text-center rounded-3xl text-sm text-on-surface-variant italic">
                Tidak ada jadwal kunjungan tersisa untuk hari ini.
              </div>
            ) : (
              schedules.map((schedule, index) => (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} key={schedule.id} className="bg-surface-container-lowest border border-surface-container rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5", schedule.status === 'On Process' && "bg-warning", schedule.status === 'Confirmed' && "bg-primary", schedule.status === 'Pending' && "bg-outline")} />
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold text-on-surface-variant tracking-wide bg-surface-container px-2 py-1 rounded-md flex items-center gap-1"><Clock className="w-3 h-3" /> {schedule.time}</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md", schedule.status === 'On Process' && "bg-warning-container/30 text-warning", schedule.status === 'Confirmed' && "bg-primary-container/20 text-primary", schedule.status === 'Pending' && "bg-surface-container text-on-surface-variant")}>
                        {schedule.status}
                      </span>
                    </div>
                    <h3 className="font-black text-base text-on-surface group-hover:text-primary transition-colors">{schedule.childName}</h3>
                    <div className="flex items-start gap-1.5 text-on-surface-variant text-xs mt-2 mb-4">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-outline" />
                      <p className="line-clamp-2">{schedule.address}</p>
                    </div>
                  </div>

                  <button onClick={() => setSelectedDetail(schedule)} className="w-full bg-surface-container border border-surface-container-high hover:bg-primary hover:text-white text-on-surface text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn">
                    <span>Lihat Detail & Lokasi</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* RIWAYAT SINGKAT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-black text-on-surface">Riwayat Singkat</h2></div>
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
                            <h3 className="font-bold text-on-surface text-base truncate">{item.nama_anak}</h3>
                            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", item.status_jadwal === 'Menunggu' ? "bg-surface-container text-on-surface border-outline-variant" : item.status_jadwal === 'Diproses' ? "bg-warning-container/30 text-warning border-warning/20" : item.status_jadwal === 'Selesai' ? "bg-success-container/30 text-success border-success/20" : "bg-error-container/30 text-error border-error/20")}>{item.status_jadwal}</span>
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
                            id: item.id, childName: item.nama_anak, usia: item.usia_saat_ini, bb: item.bb_saat_ini, address: item.alamat_lengkap, time: formatDate(item.waktu_reservasi), status: item.status_jadwal === 'Menunggu' ? 'Pending' : (item.status_jadwal === 'Diproses' ? 'On Process' : item.status_jadwal), phone: item.no_hp_ortu, mapLink: item.link_shareloc, complaint: item.keluhan_awal, services: item.rincian_layanan
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
                
                {/* Info Anak */}
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-3">Informasi Anak</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Nama Pasien</p>
                      <p className="font-black text-lg text-on-surface">{selectedDetail.childName || selectedDetail.nama_anak}</p>
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

                {/* Daftar Layanan */}
                <div>
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-primary"/> Daftar Layanan</h4>
                  <div className="bg-surface-container-low border border-surface-container p-3 rounded-xl">
                    <ul className="list-decimal list-inside space-y-1.5">
                      {selectedDetail.services ? selectedDetail.services.split('+').map((srv: string, idx: number) => (
                        <li key={idx} className="text-sm font-bold text-on-surface">{srv.trim()}</li>
                      )) : (
                        <li className="text-sm font-bold text-on-surface">Layanan Umum</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Alamat Lengkap Kunjungan</p>
                  <p className="text-sm text-on-surface bg-surface-container-low p-3 rounded-xl border border-surface-container">{selectedDetail.address}</p>
                  
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
                {selectedDetail.status === 'Pending' || selectedDetail.status === 'Menunggu' ? (
                  <button onClick={openStartModal} className="w-full bg-primary hover:bg-primary/90 text-on-primary text-sm font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30">
                    <Activity className="w-5 h-5"/> Mulai Layanan Sekarang
                  </button>
                ) : selectedDetail.status === 'On Process' || selectedDetail.status === 'Diproses' ? (
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

      {/* MODALS UNTUK HALAMAN SEPARATE SUDAH DIHAPUS */}


    </div>
  );
}