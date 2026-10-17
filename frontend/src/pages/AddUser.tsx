import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Search,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface UserRow {
  id: number;
  username: string;
  role: string;
  foto: string | null;
  created_at: string;
}

export default function AddUser() {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost/awee-babycare/backend/api';
  const uploadsUrl = baseUrl.replace('/api', '/uploads');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('user_session');
    if (sessionStr) {
      try {
        setSessionId(JSON.parse(sessionStr).id ?? null);
      } catch {
        setSessionId(null);
      }
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/users.php?action=list`);
      const result = await response.json();
      if (result.status === 200) {
        setUsers(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setRole('admin');
    setShowPassword(false);
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    resetForm();
    setMessage({ type: null, text: '' });
    setIsModalOpen(true);
  };

  const openEdit = (user: UserRow) => {
    resetForm();
    setMessage({ type: null, text: '' });
    setEditingId(user.id);
    setUsername(user.username);
    setRole(user.role);
    setFotoPreview(user.foto ? `${uploadsUrl}/${user.foto}` : null);
    setIsModalOpen(true);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: null, text: '' });

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('role', role);
      if (editingId) formData.append('id', String(editingId));
      if (password) formData.append('password', password);
      if (fotoFile) formData.append('foto', fotoFile);

      const url = editingId
        ? `${baseUrl}/update_settings.php`
        : `${baseUrl}/create_user.php`;

      const response = await fetch(url, { method: 'POST', body: formData });
      const result = await response.json();

      if (result.status !== 200) {
        throw new Error(result.message);
      }

      setMessage({
        type: 'success',
        text: editingId ? 'User berhasil diperbarui' : 'User berhasil ditambahkan'
      });
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const requester = sessionId ? `&requester_id=${sessionId}` : '';
      const response = await fetch(
        `${baseUrl}/users.php?id=${deleteTarget.id}${requester}`,
        { method: 'DELETE' }
      );
      const result = await response.json();

      if (result.status !== 200) {
        throw new Error(result.message);
      }

      setMessage({ type: 'success', text: 'User berhasil dihapus' });
      setDeleteTarget(null);
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Manajemen User</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Kelola akun admin dan therapist: tambah, edit, dan hapus.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3.5 rounded-2xl font-bold hover:brightness-105 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {message.type && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-surface-container overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-surface-container">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username..."
              className="w-full pl-12 py-3 rounded-2xl border border-surface-container bg-surface"
            />
          </div>

          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2.5 rounded-xl transition-all"
          >
            <RefreshCw size={16} />
            Muat Ulang
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-on-surface-variant font-medium text-sm">
              Memuat data user...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant font-medium">
            Belum ada user.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase text-on-surface-variant border-b border-surface-container">
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Dibuat</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-surface-container/60 hover:bg-surface-container-low/60 transition-all"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-surface-container-high bg-surface-container flex items-center justify-center shrink-0">
                          {user.foto ? (
                            <img
                              src={`${uploadsUrl}/${user.foto}`}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 opacity-50" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface capitalize">
                            {user.username}
                          </p>
                          {sessionId === user.id && (
                            <span className="text-[11px] text-primary font-semibold">
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                          user.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2.5 rounded-xl text-primary hover:bg-primary/10 transition-all"
                          title="Edit user"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          disabled={sessionId === user.id}
                          className="p-2.5 rounded-xl text-error hover:bg-error/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Hapus user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg shadow-2xl my-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-on-surface">
                    {editingId ? 'Edit User' : 'Tambah User'}
                  </h2>
                  <button
                    onClick={() => !isSaving && setIsModalOpen(false)}
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                          <User className="w-10 h-10 opacity-50" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-2 rounded-xl"
                      >
                        <Camera size={16} />
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
                      <h3 className="font-bold">Foto Profil</h3>
                      <p className="text-sm text-on-surface-variant">
                        JPG, JPEG atau PNG (maks 2MB).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase">Username</label>
                    <div className="relative mt-2">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        size={18}
                      />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 py-3 rounded-2xl border border-surface-container"
                        placeholder="Masukkan username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase">
                      Password {editingId && (
                        <span className="text-on-surface-variant font-medium normal-case">
                          (kosongkan jika tidak diubah)
                        </span>
                      )}
                    </label>
                    <div className="relative mt-2">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        size={18}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingId}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 rounded-2xl border border-surface-container"
                        placeholder="Masukkan password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase">Role</label>
                    <div className="relative mt-2">
                      <Shield
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        size={18}
                      />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full pl-12 py-3 rounded-2xl border border-surface-container"
                      >
                        <option value="admin">Admin</option>
                        <option value="therapist">Therapist</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold disabled:opacity-60"
                    >
                      {isSaving ? (
                        'Menyimpan...'
                      ) : (
                        <>
                          <Save size={18} />
                          {editingId ? 'Perbarui User' : 'Simpan User'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => !isSaving && setIsModalOpen(false)}
                      className="px-8 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-5">
                  <AlertTriangle size={26} />
                </div>
                <h3 className="text-xl font-black text-on-surface">
                  Hapus User
                </h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Yakin ingin menghapus{' '}
                  <strong className="text-on-surface">{deleteTarget.username}</strong>?
                  Data akan di-soft-delete dan dapat dipulihkan dari Audit Log.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 bg-error text-on-error px-6 py-3.5 rounded-2xl font-bold disabled:opacity-60"
                  >
                    {isDeleting ? (
                      'Menghapus...'
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Ya, Hapus
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
