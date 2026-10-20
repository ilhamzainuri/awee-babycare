<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

function maskNik($nik) {
    if (!$nik || strlen($nik) < 8) return $nik;
    return substr($nik, 0, 4) . str_repeat('*', strlen($nik) - 8) . substr($nik, -4);
}

function buildTherapistProfile($input) {
    return [
        'nik' => trim($input['nik'] ?? ''),
        'tempat_lahir' => trim($input['tempat_lahir'] ?? ''),
        'tanggal_lahir' => trim($input['tanggal_lahir'] ?? ''),
        'jenis_kelamin' => trim($input['jenis_kelamin'] ?? ''),
        'alamat' => trim($input['alamat'] ?? ''),
        'kelurahan' => trim($input['kelurahan'] ?? ''),
        'kecamatan' => trim($input['kecamatan'] ?? ''),
        'kota_kabupaten' => trim($input['kota_kabupaten'] ?? ''),
        'provinsi' => trim($input['provinsi'] ?? ''),
        'agama' => trim($input['agama'] ?? ''),
        'status_perkawinan' => trim($input['status_perkawinan'] ?? ''),
    ];
}

function validateTherapistProfile($profile) {
    if (!preg_match('/^\d{16}$/', $profile['nik'])) {
        return "NIK harus terdiri dari 16 digit angka.";
    }
    if ($profile['tempat_lahir'] === '') return "Tempat lahir wajib diisi.";
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $profile['tanggal_lahir'])) {
        return "Tanggal lahir tidak valid.";
    }
    if (!in_array($profile['jenis_kelamin'], ['Laki-laki', 'Perempuan'], true)) {
        return "Jenis kelamin tidak valid.";
    }
    foreach (['alamat', 'kelurahan', 'kecamatan', 'kota_kabupaten', 'provinsi'] as $field) {
        if ($profile[$field] === '') return "Data alamat KTP belum lengkap.";
    }
    return null;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents("php://input"), true);
    $actor_id = isset($input['actor_id']) && $input['actor_id'] !== '' ? (int)$input['actor_id'] : null;

    switch ($method) {
        case 'GET':
            $stmt = $conn->query("SELECT * FROM therapists WHERE deleted_at IS NULL ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($data as &$t) $t['status_aktif'] = (int)$t['status_aktif'];
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
            break;

        case 'POST': // CREATE
            if (!isset($input['user_id']) || empty($input['nama_terapis']) || empty($input['no_whatsapp'])) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => "Akun, nama, dan no WhatsApp wajib diisi."]);
                exit();
            }

            $profile = buildTherapistProfile($input);
            if ($error = validateTherapistProfile($profile)) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => $error]);
                exit();
            }

            $cek_nik = $conn->prepare("SELECT id FROM therapists WHERE nik = ? LIMIT 1");
            $cek_nik->execute([$profile['nik']]);
            if ($cek_nik->fetch()) {
                http_response_code(409);
                echo json_encode(["status" => 409, "message" => "NIK sudah terdaftar pada terapis lain."]);
                exit();
            }

            $stmt = $conn->prepare("
                INSERT INTO therapists
                (user_id, nik, nama_terapis, no_whatsapp, tempat_lahir, tanggal_lahir, jenis_kelamin,
                 alamat, kelurahan, kecamatan, kota_kabupaten, provinsi, agama, status_perkawinan, status_aktif)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input['user_id'], $profile['nik'], $input['nama_terapis'], $input['no_whatsapp'],
                $profile['tempat_lahir'], $profile['tanggal_lahir'], $profile['jenis_kelamin'],
                $profile['alamat'], $profile['kelurahan'], $profile['kecamatan'],
                $profile['kota_kabupaten'], $profile['provinsi'], $profile['agama'],
                $profile['status_perkawinan'], $input['status_aktif']
            ]);

            $new_record_id = $conn->lastInsertId();

            $data_log_baru = array_merge($profile, [
                "nik" => maskNik($profile['nik']),
                "user_id" => (int)$input['user_id'],
                "nama_terapis" => $input['nama_terapis'],
                "no_whatsapp" => $input['no_whatsapp'],
                "status_aktif" => (int)$input['status_aktif']
            ]);

            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'create', 'therapists', ?, NULL, ?)");
            $log_stmt->execute([$actor_id, $new_record_id, json_encode($data_log_baru)]);

            echo json_encode(["status" => 201, "message" => "Terapis ditambahkan"]);
            break;

        case 'PUT': // UPDATE
            $id_target = $_GET['id'] ?? 0;

            if (!$id_target || !isset($input['user_id']) || empty($input['nama_terapis']) || empty($input['no_whatsapp'])) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => "ID, akun, nama, dan no WhatsApp wajib diisi."]);
                exit();
            }

            $profile = buildTherapistProfile($input);
            if ($error = validateTherapistProfile($profile)) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => $error]);
                exit();
            }

            $cek_nik = $conn->prepare("SELECT id FROM therapists WHERE nik = ? AND id != ? LIMIT 1");
            $cek_nik->execute([$profile['nik'], $id_target]);
            if ($cek_nik->fetch()) {
                http_response_code(409);
                echo json_encode(["status" => 409, "message" => "NIK sudah terdaftar pada terapis lain."]);
                exit();
            }

            $old_stmt = $conn->prepare("SELECT * FROM therapists WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

            if ($data_lama && !empty($data_lama['nik'])) {
                $data_lama['nik'] = maskNik($data_lama['nik']);
            }

            $stmt = $conn->prepare("
                UPDATE therapists SET
                    user_id=?, nik=?, nama_terapis=?, no_whatsapp=?, tempat_lahir=?, tanggal_lahir=?, jenis_kelamin=?,
                    alamat=?, kelurahan=?, kecamatan=?, kota_kabupaten=?, provinsi=?, agama=?, status_perkawinan=?, status_aktif=?
                WHERE id=?
            ");
            $stmt->execute([
                $input['user_id'], $profile['nik'], $input['nama_terapis'], $input['no_whatsapp'],
                $profile['tempat_lahir'], $profile['tanggal_lahir'], $profile['jenis_kelamin'],
                $profile['alamat'], $profile['kelurahan'], $profile['kecamatan'],
                $profile['kota_kabupaten'], $profile['provinsi'], $profile['agama'],
                $profile['status_perkawinan'], $input['status_aktif'], $id_target
            ]);

            $data_log_baru = array_merge($profile, [
                "nik" => maskNik($profile['nik']),
                "user_id" => (int)$input['user_id'],
                "nama_terapis" => $input['nama_terapis'],
                "no_whatsapp" => $input['no_whatsapp'],
                "status_aktif" => (int)$input['status_aktif']
            ]);

            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'therapists', ?, ?, ?)");
            $log_stmt->execute([$actor_id, $id_target, json_encode($data_lama), json_encode($data_log_baru)]);

            echo json_encode(["status" => 200, "message" => "Terapis diperbarui"]);
            break;

        case 'DELETE': // SOFT DELETE
            $id_target = $_GET['id'];

            $old_stmt = $conn->prepare("SELECT * FROM therapists WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);
            if ($data_lama && !empty($data_lama['nik'])) {
                $data_lama['nik'] = maskNik($data_lama['nik']);
            }

            $stmt = $conn->prepare("UPDATE therapists SET deleted_at=NOW() WHERE id=?");
            $stmt->execute([$id_target]);

            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'delete', 'therapists', ?, ?, NULL)");
            $log_stmt->execute([$actor_id, $id_target, json_encode($data_lama)]);

            echo json_encode(["status" => 200, "message" => "Terapis dihapus"]);
            break;

        default:
            http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(["status" => 409, "message" => "NIK sudah terdaftar pada terapis lain."]);
        exit();
    }
    http_response_code(500); echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>
