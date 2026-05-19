import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  Wallet, 
  AlertTriangle, 
  Timer,
  Coffee,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  // 1. Inisialisasi State untuk menyimpan data dari API
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Fetch Data dari PHP Native Backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Memanggil API menggunakan URL dari .env
        const apiUrl = import.meta.env.VITE_API_BASE_URL 
          ? `${import.meta.env.VITE_API_BASE_URL}/dashboard.php` 
          : 'http://localhost/awee-babycare/backend/api/dashboard.php';

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal terhubung ke server');
        
        const result = await response.json();
        
        if (result.status === 200) {
          setData({
            kpis: result.data.kpis,
            alerts: result.data.alerts
          });
        } else {
          throw new Error(result.message || 'Terjadi kesalahan pada data');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // Auto-refresh data setiap 1 menit (opsional)
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  // 3. Mapping data API ke struktur KPI UI
  const dynamicKpis = [
    { 
      label: 'Total Reservasi Hari Ini', 
      value: data.kpis.reservasi.toString(), 
      icon: CalendarCheck, 
      color: 'text-primary', 
      bgColor: 'bg-primary-container/20' 
    },
    { 
      label: 'Terapis On-Duty vs Standby', 
      value: data.kpis.terapis_aktif.toString(), 
      subValue: `/ ${data.kpis.terapis_total}`,
      icon: Users, 
      color: 'text-secondary', 
      bgColor: 'bg-secondary-container/20' 
    },
    { 
      label: 'Menunggu Verifikasi', 
      value: data.kpis.unverified.toString(), 
      icon: Clock, 
      color: 'text-error', 
      bgColor: 'bg-error-container/30',
      isUrgent: data.kpis.unverified > 0 // Akan urgent jika ada > 0
    },
    { 
      label: 'Estimasi Omzet Hari Ini', 
      value: formatRupiah(data.kpis.omzet), 
      icon: Wallet, 
      color: 'text-tertiary', 
      bgColor: 'bg-tertiary-container/20' 
    },
  ];

  // Data jadwal sementara tetap statis, bisa dihubungkan ke API dengan cara yang sama nantinya
  const schedule = [
    {
      id: 1,
      therapist: 'Therapist Budi',
      specialty: 'Physiotherapy',
      patient: 'Patient Kimi',
      room: 'Room 1',
      time: '11:00 - 12:00',
      status: 'active',
      img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 2,
      therapist: 'Therapist Siti',
      specialty: 'Occupational Therapy',
      status: 'break',
      img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 3,
      therapist: 'Therapist Dika',
      specialty: 'Speech Therapy',
      patient: 'Patient Leo',
      room: 'Room 3',
      time: '11:30 - 12:30',
      status: 'upcoming',
      initials: 'DA'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-on-surface-variant font-bold animate-pulse">Memuat Data Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error-container text-on-error-container rounded-xl font-bold">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {dynamicKpis.map((kpi, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
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
        {/* Warning System */}
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
                  whileHover={{ x: 4 }}
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-3xl border-l-[6px] shadow-sm bg-surface-container-lowest",
                    alert.type === 'error' ? "border-l-error" : "border-l-secondary-container"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-full",
                      alert.type === 'error' ? "bg-error/10 text-error" : "bg-secondary-container/20 text-secondary"
                    )}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-on-surface text-sm">{alert.title}</h3>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">{alert.time}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                      {alert.type === 'error' && (
                        <div className="mt-4 flex gap-2">
                          <button className="px-4 py-2 bg-error text-on-error rounded-xl text-xs font-bold hover:bg-error/90 transition-all">
                            Review
                          </button>
                          <button className="px-4 py-2 border border-outline text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container transition-all">
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Therapist Schedule */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Therapist Schedule</h2>
            <button className="text-primary-container font-bold text-sm flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden shadow-sm">
            {/* Timeline Bar */}
            <div className="flex overflow-x-auto p-4 bg-surface-container-low border-b border-surface-container gap-8 hide-scrollbar">
               {['11:00', '12:00', '13:00', '14:00'].map((time, i) => (
                 <div key={time} className={cn("text-center min-w-[60px]", i > 0 && "opacity-40 whitespace-nowrap")}>
                    <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest">{i === 0 ? 'NOW' : i === 1 ? 'UP NEXT' : 'LATER'}</p>
                    <p className="text-base font-bold text-on-surface">{time}</p>
                 </div>
               ))}
            </div>

            {/* List */}
            <div className="divide-y divide-surface-container">
              {schedule.map((item) => (
                <div key={item.id} className="p-4 md:p-6 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-surface-container-highest">
                      {item.img ? (
                        <img src={item.img} alt={item.therapist} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant">
                          {item.initials}
                        </div>
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-on-surface text-sm">{item.therapist}</h3>
                      <p className="text-xs text-on-surface-variant">{item.specialty}</p>
                   </div>
                   {item.status === 'break' ? (
                     <div className="flex items-center gap-2 px-4 py-2 bg-surface-container text-on-surface-variant rounded-xl border border-dashed border-outline-variant">
                       <Coffee className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase tracking-wide">Break</span>
                     </div>
                   ) : (
                     <div className={cn(
                       "p-3 rounded-2xl border transition-all max-w-[200px] flex flex-col gap-1",
                       item.status === 'active' ? "bg-primary-container/10 border-primary-container text-primary-container" : "bg-secondary-container/10 border-secondary-container text-secondary"
                     )}>
                        <p className="text-xs font-bold truncate">{item.patient}</p>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{item.room} • {item.time}</p>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}