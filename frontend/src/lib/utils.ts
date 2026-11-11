import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function canStartService(waktuRaw?: string) {
  if (!waktuRaw) return true;
  const jadwal = new Date(waktuRaw.replace(' ', 'T'));
  if (isNaN(jadwal.getTime())) return true;
  return Date.now() >= jadwal.getTime();
}

export function startServiceBlockMessage(waktuRaw?: string) {
  if (!waktuRaw) return '';
  const jadwal = new Date(waktuRaw.replace(' ', 'T'));
  if (isNaN(jadwal.getTime()) || Date.now() >= jadwal.getTime()) return '';
  const diff = Math.ceil((jadwal.getTime() - Date.now()) / 60000);
  const jam = Math.floor(diff / 60);
  const mnt = diff % 60;
  return `Layanan baru bisa dimulai ${jam > 0 ? jam + ' jam ' : ''}${mnt > 0 ? mnt + ' menit ' : ''}lagi (terjadwal: ${jadwal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
}

export function localDateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function groupSchedulesByDate<T extends { waktu_reservasi_raw?: string; time: string }>(list: T[]) {
  const groups: { dateKey: string; items: T[] }[] = [];
  [...list]
    .sort((a, b) => (a.waktu_reservasi_raw || a.time).localeCompare(b.waktu_reservasi_raw || b.time))
    .forEach(item => {
      const dateKey = (item.waktu_reservasi_raw || item.time).slice(0, 10);
      const group = groups.find(g => g.dateKey === dateKey);
      if (group) group.items.push(item);
      else groups.push({ dateKey, items: [item] });
    });
  return groups;
}

export function formatGroupDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const label = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dateKey === localDateKey(today)) return `Hari Ini · ${label}`;
  if (dateKey === localDateKey(tomorrow)) return `Besok · ${label}`;
  return label;
}

export function formatDateRange(startKey: string, endKey: string) {
  if (startKey === endKey) {
    return new Date(`${startKey}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const monthYear = end.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  if (sameMonth) return `${start.getDate()} – ${end.getDate()} ${monthYear}`;
  const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}
