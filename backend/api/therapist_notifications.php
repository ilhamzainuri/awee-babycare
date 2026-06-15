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
        al.data_baru, 
        al.created_at, 
        app.nama_anak 
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
    $message = "Perubahan data pada reservasi " . $row['nama_anak'];
    
    // Parse JSON dari column data_baru di audit_logs
    $data_baru = json_decode($row['data_baru'], true);

    if ($row['aksi'] === 'create') {
        $type = 'reservation';
        $message = "Reservasi baru masuk untuk anak " . $row['nama_anak'];
    } elseif ($row['aksi'] === 'update') {
        
        // Deteksi perubahan dari field JSON yang ada di tabel audit_logs Anda
        if (isset($data_baru['Status'])) {
            $type = 'status_change';
            $message = "Status layanan " . $row['nama_anak'] . " berubah menjadi " . $data_baru['Status'];
        } elseif (isset($data_baru['status_pembayaran'])) {
            $type = 'data_update';
            $message = "Status pembayaran " . $row['nama_anak'] . " berubah menjadi " . $data_baru['status_pembayaran'];
        }
    }

    $notifications[] = [
        "id" => $row['id'],
        "type" => $type,
        "message" => $message,
        "created_at" => $row['created_at'],
        "link" => "/therapist/Schedule" // Sesuaikan dengan path target klik notifikasi
    ];
}

// 4. Return data JSON ke Frontend React
echo json_encode(["status" => 200, "data" => $notifications]);

$stmt_logs->close();
$conn->close();
?>