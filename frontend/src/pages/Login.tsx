import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import logo from "../assets/logo.jpg";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/awee-babycare/backend/api';
      
      const response = await fetch(`${baseUrl}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.status === 200) {
        // Simpan data user ke localStorage untuk sesi
        localStorage.setItem('user_session', JSON.stringify(result.data));

        // Redirect berdasarkan role
        if (result.data.role === 'admin') {
          navigate('/'); // Arahkan ke Dashboard Admin
        } else if (result.data.role === 'therapist') {
          navigate('/therapist-dashboard'); // Sesuaikan dengan rute terapis kamu
        } else {
          navigate('/'); // Fallback
        }
      } else {
        throw new Error(result.message || "Gagal melakukan otentikasi.");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] p-8 md:p-10 shadow-2xl border border-surface-container"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 bg-primary-container rounded-3xl p-1 shadow-inner mb-4 overflow-hidden border border-surface-container-high">
            <img src={logo} alt="Awee Babycare" className="w-full h-full object-cover rounded-[1.3rem]" />
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">Selamat Datang</h1>
          <p className="text-sm font-medium text-on-surface-variant mt-2">Silakan masuk ke akun Anda</p>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mb-6 p-4 bg-error-container/50 text-error flex items-center gap-3 rounded-2xl border border-error/20"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Username</label>
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
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none font-medium text-on-surface transition-all"
                placeholder="Masukkan password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-2xl font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}