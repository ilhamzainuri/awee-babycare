import React, { useState, useEffect } from 'react';
import {
  FileText, Table as TableIcon, TrendingUp, Users,
  ArrowUpRight, ChevronRight, Landmark, AlertTriangle,
  PieChart as PieIcon, Activity, Search, Filter, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';

const STATUS_COLORS: Record<string, string> = {
  'Menunggu': '#F59E0B',
  'Diproses': '#3B82F6',
  'Selesai': '#10B981',
  'Dibatalkan': '#EF4444'
};

export default function Reports() {
  const [activeFilter, setActiveFilter] = useState('Monthly');

  // Custom Date States
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // States Database API
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [totalReservasi, setTotalReservasi] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States untuk Filter Tabel (Client-Side)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTherapist, setFilterTherapist] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    // Jika custom dipilih tapi tanggal kosong, jangan request
    if (activeFilter === 'Custom' && (!startDate || !endDate)) return;

    const fetchReports = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;

        let url = `${baseUrl}/reports.php?filter=${activeFilter}`;
        if (activeFilter === 'Custom') {
          url += `&start=${startDate}&end=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal terhubung ke API Reports");

        const result = await response.json();

        if (result.status === 200) {
          setTotalOmzet(result.data.total_omzet);
          setTotalReservasi(result.data.total_reservasi);
          setChartData(result.data.chart);
          setTherapists(result.data.therapists);
          setStatusData(result.data.status_reservasi);
          setTopServices(result.data.top_services);
          setReservations(result.data.reservations);
        } else throw new Error(result.message);
      } catch (error: any) {
        setErrorMsg(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [activeFilter, startDate, endDate]); // Trigger ulang ketika tanggal / tab berubah

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angka));
  };
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const uniqueTherapists = Array.from(new Set(reservations.map(r => r.nama_terapis)));

  const filteredReservations = reservations.filter(res => {
    const matchSearch = res.nama_anak.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#TRX-${res.trx_id}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTherapist = filterTherapist === 'All' || res.nama_terapis === filterTherapist;
    const matchStatus = filterStatus === 'All' || res.status_jadwal === filterStatus;

    return matchSearch && matchTherapist && matchStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Financial & Activity Reports</h1>
          <p className="text-on-surface-variant mt-1">Overview of clinic revenue, reservations, and staff performance.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary-container text-primary-container font-bold rounded-full hover:bg-primary-container/10 transition-all text-sm">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-bold rounded-full hover:brightness-110 shadow-lg transition-all text-sm">
            <TableIcon className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Global Filter Tabs & Custom Date Picker */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="bg-surface-container-low p-1.5 rounded-[1.5rem] flex flex-wrap md:inline-flex w-full md:w-auto shadow-inner gap-1">
          {['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'].map((label) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className={cn(
                "flex-1 md:flex-none px-3 md:px-8 py-2.5 rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap text-center",
                activeFilter === label
                  ? "bg-primary-container text-on-primary-container shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {activeFilter === 'Custom' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              /* Date picker juga diubah menjadi flex-col di HP agar tidak gepeng */
              className="flex flex-col sm:flex-row items-center gap-2 bg-surface-container-lowest border border-surface-container rounded-2xl p-2 shadow-sm w-full md:w-auto"
            >
              <div className="relative w-full sm:flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <span className="hidden sm:block text-on-surface-variant font-bold text-sm">-</span>
              <div className="relative w-full sm:flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {errorMsg && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3"><AlertTriangle className="w-5 h-5" /><span className="font-bold text-sm">{errorMsg}</span></div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><span className="text-on-surface-variant font-bold animate-pulse">Menganalisis Data...</span></div>
      ) : !errorMsg && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 1. KOTAK OMZET */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-surface-container-high shadow-sm relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary-container" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Laporan Omzet Klinik</h3>
                  <p className="text-sm text-on-surface-variant">Gross revenue based on selected filter</p>
                </div>
                <div className="p-2 bg-primary-container/10 text-primary-container rounded-2xl"><Landmark className="w-6 h-6" /></div>
              </div>
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-primary-container tracking-tighter">{formatRupiah(totalOmzet)}</h2>
              </div>
              <div className="h-64 h-full min-h-[250px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'var(--color-surface-container)', radius: 8 }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="var(--color-primary-container)" fillOpacity={index === chartData.length - 1 ? 1 : 0.4} />)}
                      </Bar>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-on-surface-variant)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-on-surface-variant font-bold text-sm">Tidak ada data transaksi.</div>
                )}
              </div>
            </motion.div>

            {/* 2. KOTAK STATUS RESERVASI */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-surface-container-high shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-2 h-full bg-tertiary-container" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Status Reservasi</h3>
                  <p className="text-sm text-on-surface-variant">Total {totalReservasi} Pasien</p>
                </div>
                <div className="p-2 bg-tertiary-container/10 text-tertiary rounded-2xl"><PieIcon className="w-6 h-6" /></div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center min-h-[200px]">
                {statusData.length > 0 ? (
                  <div className="relative w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-on-surface">{totalReservasi}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-on-surface-variant font-bold text-sm">Belum ada reservasi.</div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || '#94A3B8' }} />
                    <span className="text-xs font-bold text-on-surface-variant">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 3. KOTAK KOMISI TERAPIS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-surface-container-high shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-2 h-full bg-secondary-container" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Laporan Komisi Terapis</h3>
                  <p className="text-sm text-on-surface-variant">Top performance</p>
                </div>
                <div className="p-2 bg-secondary-container/20 text-secondary rounded-2xl"><Users className="w-6 h-6" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {therapists.length > 0 ? therapists.map((t) => (
                  <div key={t.name} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-surface-container hover:border-secondary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">{t.name}</h4>
                        <p className="text-xs text-on-surface-variant">{t.sessions} Sesi</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-secondary">{formatRupiah(t.commission)}</p>
                  </div>
                )) : <p className="text-sm font-bold text-on-surface-variant">Belum ada data komisi.</p>}
              </div>
            </motion.div>

            {/* 4. KOTAK LAYANAN TERLARIS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-surface-container-high shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Layanan Terlaris</h3>
                  <p className="text-sm text-on-surface-variant">Top booked services</p>
                </div>
                <div className="p-2 bg-primary/10 text-primary rounded-2xl"><Activity className="w-6 h-6" /></div>
              </div>
              <div className="space-y-3 flex-1">
                {topServices.length > 0 ? topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-surface-container last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-surface-container-highest">{index + 1}</span>
                      <span className="font-bold text-sm text-on-surface">{service.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold">{service.total_booked}x</span>
                  </div>
                )) : <p className="text-sm font-bold text-on-surface-variant">Belum ada data layanan.</p>}
              </div>
            </motion.div>
          </div>

          {/* ==========================================
              TABEL RINCIAN RESERVASI LENGKAP
              ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-surface-container-lowest rounded-3xl border border-surface-container-high shadow-sm overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-surface-container">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Daftar Transaksi</h3>
                  <p className="text-sm text-on-surface-variant">Tabel riwayat reservasi yang terfilter</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input
                      type="text"
                      placeholder="Cari Nama / ID TRX..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2 bg-surface-container-low border border-surface-container rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <select
                      value={filterTherapist}
                      onChange={(e) => setFilterTherapist(e.target.value)}
                      className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2 bg-surface-container-low border border-surface-container rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                      <option value="All">Semua Terapis</option>
                      {uniqueTherapists.map(name => (
                        <option key={name as string} value={name as string}>{name as string}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2 bg-surface-container-low border border-surface-container rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                      <option value="All">Semua Status</option>
                      <option value="Menunggu">Menunggu</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Dibatalkan">Dibatalkan</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">ID / Tanggal</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Pasien</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Terapis</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Pembayaran</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Status</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container text-right whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length > 0 ? (
                    filteredReservations.map((res) => {
                      const tgl = new Date(res.waktu_reservasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                      const jam = new Date(res.waktu_reservasi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <tr key={res.trx_id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                          <td className="p-4 border-b border-surface-container">
                            <p className="font-bold text-sm text-on-surface">#TRX-{res.trx_id}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{tgl} • {jam}</p>
                          </td>
                          <td className="p-4 border-b border-surface-container font-bold text-sm text-on-surface">{res.nama_anak}</td>
                          <td className="p-4 border-b border-surface-container text-sm text-on-surface-variant">{res.nama_terapis}</td>
                          <td className="p-4 border-b border-surface-container">
                            <p className="text-sm font-bold">{res.metode_bayar_admin}</p>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-0.5", res.status_pembayaran === 'Verified' ? "text-tertiary" : "text-error")}>
                              {res.status_pembayaran}
                            </p>
                          </td>
                          <td className="p-4 border-b border-surface-container">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: `${STATUS_COLORS[res.status_jadwal]}20`, color: STATUS_COLORS[res.status_jadwal] }}>
                              {res.status_jadwal}
                            </span>
                          </td>
                          <td className="p-4 border-b border-surface-container text-right font-black text-primary-container">
                            {formatRupiah(res.total_harga_kunjungan)}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-on-surface-variant font-bold text-sm">
                        Tidak ada data reservasi yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}