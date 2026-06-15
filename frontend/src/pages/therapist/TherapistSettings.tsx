import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Lock, 
  Camera, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

export default function TherapistSettings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null, text: string }>({ type: null, text: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';

  // 1. Ambil data user dari Database saat halaman dimuat
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) throw new Error("Sesi login tidak ditemukan.");
        
        const sessionData = JSON.parse(sessionStr);
        setUserId(sessionData.id);

        // Ambil data terbaru dari backend
        const response = await fetch(`${baseUrl}/get_user.php?id=${sessionData.id}`);
        const result = await response.json();

        if (result.status === 200) {
          setUsername(result.data.username);
          
          if (result.data.foto) {
            const uploadsUrl = baseUrl.replace('/api', '/uploads');
            setFotoPreview(`${uploadsUrl}/${result.data.foto}`);
          }
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Gagal memuat data profil.' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, [baseUrl]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setMessage({ type: null, text: '' });

    try {
      const formData = new FormData();
      formData.append('id', userId);
      formData.append('username', username);
      if (password) formData.append('password', password);
      if (fotoFile) formData.append('foto', fotoFile);

      const response = await fetch(`${baseUrl}/update_settings.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 200) {
        setMessage({ type: 'success', text: 'Profil Terapis berhasil diperbarui!' });
        setPassword(''); 
        
        // Update data session di local storage agar TherapistLayout (sidebar/header) ikut berubah
        const sessionStr = localStorage.getItem('user_session');
        if (sessionStr) {
          const sessionData = JSON.parse(sessionStr);
          const updatedSession = { 
            ...sessionData, 
            username: username,
            foto: result.data?.foto || sessionData.foto 
          };
          localStorage.setItem('user_session', JSON.stringify(updatedSession));
          window.dispatchEvent(new Event('storage')); // Trigger update UI Layout
        }
      } else {
        throw new Error(result.message || "Gagal memperbarui pengaturan.");
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Memuat data profil terapis...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Profil Terapis</h1>
          <div className="bg-primary-container/20 text-primary-container px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary-container/20">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Official</span>
          </div>
        </div>
        <p className="text-sm font-medium text-on-surface-variant">Kelola informasi kredensial dan keamanan akun Anda.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container">
        
        {message.type && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className={`mb-6 p-4 flex items-center gap-3 rounded-2xl border ${
              message.type === 'error' 
                ? 'bg-error-container/50 text-error border-error/20' 
                : 'bg-green-100 text-green-800 border-green-200'
            }`}
          >
            {message.type === 'error' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-bold">{message.text}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-surface-container">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container bg-surface-container-high flex items-center justify-center shadow-md transition-all group-hover:border-primary/30">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-on-surface-variant opacity-50" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2.5 bg-primary text-on-primary rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all border-2 border-surface-container-lowest"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFotoChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Foto Profil</h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-[200px]">
                Gunakan foto profesional dengan format JPG atau PNG (Maksimal 2MB).
              </p>
            </div>
          </div>

          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Username Akun</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none font-medium text-on-surface transition-all"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Password Baru (Opsional)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none font-medium text-on-surface transition-all"
                  placeholder="Isi hanya jika ingin mengubah password"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}