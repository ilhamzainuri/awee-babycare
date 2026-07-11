import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Syringe, Brain, Apple, Plus, History,
  CheckCircle2, XCircle, MoreVertical, Activity, Phone,
  AlertTriangle, X, Edit, Trash2,
  Hand, Waves, Scissors, Baby, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_BASE_URL = 'http://localhost/awee-babycare/backend/api';
const iconSet = [Stethoscope, Syringe, Brain, Apple, Activity];

const getServiceIcon = (namaLayanan: string, id: number) => {
  const teks = namaLayanan.toLowerCase();
  if (teks.includes('pijat') || teks.includes('massage') || teks.includes('terapi')) return Hand;
  if (teks.includes('renang') || teks.includes('spa') || teks.includes('hydro')) return Waves;
  if (teks.includes('cukur') || teks.includes('potong') || teks.includes('rambut')) return Scissors;
  if (teks.includes('vaksin') || teks.includes('imunisasi')) return Syringe;
  if (teks.includes('gizi') || teks.includes('makan') || teks.includes('nutrisi')) return Apple;
  if (teks.includes('cek') || teks.includes('periksa') || teks.includes('konsultasi')) return Stethoscope;
  
  return iconSet[id % iconSet.length];
};

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<'services' | 'therapists' | 'categories'>('services');

  // Data States
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbTherapists, setDbTherapists] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]); // 🟢 State untuk menampung daftar akun user
  const [dbCategories, setDbCategories] = useState<any[]>([]); // State untuk menampung daftar kategori
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CRUD States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Category Creation States
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // 🟢 Form State Dinamis (Ditambah kategori_id, nama_kategori)
  const [formData, setFormData] = useState({
    nama_layanan: '', kategori_id: '', type_layanan: '', harga_saat_ini: '', persentase_komisi: '',
    user_id: '', nama_terapis: '', no_whatsapp: '', status_aktif: '1',
    nama_kategori: ''
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL;

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = activeTab === 'services' ? 'services.php' : (activeTab === 'categories' ? 'categories.php' : 'therapists.php');
      const response = await fetch(`${baseUrl}/${endpoint}`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const result = await response.json();

      if (result.status === 200) {
        if (activeTab === 'services') setDbServices(result.data);
        else if (activeTab === 'categories') setDbCategories(result.data);
        else setDbTherapists(result.data);
      } else throw new Error(result.message);
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal mengambil data dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Fungsi untuk mengambil daftar akun user (untuk dropdown)
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/users.php`);
      const result = await response.json();
      if (result.status === 200) setDbUsers(result.data);
    } catch (error) {
      console.error("Gagal memuat daftar user", error);
    }
  };

  // 🟢 Fungsi untuk mengambil daftar kategori (untuk dropdown)
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${baseUrl}/categories.php`);
      const result = await response.json();
      if (result.status === 200) setDbCategories(result.data);
    } catch (error) {
      console.error("Gagal memuat daftar kategori", error);
    }
  };

  // Panggil data saat tab berubah
  useEffect(() => {
    fetchData();
    if (activeTab === 'services') {
      fetchCategories();
    } else if (activeTab === 'therapists') {
      fetchUsers(); // Hanya dipanggil jika sedang membuka tab Terapis
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'services' ? 'services.php' : (activeTab === 'categories' ? 'categories.php' : 'therapists.php');
      const url = modalMode === 'edit' ? `${baseUrl}/${endpoint}?id=${selectedId}` : `${baseUrl}/${endpoint}`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const payload = activeTab === 'categories' ? { nama_kategori: formData.nama_kategori } : formData;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 200 || result.status === 201) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Gagal menyimpan: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      const endpoint = activeTab === 'services' ? 'services.php' : (activeTab === 'categories' ? 'categories.php' : 'therapists.php');
      const response = await fetch(`${baseUrl}/${endpoint}?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.status === 200) {
        fetchData();
        if (activeTab === 'categories' || activeTab === 'services') {
          fetchCategories(); // Sinkronisasi ulang cache kategori
        }
      }
      else alert("Gagal menghapus: " + result.message);
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus.");
    }
  };

  const openModal = (mode: 'create' | 'edit', data: any = null) => {
    setModalMode(mode);
    setShowAddCategory(false);
    setNewCategoryName('');
    if (mode === 'edit' && data) {
      setSelectedId(data.id);
      setFormData({
        nama_layanan: data.nama_layanan || '',
        kategori_id: data.kategori_id ? data.kategori_id.toString() : '',
        type_layanan: data.type_layanan || '',
        harga_saat_ini: data.harga_saat_ini || '',
        persentase_komisi: data.persentase_komisi || '',
        user_id: data.user_id ? data.user_id.toString() : '', // 🟢 Mapping user_id
        nama_terapis: data.nama_terapis || '',
        no_whatsapp: data.no_whatsapp || '',
        status_aktif: data.status_aktif !== undefined ? data.status_aktif.toString() : '1',
        nama_kategori: data.nama_kategori || ''
      });
    } else {
      setFormData({
        nama_layanan: '',
        kategori_id: '',
        type_layanan: '',
        harga_saat_ini: '',
        persentase_komisi: '',
        user_id: '',
        nama_terapis: '',
        no_whatsapp: '',
        status_aktif: '1',
        nama_kategori: ''
      });
    }
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const formatRupiah = (angka: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angka));
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Master Data</h1>
          <p className="text-on-surface-variant mt-1">Kelola data layanan klinik dan staf medis aktif.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high p-1 rounded-full flex shadow-inner">
            <button onClick={() => setActiveTab('services')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'services' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container")}>Services</button>
            <button onClick={() => setActiveTab('categories')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'categories' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container")}>Categories</button>
            <button onClick={() => setActiveTab('therapists')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'therapists' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container")}>Therapists</button>
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

        <div className="space-y-10 animate-fade-in">
          {/* Top Bar with Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Daftar Layanan Klinik</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">Layanan dikelompokkan berdasarkan kategori.</p>
            </div>
            <button onClick={() => openModal('create')} className="px-6 py-3 bg-primary text-on-primary rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-md">
              <Plus className="w-4 h-4" /> Add New Service
            </button>
          </div>

          {/* Grouped Tables */}
          {dbCategories.map((category) => {
            const servicesInCategory = dbServices.filter(s => s.kategori_id !== null && s.kategori_id !== undefined && s.kategori_id.toString() === category.id.toString());
            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                  <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                    {category.nama_kategori}
                  </h3>
                  <span className="text-xs font-bold px-3 py-1 bg-primary-container/10 text-primary rounded-full">
                    {servicesInCategory.length} Services
                  </span>
                </div>

                {servicesInCategory.length === 0 ? (
                  <div className="p-8 bg-surface-container-lowest border border-dashed border-surface-container-highest rounded-3xl text-center text-on-surface-variant text-sm font-medium shadow-sm">
                    Tidak ada layanan dalam kategori ini.
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-surface-container-high">
                            <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama Layanan</th>
                            <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Harga</th>
                            <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Komisi</th>
                            <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-high/50">
                          {servicesInCategory.map((service) => {
                            const ServiceIcon = getServiceIcon(service.nama_layanan, service.id);
                            return (
                              <tr key={service.id} className="hover:bg-surface-container/20 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-container/10 text-primary-container group-hover:scale-105 transition-transform">
                                      <ServiceIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-on-surface">{service.nama_layanan}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-on-surface">
                                  {formatRupiah(service.harga_saat_ini)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-extrabold text-tertiary">
                                  {Number(service.persentase_komisi)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => openModal('edit', service)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-xl transition-all" title="Hapus">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized Services */}
          {(() => {
            const uncategorizedServices = dbServices.filter(s => !s.kategori_id || !dbCategories.some(c => c.id.toString() === s.kategori_id.toString()));
            if (uncategorizedServices.length === 0) return null;
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                  <h3 className="text-lg font-extrabold text-on-surface-variant flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline inline-block"></span>
                    Tanpa Kategori
                  </h3>
                  <span className="text-xs font-bold px-3 py-1 bg-surface-container/20 text-on-surface-variant rounded-full">
                    {uncategorizedServices.length} Services
                  </span>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-surface-container-high">
                          <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama Layanan</th>
                          <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Harga</th>
                          <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Komisi</th>
                          <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/50">
                        {uncategorizedServices.map((service) => {
                          const ServiceIcon = getServiceIcon(service.nama_layanan, service.id);
                          return (
                            <tr key={service.id} className="hover:bg-surface-container/20 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-container/10 text-primary-container group-hover:scale-105 transition-transform">
                                    <ServiceIcon className="w-5 h-5" />
                                  </div>
                                  <span className="font-bold text-on-surface">{service.nama_layanan}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-bold text-on-surface">
                                {formatRupiah(service.harga_saat_ini)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-extrabold text-tertiary">
                                {Number(service.persentase_komisi)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => openModal('edit', service)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(service.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-xl transition-all" title="Hapus">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      ) : !errorMsg && activeTab === 'therapists' ? (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dbTherapists.map((therapist, i) => {
            const isAktif = therapist.status_aktif === 1;
            return (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={therapist.id} className={cn("bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm relative overflow-visible", !isAktif && "opacity-60")}>
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
                  <button onClick={() => setActiveMenuId(activeMenuId === therapist.id ? null : therapist.id)} className="p-2 rounded-full hover:bg-surface-container transition-all"><MoreVertical className="w-4 h-4 text-on-surface-variant" /></button>
                  {activeMenuId === therapist.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-36 bg-surface-container-lowest rounded-2xl shadow-lg border p-1 z-10">
                      <button onClick={() => openModal('edit', therapist)} className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                      <button onClick={() => handleDelete(therapist.id)} className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/20 rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4" /> Hapus</button>
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
      ) : !errorMsg && activeTab === 'categories' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dbCategories.map((category, i) => {
            return (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={category.id} className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm relative overflow-visible group hover:shadow-xl hover:border-primary-container/20 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary-container/10 text-primary-container font-black text-lg">
                      {category.nama_kategori.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold truncate max-w-[200px]">{category.nama_kategori}</h3>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 right-6">
                  <button onClick={() => setActiveMenuId(activeMenuId === category.id ? null : category.id)} className="p-2 rounded-full hover:bg-surface-container transition-all"><MoreVertical className="w-4 h-4 text-on-surface-variant" /></button>
                  {activeMenuId === category.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-36 bg-surface-container-lowest rounded-2xl shadow-lg border p-1 z-10">
                      <button onClick={() => openModal('edit', category)} className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                      <button onClick={() => handleDelete(category.id)} className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/20 rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4" /> Hapus</button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          <motion.button onClick={() => openModal('create')} className="border-2 border-dashed border-surface-container-highest rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-on-surface-variant hover:border-primary-container/40 hover:text-primary-container hover:bg-primary-container/5 min-h-[140px]">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center"><Plus className="w-8 h-8" /></div>
            <span className="font-bold text-sm uppercase">Add New Category</span>
          </motion.button>
        </div>
      ) : null}

      {/* MODAL POP-UP */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/30">
                <h2 className="text-xl font-bold">{modalMode === 'create' ? 'Tambah Data' : 'Edit Data'} {activeTab === 'services' ? 'Layanan' : (activeTab === 'categories' ? 'Kategori' : 'Terapis')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-surface-container hover:bg-error-container hover:text-error rounded-full transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {activeTab === 'services' ? (
                  <>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Nama Layanan</label>
                      <input required type="text" value={formData.nama_layanan} onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1">Kategori Layanan</label>
                        <button
                          type="button"
                          onClick={() => setShowAddCategory(!showAddCategory)}
                          className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          {showAddCategory ? 'Batal' : '+ Tambah Kategori'}
                        </button>
                      </div>
                      {showAddCategory ? (
                        <div className="flex gap-2 p-2 bg-surface-container-low border border-dashed border-outline-variant rounded-xl items-center">
                          <input
                            type="text"
                            placeholder="Nama kategori baru..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 p-2 bg-surface-container-lowest border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            type="button"
                            disabled={isAddingCategory}
                            onClick={async () => {
                              if (!newCategoryName.trim()) return;
                              setIsAddingCategory(true);
                              try {
                                const response = await fetch(`${baseUrl}/categories.php`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ nama_kategori: newCategoryName.trim() })
                                });
                                const result = await response.json();
                                if (result.status === 201) {
                                  await fetchCategories();
                                  setFormData(prev => ({ ...prev, kategori_id: result.data.id.toString() }));
                                  setNewCategoryName('');
                                  setShowAddCategory(false);
                                } else {
                                  alert("Gagal menambahkan kategori: " + result.message);
                                }
                              } catch (err) {
                                alert("Terjadi kesalahan koneksi.");
                              } finally {
                                setIsAddingCategory(false);
                              }
                            }}
                            className="px-3 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            {isAddingCategory ? '...' : 'Simpan'}
                          </button>
                        </div>
                      ) : (
                        <select
                          required
                          value={formData.kategori_id}
                          onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Pilih Kategori</option>
                          {dbCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nama_kategori}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-on-surface-variant mb-1 block">Harga (Rp)</label>
                        <input required type="number" value={formData.harga_saat_ini} onChange={e => setFormData({ ...formData, harga_saat_ini: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-on-surface-variant mb-1 block">Komisi (%)</label>
                        <input required type="number" step="0.01" value={formData.persentase_komisi} onChange={e => setFormData({ ...formData, persentase_komisi: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </>
                ) : activeTab === 'categories' ? (
                  <>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Nama Kategori</label>
                      <input required type="text" value={formData.nama_kategori} onChange={e => setFormData({ ...formData, nama_kategori: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </>
                ) : (
                  <>
                    {/* 🟢 TAMPILAN DROPDOWN USER */}
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 flex items-center gap-1"><User className="w-4 h-4" /> Akun Sistem (User)</label>
                      <select required value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm">
                        <option value="" disabled>-- Pilih Akun Terapis --</option>
                        {dbUsers.length === 0 ? (
                          <option value="" disabled>Tidak ada akun terapis tersedia.</option>
                        ) : (
                          dbUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                          ))
                        )}
                      </select>
                      <p className="text-[10px] text-on-surface-variant mt-1.5">Tautkan profil dengan akun login yang sudah dibuat.</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Nama Lengkap Terapis</label>
                      <input required type="text" value={formData.nama_terapis} onChange={e => setFormData({ ...formData, nama_terapis: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">No WhatsApp</label>
                      <input required type="text" value={formData.no_whatsapp} onChange={e => setFormData({ ...formData, no_whatsapp: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-on-surface-variant mb-1 block">Status Pekerjaan</label>
                      <select value={formData.status_aktif} onChange={e => setFormData({ ...formData, status_aktif: e.target.value })} className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none">
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