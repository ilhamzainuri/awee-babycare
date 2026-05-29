import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  FileEdit, 
  CheckCircle2, 
  ArrowRight,
  User,
  History,
  Trash2,
  RefreshCw,
  Activity,
  ArrowRightCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

// Tipe Data dari API
interface AuditLogData {
  id: number;
  aksi: 'create' | 'update' | 'delete' | 'restore';
  nama_tabel: string;
  record_id: number;
  data_lama: string | null; 
  data_baru: string | null; 
  created_at: string;
  user: string;
  role: string;
}

// Helper untuk format UI berdasarkan jenis Aksi
const getUiConfig = (aksi: string, tabel: string) => {
  switch (aksi) {
    case 'create':
      return {
        action: `Input ${tabel}`,
        icon: CheckCircle2,
        color: "bg-tertiary-container/10 text-tertiary",
        descriptionPrefix: "Menambahkan data baru di tabel"
      };
    case 'update':
      return {
        action: `Update ${tabel}`,
        icon: FileEdit,
        color: "bg-secondary-container/20 text-secondary",
        descriptionPrefix: "Memperbarui data di tabel"
      };
    case 'delete':
      return {
        action: `Hapus ${tabel}`,
        icon: Trash2,
        color: "bg-error-container/20 text-error",
        descriptionPrefix: "Menghapus data di tabel"
      };
    case 'restore':
      return {
        action: `Restore ${tabel}`,
        icon: RefreshCw,
        color: "bg-primary-container/20 text-primary",
        descriptionPrefix: "Mengembalikan data yang dihapus di tabel"
      };
    default:
      return {
        action: `Aktivitas ${tabel}`,
        icon: Activity,
        color: "bg-surface-container text-on-surface",
        descriptionPrefix: "Aktivitas pada tabel"
      };
  }
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchUser, setSearchUser] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Filter log secara reaktif
  const filteredLogs = logs.filter(log => {
    const matchesUser = (log.user || '').toLowerCase().includes(searchUser.toLowerCase()) ||
                        (log.role || '').toLowerCase().includes(searchUser.toLowerCase()) ||
                        (log.nama_tabel || '').toLowerCase().includes(searchUser.toLowerCase()) ||
                        (log.aksi || '').toLowerCase().includes(searchUser.toLowerCase());
                        
    let matchesDate = true;
    if (searchDate && log.created_at) {
      const logDateString = log.created_at.substring(0, 10);
      matchesDate = logDateString === searchDate;
    }
    
    return matchesUser && matchesDate;
  });

  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/auditlog.php` 
    : 'http://localhost/awee-babycare/backend/api/auditlog.php';

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        
        const result = await response.json();
        if (result.status !== 200) throw new Error(result.message);
        
        setLogs(result.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [apiUrl]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">System Audit Log</h1>
        <p className="text-on-surface-variant font-medium">Review recent administrative and operational activities across the clinic.</p>
      </div>

      {/* Advanced Filters */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container p-6 rounded-3xl shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Search User / Table / Action</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text" 
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Cari user, tabel, atau aksi..."
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container transition-all text-on-surface"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="date" 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container transition-all text-on-surface"
              />
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            setSearchUser('');
            setSearchDate('');
          }}
          disabled={!searchUser && !searchDate}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 font-black rounded-2xl transition-all text-sm",
            searchUser || searchDate 
              ? "bg-error/10 text-error hover:bg-error/20 cursor-pointer shadow-md"
              : "bg-surface-container text-on-surface-variant opacity-60 cursor-not-allowed"
          )}
        >
          <Trash2 className="w-4 h-4" />
          RESET FILTER PENCARIAN
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center text-sm font-bold">
          Error: {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
         <div className="text-center py-12 text-on-surface-variant font-medium">
           Belum ada log aktivitas di sistem.
         </div>
      )}

      {!loading && !error && logs.length > 0 && filteredLogs.length === 0 && (
         <div className="text-center py-12 text-on-surface-variant font-medium">
           Tidak ada aktivitas yang cocok dengan filter pencarian Anda.
         </div>
      )}

      {/* Timeline List */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="relative space-y-6">
          <div className="absolute left-5 sm:left-24 top-8 bottom-8 w-[2px] bg-surface-container rounded-full hidden sm:block" />

          {filteredLogs.map((log, i) => {
            const dateObj = new Date(log.created_at);
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(' ', " '");
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            const config = getUiConfig(log.aksi, log.nama_tabel);
            const Icon = config.icon;

            // Ekstrak informasi detail perubahan (Semua properti yang berubah)
            let changedProps: { key: string; from: any; to: any }[] = [];
            let payloadToShow: Record<string, any> | null = null;

            try {
              if (log.aksi === 'update' && log.data_lama && log.data_baru) {
                const lama = JSON.parse(log.data_lama);
                const baru = JSON.parse(log.data_baru);
                
                // Gabungkan semua key unik dari objek lama dan baru
                const allKeys = Array.from(new Set([...Object.keys(lama), ...Object.keys(baru)]));

                for (const key of allKeys) {
                  if (key === 'updated_at' || key === 'created_at' || key === 'id' || key === 'user_id' || key === 'deleted_at') continue;
                  
                  const valLama = lama[key];
                  const valBaru = baru[key];
                  
                  // SOLUSI BUG: Jika di satu sisi kosong/null/undefined dan di sisi lain juga kosong/null/"" -> ABAIKAN
                  const isLamaEmpty = valLama === undefined || valLama === null || valLama === '';
                  const isBaruEmpty = valBaru === undefined || valBaru === null || valBaru === '';
                  if (isLamaEmpty && isBaruEmpty) continue;
                  
                  if (valLama !== valBaru) {
                    changedProps.push({ 
                      key: key.replace('_', ' '), // Merapikan dari nama_terapis menjadi nama terapis
                      from: !isLamaEmpty ? valLama : 'Kosong', 
                      to: !isBaruEmpty ? valBaru : 'Kosong' 
                    });
                  }
                }
              } else if (log.aksi === 'create' && log.data_baru) {
                payloadToShow = JSON.parse(log.data_baru);
              } else if (log.aksi === 'delete' && log.data_lama) {
                payloadToShow = JSON.parse(log.data_lama);
              }
            } catch (e) {
              console.error("Gagal parse JSON log", e);
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={log.id}
                className="flex flex-col sm:flex-row gap-4 sm:gap-12 relative group"
              >
                <div className={cn(
                  "hidden sm:flex flex-col items-end w-24 shrink-0 transition-opacity pt-2 group-hover:opacity-100",
                  i === 0 ? "opacity-100" : "opacity-40"
                )}>
                  <span className="text-sm font-black text-on-surface">{dateStr}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">{timeStr}</span>
                </div>

                <div className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center relative z-10 shrink-0 border-4 border-surface-container-lowest shadow-sm overflow-hidden">
                  <div className={cn("w-full h-full flex items-center justify-center", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="sm:hidden flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-on-surface">{dateStr}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">{timeStr}</span>
                  </div>
                </div>

                <div className="flex-1 bg-surface-container-lowest border border-surface-container p-6 rounded-3xl shadow-sm group-hover:shadow-md group-hover:border-primary-container/20 transition-all">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      config.color
                    )}>
                      {config.action}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-primary-container text-sm">
                      <User className="w-3 h-3" />
                      {log.user} <span className="text-on-surface-variant text-[10px] uppercase ml-1">({log.role})</span>
                    </div>
                  </div>
                  
                  <p className="text-xl font-bold text-on-surface tracking-tight leading-tight">
                    {config.descriptionPrefix} <span className="capitalize">{log.nama_tabel}</span> <span className="text-sm font-medium text-on-surface-variant opacity-70">#ID:{log.record_id}</span>
                  </p>

                  {/* Render Data Perubahan (Update) */}
                  {changedProps.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {changedProps.map((prop, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl w-fit">
                          <span className="text-xs text-on-surface-variant font-bold uppercase mr-2">{prop.key}:</span>
                          <span className="text-sm text-on-surface-variant line-through font-medium max-w-[150px] truncate" title={String(prop.from)}>{String(prop.from)}</span>
                          <ArrowRight className="w-4 h-4 text-outline shrink-0" />
                          <span className="text-sm text-tertiary font-black max-w-[150px] truncate" title={String(prop.to)}>{String(prop.to)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Payload (Create / Delete) */}
                  {payloadToShow && (
                    <div className="mt-4 p-4 bg-surface-container-low rounded-xl w-full sm:w-fit">
                      <div className="flex items-center gap-2 mb-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
                        <ArrowRightCircle className="w-3 h-3" />
                        Detail Payload
                      </div>
                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                        {Object.entries(payloadToShow).map(([key, value]) => (
                           key !== 'updated_at' && key !== 'created_at' && value !== null && (
                            <React.Fragment key={key}>
                              <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-wider pt-0.5">{key}</span>
                              <span className="font-medium text-on-surface break-all">{String(value)}</span>
                            </React.Fragment>
                           )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Button Load More */}
      {!loading && !error && logs.length > 0 && (
        <div className="flex justify-center pb-12">
          <button className="px-8 py-3 rounded-full border-2 border-surface-container text-primary-container font-black hover:bg-surface-container transition-all text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            LOAD MORE ACTIVITY
          </button>
        </div>
      )}
    </div>
  );
}