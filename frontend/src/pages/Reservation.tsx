import React, { useState, useEffect } from 'react';
import { 
  Baby, UserPlus, Stethoscope, Plus, Trash2, Save, 
  MapPin, Phone, ChevronDown, Calendar, X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';

export default function Reservation() {
  // Master Data States (untuk Dropdown)
  const [therapists, setTherapists] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_pasien: '', usia_saat_ini: '', bb_saat_ini: '', jenis_kelamin: 'Laki-laki',
    no_hp_ortu: '', link_shareloc: '', alamat_lengkap: '', keluhan_awal: '',
    id_therapist: '', waktu_reservasi: '', metode_bayar_admin: 'Cash'
  });

  // Array untuk Multi-Service / Treatments (setiap item memiliki kategori dan layanan tersendiri)
  const [treatments, setTreatments] = useState<{ id: number; kategori_id: string; id_service: string }[]>([
    { id: Date.now(), kategori_id: '', id_service: '' }
  ]);

  // Ambil Data Master saat komponen dimuat
  useEffect(() => {
    const fetchMasterData = async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      try {
        const [resTherapists, resServices, resCategories] = await Promise.all([
          fetch(`${baseUrl}/therapists.php`),
          fetch(`${baseUrl}/services.php`),
          fetch(`${baseUrl}/categories.php`)
        ]);
        
        const dataT = await resTherapists.json();
        const dataS = await resServices.json();
        const dataC = await resCategories.json();

        if (dataT.status === 200) setTherapists(dataT.data.filter((t: any) => t.status_aktif === 1)); // Hanya ambil terapis On-Duty
        if (dataS.status === 200) setServices(dataS.data);
        if (dataC.status === 200) setCategories(dataC.data);
      } catch (error) {
        console.error("Gagal mengambil master data", error);
      }
    };
    fetchMasterData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.name === 'no_hp_ortu') {
      // Hanya izinkan karakter angka (0-9)
      value = value.replace(/[^0-9]/g, '');
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Helper: Deteksi tipe kategori ('outlet', 'homecare', atau 'other')
  const getCategoryType = (katId: string): 'outlet' | 'homecare' | 'other' => {
    const found = categories.find(c => c.id.toString() === katId.toString());
    if (!found) return 'other';
    const name = (found.nama_kategori || '').toLowerCase();
    if (name.includes('outlet')) return 'outlet';
    if (name.includes('homecare')) return 'homecare';
    return 'other';
  };

  // Treatment Handlers
  const addTreatment = () => setTreatments([...treatments, { id: Date.now(), kategori_id: '', id_service: '' }]);
  const removeTreatment = (id: number) => {
    if (treatments.length > 1) {
      const remaining = treatments.filter(t => t.id !== id);
      setTreatments(remaining);
      // Cek apakah sisa treatment masih punya konflik
      const types = remaining.map(t => getCategoryType(t.kategori_id));
      const hasOutlet = types.includes('outlet');
      const hasHomecare = types.includes('homecare');
      if (!hasOutlet || !hasHomecare) {
        setCategoryError(null);
      }
    }
  };
  const updateTreatmentCategory = (id: number, kategori_id: string) => {
    if (!kategori_id) {
      setTreatments(treatments.map(t => t.id === id ? { ...t, kategori_id: '', id_service: '' } : t));
      setCategoryError(null);
      return;
    }

    const newType = getCategoryType(kategori_id);

    // Cek apakah ada treatment lain yang sudah dipilih kategorinya
    const otherSelected = treatments.filter(t => t.id !== id && t.kategori_id);
    if (otherSelected.length > 0 && (newType === 'outlet' || newType === 'homecare')) {
      const existingTypes = otherSelected.map(t => getCategoryType(t.kategori_id));
      const hasConflict = existingTypes.some(t => (t === 'outlet' || t === 'homecare') && t !== newType);

      if (hasConflict) {
        const currentActiveType = existingTypes.find(t => t === 'outlet' || t === 'homecare');
        const activeLabel = currentActiveType === 'outlet' ? 'Outlet' : 'Homecare';
        const chosenLabel = newType === 'outlet' ? 'Outlet' : 'Homecare';

        setCategoryError(
          `Perhatian: Reservasi hanya dapat memilih 1 jenis layanan (${activeLabel}). Anda tidak dapat menambahkan layanan kategori ${chosenLabel} dalam satu reservasi yang sama.`
        );
        return;
      }
    }

    // Jika tidak ada konflik, bersihkan categoryError
    setCategoryError(null);
    setTreatments(treatments.map(t => t.id === id ? { ...t, kategori_id, id_service: '' } : t));
  };
  const updateTreatmentService = (id: number, id_service: string) => {
    setTreatments(treatments.map(t => t.id === id ? { ...t, id_service } : t));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validasi basic
    if (!formData.id_therapist || treatments.some(t => !t.id_service)) {
      setMessage({ type: 'error', text: 'Mohon lengkapi pilihan Terapis dan Layanan.' });
      setIsLoading(false);
      return;
    }

    // Validasi konsistensi tipe layanan (Outlet vs Homecare)
    const types = treatments.map(t => getCategoryType(t.kategori_id));
    const hasOutlet = types.includes('outlet');
    const hasHomecare = types.includes('homecare');
    if (hasOutlet && hasHomecare) {
      setMessage({
        type: 'error',
        text: 'Perhatian: Reservasi hanya dapat memilih 1 jenis layanan (Homecare saja atau Outlet saja). Tidak dapat menggabungkan layanan Outlet dan Homecare dalam satu reservasi.'
      });
      setIsLoading(false);
      return;
    }

    // Ubah format HTML datetime-local (T) menjadi format MySQL (Spasi)
    const formattedDate = formData.waktu_reservasi.replace('T', ' ') + ':00';

    // Dapatkan user_id dari session di local storage
    const sessionStr = localStorage.getItem('user_session');
    let userId = null;
    if (sessionStr) {
      try {
        const sessionData = JSON.parse(sessionStr);
        userId = sessionData.id;
      } catch (e) {
        console.error("Gagal membaca session data", e);
      }
    }

    const payload = { ...formData, waktu_reservasi: formattedDate, treatments, user_id: userId };

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;
      const response = await fetch(`${baseUrl}/appointments.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.status === 201) {
        setMessage({ type: 'success', text: result.message });
        // Reset Form setelah sukses
        setFormData({
          nama_pasien: '', usia_saat_ini: '', bb_saat_ini: '', jenis_kelamin: 'Laki-laki',
          no_hp_ortu: '', link_shareloc: '', alamat_lengkap: '', keluhan_awal: '',
          id_therapist: '', waktu_reservasi: '', metode_bayar_admin: 'Cash'
        });
        setTreatments([{ id: Date.now(), kategori_id: '', id_service: '' }]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">New Reservation</h1>
        <p className="text-on-surface-variant font-medium mt-1">Schedule specialized pediatric treatments for your patient.</p>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={cn("p-4 rounded-2xl border flex items-center gap-3", message.type === 'success' ? "bg-tertiary-container/20 text-tertiary border-tertiary/20" : "bg-error-container/20 text-error border-error/20")}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </motion.div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Patient Info Section */}
        <motion.section className="bg-surface-container-lowest p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high space-y-8">
          <div className="flex items-center gap-4 border-b border-surface-container pb-4">
            <div className="p-3 bg-primary-container/10 text-primary-container rounded-2xl"><Baby className="w-6 h-6" /></div>
            <h2 className="text-xl font-bold text-primary-container">Patient Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Nama Pasien</label>
              <input name="nama_pasien" value={formData.nama_pasien} onChange={handleInputChange} type="text" placeholder="Nama Lengkap Pasien (Kosongkan jika treatment Ibu)" className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Usia Saat Ini</label>
              <input name="usia_saat_ini" value={formData.usia_saat_ini} onChange={handleInputChange} type="text" placeholder="Misal: 12 Bulan" className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Berat Badan (kg)</label>
              <input name="bb_saat_ini" value={formData.bb_saat_ini} onChange={handleInputChange} type="number" step="0.1" placeholder="0.0" className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Jenis Kelamin</label>
              <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none appearance-none">
                 <option value="Laki-laki">Laki-laki</option>
                 <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2 flex flex-col sm:flex-row gap-6">
               <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1 flex items-center gap-1"><Phone className="w-3 h-3" /> No. WhatsApp Ortu</label>
                  <input required name="no_hp_ortu" value={formData.no_hp_ortu} onChange={handleInputChange} type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="08..." className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none" />
               </div>
               <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Shareloc Link</label>
                  <input name="link_shareloc" value={formData.link_shareloc} onChange={handleInputChange} type="url" placeholder="Google Maps URL" className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none" />
               </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Alamat Lengkap</label>
              <textarea required name="alamat_lengkap" value={formData.alamat_lengkap} onChange={handleInputChange} placeholder="Detail alamat..." rows={3} className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none resize-none" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Keluhan / Catatan</label>
              <textarea name="keluhan_awal" value={formData.keluhan_awal} onChange={handleInputChange} placeholder="Catatan kunjungan..." rows={2} className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary-container outline-none resize-none" />
            </div>
          </div>
        </motion.section>

        {/* Assignment Section */}
        <motion.section className="bg-surface-container-lowest p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high space-y-8">
          <div className="flex items-center gap-4 border-b border-surface-container pb-4">
            <div className="p-3 bg-secondary-container/20 text-secondary rounded-2xl"><UserPlus className="w-6 h-6" /></div>
            <h2 className="text-xl font-bold text-secondary">Assignment & Payment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Terapis Bertugas</label>
                <div className="relative">
                   <select required name="id_therapist" value={formData.id_therapist} onChange={handleInputChange} className="w-full appearance-none px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-secondary outline-none cursor-pointer">
                      <option value="" disabled>Pilih Terapis</option>
                      {therapists.map(t => <option key={t.id} value={t.id}>{t.nama_terapis}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Waktu Reservasi</label>
                <div className="relative">
                   <input required name="waktu_reservasi" value={formData.waktu_reservasi} onChange={handleInputChange} type="datetime-local" className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-secondary outline-none text-on-surface" />
                </div>
             </div>
             <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Metode Bayar (Rencana Admin)</label>
                <div className="relative">
                   <select required name="metode_bayar_admin" value={formData.metode_bayar_admin} onChange={handleInputChange} className="w-full appearance-none px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-secondary outline-none cursor-pointer">
                      <option value="Cash">Cash (Tunai)</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
                </div>
             </div>
          </div>
        </motion.section>

        {/* Treatment Details Dynamic Selection */}
        <motion.section className="bg-surface-container-lowest p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high space-y-8">
          <div className="flex items-center justify-between border-b border-surface-container pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-tertiary-container/10 text-tertiary rounded-2xl"><Stethoscope className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold text-tertiary">Layanan Treatment</h2>
                <p className="text-xs text-on-surface-variant font-medium">Reservasi hanya dapat memilih 1 tipe lokasi layanan (Outlet saja atau Homecare saja).</p>
              </div>
            </div>
            {(() => {
              const types = treatments.map(t => getCategoryType(t.kategori_id)).filter(t => t === 'outlet' || t === 'homecare');
              if (types.length > 0) {
                const activeType = types[0];
                return (
                  <span className={cn(
                    "text-xs font-black px-3 py-1 rounded-full border uppercase tracking-wider hidden sm:inline-block",
                    activeType === 'outlet' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}>
                    Tipe: {activeType === 'outlet' ? 'Outlet' : 'Homecare'}
                  </span>
                );
              }
              return null;
            })()}
          </div>

          <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                 {treatments.map((t, index) => (
                    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={t.id} className="p-4 md:p-6 bg-surface-container-low rounded-[2rem] border border-surface-container relative group transition-all">
                       {treatments.length > 1 && (
                         <button type="button" onClick={() => removeTreatment(t.id)} className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-all md:opacity-0 group-hover:opacity-100" title="Hapus Layanan">
                            <X className="w-4 h-4" />
                         </button>
                       )}
 
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6 sm:pr-8">
                          {/* Dropdown Kategori per Item */}
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Kategori Layanan {index + 1}</label>
                             <div className="relative">
                                <select required value={t.kategori_id} onChange={(e) => updateTreatmentCategory(t.id, e.target.value)} className="w-full appearance-none px-4 py-3 bg-surface-container-lowest border border-surface-container rounded-xl text-sm font-bold focus:ring-2 focus:ring-tertiary outline-none cursor-pointer">
                                   <option value="">-- Pilih Kategori --</option>
                                   {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                                   ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                             </div>
                          </div>

                          {/* Dropdown Layanan per Item */}
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">Pilih Layanan {index + 1}</label>
                             <div className="relative">
                                <select required value={t.id_service} onChange={(e) => updateTreatmentService(t.id, e.target.value)} disabled={!t.kategori_id} className="w-full appearance-none px-4 py-3 bg-surface-container-lowest border border-surface-container rounded-xl text-sm font-bold focus:ring-2 focus:ring-tertiary outline-none cursor-pointer disabled:opacity-50">
                                   <option value="" disabled>
                                      {t.kategori_id ? "Pilih Layanan..." : "Pilih Kategori Terlebih Dahulu"}
                                   </option>
                                   {services
                                      .filter(s => s.kategori_id !== null && s.kategori_id.toString() === t.kategori_id)
                                      .map(s => (
                                         <option key={s.id} value={s.id}>
                                            {s.nama_layanan} - Rp {Number(s.harga_saat_ini).toLocaleString('id-ID')}
                                         </option>
                                      ))
                                   }
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </AnimatePresence>

             <button type="button" onClick={addTreatment} className="w-full py-4 border-2 border-dashed border-tertiary/30 text-tertiary font-black rounded-3xl hover:bg-tertiary-container/10 hover:border-tertiary transition-all flex items-center justify-center gap-2 text-sm tracking-widest">
                <Plus className="w-5 h-5" /> TAMBAH LAYANAN (MULTI-ORDER)
             </button>
          </div>
        </motion.section>

        {/* Alert Error Khusus Pemilihan Layanan (Muncul Langsung di Bawah Card Layanan) */}
        <AnimatePresence>
          {categoryError && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="p-5 rounded-3xl bg-error-container/25 text-error border border-error/30 flex items-start gap-3.5 shadow-sm"
            >
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-extrabold text-sm leading-snug">{categoryError}</p>
                <p className="text-xs text-error/80 mt-1 font-medium">
                  Silakan pilih kategori yang sejenis atau buat reservasi terpisah jika pasien membutuhkan kedua tipe pelayanan tersebut.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pb-12">
           <button type="submit" disabled={isLoading} className="w-full py-5 bg-primary-container text-on-primary-container font-black rounded-[2rem] shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50">
             <Save className="w-6 h-6" />
             {isLoading ? 'MENYIMPAN...' : 'SIMPAN RESERVASI SEKARANG'}
           </button>
        </div>
      </form>
    </div>
  );
}