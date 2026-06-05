import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Thermometer, Scale, Activity, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function StartService() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialDetail = location.state?.selectedDetail;

  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  const [isStartingService, setIsStartingService] = useState(false);
  const [startData, setStartData] = useState({
    suhu_anak: '',
    bb_real_terapis: ''
  });

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
          // Hanya ambil jadwal yang Pending atau On Process
          const validSchedules = result.data.schedules.filter((s: any) => s.status === 'Pending' || s.status === 'On Process');
          setSchedules(validSchedules);

          // Set pilihan awal berdasarkan location state atau dropdown kosong
          if (initialDetail) {
            setSelectedScheduleId(initialDetail.id);
            // Pre-fill data jika sudah ada (untuk kasus update/edit)
            const matched = validSchedules.find((s: any) => s.id === initialDetail.id);
            if (matched) {
              setStartData({
                suhu_anak: matched.suhu_anak || '',
                bb_real_terapis: matched.bb_real_terapis || ''
              });
            }
          } else if (validSchedules.length > 0) {
            // Biarkan kosong agar user memilih secara eksplisit
            setSelectedScheduleId('');
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
    
    if (id !== '') {
      const matched = schedules.find(s => s.id === Number(id));
      if (matched) {
        setStartData({
          suhu_anak: matched.suhu_anak || '',
          bb_real_terapis: matched.bb_real_terapis || ''
        });
      }
    } else {
      setStartData({ suhu_anak: '', bb_real_terapis: '' });
    }
  };

  const submitStartService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      alert("Silakan pilih jadwal kunjungan terlebih dahulu!");
      return;
    }

    setIsStartingService(true);
    try {
      const sessionStr = localStorage.getItem('user_session');
      const user = sessionStr ? JSON.parse(sessionStr) : null;
      
      const res = await fetch(`${baseUrl}/start_service.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointment_id: selectedScheduleId, 
          user_id: user?.id,
          suhu_anak: startData.suhu_anak,
          bb_real_terapis: startData.bb_real_terapis
        })
      });
      const data = await res.json();
      if (data.status === 200) {
        alert("Data klinis berhasil disimpan.");
        navigate('/therapist', { replace: true });
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    } finally {
      setIsStartingService(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center font-bold text-on-surface-variant animate-pulse">Menyiapkan halaman pemeriksaan...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button onClick={() => navigate('/therapist')} className="flex items-center gap-2 text-primary font-bold hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container overflow-hidden">
        
        <div className="p-6 border-b border-surface-container bg-surface-container-low flex justify-between items-center">
          <h2 className="font-black text-xl flex items-center gap-2 text-primary"><Activity className="w-6 h-6"/> Pemeriksaan Klinis</h2>
        </div>

        <form onSubmit={submitStartService} className="flex flex-col">
          <div className="p-6 space-y-6">
            
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                Silakan pilih jadwal dan masukkan data pemeriksaan klinis terbaru. Form ini juga dapat digunakan untuk memperbarui data (revisi typo) jika status sudah <strong className="text-primary">On Process</strong>.
              </p>
            </div>

            {/* Pemilihan Jadwal */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface">Pilih Jadwal Pasien</label>
              {schedules.length === 0 ? (
                <div className="p-4 bg-error-container/20 text-error rounded-xl text-sm font-bold border border-error-container">
                  Tidak ada jadwal Pending atau On Process hari ini.
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
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2"><Thermometer className="w-4 h-4 text-primary"/> Suhu Tubuh Aktual (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={startData.suhu_anak} 
                    onChange={e => setStartData({...startData, suhu_anak: e.target.value})} 
                    className="w-full bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-xl text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm" 
                    placeholder="Misal: 36.5"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2"><Scale className="w-4 h-4 text-primary"/> Berat Badan Aktual (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={startData.bb_real_terapis} 
                    onChange={e => setStartData({...startData, bb_real_terapis: e.target.value})} 
                    className="w-full bg-surface-container-lowest border border-surface-container px-4 py-3 rounded-xl text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm" 
                    placeholder="Misal: 4.5"
                  />
                </div>
              </motion.div>
            )}

          </div>

          <div className="p-6 border-t border-surface-container bg-surface-container-low">
            <button 
              type="submit" 
              disabled={isStartingService || schedules.length === 0 || selectedScheduleId === ''} 
              className={cn(
                "w-full text-white text-base font-black py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg",
                (isStartingService || schedules.length === 0 || selectedScheduleId === '') ? "bg-surface-container-highest cursor-not-allowed shadow-none" : "bg-primary hover:bg-primary/90 shadow-primary/30"
              )}
            >
              {isStartingService ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <><Check className="w-6 h-6"/> Simpan Data Klinis</>
              )}
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
