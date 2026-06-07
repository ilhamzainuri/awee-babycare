import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Activity,
  ArrowRight,
  ChevronLeft,
  X,
  FileText,
  Map,
  MessageCircle,
  Info,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveScheduleDetail {
  id: number;
  childName: string;
  usia?: string;
  bb?: string;
  address: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'On Process' | 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan' | string;
  phone?: string;
  mapLink?: string;
  complaint?: string;
  services?: string;
}

export default function AllSchedulesPage() {
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleTab, setScheduleTab] = useState<'upcoming' | 'all'>('upcoming');
  const [selectedDetail, setSelectedDetail] = useState<ActiveScheduleDetail | null>(null);

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';

  useEffect(() => {
    const fetchAllSchedules = async () => {
      setIsLoading(true);
      try {
        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) return;
        const user = JSON.parse(sessionStr);
        const response = await fetch(`${baseUrl}/appointments.php?user_id=${user.id}`);
        const result = await response.json();
        if (result.status === 200) setAllSchedules(result.data);
      } catch (error) {
        console.error('Gagal mengambil seluruh jadwal', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllSchedules();
  }, [baseUrl]);

  const getDisplayedSchedules = () => {
    if (scheduleTab === 'all') return allSchedules;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    return allSchedules.filter((item) => {
      const itemDate = new Date(item.waktu_reservasi.replace(' ', 'T'));
      return (
        itemDate >= today &&
        itemDate <= nextWeek &&
        item.status_jadwal !== 'Selesai' &&
        item.status_jadwal !== 'Dibatalkan'
      );
    });
  };

  const displayedAllSchedules = getDisplayedSchedules();

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(' ', 'T')).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const openStartModal = () => {
    navigate('/therapist/start-service', { state: { selectedDetail } });
  };

  const openReportModal = () => {
    navigate('/therapist/submit-report', { state: { selectedDetail } });
  };

  return (
    <div className="min-h-screen bg-surface max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-on-surface">Jadwal &amp; Riwayat Kunjungan</h2>
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>

      {/* TAB */}
      <div className="flex gap-2 p-1 bg-surface-container rounded-xl w-max">
        <button
          onClick={() => setScheduleTab('upcoming')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
            scheduleTab === 'upcoming'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          Seminggu Kedepan
        </button>
        <button
          onClick={() => setScheduleTab('all')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
            scheduleTab === 'all'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          Semua Riwayat
        </button>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : displayedAllSchedules.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-bold">Tidak ada data jadwal untuk kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAllSchedules.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-surface-container-lowest border border-surface-container p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-on-surface text-base truncate">{item.nama_anak}</h3>
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase px-2 py-0.5 rounded-full border',
                      item.status_jadwal === 'Menunggu'
                        ? 'bg-surface-container text-on-surface border-outline-variant'
                        : item.status_jadwal === 'Diproses'
                        ? 'bg-warning-container/30 text-warning border-warning/20'
                        : item.status_jadwal === 'Selesai'
                        ? 'bg-success-container/30 text-success border-success/20'
                        : 'bg-error-container/30 text-error border-error/20'
                    )}
                  >
                    {item.status_jadwal}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant mb-2 line-clamp-1 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  {item.rincian_layanan || 'Pemeriksaan Umum'}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(item.waktu_reservasi)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.alamat_lengkap}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                <div className="bg-surface-container-low p-2.5 rounded-xl border border-surface-container text-right w-full sm:w-auto">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Komisi Estimasi</p>
                  <p className="text-sm font-black text-primary">{formatRupiah(item.total_komisi_kunjungan)}</p>
                </div>
                <button
                  onClick={() =>
                    setSelectedDetail({
                      id: item.id,
                      childName: item.nama_anak,
                      usia: item.usia_saat_ini,
                      bb: item.bb_saat_ini,
                      address: item.alamat_lengkap,
                      time: formatDate(item.waktu_reservasi),
                      status:
                        item.status_jadwal === 'Menunggu'
                          ? 'Pending'
                          : item.status_jadwal === 'Diproses'
                          ? 'On Process'
                          : item.status_jadwal,
                      phone: item.no_hp_ortu,
                      mapLink: item.link_shareloc,
                      complaint: item.keluhan_awal,
                      services: item.rincian_layanan,
                    })
                  }
                  className="text-[11px] font-bold text-primary hover:underline self-end flex items-center gap-1"
                >
                  Lihat Detail <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DETAIL */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              className="bg-surface-container-lowest w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-surface-container flex justify-between items-center bg-surface-container-low rounded-t-3xl shrink-0">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" /> Detail #TRX-{selectedDetail.id}
                </h3>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Info Anak */}
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-3">Informasi Anak</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Nama Pasien</p>
                      <p className="font-black text-lg text-on-surface">{selectedDetail.childName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Usia</p>
                      <p className="font-bold text-sm text-on-surface">{selectedDetail.usia || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Berat Badan (Awal)</p>
                      <p className="font-bold text-sm text-on-surface">
                        {selectedDetail.bb ? `${selectedDetail.bb} kg` : '-'}
                      </p>
                    </div>
                    {selectedDetail.complaint && (
                      <div className="col-span-2 mt-2 bg-error-container/20 border border-error-container p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-error mb-1">Keluhan Awal</p>
                        <p className="text-sm font-medium text-on-surface">{selectedDetail.complaint}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Jadwal & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Jadwal / Waktu
                    </p>
                    <p className="font-bold text-sm text-on-surface">{selectedDetail.time}</p>
                  </div>
                  <div className="bg-surface-container p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Status
                    </p>
                    <p className="font-black text-sm text-primary uppercase">{selectedDetail.status}</p>
                  </div>
                </div>

                {/* Daftar Layanan */}
                <div>
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-primary" /> Daftar Layanan
                  </h4>
                  <div className="bg-surface-container-low border border-surface-container p-3 rounded-xl">
                    <ul className="list-decimal list-inside space-y-1.5">
                      {selectedDetail.services ? (
                        selectedDetail.services.split('+').map((srv: string, idx: number) => (
                          <li key={idx} className="text-sm font-bold text-on-surface">
                            {srv.trim()}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm font-bold text-on-surface">Layanan Umum</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Alamat Lengkap Kunjungan
                  </p>
                  <p className="text-sm text-on-surface bg-surface-container-low p-3 rounded-xl border border-surface-container">
                    {selectedDetail.address}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {selectedDetail.mapLink && selectedDetail.mapLink !== '-' && (
                      <button
                        onClick={() => window.open(selectedDetail.mapLink, '_blank')}
                        className="w-full bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1967D2] text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Map className="w-3.5 h-3.5" /> Buka Maps
                      </button>
                    )}
                    {selectedDetail.phone && (
                      <button
                        onClick={() =>
                          window.open(
                            `https://wa.me/${selectedDetail.phone!.replace(/^0/, '62')}`,
                            '_blank'
                          )
                        }
                        className="w-full bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 border-t border-surface-container bg-surface-container-low rounded-b-3xl shrink-0 flex flex-col gap-3">
                {selectedDetail.status === 'Pending' || selectedDetail.status === 'Menunggu' ? (
                  <button
                    onClick={openStartModal}
                    className="w-full bg-primary hover:bg-primary/90 text-on-primary text-sm font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                  >
                    <Activity className="w-5 h-5" /> Mulai Layanan Sekarang
                  </button>
                ) : selectedDetail.status === 'On Process' || selectedDetail.status === 'Diproses' ? (
                  <button
                    onClick={openReportModal}
                    className="w-full bg-success hover:bg-success/90 text-on-primary text-sm font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-success/30"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Isi Laporan Selesai
                  </button>
                ) : (
                  <div className="bg-surface-container p-3 rounded-xl text-center">
                    <p className="text-xs font-bold text-on-surface-variant">
                      Layanan sudah {selectedDetail.status}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}