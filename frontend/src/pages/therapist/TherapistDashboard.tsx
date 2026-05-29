import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

// Interface untuk data internal dashboard
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

  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/therapist_dashboard.php` 
    : 'http://localhost/awee-babycare/backend/api/therapist_dashboard.php';

  useEffect(() => {
    const fetchTherapistData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal memuat data dashboard terapis');
        const result = await response.json();
        
        if (result.status === 200) {
          setProfile(result.data.profile);
          setSchedules(result.data.schedules || []);
          setHistory(result.data.history || []);
        }
      } catch (err: any) {
        setError(err.message);
        // MOCK DATA UNTUK PREVIEW JIKA API BELUM SIAP
        setProfile({ name: 'Bidan Naya', status: 'Standby', weeklyCommission: 1250000 });
        setSchedules([
          { id: 1, childName: 'Arkananta Putra', time: '09:00 - 10:30', address: 'Jl. Merbabu No. 12', status: 'Confirmed' },
          { id: 2, childName: 'Baby Alika', time: '13:00 - 14:30', address: 'Perum Gading Asri Blok C-5', status: 'On Process' },
          { id: 3, childName: 'Rayyanza', time: '16:00 - 17:30', address: 'Sawojajar Gang 2, No. 14', status: 'Pending' }
        ]);
        setHistory([
          { id: 101, childName: 'Kenzie Ramadhan', serviceName: 'Baby Spa + Massage', date: 'Kemarin', commission: 150000 },
          { id: 102, childName: 'Aisya Humaira', serviceName: 'Pediatric Massage', date: '28 Mei 2026', commission: 120000 },
          { id: 103, childName: 'Gibran Rakabuming', serviceName: 'Tindik Telinga Medis', date: '27 Mei 2026', commission: 90000 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTherapistData();
  }, [apiUrl]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-on-surface-variant font-bold animate-pulse text-sm">Menyelaraskan Tugas Hari Ini...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-0">
      
      {/* 1. WIDGET RINGKASAN & SALUTATION */}
      <section className="bg-gradient-to-br from-primary/10 via-primary-container/5 to-surface-container-lowest p-6 rounded-3xl border border-primary-container/20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">Therapist Portal</span>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface mt-2">Halo, {profile?.name || 'Terapis'}! 👋</h1>
            <p className="text-xs text-on-surface-variant mt-1">Siap memberikan pelayanan terbaik untuk buah hati hari ini?</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            {/* Status Card */}
            <div className="flex-1 md:flex-none bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                profile?.status === 'Standby' ? "bg-success" : "bg-warning"
              )} />
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Status Anda</p>
                <p className="text-sm font-extrabold text-on-surface">{profile?.status}</p>
              </div>
            </div>

            {/* Commission Card */}
            <div className="flex-1 md:flex-none bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="p-2 bg-secondary-container/20 text-secondary rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
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
        
        {/* 2. DAFTAR JADWAL HARI INI (CARD VIEW) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black text-on-surface">Jadwal Kunjungan Hari Ini</h2>
            </div>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">
              {schedules.length} Sesi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.length === 0 ? (
              <div className="col-span-2 bg-surface-container-lowest border border-dashed border-surface-container p-8 text-center rounded-3xl text-sm text-on-surface-variant italic">
                Tidak ada jadwal kunjungan tersisa untuk hari ini.
              </div>
            ) : (
              schedules.map((schedule, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={schedule.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                >
                  {/* Status Indicator Bar */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1.5",
                    schedule.status === 'On Process' && "bg-warning",
                    schedule.status === 'Confirmed' && "bg-primary",
                    schedule.status === 'Pending' && "bg-outline"
                  )} />

                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold text-on-surface-variant tracking-wide bg-surface-container px-2 py-1 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {schedule.time}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                        schedule.status === 'On Process' && "bg-warning-container/30 text-warning",
                        schedule.status === 'Confirmed' && "bg-primary-container/20 text-primary",
                        schedule.status === 'Pending' && "bg-surface-container text-on-surface-variant"
                      )}>
                        {schedule.status}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-on-surface group-hover:text-primary transition-colors">{schedule.childName}</h3>
                    
                    <div className="flex items-start gap-1.5 text-on-surface-variant text-xs mt-2 mb-4">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-outline" />
                      <p className="line-clamp-2">{schedule.address}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => alert(`Membuka detail reservasi #${schedule.id}`)}
                    className="w-full bg-surface-container border border-surface-container-high hover:bg-primary hover:text-white text-on-surface text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Lihat Detail & Lokasi</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* 3. RIWAYAT SINGKAT LAYANAN */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-on-surface">Riwayat Singkat</h2>
            <p className="text-[11px] text-primary font-bold hover:underline cursor-pointer flex items-center">
              Semua <ChevronRight className="w-3 h-3" />
            </p>
          </div>

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
    </div>
  );
}