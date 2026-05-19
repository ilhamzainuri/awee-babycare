import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Syringe, Brain, Apple, Plus, History,
  CheckCircle2, XCircle, MoreVertical, Activity, Phone,
  AlertTriangle, X, Edit, Trash2,
  // Icon tambahan untuk pencocokan otomatis:
  Hand, Waves, Scissors, Baby
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';
const iconSet = [Stethoscope, Syringe, Brain, Apple, Activity];

// Fungsi baru untuk mendeteksi kata kunci pada nama layanan
const getServiceIcon = (namaLayanan: string, id: number) => {
  const teks = namaLayanan.toLowerCase();

  if (teks.includes('pijat') || teks.includes('massage') || teks.includes('terapi')) {
    return Hand; // Icon tangan untuk pijat
  }
  if (teks.includes('renang') || teks.includes('spa') || teks.includes('hydro')) {
    return Waves; // Icon air/gelombang untuk baby spa
  }
  if (teks.includes('cukur') || teks.includes('potong') || teks.includes('rambut')) {
    return Scissors; // Icon gunting untuk cukur rambut bayi
  }
  if (teks.includes('vaksin') || teks.includes('imunisasi')) {
    return Syringe; // Icon jarum suntik
  }
  if (teks.includes('gizi') || teks.includes('makan') || teks.includes('nutrisi')) {
    return Apple; // Icon apel untuk gizi
  }
  if (teks.includes('cek') || teks.includes('periksa') || teks.includes('konsultasi')) {
    return Stethoscope; // Icon stetoskop untuk pemeriksaan umum
  }

  // Jika tidak ada kata yang cocok, gunakan icon default otomatis (modulo)
  return iconSet[id % iconSet.length];
};

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<'services' | 'therapists'>('services');
  
  // Data States
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbTherapists, setDbTherapists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CRUD States (Modal & Form)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Form State Dinamis
  const [formData, setFormData] = useState({
    nama_layanan: '', harga_saat_ini: '', persentase_komisi: '', // Untuk Services
    nama_terapis: '', no_whatsapp: '', status_aktif: '1' // Untuk Therapists
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;

  // ==========================================
  // [READ] FETCH DATA
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = activeTab === 'services' ? 'services.php' : 'therapists.php';
      const response = await fetch(`${baseUrl}/${endpoint}`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const result = await response.json();
      
      if (result.status === 200) {
        activeTab === 'services' ? setDbServices(result.data) : setDbTherapists(result.data);
      } else throw new Error(result.message);
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal mengambil data dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ==========================================
  // [CREATE & UPDATE] SUBMIT FORM
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'services' ? 'services.php' : 'therapists.php';
      const url = modalMode === 'edit' ? `${baseUrl}/${endpoint}?id=${selectedId}` : `${baseUrl}/${endpoint}`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.status === 200 || result.status === 201) {
        setIsModalOpen(false);
        fetchData(); // Refresh data
      } else {
        alert("Gagal menyimpan: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // [DELETE] SOFT DELETE
  // ==========================================
  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      const endpoint = activeTab === 'services' ? 'services.php' : 'therapists.php';
      const response = await fetch(`${baseUrl}/${endpoint}?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.status === 200) fetchData();
      else alert("Gagal menghapus: " + result.message);
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus.");
    }
  };

  // ==========================================
  // HANDLERS (Buka Modal, Format Uang)
  // ==========================================
  const openModal = (mode: 'create' | 'edit', data: any = null) => {
    setModalMode(mode);
    if (mode === 'edit' && data) {
      setSelectedId(data.id);
      setFormData({
        nama_layanan: data.nama_layanan || '',
        harga_saat_ini: data.harga_saat_ini || '',
        persentase_komisi: data.persentase_komisi || '',
        nama_terapis: data.nama_terapis || '',
        no_whatsapp: data.no_whatsapp || '',
        status_aktif: data.status_aktif !== undefined ? data.status_aktif.toString() : '1'
      });
    } else {
      setFormData({ nama_layanan: '', harga_saat_ini: '', persentase_komisi: '', nama_terapis: '', no_whatsapp: '', status_aktif: '1' });
    }
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const formatRupiah = (angka: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angka));
  };

  return (
    <div className="space-y-8 relative">
      {/* Header (Sama seperti sebelumnya) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Master Data</h1>
          <p className="text-on-surface-variant mt-1">Kelola data layanan klinik dan staf medis aktif.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high p-1 rounded-full flex shadow-inner">
            <button 
              onClick={() => setActiveTab('services')}
              className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'services' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container")}
            >Services</button>
            <button 
              onClick={() => setActiveTab('therapists')}
              className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'therapists' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container")}
            >Therapists</button>
          </div>
        </div>
      </div>

      {errorMsg && (
         <div className="p-6 bg-error-container text-on-error-container rounded-3xl border border-error/20 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
            <div>
               <h3 className="font-bold text-lg mb-1">Gagal Terhubung ke Backend</h3>
               <p className="text-sm font-medium">{errorMsg}</p>
            </div>
         </div>
      )}

      {isLoading ? (
         <div className="flex justify-center items-center h-40"><span className="text-on-surface-variant font-bold animate-pulse">Memuat Data...</span></div>
      ) : !errorMsg && activeTab === 'services' ? (
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dbServices.map((service, i) => {
            const ServiceIcon = getServiceIcon(service.nama_layanan, service.id);
            return (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={service.id}
                className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm relative group hover:shadow-xl hover:border-primary-container/20 transition-all overflow-visible"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 bg-primary-container/10 text-primary-container">
                      <ServiceIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-on-surface truncate max-w-[150px]">{service.nama_layanan}</h3>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <div className="flex-1 bg-surface-container-low p-4 rounded-2xl border flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Price</span>
                    <span className="text-lg font-bold text-on-surface">{formatRupiah(service.harga_saat_ini)}</span>
                  </div>
                  <div className="flex-1 p-4 rounded-2xl border flex flex-col justify-center bg-tertiary-container/5 border-tertiary-container/10">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Commission</span>
                    <span className="text-lg font-bold text-tertiary">{Number(service.persentase_komisi)}%</span>
                  </div>
                </div>

                {/* Dropdown Menu Titik Tiga */}
                <div className="absolute bottom-6 right-6">
                   <button onClick={() => setActiveMenuId(activeMenuId === service.id ? null : service.id)} className="p-2 rounded-full hover:bg-surface-container transition-all">
                     <MoreVertical className="w-4 h-4 text-on-surface-variant" />
                   </button>
                   {activeMenuId === service.id && (
                     <div className="absolute right-0 bottom-full mb-2 w-36 bg-surface-container-lowest rounded-2xl shadow-lg border p-1 z-10">
                        <button onClick={() => openModal('edit', service)} className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"><Edit className="w-4 h-4"/> Edit</button>
                        <button onClick={() => handleDelete(service.id)} className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/20 rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4"/> Hapus</button>
                     </div>
                   )}
                </div>
              </motion.div>
            );
          })}

          <motion.button onClick={() => openModal('create')} className="border-2 border-dashed border-surface-container-highest rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-on-surface-variant hover:border-primary-container/40 hover:text-primary-container hover:bg-primary-container/5 min-h-[180px]">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center"><Plus className="w-8 h-8" /></div>
            <span className="font-bold text-sm uppercase">Add New Service</span>
          </motion.button>
        </div>

      ) : !errorMsg && activeTab === 'therapists' ? (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dbTherapists.map((therapist, i) => {
            const isAktif = therapist.status_aktif === 1;
            return (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={therapist.id}
                className={cn("bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm relative overflow-visible", !isAktif && "opacity-60")}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isAktif ? "bg-secondary-container/20 text-secondary" : "bg-surface-container text-on-surface-variant")}>
                      <span className="font-bold text-lg">{therapist.nama_terapis.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold truncate max-w-[150px]">{therapist.nama_terapis}</h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {therapist.no_whatsapp}</p>
                    </div>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", isAktif ? "bg-tertiary-container/10 text-tertiary" : "bg-surface-container text-on-surface-variant")}>
                    {isAktif ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {isAktif ? 'On-Duty' : 'Off-Duty'}
                  </div>
                </div>

                <div className="absolute bottom-6 right-6">
                   <button onClick={() => setActiveMenuId(activeMenuId === therapist.id ? null : therapist.id)} className="p-2 rounded-full hover:bg-surface-container transition-all">
                     <MoreVertical className="w-4 h-4 text-on-surface-variant" />
                   </button>
                   {activeMenuId === therapist.id && (
                     <div className="absolute right-0 bottom-full mb-2 w-36 bg-surface-container-lowest rounded-2xl shadow-lg border p-1 z-10">
                        <button onClick={() => openModal('edit', therapist)} className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"><Edit className="w-4 h-4"/> Edit</button>
                        <button onClick={() => handleDelete(therapist.id)} className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/20 rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4"/> Hapus</button>
                     </div>
                   )}
                </div>
              </motion.div>
            );
          })}
          <motion.button onClick={() => openModal('create')} className="border-2 border-dashed border-surface-container-highest rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-on-surface-variant hover:border-secondary-container/40 hover:text-secondary hover:bg-secondary-container/5 min-h-[140px]">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center"><Plus className="w-8 h-8" /></div>
            <span className="font-bold text-sm uppercase">Add New Therapist</span>
          </motion.button>
        </div>
      ) : null}

      {/* MODAL POP-UP (Untuk Tambah & Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/30">
                <h2 className="text-xl font-bold">{modalMode === 'create' ? 'Tambah Data' : 'Edit Data'} {activeTab === 'services' ? 'Layanan' : 'Terapis'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-surface-container hover:bg-error-container hover:text-error rounded-full transition-all"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {activeTab === 'services' ? (
                  <>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Nama Layanan</label>
                      <input required type="text" value={formData.nama_layanan} onChange={e => setFormData({...formData, nama_layanan: e.target.value})} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-on-surface-variant mb-1 block">Harga (Rp)</label>
                        <input required type="number" value={formData.harga_saat_ini} onChange={e => setFormData({...formData, harga_saat_ini: e.target.value})} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-on-surface-variant mb-1 block">Komisi (%)</label>
                        <input required type="number" step="0.01" value={formData.persentase_komisi} onChange={e => setFormData({...formData, persentase_komisi: e.target.value})} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Nama Terapis</label>
                      <input required type="text" value={formData.nama_terapis} onChange={e => setFormData({...formData, nama_terapis: e.target.value})} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">No WhatsApp</label>
                      <input required type="text" value={formData.no_whatsapp} onChange={e => setFormData({...formData, no_whatsapp: e.target.value})} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Status</label>
                      <select value={formData.status_aktif} onChange={e => setFormData({...formData, status_aktif: e.target.value})} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none">
                        <option value="1">Aktif (On-Duty)</option>
                        <option value="0">Tidak Aktif (Off-Duty)</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-on-surface bg-surface-container hover:bg-surface-container-high rounded-xl transition-all">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 font-bold text-on-primary bg-primary hover:opacity-90 rounded-xl transition-all flex justify-center items-center">
                    {isSubmitting ? <span className="animate-pulse">Menyimpan...</span> : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}