<?php
// backend/api.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include_once 'dbconfig.php';

if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

$input = json_decode(file_get_contents("php://input"));

try {
    switch ($action) {
    // --- AUTH / USER MANAGEMENT ---
    case 'get_users':
        $stmt = $conn->prepare("SELECT u.id, p.name, p.avatar_id FROM users u LEFT JOIN user_profile p ON u.id = p.user_id");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
        break;

    case 'register':
        if (!isset($input->username)) {
            echo json_encode(["error" => "Username required"]);
            break;
        }
        $conn->beginTransaction();
        try {
            $stmt = $conn->prepare("INSERT INTO users (username) VALUES (:username)");
            $stmt->bindParam(':username', $input->username);
            $stmt->execute();
            $userId = $conn->lastInsertId();

            $stmt = $conn->prepare("INSERT INTO user_profile (user_id, name, avatar_id) VALUES (:user_id, :name, :avatar_id)");
            $stmt->bindParam(':user_id', $userId);
            $name = isset($input->name) ? $input->name : $input->username;
            $avatarId = isset($input->avatarId) ? $input->avatarId : 1;
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':avatar_id', $avatarId);
            $stmt->execute();

            $conn->commit();
            echo json_encode(["message" => "User registered", "userId" => $userId]);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    // --- PROFILE ---
    case 'get_profile':
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if (!$userId) { echo json_encode(null); break; }
        $stmt = $conn->prepare("SELECT * FROM user_profile WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($row);
        break;

    case 'update_profile':
        $userId = isset($input->userId) ? (int)$input->userId : null;
        if (!$userId) { echo json_encode(["error" => "No user_id"]); break; }
        $stmt = $conn->prepare("UPDATE user_profile SET name = :name, avatar_id = :avatar_id, total_score = :total_score WHERE user_id = :user_id");
        $stmt->bindParam(':name', $input->name);
        $stmt->bindParam(':avatar_id', $input->avatarId);
        $stmt->bindParam(':total_score', $input->totalScore);
        $stmt->bindParam(':user_id', $userId);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Profile updated"]);
        }
        break;

    // --- SONGS ---
    case 'get_songs':
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        $instrument = isset($_GET['instrument']) ? $_GET['instrument'] : 'piano';
        // Fetch global songs + user-specific songs for the specified instrument
        $stmt = $conn->prepare("SELECT * FROM songs WHERE (user_id IS NULL OR user_id = :user_id) AND instrument = :instrument ORDER BY order_index ASC, id ASC");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':instrument', $instrument);
        $stmt->execute();
        $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($songs as &$song) {
            $song['sequence'] = json_decode($song['sequence']);
            $song['isUserCreated'] = (bool)$song['is_user_created'];
            $song['stickerId'] = (int)$song['sticker_id'];
        }
        echo json_encode($songs);
        break;

    case 'add_song':
        $userId = isset($input->userId) ? (int)$input->userId : null;
        $instrument = isset($input->instrument) ? $input->instrument : 'piano';
        $isUserCreated = $userId ? 1 : 0;
        $stmt = $conn->prepare("INSERT INTO songs (user_id, title, sequence, sticker_id, speed, rhythm, is_user_created, instrument) VALUES (:user_id, :title, :sequence, :sticker_id, :speed, :rhythm, :is_user_created, :instrument)");
        $stmt->bindParam(':is_user_created', $isUserCreated);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $input->title);
        $sequence = json_encode($input->sequence);
        $stmt->bindParam(':sequence', $sequence);
        $stmt->bindParam(':sticker_id', $input->stickerId);
        $stmt->bindParam(':speed', $input->speed);
        $stmt->bindParam(':rhythm', $input->rhythm);
        $stmt->bindParam(':instrument', $instrument);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Song added", "id" => $conn->lastInsertId()]);
        }
        break;

    case 'get_admin_songs':
        $instrument = isset($_GET['instrument']) ? $_GET['instrument'] : 'piano';
        // Fetch absolutely all songs for the specified instrument, ordered by their index
        $stmt = $conn->prepare("SELECT * FROM songs WHERE instrument = :instrument ORDER BY order_index ASC, id ASC");
        $stmt->bindParam(':instrument', $instrument);
        $stmt->execute();
        $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($songs as &$song) {
            $song['sequence'] = json_decode($song['sequence']);
            $song['isUserCreated'] = (bool)$song['is_user_created'];
            $song['stickerId'] = (int)$song['sticker_id'];
        }
        echo json_encode($songs);
        break;

    case 'update_song':
        $songId = isset($input->id) ? (int)$input->id : null;
        if (!$songId) { echo json_encode(["error" => "No song id"]); break; }
        $stmt = $conn->prepare("UPDATE songs SET title = :title, sequence = :sequence, sticker_id = :sticker_id, speed = :speed, rhythm = :rhythm WHERE id = :id");
        $stmt->bindParam(':title', $input->title);
        $sequence = json_encode($input->sequence);
        $stmt->bindParam(':sequence', $sequence);
        $stmt->bindParam(':sticker_id', $input->stickerId);
        $stmt->bindParam(':speed', $input->speed);
        $stmt->bindParam(':rhythm', $input->rhythm);
        $stmt->bindParam(':id', $songId);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Song updated"]);
        }
        break;

    case 'delete_song':
        $songId = isset($input->id) ? (int)$input->id : null;
        if (!$songId) { echo json_encode(["error" => "No song id"]); break; }
        $stmt = $conn->prepare("DELETE FROM songs WHERE id = :id");
        $stmt->bindParam(':id', $songId);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Song deleted"]);
        }
        break;

    case 'reorder_songs':
        if (!isset($input->orders) || !is_array($input->orders)) {
            echo json_encode(["error" => "Invalid orders array"]);
            break;
        }
        $conn->beginTransaction();
        try {
            $stmt = $conn->prepare("UPDATE songs SET order_index = :order_index WHERE id = :id");
            foreach ($input->orders as $order) {
                if (isset($order->id) && isset($order->order_index)) {
                    $stmt->bindParam(':id', $order->id);
                    $stmt->bindParam(':order_index', $order->order_index);
                    $stmt->execute();
                }
            }
            $conn->commit();
            echo json_encode(["message" => "Songs reordered successfully"]);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(["error" => "Reorder failed: " . $e->getMessage()]);
        }
        break;

    // --- STICKERS ---
    case 'get_stickers':
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if (!$userId) { echo json_encode([]); break; }
        $stmt = $conn->prepare("SELECT sticker_id FROM user_stickers WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode($rows);
        break;

    case 'unlock_sticker':
        $userId = isset($input->userId) ? (int)$input->userId : null;
        if (!$userId) { echo json_encode(["error" => "No user_id"]); break; }
        $stmt = $conn->prepare("INSERT IGNORE INTO user_stickers (user_id, sticker_id) SELECT :user_id, :sticker_id WHERE NOT EXISTS (SELECT 1 FROM user_stickers WHERE user_id = :user_id AND sticker_id = :sticker_id)");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':sticker_id', $input->stickerId);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Sticker unlocked"]);
        }
        break;

    // --- MEDALS ---
    case 'get_medals':
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if (!$userId) { echo json_encode([]); break; }
        $stmt = $conn->prepare("SELECT song_id FROM user_medals WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode($rows);
        break;

    case 'unlock_medal':
        $userId = isset($input->userId) ? (int)$input->userId : null;
        if (!$userId) { echo json_encode(["error" => "No user_id"]); break; }
        $stmt = $conn->prepare("INSERT IGNORE INTO user_medals (user_id, song_id) SELECT :user_id, :song_id WHERE NOT EXISTS (SELECT 1 FROM user_medals WHERE user_id = :user_id AND song_id = :song_id)");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':song_id', $input->songId);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Medal unlocked"]);
        }
        break;

    // --- PERFORMANCES (AUDIOS) ---
    case 'save_performance':
        $userId = isset($input->userId) ? (int)$input->userId : null;
        if (!$userId) { echo json_encode(["error" => "No user_id"]); break; }
        $stmt = $conn->prepare("INSERT INTO user_performances (user_id, song_id, log_data, score) VALUES (:user_id, :song_id, :log_data, :score)");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':song_id', $input->songId);
        $logData = json_encode($input->performanceLog);
        $stmt->bindParam(':log_data', $logData);
        $stmt->bindParam(':score', $input->score);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Performance saved", "id" => $conn->lastInsertId()]);
        }
        break;

    case 'get_performances':
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if (!$userId) { echo json_encode([]); break; }
        $stmt = $conn->prepare("SELECT p.*, s.title as song_title FROM user_performances p LEFT JOIN songs s ON p.song_id = s.id WHERE p.user_id = :user_id ORDER BY p.created_at DESC");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['log_data'] = json_decode($row['log_data']);
        }
        echo json_encode($rows);
        break;

    // --- STUDIO PROJECTS ---
    case 'save_studio_project':
        $userId = isset($input->userId) ? (int)$input->userId : null;
        if (!$userId) { echo json_encode(["error" => "No user_id"]); break; }
        $projectId = isset($input->id) ? $input->id : 'proj_' . uniqid();
        $name = isset($input->name) ? $input->name : 'Proyecto ' . rand(100, 999);
        $data = json_encode($input->data);
        
        $stmt = $conn->prepare("INSERT INTO studio_projects (id, user_id, name, data) VALUES (:id, :user_id, :name, :data) ON DUPLICATE KEY UPDATE name = VALUES(name), data = VALUES(data), updated_at = NOW()");
        $stmt->bindParam(':id', $projectId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':data', $data);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Studio project saved", "id" => $projectId, "name" => $name]);
        }
        break;
        
    case 'get_studio_projects':
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if (!$userId) { echo json_encode([]); break; }
        $stmt = $conn->prepare("SELECT id, name, updated_at FROM studio_projects WHERE user_id = :user_id ORDER BY updated_at DESC");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows);
        break;
        
    case 'load_studio_project':
        $projectId = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$projectId) { echo json_encode(["error" => "No project id"]); break; }
        $stmt = $conn->prepare("SELECT * FROM studio_projects WHERE id = :id");
        $stmt->bindParam(':id', $projectId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['data'] = json_decode($row['data']);
            echo json_encode($row);
        } else {
            echo json_encode(["error" => "Project not found"]);
        }
        break;

    default:
        echo json_encode(["message" => "Invalid action"]);
        break;
    }
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
