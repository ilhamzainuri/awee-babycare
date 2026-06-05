import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Activity, DollarSign, UploadCloud, Check, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function SubmitReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialDetail = location.state?.selectedDetail;

  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportData, setReportData] = useState({
    catatan_terapis: '',
    metode_bayar_terapis: 'Cash',
    bukti_pembayaran: null as File | null
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) throw new Error('Sesi tidak valid');
        const user = JSON.parse(sessionStr);

        const response = await fetch(`${baseUrl}/therapist_dashboard.php?user_id=${user.id}`);
        const result = await response.json();
        
        if (result.status === 200 && result.data.schedules) {
          // Laporan Selesai hanya untuk jadwal yang sedang On Process
          const validSchedules = result.data.schedules.filter((s: any) => s.status === 'On Process');
          setSchedules(validSchedules);

          if (initialDetail && validSchedules.find((s: any) => s.id === initialDetail.id)) {
            setSelectedScheduleId(initialDetail.id);
          } else if (validSchedules.length > 0) {
            setSelectedScheduleId(''); // Harus pilih manual jika dari sidebar
          }
        }
      } catch (err) {
        console.error("Gagal mengambil jadwal", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [baseUrl, initialDetail]);

  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedScheduleId(id === '' ? '' : Number(id));
    setReportData({
      catatan_terapis: '',
      metode_bayar_terapis: 'Cash',
      bukti_pembayaran: null
    });
    setPreviewImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportData(prev => ({ ...prev, bukti_pembayaran: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      alert("Silakan pilih jadwal kunjungan terlebih dahulu!");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const sessionStr = localStorage.getItem('user_session');
      const user = sessionStr ? JSON.parse(sessionStr) : null;
      
      const formData = new FormData();
      formData.append('appointment_id', selectedScheduleId.toString());
      if (user) formData.append('user_id', user.id);
      formData.append('catatan_terapis', reportData.catatan_terapis);
      formData.append('metode_bayar_terapis', reportData.metode_bayar_terapis);
      
      if (reportData.bukti_pembayaran) {
        formData.append('bukti_pembayaran', reportData.bukti_pembayaran);
      } else if (reportData.metode_bayar_terapis === 'Transfer Bank' || reportData.metode_bayar_terapis === 'Transfer') {
        alert("Mohon unggah foto bukti transfer!");
        setIsSubmittingReport(false);
        return;
      }

      const res = await fetch(`${baseUrl}/submit_report.php`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 200) {
        alert("Laporan berhasil dikirim!");
        navigate('/therapist', { replace: true });
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim laporan.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center font-bold text-on-surface-variant animate-pulse">Menyiapkan form laporan...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button onClick={() => navigate('/therapist')} className="flex items-center gap-2 text-primary font-bold hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container overflow-hidden">
        
        <div className="p-6 border-b border-surface-container bg-surface-container-low flex justify-between items-center">
          <h2 className="font-black text-xl flex items-center gap-2 text-primary"><ClipboardList className="w-6 h-6"/> Laporan Layanan</h2>
        </div>

        <form onSubmit={handleSubmitReport} className="flex flex-col">
          <div className="p-6 space-y-6">

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                Isi laporan penyelesaian layanan. Pastikan catatan dan metode pembayaran telah sesuai dengan kondisi faktual di lapangan.
              </p>
            </div>

            {/* Pemilihan Jadwal */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface">Pilih Jadwal Pasien</label>
              {schedules.length === 0 ? (
                <div className="p-4 bg-error-container/20 text-error rounded-xl text-sm font-bold border border-error-container">
                  Tidak ada layanan yang sedang berlangsung (On Process) saat ini.
                </div>
              ) : (
                <select 
                  value={selectedScheduleId} 
                  onChange={handleScheduleChange}
                  className="w-full bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-xl text-base font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Pilih Pasien --</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.childName} ({s.time}) - {s.status}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Form Inputs (Hanya tampil jika jadwal dipilih) */}
            {selectedScheduleId !== '' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-2">
                
                {/* A. Catatan Perkembangan */}
                <div>
                  <h4 className="text-sm font-black text-on-surface mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary"/> A. Catatan Pelayanan</h4>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-on-surface-variant">Catatan / Perkembangan Anak</label>
                    <textarea 
                      required 
                      rows={4} 
                      value={reportData.catatan_terapis} 
                      onChange={e => setReportData({...reportData, catatan_terapis: e.target.value})} 
                      className="w-full bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-xl text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none shadow-sm" 
                      placeholder="Ceritakan bagaimana kondisi dan respon anak saat dilayani..."
                    ></textarea>
                  </div>
                </div>

                {/* B. Laporan Pembayaran */}
                <div className="border-t border-surface-container pt-6">
                  <h4 className="text-sm font-black text-on-surface mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary"/> B. Laporan Pembayaran</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-on-surface-variant">Metode Bayar Aktual</label>
                      <div className="bg-warning-container/30 border border-warning/20 p-3 rounded-xl mb-2">
                        <p className="text-xs font-medium text-warning-dark"><span className="font-bold">Penting:</span> Wajib diisi sesuai dengan fakta pembayaran di lapangan (Anti-Selisih).</p>
                      </div>
                      <select 
                        required 
                        value={reportData.metode_bayar_terapis} 
                        onChange={e => setReportData({...reportData, metode_bayar_terapis: e.target.value})} 
                        className="w-full bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-xl text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold shadow-sm cursor-pointer"
                      >
                        <option value="Cash">Tunai / Cash</option>
                        <option value="Transfer Bank">Transfer Bank / E-Wallet</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-on-surface-variant">Bukti Pembayaran (Wajib jika Transfer)</label>
                      
                      <div className="relative border-2 border-dashed border-surface-container hover:border-primary/50 transition-colors rounded-2xl p-6 text-center cursor-pointer overflow-hidden bg-surface-container-lowest">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        
                        {previewImage ? (
                          <div className="relative aspect-video w-full">
                            <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                              <p className="text-white text-sm font-bold flex items-center gap-1"><UploadCloud className="w-5 h-5"/> Ganti Foto</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                              <UploadCloud className="w-7 h-7" />
                            </div>
                            <p className="text-sm font-bold text-on-surface">Tap untuk Ambil Foto / Pilih Galeri</p>
                            <p className="text-xs text-on-surface-variant mt-1">Upload foto bukti transfer atau kwitansi uang pas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </div>

          <div className="p-6 border-t border-surface-container bg-surface-container-low">
            <button 
              type="submit" 
              disabled={isSubmittingReport || schedules.length === 0 || selectedScheduleId === ''} 
              className={cn(
                "w-full text-white text-base font-black py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg",
                (isSubmittingReport || schedules.length === 0 || selectedScheduleId === '') ? "bg-surface-container-highest cursor-not-allowed shadow-none" : "bg-success hover:bg-success/90 shadow-success/30"
              )}
            >
              {isSubmittingReport ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <><Check className="w-6 h-6"/> Kirim Laporan & Selesai</>
              )}
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
