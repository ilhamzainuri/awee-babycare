import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User,
  Lock,
  ArrowRight,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import logo from "../assets/logo.jpg";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  // Generate captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi captcha
    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
      setErrorMsg('Captcha salah. Silakan coba lagi.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        'http://localhost/awee-babycare/backend/api';

      const response = await fetch(`${baseUrl}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (result.status === 200) {
        localStorage.setItem(
          'user_session',
          JSON.stringify(result.data)
        );

        if (result.data.role === 'admin') {
          navigate('/');
        } else if (result.data.role === 'therapist') {
          navigate('/therapist-dashboard');
        } else {
          navigate('/');
        }
      } else {
        generateCaptcha();
        throw new Error(
          result.message || 'Gagal melakukan otentikasi.'
        );
      }
    } catch (error: any) {
      generateCaptcha();
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
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 bg-primary-container rounded-3xl p-1 shadow-inner mb-4 overflow-hidden border border-surface-container-high">
            <img
              src={logo}
              alt="Awee Babycare"
              className="w-full h-full object-cover rounded-[1.3rem]"
            />
          </div>

          <h1 className="text-2xl font-black text-on-surface tracking-tight">
            Selamat Datang
          </h1>

          <p className="text-sm font-medium text-on-surface-variant mt-2">
            Silakan masuk ke akun Anda
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-error-container/50 text-error flex items-center gap-3 rounded-2xl border border-error/20"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">
              {errorMsg}
            </span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Username
            </label>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />

              <input
                type="text"
                required
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none font-medium text-on-surface transition-all"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />

              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none font-medium text-on-surface transition-all"
                placeholder="Masukkan password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Captcha */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Verifikasi Captcha
            </label>

            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-lg text-primary">
                  {captchaNum1} + {captchaNum2} = ?
                </div>

                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-xs bg-primary text-on-primary px-3 py-1 rounded-lg"
                >
                  Refresh
                </button>
              </div>

              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={(e) =>
                  setCaptchaAnswer(e.target.value)
                }
                className="mt-3 w-full px-4 py-3 bg-white border border-surface-container rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan hasil penjumlahan"
              />
            </div>
          </div>

          {/* Login Button */}
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