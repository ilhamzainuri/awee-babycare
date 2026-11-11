import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Calendar, 
  FileEdit, 
  CheckCircle2, 
  ArrowRight,
  User,
  History,
  Trash2,
  RefreshCw,
  Activity,
  ArrowRightCircle,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  X,
  Check,
  ShieldCheck,
  Layers,
  Sparkles,
  Loader2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

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
  can_restore?: boolean;
  is_restored?: boolean;
  is_permanently_deleted?: boolean;
  days_remaining?: number | null;
}

interface MetaPagination {
  total: number;
  limit: number;
  offset: number;
}

// Helper untuk format UI berdasarkan jenis Aksi
const getUiConfig = (aksi: string, tabel: string) => {
  switch (aksi) {
    case 'create':
      return {
        action: `Input ${tabel}`,
        icon: CheckCircle2,
        color: "bg-tertiary-container/10 text-tertiary border-tertiary/20",
        descriptionPrefix: "Menambahkan data baru di tabel"
      };
    case 'update':
      return {
        action: `Update ${tabel}`,
        icon: FileEdit,
        color: "bg-secondary-container/20 text-secondary border-secondary/20",
        descriptionPrefix: "Memperbarui data di tabel"
      };
    case 'delete':
      return {
        action: `Hapus ${tabel}`,
        icon: Trash2,
        color: "bg-error-container/20 text-error border-error/20",
        descriptionPrefix: "Menghapus data di tabel"
      };
    case 'restore':
      return {
        action: `Restore ${tabel}`,
        icon: RotateCcw,
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        descriptionPrefix: "Mengembalikan data yang dihapus di tabel"
      };
    default:
      return {
        action: `Aktivitas ${tabel}`,
        icon: Activity,
        color: "bg-surface-container text-on-surface border-surface-container",
        descriptionPrefix: "Aktivitas pada tabel"
      };
  }
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [meta, setMeta] = useState<MetaPagination>({ total: 0, limit: 50, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'delete' | 'restore' | 'update' | 'create'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Restore Modal State
  const [restoreModalLog, setRestoreModalLog] = useState<AuditLogData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Permanent Delete Modal State
  const [permanentDeleteLog, setPermanentDeleteLog] = useState<AuditLogData | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  // User session
  const currentUser = useMemo(() => {
    try {
      const sessionStr = localStorage.getItem('user_session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch {
      return null;
    }
  }, []);

  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL 
    : 'http://localhost/awee-babycare/backend/api';

  const fetchLogs = useCallback(async (currentLimit = 50, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      let url = `${baseUrl}/auditlog.php?limit=${currentLimit}&offset=0`;
      if (activeTab !== 'all') {
        url += `&aksi=${activeTab}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengambil data log dari server');
      
      const result = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Error saat memuat log');
      
      setLogs(result.data || []);
      if (result.meta) {
        setMeta(result.meta);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [baseUrl, activeTab]);

  useEffect(() => {
    fetchLogs(50, true);
  }, [fetchLogs]);

  // Load More Activity
  const handleLoadMore = () => {
    const nextLimit = meta.limit + 50;
    fetchLogs(nextLimit, false);
  };

  // Eksekusi Restore
  const handleConfirmRestore = async () => {
    if (!restoreModalLog) return;
    setIsRestoring(true);

    try {
      const response = await fetch(`${baseUrl}/restore.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_log_id: restoreModalLog.id,
          user_id: currentUser?.id || 1
        })
      });

      const result = await response.json();

      if (!response.ok || result.status !== 200) {
        throw new Error(result.message || 'Gagal memulihkan data');
      }

      toast.success(result.message || 'Data berhasil dipulihkan!');
      setRestoreModalLog(null);
      
      // Refresh logs
      await fetchLogs(meta.limit, false);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memulihkan data');
    } finally {
      setIsRestoring(false);
    }
  };

  // Eksekusi Hapus Permanen
  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteLog) return;
    setIsDeletingPermanently(true);

    try {
      const response = await fetch(`${baseUrl}/permanent_delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_log_id: permanentDeleteLog.id,
          user_id: currentUser?.id || 1
        })
      });

      const result = await response.json();

      if (!response.ok || result.status !== 200) {
        throw new Error(result.message || 'Gagal menghapus data secara permanen');
      }

      toast.success(result.message || 'Data berhasil dihapus permanen.');
      setPermanentDeleteLog(null);

      // Refresh logs
      await fetchLogs(meta.limit, false);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus permanen');
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  // Client-side search & date filter
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        (log.user || '').toLowerCase().includes(query) ||
        (log.role || '').toLowerCase().includes(query) ||
        (log.nama_tabel || '').toLowerCase().includes(query) ||
        (log.aksi || '').toLowerCase().includes(query) ||
        (log.data_lama || '').toLowerCase().includes(query) ||
        (log.data_baru || '').toLowerCase().includes(query);
                          
      let matchesDate = true;
      if (searchDate && log.created_at) {
        const logDateString = log.created_at.substring(0, 10);
        matchesDate = logDateString === searchDate;
      }
      
      return matchesSearch && matchesDate;
    });
  }, [logs, searchQuery, searchDate]);

  // Hitung jumlah item yang bisa di-restore
  const restorableCount = useMemo(() => {
    return logs.filter(l => l.aksi === 'delete' && l.can_restore).length;
  }, [logs]);

  // Helper untuk mengekstrak nama entitas dari data lama
  const getEntityName = (dataLamaStr: string | null) => {
    if (!dataLamaStr) return null;
    try {
      const obj = JSON.parse(dataLamaStr);
      return obj.nama_layanan || obj.nama_terapis || obj.nama_pasien || 
obj.username || obj.nama_kategori || null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">System Audit Log</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black">
              {meta.total} Aktivitas
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">
            Pantau seluruh aktivitas operasional klinik, pulihkan data yang dihapus, atau lakukan pembersihan permanen.
          </p>
        </div>

        {/* Info Pill Restore Tersedia */}
        {restorableCount > 0 && (
          <button
            onClick={() => setActiveTab('delete')}
            className="flex items-center gap-2 px-4 py-2.5 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-error animate-spin-slow" />
            <span>{restorableCount} Data Terhapus Dapat Dipulihkan</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-container-low/80 backdrop-blur-md rounded-2xl border border-surface-container">
        {[
          { id: 'all', label: 'Semua Log', icon: Layers },
          { id: 'delete', label: 'Data Dihapus', icon: Trash2, count: restorableCount > 0 ? restorableCount : undefined },
          { id: 'restore', label: 'Dipulihkan', icon: RotateCcw },
          { id: 'update', label: 'Pembaruan', icon: FileEdit },
          { id: 'create', label: 'Penambahan', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isActive 
                  ? "bg-surface-container-lowest text-primary shadow-sm border border-surface-container font-black"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 bg-error text-white rounded-full text-[10px] font-black leading-none">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Kebijakan Auto-Cleanup 30 Hari Banner (Khusus di Tab Data Dihapus) */}
      {activeTab === 'delete' && (
        <div className="flex items-start gap-3.5 p-4.5 bg-amber-500/10 border border-amber-500/30 rounded-3xl text-xs text-on-surface">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-amber-900 dark:text-amber-300 text-sm">
              Kebijakan Pembersihan Otomatis 30 Hari
            </p>
            <p className="text-on-surface-variant leading-relaxed text-xs">
              Data yang telah dihapus akan disimpan selama <strong>30 hari</strong> untuk memberikan kesempatan pemulihan (restore). 
              Jika tidak dipulihkan dalam 30 hari, sistem secara otomatis akan <strong>menghapusnya secara permanen</strong>. 
              Anda juga dapat memilih tombol <strong>Hapus Permanen</strong> secara manual jika data sudah tidak lagi dibutuhkan.
            </p>
          </div>
        </div>
      )}

      {/* Search & Date Filter Box */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container p-6 rounded-3xl shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">
              Cari Pengguna / Tabel / Kata Kunci
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari admin, tabel, aksi, atau isi data..."
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container transition-all text-on-surface"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">
              Filter Tanggal
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="date" 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container transition-all text-on-surface"
              />
            </div>
          </div>
        </div>

        {(searchQuery || searchDate) && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setSearchDate('');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-error/10 hover:bg-error/20 text-error font-black rounded-2xl transition-all text-xs cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            RESET FILTER PENCARIAN
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-xs font-bold text-on-surface-variant">Memuat audit log dan status data...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-error-container text-on-error-container p-5 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Terjadi kendala: {error}</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && logs.length === 0 && (
         <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-surface-container p-8 space-y-2">
           <Layers className="w-10 h-10 mx-auto text-on-surface-variant/40" />
           <p className="text-on-surface font-bold text-base">Belum ada riwayat aktivitas</p>
           <p className="text-on-surface-variant text-xs">Aktivitas sistem dan log perubahan akan otomatis tercatat di sini.</p>
         </div>
      )}

      {!loading && !error && logs.length > 0 && filteredLogs.length === 0 && (
         <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-surface-container p-8 space-y-2">
           <Search className="w-10 h-10 mx-auto text-on-surface-variant/40" />
           <p className="text-on-surface font-bold text-base">Tidak ada log yang sesuai</p>
           <p className="text-on-surface-variant text-xs">Coba sesuaikan kata kunci pencarian atau reset filter tanggal.</p>
         </div>
      )}

      {/* Timeline List */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="relative space-y-6">
          <div className="absolute left-5 sm:left-24 top-8 bottom-8 w-[2px] bg-surface-container rounded-full hidden sm:block" />

          {filteredLogs.map((log, i) => {
            const dateObj = new Date(log.created_at);
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(' ', " '");
            const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            const config = getUiConfig(log.aksi, log.nama_tabel);
            const Icon = config.icon;

            // Ekstrak informasi detail perubahan (Semua properti yang berubah)
            let changedProps: { key: string; from: any; to: any }[] = [];
            let payloadToShow: Record<string, any> | null = null;
            const entityName = getEntityName(log.data_lama || log.data_baru);

            try {
              if (log.aksi === 'update' && log.data_lama && log.data_baru) {
                const lama = JSON.parse(log.data_lama);
                const baru = JSON.parse(log.data_baru);
                
                const allKeys = Array.from(new Set([...Object.keys(lama), ...Object.keys(baru)]));

                for (const key of allKeys) {
                  if (key === 'updated_at' || key === 'created_at' || key === 'id' || key === 'user_id' || key === 'deleted_at') continue;
                  
                  const valLama = lama[key];
                  const valBaru = baru[key];
                  
                  const isLamaEmpty = valLama === undefined || valLama === null || valLama === '';
                  const isBaruEmpty = valBaru === undefined || valBaru === null || valBaru === '';
                  if (isLamaEmpty && isBaruEmpty) continue;
                  
                  if (valLama !== valBaru) {
                    changedProps.push({ 
                      key: key.replace(/_/g, ' '),
                      from: !isLamaEmpty ? valLama : 'Kosong', 
                      to: !isBaruEmpty ? valBaru : 'Kosong' 
                    });
                  }
                }
              } else if (log.aksi === 'create' && log.data_baru) {
                payloadToShow = JSON.parse(log.data_baru);
              } else if (log.aksi === 'delete' && log.data_lama) {
                payloadToShow = JSON.parse(log.data_lama);
              } else if (log.aksi === 'restore' && log.data_baru) {
                payloadToShow = JSON.parse(log.data_baru);
              }
            } catch (e) {
              console.error("Gagal parse JSON log", e);
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                key={log.id}
                className="flex flex-col sm:flex-row gap-4 sm:gap-12 relative group"
              >
                {/* Waktu Desktop */}
                <div className={cn(
                  "hidden sm:flex flex-col items-end w-24 shrink-0 transition-opacity pt-2 group-hover:opacity-100",
                  i === 0 ? "opacity-100" : "opacity-50"
                )}>
                  <span className="text-sm font-black text-on-surface">{dateStr}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">{timeStr}</span>
                </div>

                {/* Bulatan Icon Desktop */}
                <div className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center relative z-10 shrink-0 border-4 border-surface-container-lowest shadow-sm overflow-hidden">
                  <div className={cn("w-full h-full flex items-center justify-center border", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Waktu Mobile */}
                <div className="sm:hidden flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-on-surface">{dateStr}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">{timeStr}</span>
                  </div>
                </div>

                {/* Card Konten */}
                <div className="flex-1 bg-surface-container-lowest border border-surface-container p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-primary-container/30 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                        config.color
                      )}>
                        {config.action}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-primary-container text-xs">
                        <User className="w-3.5 h-3.5" />
                        {log.user} <span className="text-on-surface-variant text-[10px] uppercase ml-0.5">({log.role})</span>
                      </div>
                    </div>

                    {/* Tombol Restore & Hapus Permanen atau Badge Status */}
                    {log.aksi === 'delete' && (
                      <div className="shrink-0 flex flex-wrap items-center gap-2">
                        {log.can_restore ? (
                          <>
                            {/* Badge Sisa Hari Auto-Cleanup 30 Hari */}
                            {log.days_remaining !== null && log.days_remaining !== undefined && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/25">
                                <Clock className="w-3 h-3" />
                                {log.days_remaining} hari tersisa
                              </span>
                            )}
                            <button
                              onClick={() => setRestoreModalLog(log)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold text-xs transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                              title="Pulihkan data kembali ke sistem"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Pulihkan</span>
                            </button>
                            <button
                              onClick={() => setPermanentDeleteLog(log)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-xl font-bold text-xs transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                              title="Hapus permanen dari database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Permanen</span>
                            </button>
                          </>
                        ) : log.is_restored ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sudah Dipulihkan</span>
                          </span>
                        ) : log.is_permanently_deleted ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant/70 border border-surface-container rounded-xl font-bold text-xs">
                            <Trash2 className="w-3.5 h-3.5 opacity-60" />
                            <span>Dihapus Permanen</span>
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-on-surface tracking-tight leading-snug">
                      {config.descriptionPrefix}{' '}
                      <span className="capitalize font-black text-primary">{log.nama_tabel}</span>
                      {entityName && (
                        <span className="text-on-surface"> &ldquo;{entityName}&rdquo;</span>
                      )}
                      {' '}
                      <span className="text-xs font-semibold text-on-surface-variant opacity-75">
                        (#ID:{log.record_id})
                      </span>
                    </p>

                    {/* Hint sisa waktu 30 hari di subtitle */}
                    {log.aksi === 'delete' && log.can_restore && log.days_remaining !== null && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Otomatis dihapus permanen dalam {log.days_remaining} hari jika tidak dipulihkan.
                      </p>
                    )}

                    {/* Penanda hapus permanen manual */}
                    {log.aksi === 'delete' && (() => {
                      try {
                        const info = JSON.parse(log.data_baru || '{}');
                        return info.keterangan ? (
                          <p className="text-xs text-error font-semibold flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            {info.keterangan}
                          </p>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>

                  {/* Render Data Perubahan (Update) */}
                  {changedProps.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {changedProps.map((prop, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2.5 p-3 bg-surface-container-low rounded-xl w-full sm:w-fit border border-surface-container/60">
                          <span className="text-xs text-on-surface-variant font-bold uppercase mr-1">{prop.key}:</span>
                          <span className="text-xs text-on-surface-variant line-through font-medium max-w-[150px] truncate" title={String(prop.from)}>{String(prop.from)}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span className="text-xs text-tertiary font-black max-w-[180px] truncate" title={String(prop.to)}>{String(prop.to)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Payload (Create / Delete / Restore) */}
                  {payloadToShow && (
                    <div className="mt-4 p-4 bg-surface-container-low rounded-2xl w-full border border-surface-container/60">
                      <div className="flex items-center gap-2 mb-3 text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                        <ArrowRightCircle className="w-3.5 h-3.5 text-primary" />
                        Detail Snapshot Data
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                        {Object.entries(payloadToShow).map(([key, value]) => (
                           key !== 'updated_at' && key !== 'created_at' && key !== 'deleted_at' && value !== null && (
                            <div key={key} className="flex flex-col">
                              <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">{key.replace(/_/g, ' ')}</span>
                              <span className="font-semibold text-on-surface break-words">{String(value)}</span>
                            </div>
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
      {!loading && !error && logs.length > 0 && logs.length < meta.total && (
        <div className="flex justify-center pt-6">
          <button 
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-full border-2 border-surface-container text-primary font-black hover:bg-surface-container hover:shadow-md transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <History className="w-4 h-4" />
            )}
            <span>{loadingMore ? 'MEMUAT LEBIH BANYAK...' : `MUAT LEBIH BANYAK (${logs.length} dari ${meta.total})`}</span>
          </button>
        </div>
      )}

      {/* MODAL KONFIRMASI RESTORE */}
      <AnimatePresence>
        {restoreModalLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-container-lowest border border-surface-container rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <RotateCcw className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-on-surface">Konfirmasi Pemulihan Data</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Pulihkan data yang telah dihapus kembali ke sistem.</p>
                  </div>
                </div>
                <button
                  onClick={() => setRestoreModalLog(null)}
                  disabled={isRestoring}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rincian Data yang akan Di-restore */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider">Tabel Tujuan</span>
                  <span className="capitalize font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">{restoreModalLog.nama_tabel}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider">ID Record</span>
                  <span className="font-mono font-bold text-on-surface">#{restoreModalLog.record_id}</span>
                </div>

                {/* Preview Snapshot Data */}
                {restoreModalLog.data_lama && (() => {
                  try {
                    const parsed = JSON.parse(restoreModalLog.data_lama);
                    return (
                      <div className="pt-2 border-t border-surface-container space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Rincian Data:</p>
                        <div className="space-y-1 text-xs max-h-40 overflow-y-auto pr-1">
                          {Object.entries(parsed).map(([k, v]) => (
                            k !== 'deleted_at' && k !== 'id' && v !== null && (
                              <div key={k} className="flex justify-between gap-2">
                                <span className="text-on-surface-variant capitalize text-[11px]">{k.replace(/_/g, ' ')}:</span>
                                <span className="font-semibold text-on-surface truncate max-w-[220px]" title={String(v)}>{String(v)}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>

              {/* Penjelasan */}
              <div className="flex items-start gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-2xl text-xs text-on-surface">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Data ini akan diaktifkan kembali sehingga dapat digunakan pada transaksi, jadwal, dan reservasi seperti semula. Aksi pemulihan akan dicatat di log audit.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestoreModalLog(null)}
                  disabled={isRestoring}
                  className="flex-1 py-3 px-4 border border-surface-container rounded-2xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl text-xs font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memulihkan...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Ya, Pulihkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS PERMANEN */}
      <AnimatePresence>
        {permanentDeleteLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-container-lowest border border-error/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-on-surface">Hapus Secara Permanen</h3>
                    <p className="text-xs text-error font-bold">Tindakan ini tidak dapat dibatalkan!</p>
                  </div>
                </div>
                <button
                  onClick={() => setPermanentDeleteLog(null)}
                  disabled={isDeletingPermanently}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rincian Data */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider">Tabel Data</span>
                  <span className="capitalize font-black text-error px-2 py-0.5 bg-error/10 rounded-lg">{permanentDeleteLog.nama_tabel}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider">ID Record</span>
                  <span className="font-mono font-bold text-on-surface">#{permanentDeleteLog.record_id}</span>
                </div>

                {/* Preview Snapshot Data */}
                {permanentDeleteLog.data_lama && (() => {
                  try {
                    const parsed = JSON.parse(permanentDeleteLog.data_lama);
                    return (
                      <div className="pt-2 border-t border-surface-container space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Rincian Data yang Dihapus:</p>
                        <div className="space-y-1 text-xs max-h-36 overflow-y-auto pr-1">
                          {Object.entries(parsed).map(([k, v]) => (
                            k !== 'deleted_at' && k !== 'id' && v !== null && (
                              <div key={k} className="flex justify-between gap-2">
                                <span className="text-on-surface-variant capitalize text-[11px]">{k.replace(/_/g, ' ')}:</span>
                                <span className="font-semibold text-on-surface truncate max-w-[220px]" title={String(v)}>{String(v)}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>

              {/* Peringatan Bahaya */}
              <div className="flex items-start gap-2.5 p-3.5 bg-error/10 border border-error/30 rounded-2xl text-xs text-error font-medium">
                <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Data ini akan <strong>dihapus seluruhnya dari database</strong>. Anda tidak akan dapat memulihkannya lagi di kemudian hari.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPermanentDeleteLog(null)}
                  disabled={isDeletingPermanently}
                  className="flex-1 py-3 px-4 border border-surface-container rounded-2xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPermanentDelete}
                  disabled={isDeletingPermanently}
                  className="flex-1 py-3 px-4 bg-error hover:bg-error/90 text-white rounded-2xl text-xs font-black shadow-lg shadow-error/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingPermanently ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus Permanen</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}