# AGENTS.md

Clinic management system for Awee Babycare (baby/mother care clinic). Two independent halves, no shared build:

- `backend/` — PHP native (PDO) REST-ish API. No composer, no autoloader, no framework.
- `frontend/` — React 19 + Vite 6 + TypeScript + Tailwind v4, single SPA. UI text is Indonesian.

## Roles & demo accounts

- Roles: `admin` (full CRUD, verification, reports, audit log) and `therapist` (`/therapist/*`).
- Seed accounts (from `USERACC.md`, passwords stored plaintext in DB): `admin`/`admin`, `karin`/`karin`.

## Run / verify

Backend needs Apache + MySQL from XAMPP serving the repo from `htdocs`. Endpoints are plain files at
`http://localhost/awee-babycare/backend/api/<file>.php`.

```powershell
# first-time DB setup: create db `db_awee_babycare` in phpMyAdmin, import root "db_awee_babycare copy.sql" (populated; the plain .sql has no appointment data)
# config: backend/config/koneksi.php (root / empty password by default)

# frontend (workdir: frontend)
npm install
npm run dev      # vite --port=3000 --host=0.0.0.0  (README's :5173 is stale)
npm run lint     # this is `tsc --noEmit` — the only typecheck, no ESLint
npm run build
```

- No test framework and no CI exist. `npm run lint` (tsc) is the only automated check — run it after TS edits.
- No PHP linter/tests configured. Verify backend changes by hitting the endpoint in a browser/curl.
- `npm run clean` is `rm -rf dist` and fails in PowerShell — delete `dist/` manually on Windows.

## Directory map

```
backend/api/        25 standalone endpoints (list below)
backend/config/     koneksi.php — PDO $conn + shared revenue/commission helpers
backend/uploads/    user photos; uploads/payments/ holds payment proofs (both gitignored)
frontend/src/App.tsx            routing + ProtectedRoute (role gate)
frontend/src/components/        Layout.tsx (admin), TherapistLayout.tsx (therapist)
frontend/src/pages/             admin pages; pages/therapist/ therapist pages
frontend/src/lib/               utils.ts (cn), exportUtils.ts (Excel/PDF export)
frontend/src/index.css          Tailwind v4 @theme design tokens
frontend/dist/                  build artifact (gitignored) — never edit
```

## API endpoints (`backend/api/`)

- `login.php` POST username/password (plaintext compare) → user row.
- `dashboard.php` GET admin KPIs + warning alerts; `?action=schedule` = day's therapist schedule.
- `admin_schedules.php` GET daily schedule list (`date`/`search`/`status` filters).
- `appointments.php` POST reservation (needs `id_therapist`+`treatments`) or verify (body `id`); GET all (verification grid), `?id=` detail, `?user_id=` that therapist's own schedule.
- `verification.php` GET payment-verification list/`?id=` detail; POST `id` to verify.
- `update_schedule.php` POST `trx_id` reschedule / change `status_jadwal` / cancel.
- `start_service.php` POST `appointment_id`,`user_id` → `Diproses`.
- `submit_report.php` POST multipart `appointment_id`,`user_id`,catatan,metode,bukti → `Selesai`.
- `services.php` CRUD `services` (PUT/DELETE via `?id=`).
- `categories.php` CRUD `kategori` (delete blocked while referenced by services).
- `therapists.php` CRUD `therapists`.
- `reports.php` GET analytics `filter=Daily|Weekly|Monthly|Yearly|Custom`; `?therapist_id=` commission detail.
- `therapist_dashboard.php` GET `?user_id` commissions/schedules/history.
- `therapist_report.php` GET therapist-facing report.
- `therapist_schedule.php` GET therapist schedule.
- `therapist_commission_detail.php` GET `?id_therapist` completed-session list.
- `therapist_notifications.php` GET `?terapist_id` notifications derived from `audit_logs`.
- `transaction_detail.php` GET `?id` appointment + service line items.
- `users.php` GET list of therapist logins. `get_user.php` GET `?id` profile.
- `create_user.php` POST multipart create user (+`foto`). `update_settings.php` POST multipart account/therapist profile.
- `auditlog.php` GET paginated audit log (also runs 30-day auto-purge).
- `restore.php` / `permanent_delete.php` POST `audit_log_id`.

## Backend conventions

- Every endpoint is a standalone `.php` file that sends CORS headers, reads its own input, and returns JSON
  `{status, message, data}`. Mutations are switched by an `?action=` query param (e.g. `dashboard.php?action=schedule`).
- `require_once` `backend/config/koneksi.php` for the `$conn` PDO handle. Koneksi also defines shared helpers
  `getRevenueSummary()` / `getTotalCommission()` — reuse them, don't re-SQL revenue/commission sums.
- `ini_set('display_errors', 0)` is intentional so PHP warnings don't corrupt JSON output. When debugging a
  silent 500, temporarily print to a log rather than expecting errors in the response.
- Soft delete everywhere: filter `deleted_at IS NULL` in queries; delete = `UPDATE ... SET deleted_at=NOW()`.
  Restore flow: `restore.php`, hard delete: `permanent_delete.php`, both driven by `audit_logs`.
  `auditlog.php` auto-purges soft-deleted rows older than 30 days.
- Writes should also insert into `audit_logs` (see `appointments.php` / `restore.php` for the pattern).
- Most endpoints hardcode `user_id = 1` for audit logs when the caller doesn't pass one.

## Database / data model

Engine: MySQL/MariaDB (`utf8mb4`). Schema source of truth is `db_awee_babycare copy.sql` — a full dump with
seed data, indexes and FK constraints (dumped `2026-10-16`). `db_awee_babycare.sql` has the same schema but
ships only the `kategori`/`services`/`therapists`/`users` seed rows and no `appointments`/`audit_logs` data.
Both declare identical FKs; prefer the `copy` file for a populated local DB.

Tables (7) and relationships:

- `users` (PK `id`, UNIQUE `username`) — `username`, `password` (plaintext), `foto`, `role` ENUM(`admin`,`therapist`), `deleted_at`.
- `therapists` (PK `id`) — `user_id` → `users.id` (ON DELETE CASCADE), `nama_terapis`, `no_whatsapp`, `status_aktif`, `deleted_at`.
- `kategori` (PK `id_kategori`, **not** `id`) — only `nama_kategori`. Names carry the substring `outlet`/`homecare`.
- `services` (PK `id`) — `kategori_id` → `kategori.id_kategori`, `nama_layanan`, `harga_saat_ini`, `persentase_komisi` (percent, e.g. `50.00`), `deleted_at`.
- `appointments` (PK `id`, header) — `id_therapist` → `therapists.id`, patient/visit fields, plus status/money/timestamp columns (below).
- `appointment_details` (PK `id`, one appointment → many treatments) — `id_appointment` → `appointments.id`
  (ON DELETE CASCADE), `id_service` → `services.id`, plus snapshot columns `harga_snapshot`,
  `persentase_komisi_snapshot`, `nominal_komisi_kalkulasi`, `deleted_at`.
- `audit_logs` (PK `id`) — `user_id` → `users.id` (ON DELETE SET NULL), `aksi` ENUM(`create`,`update`,`delete`,`restore`),
  `nama_tabel`, `record_id`, `data_lama`/`data_baru` (JSON, `CHECK json_valid`), `created_at`.

`appointments` columns: `status_jadwal` ENUM `Menunggu`/`Diproses`/`Selesai`/`Dibatalkan` (default `Menunggu`);
`status_pembayaran` ENUM `Unverified`/`Verified` (default `Unverified`); money `total_harga_kunjungan`,
`total_komisi_kunjungan`, `total_bersih`; stamps `waktu_reservasi`, `waktu_mulai_layanan`, `waktu_selesai_layanan`;
therapist inputs `suhu_pasien`, `bb_real_terapis`, `catatan_terapis`, `metode_bayar_terapis`, `bukti_bayar_url`;
admin input `metode_bayar_admin`; `deleted_at`.

Gotchas:

- Column is `suhu_pasien` in the DB; some PHP/tests write `suhu_Pasien` — MySQL column names are case-insensitive, so both work.
- `audit_logs.data_*` payload key names drifted across the patient-field rename: old rows use `Nama Anak`/`Suhu Anak`, newer ones `Nama Pasien`/`Suhu Pasien`. Parse defensively when reading history.
- Adding a reservation touches `appointments` + `appointment_details` (multi-treatment); never store price/commission only at the header — the detail snapshots are the record.
- Naming is mixed Indonesian/English by design. Patient fields were renamed: `nama_anak`→`nama_pasien`, `suhu_anak`→`suhu_pasien`.
- Passwords are stored plaintext and login (`login.php`) compares them directly. Not a bug to "fix" in passing; flag it if a task touches auth.
- There is no server-side session/token — every API endpoint is unauthenticated. Auth is client-side only:
  `localStorage.user_session` gates routes via `ProtectedRoute` in `frontend/src/App.tsx`.

## Business logic

- **Appointment lifecycle**: admin creates a reservation (`appointments.php` POST, defaults `Menunggu`) →
  therapist `start_service.php` (`Menunggu`→`Diproses`, stamps `waktu_mulai_layanan`, `suhu_Pasien`,
  `bb_real_terapis`) → therapist `submit_report.php` (`Diproses`→`Selesai`, multipart POST, stamps
  `waktu_selesai_layanan`, `catatan_terapis`, `metode_bayar_terapis`, uploads `bukti_bayar_url`).
  `update_schedule.php` handles reschedule / status change / cancel; a `Selesai` appointment is locked
  (cannot be edited or rescheduled), and cancelling appends the reason to `catatan_terapis`.
- **Payment / verification**: admin inputs `metode_bayar_admin` (plan) at reservation, therapist inputs
  `metode_bayar_terapis` (actual) at report. Verification (`verification.php` or `appointments.php` with `id`)
  is blocked until `metode_bayar_terapis` is set and the appointment is not `Dibatalkan`. On verify it sets
  `total_bersih = total_harga_kunjungan - total_komisi_kunjungan`. A `metode_bayar_admin != metode_bayar_terapis`
  gap is a reconciliation alert; the verification `type` is one of `verified` / `waiting_therapist` / `mismatch` / `pending`.
- **Commission is a snapshot**: reservation copies `services.harga_saat_ini` + `persentase_komisi` into
  `appointment_details` (`harga_snapshot`, `persentase_komisi_snapshot`, `nominal_komisi_kalkulasi`) and rolls
  up `appointments.total_harga_kunjungan` / `total_komisi_kunjungan`. Editing a service later must NOT change
  historical appointments — always read the snapshot columns.
- **Revenue definition**: gross `omzet` = `total_harga_kunjungan` of non-`Dibatalkan` rows; net = `total_bersih`,
  counted only when `Verified`. Use `getRevenueSummary()` / `getTotalCommission()` in `koneksi.php` instead of
  re-writing the SUMs.
- **No double-booking**: a therapist must have a ≥1-hour gap between active appointments; the overlap check
  excludes `Dibatalkan` and `Selesai` rows. Enforced in both `appointments.php` (new) and `update_schedule.php`
  (reschedule / reactivate).
- **One service type per reservation**: cannot mix Outlet and Homecare. Category is matched by substring
  `outlet` / `homecare` on `kategori.nama_kategori`, and the same rule derives `jenis_layanan` / `lokasi_kunjungan`
  — never create a category whose name omits those words.
- **Therapist duty status** is derived, not stored: `On Process` if the therapist has any `Diproses` appointment,
  otherwise `Standby`.
- **Restore window**: soft-deleted rows are restorable for 30 days (`auditlog.php` auto-purges older ones);
  restore/permanent-delete only support `therapists`, `services`, `appointments`, `users`.
- Gotcha: `reports.php` counts therapist sessions/commission by `status_jadwal='Selesai'`, while
  `therapist_dashboard.php` sums commission by `status_pembayaran='Verified'` — the two can disagree.

## Frontend conventions

- Routing in `App.tsx`: admin under `/*` (`Layout.tsx`), therapist under `/therapist/*`
  (`TherapistLayout.tsx`), login at `/login`. Add pages there.
- API base URL: `import.meta.env.VITE_API_BASE_URL` (a committed `frontend/.env`, placeholder value, plus a
  hardcoded fallback in each page). Endpoints are called by string-building URLs, not a shared API client —
  keep the fallback pattern consistent when adding calls.
- Styling is Tailwind v4 with **no `tailwind.config.js`**; theme tokens (Material-style `surface*`,
  `primary*`, `secondary*`, `tertiary*`, `error*`, `outline*`) live in `src/index.css` `@theme`, font Manrope.
  Reuse those token classes (`bg-surface-container-lowest`, `text-on-surface`, …) instead of raw hex.
- Icons: lucide-react. Animation: `motion/react`. Toasts: react-hot-toast (`<Toaster>` in `main.tsx`).
- Payment proof uploads live in `backend/uploads/payments` (gitignored); frontend derives the URL by replacing
  `/api` with `/uploads/payments` (see `Verification.tsx`). User photos similarly replace `/api` with `/uploads`.
- `frontend/src/lib/exportUtils.ts` exports `exportToExcel` (exceljs) and `exportToPDF` (jspdf + autotable).
- Charts: recharts.

## Known quirks

- `Login.tsx` sends therapists to `/therapist-dashboard`, a route that does not exist; `ProtectedRoute`
  bounces them back to `/therapist`. `TherapistLayout` nav uses `/therapist/Schedule` (capital S) while the
  route is `/schedule` — React Router is case-sensitive, so it lands on the catch-all `/therapist`. Test the
  intended paths before trusting nav labels.
- Vestigial Google AI Studio scaffolding, unused by `src/`: deps `@google/genai`, `express`, `tsx`;
  `frontend/.env` `GEMINI_API_KEY`/`APP_URL`; `frontend/meta.env`, `frontend/metadata.json`; the
  `process.env.GEMINI_API_KEY` define in `vite.config.ts`. Safe to ignore/remove.
- `therapist_notifications.php` is the only endpoint that opens its own `mysqli` connection (hardcoded
  `127.0.0.1`) instead of `koneksi.php`.
- `start_service.php` runs `ALTER TABLE appointments ADD COLUMN bb_real_terapis ...` on every call (wrapped in
  try/catch) to self-heal older schemas.
- README references a `.env.example` that does not exist; `frontend/.env` is committed directly (with a
  placeholder API key).

## Git

Default branch `main`. Commit messages are short (often Indonesian), e.g. `veriifikasi pembayaran`,
`logika penambahan jadwal jika bentrok`.
