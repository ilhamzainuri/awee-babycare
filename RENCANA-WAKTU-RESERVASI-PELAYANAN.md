# DONE
# Catatan Perubahan Awee Babycare

## Bagian A — Rencana: Pemisahan Waktu Reservasi & Waktu Pelayanan di Laporan

Status: **Direncanakan, belum dieksekusi** (menunggu perintah implementasi).

### Goal

Di modal detail transaksi laporan, tampilkan tiga waktu yang berbeda:

1. **Waktu Reservasi** — kapan reservasi masuk & dicatat di sistem.
2. **Waktu Pelayanan** — jadwal pelayanan (waktu kunjungan).
3. **Mulai & Selesai Pelayanan** — dari aksi "Mulai Layanan" dan "Laporan Terapis" di dashboard terapis.

### Pemetaan Field (DB `appointments` — TANPA migrasi)

| Label di Modal | Field DB | Keterangan |
|---|---|---|
| Waktu Reservasi (baru) | `created_at` | Auto-timestamp saat record dibuat |
| Waktu Pelayanan | `waktu_reservasi` | Sudah terisi field ini — di DB Anda field ini = jadwal pelayanan |
| Mulai Pelayanan | `waktu_mulai_layanan` | Diisi `start_service.php` |
| Selesai Pelayanan | `waktu_selesai_layanan` | Diisi `submit_report.php` |

> Sesuai konfirmasi: di DB yang sekarang, **waktu pelayanan dicatat di field `waktu_reservasi`**.
> Jadi tidak ada perubahan arti field & tidak ada migrasi database.

### Format & Fallback

- Format semua waktu: **`DD MMM YYYY, HH:MM`** → contoh `20 Okt 2026, 14:30`
  (pakai `toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })` + `', '` + `toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })`).
- Nilai kosong:
  - `waktu_mulai_layanan` NULL → **`Belum dimulai`**
  - `waktu_selesai_layanan` NULL → **`Belum dimulai`**; jika mulai sudah ada → **`Belum selesai`**
  - `created_at` NULL (tidak terjadi, default) → `-`

### Backend

**Tidak ada perubahan.** `transaction_detail.php` sudah `SELECT a.*` sehingga
`created_at`, `waktu_reservasi`, `waktu_mulai_layanan`, `waktu_selesai_layanan`
sudah dikembalikan ke frontend.

### File yang Diubah (frontend saja)

1. **`frontend/src/pages/therapist/TherapistReport.tsx`** — kotak *Jadwal & Penugasan*
   di modal *Detail Transaksi*:
   - tambah baris **Waktu Reservasi** → `trxDetail.created_at`
   - baris **Waktu Pelayanan** → `trxDetail.waktu_reservasi` (fmt baru)
   - baris **Mulai/Selesai Layanan** → fmt + fallback di atas (sebelumnya `|| '-'`)
   - tambah helper `fmtDateTime()` lokal
2. **`frontend/src/pages/Reports.tsx`** — modal detail admin yang identik
   (± line 879–897): perubahan sama persis agar konsisten.

### Tidak Disentuh (sesuai keputusan)

- Tabel utama laporan (tanpa kolom waktu baru) — perubahan hanya di **modal detail**.
- Export Excel/PDF (`prepareExportData`) tidak ditambah kolom waktu.
- Dashboard terapis, `therapist_dashboard.php`, `reports.php` tidak diubah.

### Verifikasi

```powershell
# workdir: frontend
npm run lint   # tsc --noEmit — satu-satunya check otomatis
```

Lalu uji manual: login terapis → `/therapist-report` → klik **Detail** pada salah satu
transaksi, cek 4 baris waktu di kotak *Jadwal & Penugasan* (data `Menunggu` harus
menampilkan `Belum dimulai`).

---

## Bagian B — Rencana: Validasi Waktu Reservasi Tidak Boleh Mundur

Status: **Selesai diimplementasikan**.

### Masalah
Form reservasi dan reschedule tidak memvalidasi waktu — user bisa memilih waktu di masa lalu (waktu mundur).

### Solusi
Validasi dua lapis:
1. **Frontend** — `min` attribute pada input datetime/date/time agar browser blokir input waktu lampau.
2. **Backend** — `strtotime($waktu) >= strtotime(NOW())` untuk guard trust boundary.

---

## 1. Reservasi Baru

### File: `frontend/src/pages/Reservation.tsx`

**Tambah helper (di dalam komponen, sebelum `handleSubmit`):**
```tsx
const getMinDatetimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};
```

**Ubah input `waktu_reservasi` (line 404):**
```tsx
<input
  required
  name="waktu_reservasi"
  value={formData.waktu_reservasi}
  onChange={handleInputChange}
  type="datetime-local"
  min={getMinDatetimeLocal()}
  className="w-full px-5 py-4 bg-surface-container border border-surface-container-highest rounded-2xl text-base font-medium focus:ring-2 focus:ring-secondary outline-none text-on-surface"
/>
```

**Validasi di `handleSubmit` (~line 134, sebelum `formattedDate`):**
```tsx
// Validasi waktu tidak boleh mundur
const nowLocal = new Date();
nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
const selectedTime = new Date(formData.waktu_reservasi.replace('T', ' ').replace(':00', ''));
if (selectedTime.getTime() < nowLocal.getTime()) {
  setMessage({ type: 'error', text: 'Waktu pelayanan tidak boleh di masa lalu. Silakan pilih waktu saat ini atau di masa depan.' });
  setIsLoading(false);
  return;
}
```

---

### File: `backend/api/appointments.php`

**Setelah line 36** (`$waktu_reservasi = $input['waktu_reservasi'];`), **sebelum cek overlap** (line 39):

```php
// Validasi waktu tidak boleh mundur
if (strtotime($waktu_reservasi) < strtotime(date('Y-m-d H:i:s'))) {
    http_response_code(400);
    echo json_encode([
        "status" => 400,
        "message" => "Gagal: Waktu pelayanan tidak boleh di masa lalu. Silakan pilih waktu saat ini atau di masa depan."
    ]);
    exit();
}
```

---

## 2. Reschedule (Admin Schedules)

### File: `frontend/src/pages/AdminSchedules.tsx`

**Tambah helper (di dalam komponen, sebelum `handleSave`):**
```tsx
const getTodayDateString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const getMinTimeString = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const getTimeMinValue = () => {
  if (editForm.date === getTodayDateString()) {
    return getMinTimeString();
  }
  return '';
};
```

**Date input (line 712-717):**
```tsx
<input
  type="date"
  value={editForm.date}
  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
  min={getTodayDateString()}
  className="w-full p-2.5 sm:p-3 bg-surface-container-lowest border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container transition-all text-xs sm:text-sm"
/>
```

**Time input (line 720-726):**
```tsx
<input
  type="time"
  value={editForm.time}
  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
  min={getTimeMinValue()}
  className="w-full p-2.5 sm:p-3 bg-surface-container-lowest border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container transition-all text-xs sm:text-sm"
/>
```

**Validasi di `handleSave` (setelah line 159, sebelum `setIsUpdating`):**
```tsx
// Validasi waktu tidak boleh mundur
const selectedDatetime = new Date(`${editForm.date}T${editForm.time}:00`);
const nowLocal = new Date();
nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
if (selectedDatetime.getTime() < nowLocal.getTime()) {
  toast.error("Waktu pelayanan tidak boleh di masa lalu. Silakan pilih waktu saat ini atau di masa depan.");
  return;
}
```

---

### File: `backend/api/update_schedule.php`

**Setelah line 78** (`$new_datetime = ...`), **sebelum cek overlap** (line 86):

```php
// Validasi waktu tidak boleh mundur (hanya jika waktu diubah)
if ($has_datetime && strtotime($new_datetime) < strtotime(date('Y-m-d H:i:s'))) {
    throw new Exception("Gagal: Waktu pelayanan tidak boleh di masa lalu. Silakan pilih waktu saat ini atau di masa depan.");
}
```

---

## Behavior Khusus

| Scenario | Waktu dikirim | Validasi waktu? | Keterangan |
|---|---|---|---|
| **Reservasi baru** | Ya | ✅ Ya | Waktu harus `>= NOW()` |
| **Reschedule (modal)** | Ya | ✅ Ya | Waktu harus `>= NOW()` |
| **Ubah status cepat** | Tidak | ❌ Tidak | Jadwal lama tetap bisa diubah status (misal cancel/aktifkan ulang) |
| **Pembatalan** | Tidak | ❌ Tidak | Jadwal lama tetap bisa dibatalkan |

> Catatan: "reschedule bisa ubah waktu" → admin wajib pilih waktu baru (`>= now`), tidak boleh mempertahankan waktu lama yang sudah lewat.

---

## Verifikasi

```powershell
# workdir: frontend
npm run lint   # tsc --noEmit — satu-satunya check otomatis
```

**Manual test:**
1. Reservasi waktu lampau → ditolak di form (`min`) + toast/error message.
2. Reschedule ke jam lampau → ditolak di form (`min`) + toast.
3. Cancel/ubah status jadwal lama → **lolos** (tidak validasi waktu, sesuai keputusan).
4. Reservasi/Reschedule ke waktu sekarang atau depan → **lolos**.

---

## Catatan Teknis

- Format waktu frontend: `YYYY-MM-DDTHH:MM` (HTML datetime-local).
- Format waktu backend: `YYYY-MM-DD HH:MM:SS` (MySQL datetime).
- `timezoneOffset` disesuaikan di frontend agar user melihat jam lokal, bukan UTC.
- Validasi backend menggunakan `strtotime()` untuk perbandingan timestamp unix (timezone-agnostic).
