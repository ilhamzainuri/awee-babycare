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
