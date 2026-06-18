import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function AddUser() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  const [showPassword, setShowPassword] = useState(false);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({
    type: null,
    text: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost/awee-babycare/backend/api';

  const handleFotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setIsSaving(true);
    setMessage({
      type: null,
      text: ''
    });

    try {
      const formData = new FormData();

      formData.append('username', username);
      formData.append('password', password);
      formData.append('role', role);

      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      const response = await fetch(
        `${baseUrl}/create_user.php`,
        {
          method: 'POST',
          body: formData
        }
      );

      const result = await response.json();

      if (result.status === 200) {
        setMessage({
          type: 'success',
          text: 'User berhasil ditambahkan'
        });

        setUsername('');
        setPassword('');
        setRole('admin');

        setFotoFile(null);
        setFotoPreview(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-on-surface">
          Tambah User
        </h1>

        <p className="text-sm text-on-surface-variant mt-2">
          Tambahkan akun admin atau therapist baru.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container">

        {message.type && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.type === 'success'
              ? <CheckCircle2 size={20}/>
              : <AlertTriangle size={20}/>
            }

            <span>{message.text}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* FOTO */}
          <div className="flex flex-col sm:flex-row gap-6 items-center pb-6 border-b border-surface-container">

            <div className="relative">

              <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden border bg-surface-container flex items-center justify-center">

                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User
                    className="w-10 h-10 opacity-50"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-2 rounded-xl"
              >
                <Camera size={16}/>
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>

            <div>
              <h3 className="font-bold">
                Foto Profil
              </h3>

              <p className="text-sm text-on-surface-variant">
                JPG, JPEG atau PNG.
              </p>
            </div>

          </div>

          {/* USERNAME */}
          <div>

            <label className="text-xs font-bold uppercase">
              Username
            </label>

            <div className="relative mt-2">

              <User
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
              />

              <input
                type="text"
                required
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="w-full pl-12 py-3 rounded-2xl border"
                placeholder="Masukkan username"
              />
            </div>

          </div>

          {/* PASSWORD */}
          <div>

            <label className="text-xs font-bold uppercase">
              Password
            </label>

            <div className="relative mt-2">

              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
              />

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full pl-12 pr-12 py-3 rounded-2xl border"
                placeholder="Masukkan password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword
                  ? <EyeOff size={20}/>
                  : <Eye size={20}/>
                }
              </button>

            </div>

          </div>

          {/* ROLE */}
          <div>

            <label className="text-xs font-bold uppercase">
              Role
            </label>

            <div className="relative mt-2">

              <Shield
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
              />

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                className="w-full pl-12 py-3 rounded-2xl border"
              >
                <option value="admin">
                  Admin
                </option>

                <option value="therapist">
                  Therapist
                </option>
              </select>

            </div>

          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold"
          >
            {isSaving ? (
              "Menyimpan..."
            ) : (
              <>
                <Save size={18}/>
                Simpan User
              </>
            )}
          </button>

        </form>

      </div>
    </motion.div>
  );
}