<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Konfigurasi Database Anda
$host = "127.0.0.1";
$user = "root";
$pass = "";
$db   = "db_awee_babycare";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["status" => 500, "message" => "Koneksi database gagal"]);
    exit;
}

function formatWaktuNotif($dt) {
    return $dt ? date('d/m/Y H:i', strtotime($dt)) : '-';
}

// 1. Tangkap parameter terapist_id (berasal dari users.id saat login)
$user_id = isset($_GET['terapist_id']) ? intval($_GET['terapist_id']) : 0;

if ($user_id === 0) {
    echo json_encode(["status" => 400, "message" => "ID User tidak valid", "data" => []]);
    exit;
}

// 2. Cari id_therapist di tabel therapists berdasarkan user_id
$stmt = $conn->prepare("SELECT id FROM therapists WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["status" => 404, "message" => "Data terapis tidak ditemukan", "data" => []]);
    $stmt->close();
    $conn->close();
    exit;
}

$therapist = $res->fetch_assoc();
$id_therapist = $therapist['id'];
$stmt->close();

// 3. Ambil aktivitas dari audit_logs yang berelasi dengan tabel appointments milik terapis ini
$sql = "
    SELECT 
        al.id, 
        al.aksi, 
        al.data_lama,
        al.data_baru, 
        al.created_at, 
        app.nama_pasien 
    FROM audit_logs al
    JOIN appointments app ON al.record_id = app.id
    WHERE al.nama_tabel = 'appointments' 
      AND app.id_therapist = ?
    ORDER BY al.created_at DESC 
    LIMIT 15
";

$stmt_logs = $conn->prepare($sql);
$stmt_logs->bind_param("i", $id_therapist);
$stmt_logs->execute();
$logs = $stmt_logs->get_result();

$notifications = [];

while ($row = $logs->fetch_assoc()) {
    $type = 'data_update';
    $nama = $row['nama_pasien'];
    $message = "Perubahan data pada reservasi " . $nama;

    $data_lama = json_decode($row['data_lama'], true) ?: [];
    $data_baru = json_decode($row['data_baru'], true) ?: [];

    if ($row['aksi'] === 'create') {
        $type = 'reservation';
        $message = "Reservasi baru masuk untuk Pasien " . $nama;
    } elseif ($row['aksi'] === 'update') {
        $status_jadwal_baru = $data_baru['status_jadwal'] ?? null;
        $status_jadwal_lama = $data_lama['status_jadwal'] ?? null;
        $status_bayar_baru  = $data_baru['status_pembayaran'] ?? null;
        $status_bayar_lama  = $data_lama['status_pembayaran'] ?? null;

        if ($status_jadwal_baru !== null && $status_jadwal_baru !== $status_jadwal_lama) {
            if ($status_jadwal_baru === 'Dibatalkan') {
                $type = 'cancelled';
                $alasan = $data_baru['alasan_pembatalan'] ?? '';
                $message = "Jadwal pasien " . $nama . " dibatalkan" . ($alasan !== '' ? ": " . $alasan : "");
            } else {
                $type = 'status_change';
                $message = "Status layanan " . $nama . " berubah menjadi " . $status_jadwal_baru;
            }
        } elseif ($status_bayar_baru !== null && $status_bayar_baru !== $status_bayar_lama) {
            if ($status_bayar_baru === 'Rejected') {
                $type = 'payment_rejected';
                $alasan = $data_baru['alasan_penolakan'] ?? '';
                $message = "Pembayaran pasien " . $nama . " ditolak" . ($alasan !== '' ? ": " . $alasan : "");
            } else {
                $type = 'payment_verified';
                $label = $status_bayar_baru === 'Verified' ? 'Terverifikasi' : $status_bayar_baru;
                $message = "Status pembayaran " . $nama . " berubah menjadi " . $label;
            }
        } elseif (isset($data_baru['waktu_reservasi']) && ($data_lama['waktu_reservasi'] ?? null) !== $data_baru['waktu_reservasi']) {
            $type = 'reschedule';
            $message = "Jadwal pasien " . $nama . " diubah ke " . formatWaktuNotif($data_baru['waktu_reservasi']);
        } elseif (isset($data_baru['metode_bayar_terapis']) && ($data_baru['override_by'] ?? '') === 'admin') {
            $type = 'override';
            $message = "Admin mengubah metode bayar pasien " . $nama . " menjadi " . $data_baru['metode_bayar_terapis'];
        }
    }

    $notifications[] = [
        "id" => $row['id'],
        "type" => $type,
        "message" => $message,
        "created_at" => $row['created_at'],
        "link" => "/therapist/schedule"
    ];
}

// 4. Return data JSON ke Frontend React
echo json_encode(["status" => 200, "data" => $notifications]);

$stmt_logs->close();
$conn->close();
?>
