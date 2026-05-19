import React from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  FileEdit, 
  CheckCircle2, 
  ArrowRight,
  User,
  History,
  ChevronDown,
  ArrowRightCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const logs = [
  {
    id: 1,
    date: "25 Apr '26",
    time: "10:00 AM",
    action: "Update Harga",
    user: "Admin Sari",
    categoryColor: "bg-secondary-container/20 text-secondary",
    icon: FileEdit,
    description: "Mengubah Pijat Bayi",
    details: { from: "150rb", to: "170rb" }
  },
  {
    id: 2,
    date: "25 Apr '26",
    time: "11:30 AM",
    action: "Input Laporan",
    user: "Terapis Naya",
    categoryColor: "bg-tertiary-container/10 text-tertiary",
    icon: CheckCircle2,
    description: "Menyelesaikan layanan Nara",
    meta: "Metode: Cash"
  }
];

export default function AuditLog() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">System Audit Log</h1>
        <p className="text-on-surface-variant font-medium">Review recent administrative and operational activities across the clinic.</p>
      </div>

      {/* Advanced Filters */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container p-6 rounded-3xl shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Search User</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text" 
                placeholder="Admin Sari..."
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="date" 
                defaultValue="2026-04-25"
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-surface-container rounded-2xl text-sm focus:ring-2 focus:ring-primary-container transition-all text-on-surface-variant"
              />
            </div>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-4 bg-primary-container text-on-primary-container font-black rounded-2xl hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-primary-container/20 text-sm">
          <Filter className="w-4 h-4" />
          FILTER ACTIVITIES
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative space-y-6">
        {/* Connection Line */}
        <div className="absolute left-5 sm:left-24 top-8 bottom-8 w-[2px] bg-surface-container rounded-full hidden sm:block" />

        {logs.map((log, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={log.id}
            className="flex flex-col sm:flex-row gap-4 sm:gap-12 relative group"
          >
            {/* Timestamp (Desktop Left Side) */}
            <div className={cn(
              "hidden sm:flex flex-col items-end w-24 shrink-0 transition-opacity pt-2 group-hover:opacity-100",
              i === 0 ? "opacity-100" : "opacity-40"
            )}>
              <span className="text-sm font-black text-on-surface">{log.date}</span>
              <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">{log.time}</span>
            </div>

            {/* Icon Node */}
            <div className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center relative z-10 shrink-0 border-4 border-surface-container-lowest shadow-sm overflow-hidden">
               <div className={cn("w-full h-full flex items-center justify-center", log.categoryColor)}>
                 <log.icon className="w-5 h-5" />
               </div>
            </div>

            {/* Mobile Header */}
            <div className="sm:hidden flex items-center gap-3">
               <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", log.categoryColor)}>
                 <log.icon className="w-5 h-5" />
               </div>
               <div className="flex flex-col">
                  <span className="text-sm font-black text-on-surface">{log.date}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">{log.time}</span>
               </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 bg-surface-container-lowest border border-surface-container p-6 rounded-3xl shadow-sm group-hover:shadow-md group-hover:border-primary-container/20 transition-all">
               <div className="flex flex-wrap items-center gap-3 mb-3">
                 <span className={cn(
                   "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                   log.categoryColor
                 )}>
                   {log.action}
                 </span>
                 <div className="flex items-center gap-1.5 font-bold text-primary-container text-sm">
                    <User className="w-3 h-3" />
                    {log.user}
                 </div>
               </div>
               
               <p className="text-xl font-bold text-on-surface tracking-tight leading-tight">
                 {log.description}
               </p>

               {log.details && (
                 <div className="mt-4 flex items-center gap-3 p-3 bg-surface-container-low rounded-xl w-fit">
                    <span className="text-sm text-on-surface-variant line-through font-medium">{log.details.from}</span>
                    <ArrowRight className="w-4 h-4 text-outline" />
                    <span className="text-sm text-tertiary font-black">{log.details.to}</span>
                 </div>
               )}

               {log.meta && (
                 <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg w-fit text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
                    <ArrowRightCircle className="w-3 h-3" />
                    {log.meta}
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pb-12">
        <button className="px-8 py-3 rounded-full border-2 border-surface-container text-primary-container font-black hover:bg-surface-container transition-all text-sm flex items-center gap-2">
           <History className="w-4 h-4" />
           LOAD MORE ACTIVITY
        </button>
      </div>
    </div>
  );
}
