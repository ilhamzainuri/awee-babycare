import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  Wallet, 
  AlertTriangle, 
  Coffee,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

// Tipe Data
interface ScheduleData {
  id: number;
  therapist: string;
  specialty: string;
  patient: string | null;
  room: string; // Sekarang berisi alamat lengkap dari API
  time: string;
  status: 'active' | 'upcoming' | 'break' | 'completed' | string;
  initials: string;
}

interface GroupedSchedule {
  [therapistName: string]: {
    initials: string;
    specialty: string;
    appointments: ScheduleData[];
  };
}

export default function Dashboard() {
  // State Utama
  const [data, setData] = useState({
    kpis: {
      reservasi: 0,
      terapis_aktif: 0,
      terapis_total: 0,
      unverified: 0,
      omzet: 0
    },
    alerts: []
  });
  
  // State Jadwal & Filter
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTherapist, setFilterTherapist] = useState('');
  
  // State Loading & Error
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sesuaikan URL API Anda
  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/dashboard.php` 
    : 'http://localhost/awee-babycare/backend/api/dashboard.php';

  // 1. Fetch data awal (KPI & Alerts)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal terhubung ke server');
        const result = await response.json();
        
        if (result.status === 200) {
          setData({ kpis: result.data.kpis, alerts: result.data.alerts });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [apiUrl]);

  // 2. Fetch jadwal dinamis berdasarkan filter dengan teknik Debounce
  useEffect(() => {
    const fetchFilteredSchedule = async () => {
      setIsScheduleLoading(true);
      try {
        const response = await fetch(`${apiUrl}?action=schedule&date=${filterDate}&therapist=${filterTherapist}`);
        if (!response.ok) throw new Error('Gagal memuat jadwal');
        
        const result = await response.json();
        if (result.status === 200) {
          setSchedules(result.data.schedules || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsScheduleLoading(false);
      }
    };

    // Jeda 500ms saat mengetik sebelum memanggil API (Debounce)
    const delayDebounceFn = setTimeout(() => {
      fetchFilteredSchedule();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [apiUrl, filterDate, filterTherapist]);

  // Utility Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
  };

  // Konfigurasi Array KPI
  const dynamicKpis = [
    { 
      label: 'Total Reservasi Hari Ini', 
      value: data.kpis.reservasi.toString(), 
      icon: CalendarCheck, color: 'text-primary', bgColor: 'bg-primary-container/20' 
    },
    { 
      label: 'Terapis On-Duty vs Standby', 
      value: data.kpis.terapis_aktif.toString(), subValue: `/ ${data.kpis.terapis_total}`,
      icon: Users, color: 'text-secondary', bgColor: 'bg-secondary-container/20' 
    },
    { 
      label: 'Menunggu Verifikasi', 
      value: data.kpis.unverified.toString(), 
      icon: Clock, color: 'text-error', bgColor: 'bg-error-container/30',
      isUrgent: data.kpis.unverified > 0
    },
    { 
      label: 'Estimasi Omzet Hari Ini', 
      value: formatRupiah(data.kpis.omzet), 
      icon: Wallet, color: 'text-tertiary', bgColor: 'bg-tertiary-container/20' 
    },
  ];

  // 3. Logika Grouping berdasarkan nama Terapis
  const groupedSchedules: GroupedSchedule = schedules.reduce((acc: GroupedSchedule, curr) => {
    if (!acc[curr.therapist]) {
      acc[curr.therapist] = {
        initials: curr.initials,
        specialty: curr.specialty,
        appointments: []
      };
    }
    acc[curr.therapist].appointments.push(curr);
    return acc;
  }, {});

  // Tampilan Loading & Error Global
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-on-surface-variant font-bold animate-pulse">Memuat Data Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error-container text-on-error-container rounded-xl font-bold">Error: {error}</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================= KPI SECTION ================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {dynamicKpis.map((kpi, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={kpi.label}
            className={cn(
              "p-4 md:p-6 rounded-3xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md",
              kpi.isUrgent ? "bg-error-container/20 border-error-container" : "bg-surface-container-lowest border-surface-container-high"
            )}
          >
            <div className={cn("p-2 rounded-xl inline-flex mb-4", kpi.bgColor, kpi.color)}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div>
              <p className={cn("text-xs md:text-sm mb-1 font-medium", kpi.isUrgent ? "text-error" : "text-on-surface-variant")}>
                {kpi.label}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl md:text-3xl font-extrabold", kpi.isUrgent ? "text-error" : "text-on-surface")}>
                  {kpi.value}
                </span>
                {kpi.subValue && <span className="text-on-surface-variant text-sm md:text-lg font-bold">{kpi.subValue}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= WARNING SYSTEM ================= */}
        <section className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Warning System</h2>
            {data.alerts.length > 0 && (
              <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                Action Required
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {data.alerts.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">Tidak ada peringatan. Sistem berjalan normal.</p>
            ) : (
              data.alerts.map((alert: any) => (
                <motion.div
                  whileHover={{ x: 4 }} key={alert.id}
                  className={cn(
                    "p-4 rounded-3xl border-l-[6px] shadow-sm bg-surface-container-lowest",
                    alert.type === 'error' ? "border-l-error" : "border-l-secondary-container"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2 rounded-full", alert.type === 'error' ? "bg-error/10 text-error" : "bg-secondary-container/20 text-secondary")}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-on-surface text-sm">{alert.title}</h3>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">{alert.time}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{alert.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* ================= THERAPIST SCHEDULE ================= */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-on-surface">Therapist Schedule</h2>
            
            {/* Filter Controls */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="text" 
                  placeholder="Cari terapis..." 
                  value={filterTherapist}
                  onChange={(e) => setFilterTherapist(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-surface-container rounded-xl text-xs focus:ring-2 focus:ring-primary-container transition-all text-on-surface outline-none"
                />
              </div>
              <div className="relative flex-1 sm:flex-none">
                <CalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-surface-container rounded-xl text-xs focus:ring-2 focus:ring-primary-container transition-all text-on-surface-variant outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden shadow-sm min-h-[250px] relative">
            {/* Overlay Loading Jadwal */}
            {isScheduleLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/50 backdrop-blur-sm z-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* List Data Terkelompok */}
            <div className="divide-y divide-surface-container">
              {Object.keys(groupedSchedules).length === 0 && !isScheduleLoading ? (
                <div className="p-8 text-center text-on-surface-variant text-sm font-bold">
                  Tidak ada jadwal untuk kriteria pencarian ini.
                </div>
              ) : (
                Object.entries(groupedSchedules).map(([therapistName, tData]) => (
                  <div key={therapistName} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    
                    {/* Profil Terapis (Kolom Kiri) */}
                    <div className="flex items-center gap-4 md:w-1/3 shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-surface-container-highest flex items-center justify-center bg-surface-container text-on-surface-variant font-bold">
                         {tData.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-on-surface text-sm truncate">{therapistName}</h3>
                        <p className="text-xs text-on-surface-variant truncate">{tData.specialty}</p>
                      </div>
                    </div>

                    {/* Daftar Jadwal Pasien (Kolom Kanan - Horizontal Scroll) */}
                    <div className="flex-1 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {tData.appointments.map((item, idx) => (
                        <React.Fragment key={item.id || idx}>
                          {item.status === 'break' ? (
                            <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-surface-container text-on-surface-variant rounded-2xl border border-dashed border-outline-variant min-w-[140px]">
                              <Coffee className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wide">Break • {item.time}</span>
                            </div>
                          ) : (
                            <div 
                              className={cn(
                                "shrink-0 p-3 rounded-2xl border transition-all min-w-[160px] max-w-[200px] flex flex-col gap-1 justify-center",
                                item.status === 'active' || item.status === 'Diproses' 
                                  ? "bg-primary-container/10 border-primary-container text-primary-container" 
                                  : "bg-secondary-container/10 border-secondary-container text-secondary"
                              )}
                              title={item.room} // <-- Menampilkan alamat lengkap saat di hover
                            >
                              <p className="text-xs font-bold truncate">{item.patient || 'Pasien Umum'}</p>
                              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest truncate">
                                {item.room} • {item.time}
                              </p>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}