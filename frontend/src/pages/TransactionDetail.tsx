import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, User, CalendarClock, 
  Stethoscope, Receipt, Banknote, Printer, Activity, Baby
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/transaction_detail.php?id=${id}` 
    : `http://localhost/awee-babycare/backend/api/transaction_detail.php?id=${id}`;

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal memuat data dari server');
        
        const result = await response.json();
        if (result.status === 200) {
          setData(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [apiUrl]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angka));
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold animate-pulse text-on-surface-variant">Memuat Detail Transaksi...</div>;
  if (error) return <div className="p-8 text-center text-error font-bold">{error}</div>;
  if (!data) return <div className="p-8 text-center text-on-surface-variant font-bold">Data tidak ditemukan.</div>;

  const tgl = new Date(data.waktu_reservasi).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const jam = new Date(data.waktu_reservasi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-3xl border border-surface-container shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container rounded-xl text-sm font-bold text-on-surface-variant transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button className="flex items-center gap-2 px-6 py-2 bg-primary-container text-on-primary-container font-bold rounded-xl text-sm hover:brightness-110 transition-all">
          <Printer className="w-4 h-4" /> Cetak Invoice
        </button>
      </div>

      {/* Header Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container shadow-sm flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-on-surface tracking-tight">#TRX-{data.id}</h1>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
              data.status_jadwal === 'Selesai' ? "bg-tertiary-container/20 text-tertiary" : "bg-secondary-container/20 text-secondary"
            )}>
              {data.status_jadwal}
            </span>
          </div>
          <p className="text-on-surface-variant font-medium flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> {tgl} • {jam} WIB
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Status Pembayaran</p>
          <div className="flex items-center md:justify-end gap-2">
            <span className={cn("text-xl font-black", data.status_pembayaran === 'Verified' ? "text-tertiary" : "text-error")}>
              {data.status_pembayaran}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Pasien & Terapis) */}
        <div className="md:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-secondary-container/20 text-secondary rounded-xl"><Baby className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-on-surface">Data Pasien</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nama Anak</p>
                <p className="font-bold text-on-surface text-lg">{data.nama_anak} <span className="text-sm font-medium text-on-surface-variant">({data.jenis_kelamin})</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Usia</p>
                  <p className="font-bold text-on-surface">{data.usia_saat_ini}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Berat Badan</p>
                  <p className="font-bold text-on-surface">{data.bb_saat_ini}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-surface-container">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Kontak Ortu</p>
                <p className="font-bold text-on-surface">{data.no_hp_ortu}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Alamat</p>
                <p className="font-medium text-sm text-on-surface-variant">{data.alamat_lengkap}</p>
                {data.link_shareloc && (
                  <a href={data.link_shareloc} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline mt-1 inline-block">Buka di Maps &rarr;</a>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-container/20 text-primary-container rounded-xl"><Stethoscope className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-on-surface">Terapis Bertugas</h2>
            </div>
            <p className="font-bold text-on-surface text-lg">{data.nama_terapis}</p>
            <p className="text-sm font-medium text-on-surface-variant flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {data.no_whatsapp}</p>
          </motion.div>
        </div>

        {/* Right Column (Layanan & Keuangan) */}
        <div className="md:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-surface-container shadow-sm">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-tertiary-container/20 text-tertiary rounded-xl"><Activity className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-on-surface">Keluhan Awal</h2>
            </div>
            <p className="p-4 bg-surface-container-low rounded-xl text-sm font-medium text-on-surface-variant leading-relaxed">
              {data.keluhan_awal || 'Tidak ada catatan keluhan awal.'}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest rounded-3xl border border-surface-container shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-surface-container flex items-center gap-3">
              <div className="p-2 bg-surface-container text-on-surface-variant rounded-xl"><Receipt className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-on-surface">Rincian Layanan</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container">Nama Layanan</th>
                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container text-right">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {data.services && data.services.length > 0 ? (
                    data.services.map((svc: any) => (
                      <tr key={svc.id} className="hover:bg-surface-container-lowest/50">
                        <td className="p-4 font-bold text-sm text-on-surface">{svc.nama_layanan}</td>
                        <td className="p-4 font-bold text-sm text-on-surface text-right">{formatRupiah(svc.harga_snapshot)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="p-4 text-center text-sm font-bold text-on-surface-variant">Tidak ada rincian layanan</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 md:p-8 bg-surface-container-low/30 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-surface-container border-dashed">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Metode Pembayaran</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant font-bold uppercase">Plan Admin: <span className="text-on-surface">{data.metode_bayar_admin || '-'}</span></p>
                  <p className="text-xs text-on-surface-variant font-bold uppercase mt-1">Fakta Terapis: <span className={cn(data.metode_bayar_admin !== data.metode_bayar_terapis ? "text-error" : "text-tertiary")}>{data.metode_bayar_terapis || 'Belum Diinput'}</span></p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-on-surface">TOTAL KUNJUNGAN</span>
                <span className="text-3xl font-black text-primary-container">{formatRupiah(data.total_harga_kunjungan)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}