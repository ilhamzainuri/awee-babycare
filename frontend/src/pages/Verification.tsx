import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CalendarDays, 
  Filter, 
  AlertTriangle, 
  Hourglass, 
  Landmark, 
  Banknote,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

// 1. Definisikan tipe data sesuai dengan yang dikirim oleh backend (API)
interface TaskData {
  id: number;
  patient: string;
  therapist: string;
  type: 'mismatch' | 'pending' | string;
  plan_method: string;
  actual_method: string;
}

// 2. Fungsi helper untuk menentukan icon berdasarkan teks metode pembayaran
const getPaymentIcon = (method: string) => {
  if (!method) return Banknote;
  if (method.toLowerCase().includes('cash')) return Banknote;
  return Landmark; // Default ke icon Transfer
};

export default function Verification() {
  // 3. Setup State
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 4. URL API Backend (menyesuaikan env Vite)
  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/verification.php` 
    : 'http://localhost/awee-babycare/backend/api/verification.php';

  // 5. Fetch Data dari Database saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Hapus ?action=fetch, API sekarang menggunakan deteksi Method GET
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        
        const result = await response.json();
        
        // Cek format respons standar API kamu (status 200)
        if (result.status !== 200) {
          throw new Error(result.message || 'Terjadi kesalahan');
        }
        
        // Yang disimpan ke state adalah result.data (array-nya)
        setTasks(result.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [apiUrl]);

  // 6. Fungsi Handler untuk tombol "Verify"
  const handleVerify = async (id: number) => {
    try {
      // Hapus ?action=verify, API sekarang menggunakan deteksi Method POST
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();

      // Cek status 200 dari respons API
      if (response.ok && result.status === 200) {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      } else {
        alert(result.message || "Gagal melakukan verifikasi di server.");
      }
    } catch (err) {
      console.error("Error verifying task:", err);
      alert("Terjadi kesalahan jaringan saat memverifikasi.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Financial Verification</h1>
        <p className="text-on-surface-variant mt-1">Reconcile planned payments with actual receipts from clinicians.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-surface-container-lowest p-2 rounded-2xl border border-surface-container shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input 
            type="text" 
            placeholder="Search patient, therapist, or TRX#"
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-container transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container transition-all border border-surface-container text-sm font-bold">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Today</span>
          </button>
          <button className="p-3 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container transition-all border border-surface-container">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tampilan Status Loading & Error */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center text-sm font-bold border border-error/20">
          Error: {error}
        </div>
      )}

      {/* List Item dari Database */}
      {!loading && !error && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant font-medium">
              Semua pembayaran sudah diverifikasi!
            </div>
          ) : (
            tasks.map((task) => {
              const PlanIcon = getPaymentIcon(task.plan_method);
              const ActualIcon = getPaymentIcon(task.actual_method);

              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={task.id}
                  className={cn(
                    "bg-surface-container-lowest rounded-3xl p-6 border-l-[6px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden",
                    task.type === 'mismatch' ? "border-l-error" : "border-l-secondary-container"
                  )}
                >
                  <div className="flex items-start md:items-center gap-6 flex-1">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
                      task.type === 'mismatch' ? "bg-error-container text-on-error-container" : "bg-secondary-container/20 text-secondary"
                    )}>
                      {task.type === 'mismatch' ? <AlertTriangle className="w-6 h-6" /> : <Hourglass className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-on-surface">{task.patient}</h3>
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-bold uppercase tracking-wider">
                          {task.therapist}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Plan</p>
                          <div className="flex items-center gap-2 text-on-surface-variant font-bold text-sm">
                            <PlanIcon className="w-4 h-4 opacity-60" />
                            {task.plan_method}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Actual</p>
                          <div className={cn(
                            "flex items-center gap-2 font-bold text-sm",
                            task.type === 'mismatch' ? "text-error" : "text-on-surface"
                          )}>
                            <ActualIcon className="w-4 h-4" />
                            {task.actual_method}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-surface-container">
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                      task.type === 'mismatch' ? "bg-error-container text-on-error-container" : "bg-secondary-container/20 text-secondary"
                    )}>
                      {task.type}
                    </span>
                    <button 
                      onClick={() => handleVerify(task.id)}
                      className="bg-primary-container text-on-primary-container font-bold px-8 py-3 rounded-2xl hover:brightness-110 active:scale-95 transition-all text-sm shadow-sm md:w-full"
                    >
                      Verify
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}

          <div className="text-center py-12 opacity-50 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-outline-variant" />
            <p className="text-sm font-medium">Showing {tasks.length} verification tasks.</p>
          </div>
        </div>
      )}
    </div>
  );
}