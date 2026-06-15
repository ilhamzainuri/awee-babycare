import React, { useState, useEffect } from 'react';
import {
  FileText, Table as TableIcon, TrendingUp, Users,
  ArrowUpRight, ChevronRight, Landmark, AlertTriangle,
  PieChart as PieIcon, Activity, Search, Filter, Calendar,
  X, Baby, Phone, MapPin, CalendarClock, Stethoscope, Receipt, Banknote, Eye
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
  const [totalKomisi, setTotalKomisi] = useState(0);
  const [totalBersih, setTotalBersih] = useState(0);
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

  // ==========================================
  // STATE & EFFECT UNTUK MODAL DETAIL KOMISI TERAPIS
  // ==========================================
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(null);
  const [commDetail, setCommDetail] = useState<any>(null);
  const [isLoadingComm, setIsLoadingComm] = useState(false);

  useEffect(() => {
    if (!selectedTherapistId) {
      setCommDetail(null);
      return;
    }

    const fetchCommDetail = async () => {
      setIsLoadingComm(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
        
        // 1. Arahkan ke reports.php & ubah id_therapist menjadi therapist_id
        // 2. Kirimkan filter waktu agar sinkron dengan dashboard utama
        let url = `${baseUrl}/reports.php?filter=${activeFilter}&therapist_id=${selectedTherapistId}`;
        if (activeFilter === 'Custom') {
          url += `&start=${startDate}&end=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil detail komisi");

        const result = await response.json();
        if (result.status === 200) {
          // Membaca key 'data' dari response php pencegat terapis yang baru
          setCommDetail(result.data);
        }
      } catch (error) {
        console.error("Error fetching therapist commission detail:", error);
      } finally {
        setIsLoadingComm(false);
      }
    };

    fetchCommDetail();
  }, [selectedTherapistId, activeFilter, startDate, endDate]);

  // ==========================================
  // STATE & EFFECT UNTUK MODAL DETAIL TRANSAKSI
  // ==========================================
  const [selectedTrxId, setSelectedTrxId] = useState<number | null>(null);
  const [trxDetail, setTrxDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (!selectedTrxId) {
      setTrxDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
        const response = await fetch(`${baseUrl}/transaction_detail.php?id=${selectedTrxId}`);
        if (!response.ok) throw new Error("Gagal mengambil detail transaksi");

        const result = await response.json();
        if (result.status === 200) {
          setTrxDetail(result.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedTrxId]);
  // ==========================================
  // EFFECT UNTUK FETCH DATA REPORT UTAMA
  // ==========================================
  useEffect(() => {
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
          setTotalKomisi(result.data.total_komisi);
          setTotalBersih(result.data.total_pendapatan_bersih || 0);
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
  }, [activeFilter, startDate, endDate]);

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
    <div className="space-y-8 pb-12 relative">
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
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-bold text-sm">{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="text-on-surface-variant font-bold animate-pulse">Menganalisis Data...</span>
        </div>
      ) : !errorMsg && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 1. KOTAK OMZET */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-surface-container-high shadow-sm relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary-container" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Laporan Keuangan Klinik</h3>
                  <p className="text-sm text-on-surface-variant">Revenue summary based on selected filter</p>
                </div>
                <div className="p-2 bg-primary-container/10 text-primary-container rounded-2xl"><Landmark className="w-6 h-6" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Omzet (Kotor)</span>
                  <h2 className="text-3xl font-black text-primary-container tracking-tight mt-1">{formatRupiah(totalOmzet)}</h2>
                </div>
                <div className="pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-surface-container-high">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    Pendapatan Bersih (Net)
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                  <h2 className="text-3xl font-black text-emerald-600 tracking-tight mt-1">{formatRupiah(totalBersih)}</h2>
                </div>
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
      <p className="text-sm text-on-surface-variant">Top performance (Klik untuk detail)</p>
    </div>
    <div className="p-2 bg-secondary-container/20 text-secondary rounded-2xl"><Users className="w-6 h-6" /></div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {therapists.length > 0 ? therapists.map((t) => (
      <div
        key={t.id_therapist || t.id} 
        onClick={() => setSelectedTherapistId(t.id_therapist || t.id)}
        className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-surface-container hover:border-secondary/40 hover:bg-surface-container transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
            {/* Sesuaikan properti nama_terapis */}
            {getInitials(t.nama_terapis || t.name || '')}
          </div>
          <div>
            {/* Sesuaikan properti nama_terapis dan total_sesi */}
            <h4 className="font-bold text-on-surface text-sm group-hover:text-secondary transition-colors">
              {t.nama_terapis || t.name}
            </h4>
            <p className="text-xs text-on-surface-variant">
              {t.total_sesi !== undefined ? t.total_sesi : t.sessions} Sesi Selesai
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sesuaikan properti total_komisi */}
          <p className="text-sm font-black text-secondary">
            {formatRupiah(t.total_komisi !== undefined ? t.total_komisi : t.commission)}
          </p>
          <ArrowUpRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
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
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">ID / Date</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Patient</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Therapist</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Payment Method</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container whitespace-nowrap">Status</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container text-right whitespace-nowrap">Total Gross</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container text-right whitespace-nowrap">Total Net</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length > 0 ? (
                    filteredReservations.map((res) => {
                      const tgl = new Date(res.waktu_reservasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                      const jam = new Date(res.waktu_reservasi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      const hargaKotor = parseFloat(res.total_harga_kunjungan) || 0;
                      const komisiTerapis = parseFloat(res.total_komisi_kunjungan) || 0;
                      const totalBersih = hargaKotor - komisiTerapis;

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
                          <td className="p-4 border-b border-surface-container text-right font-black text-emerald-600">
                            {formatRupiah(totalBersih)}
                          </td>
                          <td className="p-4 border-b border-surface-container text-center">
                            <button
                              onClick={() => setSelectedTrxId(res.trx_id)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-container/10 hover:bg-primary-container/20 text-primary-container rounded-xl text-xs font-bold transition-all"
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5" /> Detail
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-on-surface-variant font-bold text-sm">
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

      {/* ==========================================
          MODAL OVERLAY UNTUK DETAIL TRANSAKSI
          ========================================== */}
      <AnimatePresence>
        {selectedTrxId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTrxId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col"
            >
              {/* Header Modal */}
              <div className="sticky top-0 z-10 bg-surface-container-lowest/90 backdrop-blur-md px-6 py-4 border-b border-surface-container flex items-center justify-between">
                <h2 className="text-xl font-black text-on-surface tracking-tight">
                  Detail Transaksi <span className="text-primary-container">#TRX-{selectedTrxId}</span>
                </h2>
                <button
                  onClick={() => setSelectedTrxId(null)}
                  className="p-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Isi Modal */}
              <div className="p-6 md:p-8">
                {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container mb-4"></div>
                    <span className="text-on-surface-variant font-bold text-sm">Memuat Rincian...</span>
                  </div>
                ) : !trxDetail ? (
                  <div className="py-12 text-center text-error font-bold">Gagal memuat data transaksi.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Kolom Kiri: Rincian Reservasi & Pasien */}
                    <div className="space-y-4">
                      {/* Kotak Pasien */}
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                        <div className="flex items-center gap-2 mb-4">
                          <Baby className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-on-surface">Data Pasien</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-on-surface-variant text-xs block mb-1">Nama Lengkap</span>
                            <span className="font-bold text-on-surface">{trxDetail.nama_anak}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-xs block mb-1">Jenis Kelamin</span>
                            <span className="font-bold text-on-surface">{trxDetail.jenis_kelamin || '-'}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-xs block mb-1">Usia</span>
                            <span className="font-bold text-on-surface">{trxDetail.usia_saat_ini || '-'}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-xs block mb-1">Berat Badan</span>
                            <span className="font-bold text-on-surface">{trxDetail.bb_saat_ini ? `${trxDetail.bb_saat_ini} kg` : '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kotak Kontak & Lokasi */}
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-tertiary" />
                          <h3 className="font-bold text-on-surface">Kontak & Lokasi</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-on-surface-variant mt-0.5" />
                            <div>
                              <span className="text-on-surface-variant text-xs block">No. HP Orang Tua</span>
                              <span className="font-bold text-on-surface">{trxDetail.no_hp_ortu || '-'}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-on-surface-variant mt-0.5" />
                            <div>
                              <span className="text-on-surface-variant text-xs block">Alamat Kunjungan</span>
                              <span className="font-bold text-on-surface">{trxDetail.alamat_lengkap || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kotak Medis / Keluhan */}
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                        <div className="flex items-center gap-2 mb-4">
                          <Stethoscope className="w-5 h-5 text-error" />
                          <h3 className="font-bold text-on-surface">Catatan & Keluhan</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-on-surface-variant text-xs block mb-1">Keluhan Awal</span>
                            <p className="font-medium text-on-surface bg-surface-container p-3 rounded-xl">{trxDetail.keluhan_awal || 'Tidak ada keluhan.'}</p>
                          </div>
                          <div>
                            <span className="text-on-surface-variant text-xs block mb-1">Catatan Terapis (Setelah Sesi)</span>
                            <p className="font-medium text-on-surface bg-surface-container p-3 rounded-xl">{trxDetail.catatan_terapis || 'Belum ada catatan.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Jadwal, Layanan & Biaya */}
                    <div className="space-y-4">
                      {/* Kotak Jadwal & Penugasan */}
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                        <div className="flex items-center gap-2 mb-4">
                          <CalendarClock className="w-5 h-5 text-secondary" />
                          <h3 className="font-bold text-on-surface">Jadwal & Penugasan</h3>
                        </div>
                        <div className="space-y-3 text-sm border-b border-surface-container pb-4 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface-variant">Terapis Bertugas</span>
                            <span className="font-bold text-on-surface">{trxDetail.nama_terapis}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface-variant">Waktu Reservasi</span>
                            <span className="font-bold text-on-surface">{trxDetail.waktu_reservasi}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface-variant">Status Pelaksanaan</span>
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: `${STATUS_COLORS[trxDetail.status_jadwal]}20`, color: STATUS_COLORS[trxDetail.status_jadwal] }}>
                              {trxDetail.status_jadwal}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Mulai Layanan:</span>
                            <span className="font-medium">{trxDetail.waktu_mulai_layanan || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Selesai Layanan:</span>
                            <span className="font-medium">{trxDetail.waktu_selesai_layanan || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kotak Rincian Layanan & Biaya */}
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
                        <div className="flex items-center gap-2 mb-4">
                          <Receipt className="w-5 h-5 text-primary-container" />
                          <h3 className="font-bold text-on-surface">Rincian Layanan & Biaya</h3>
                        </div>

                        {/* Daftar Layanan */}
                        <div className="space-y-3 mb-6">
                          {trxDetail.services && trxDetail.services.length > 0 ? (
                            trxDetail.services.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-on-surface">• {item.nama_layanan}</span>
                                <span className="font-bold text-on-surface-variant">{formatRupiah(item.harga_snapshot)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-on-surface-variant">Tidak ada detail layanan tersimpan.</p>
                          )}
                        </div>

                        {/* Total Pembayaran */}
                        <div className="border-t border-surface-container pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-on-surface-variant">Metode Bayar</span>
                            <span className="text-sm font-bold">{trxDetail.metode_bayar_admin || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-on-surface-variant">Status Bayar</span>
                            <span className={cn("text-xs font-bold uppercase tracking-widest", trxDetail.status_pembayaran === 'Verified' ? "text-tertiary" : "text-error")}>
                              {trxDetail.status_pembayaran || 'Unverified'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2 p-3 bg-primary-container/10 rounded-xl">
                            <span className="font-bold text-primary-container">Total Keseluruhan</span>
                            <span className="text-lg font-black text-primary-container">{formatRupiah(trxDetail.total_harga_kunjungan)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 px-3">
                            <span className="text-xs text-on-surface-variant">Komisi Terapis ({trxDetail.nama_terapis})</span>
                            <span className="text-sm font-bold text-secondary">{formatRupiah(trxDetail.total_komisi_kunjungan)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL OVERLAY UNTUK DETAIL KOMISI TERAPIS
          ========================================== */}
      <AnimatePresence>
        {selectedTherapistId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTherapistId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="sticky top-0 z-10 bg-surface-container-lowest/90 backdrop-blur-md px-6 py-4 border-b border-surface-container flex items-center justify-between">
                <h2 className="text-xl font-black text-on-surface tracking-tight flex items-center gap-2">
                  <Banknote className="w-6 h-6 text-secondary" /> Rincian Komisi
                </h2>
                <button
                  onClick={() => setSelectedTherapistId(null)}
                  className="p-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                {isLoadingComm ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mb-4"></div>
                    <span className="text-on-surface-variant font-bold text-sm">Menghitung Komisi...</span>
                  </div>
                ) : !commDetail ? (
                  <div className="py-12 text-center text-error font-bold">Gagal memuat data komisi terapis.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-secondary-container/10 rounded-2xl border border-secondary/20">
                      <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xl">
                        {getInitials(commDetail.nama_terapis)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-on-surface">{commDetail.nama_terapis}</h3>
                        <p className="text-sm text-on-surface-variant">Total {commDetail.total_sesi} Sesi Selesai (Periode yang dipilih)</p>
                      </div>
                    </div>

                    <div className="bg-surface-container-low rounded-2xl border border-surface-container overflow-hidden">
                      <div className="p-4 bg-surface-container border-b border-surface-container">
                        <h4 className="font-bold text-sm text-on-surface">Riwayat Perolehan Komisi</h4>
                      </div>
                      <div className="divide-y divide-surface-container">
                        {commDetail.riwayat && commDetail.riwayat.length > 0 ? (
                          commDetail.riwayat.map((riw: any, i: number) => (
                            <div key={i} className="p-4 flex justify-between items-center hover:bg-surface-container-lowest/50 transition-colors">
                              <div>
                                <p className="font-bold text-sm text-on-surface">#TRX-{riw.id_appointment}</p>
                                <p className="text-xs text-on-surface-variant mt-1">{riw.waktu_reservasi} • {riw.nama_anak}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-secondary">{formatRupiah(riw.komisi_didapat)}</p>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-1">Status: {riw.status_jadwal}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-sm text-on-surface-variant font-bold">Belum ada transaksi selesai.</div>
                        )}
                      </div>
                      <div className="p-4 bg-surface-container-high border-t border-surface-container flex justify-between items-center">
                        <span className="font-bold text-on-surface">Total Komisi Terkumpul</span>
                        <span className="text-xl font-black text-secondary">{formatRupiah(commDetail.total_komisi)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}