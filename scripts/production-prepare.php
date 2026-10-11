<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
require dirname(__DIR__) . '/dbconfig.php';
if (!$conn) { http_response_code(503); echo '{"error":"Database unavailable"}'; exit; }

function deployment_snapshot($conn) {
    $snapshot = [];
    foreach ($conn->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $table) {
        if (!preg_match('/^[a-zA-Z0-9_]+$/D', $table)) throw new RuntimeException('Unsupported table name');
        $snapshot[$table] = ['ddl' => $conn->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1],
            'rows' => $conn->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC)];
    }
    return $snapshot;
}
function deployment_fingerprint($rows) {
    $serialized = array_map(function($row) { ksort($row); return json_encode($row); }, $rows);
    sort($serialized, SORT_STRING);
    return hash('sha256', json_encode($serialized));
}
try {
    $input = json_decode(file_get_contents(PHP_SAPI === 'cli' ? 'php://stdin' : 'php://input'), true, 128, JSON_THROW_ON_ERROR);
    if (($input['action'] ?? '') === 'backup') {
        $tables = deployment_snapshot($conn);
        $fingerprints = [];
        foreach ($tables as $table => $data) $fingerprints[$table] = deployment_fingerprint($data['rows']);
        echo json_encode(['tables' => $tables, 'fingerprints' => $fingerprints], JSON_THROW_ON_ERROR); exit;
    }
    if (($input['action'] ?? '') !== 'prepare') throw new RuntimeException('Unsupported action');
    $before = deployment_snapshot($conn);
    foreach ($input['fingerprints'] as $table => $hash) {
        if (!isset($before[$table]) || deployment_fingerprint($before[$table]['rows']) !== $hash) throw new RuntimeException('Database changed after backup; stop deployment');
    }
    $existingIds = array_column($before['songs']['rows'], null, 'id');
    $lessons = $input['lessons'] ?? [];
    foreach ($lessons as $lesson) {
        if (!in_array($lesson['id'], [7, 12, 13], true) || isset($existingIds[$lesson['id']]) || $lesson['user_id'] !== null || $lesson['is_user_created']) throw new RuntimeException('Lesson ID is not free or not authorized');
    }
    $username = $input['username'] ?? '';
    $passwordHash = $input['passwordHash'] ?? '';
    if (!preg_match('/^[a-zA-Z0-9_.-]{3,80}$/D', $username) || !password_get_info($passwordHash)['algo']) throw new RuntimeException('Invalid ADMIN provisioning');
    require __DIR__ . '/schema.php';
    require __DIR__ . '/lessons.php';
    require __DIR__ . '/validation.php';
    $seed = json_decode(file_get_contents(__DIR__.'/seed.json'), true, 512, JSON_THROW_ON_ERROR);
    prepare_content_schema($conn, $seed);
    $conn->beginTransaction();
    $insert = $conn->prepare("INSERT INTO songs (id,user_id,title,sequence,sticker_id,speed,rhythm,is_user_created,instrument,order_index) VALUES (?,NULL,?,?,?,?,?,0,'piano',?)");
    foreach ($lessons as $lesson) {
        validate_lesson(array_merge($lesson, ['enabled'=>true]));
        $insert->execute([$lesson['id'],$lesson['title'],json_encode($lesson['sequence']),$lesson['sticker_id'],$lesson['speed'],$lesson['rhythm'],$lesson['order_index']]);
        $stmt = $conn->prepare('INSERT IGNORE INTO valle_lesson_meta (lesson_id) VALUES (?)'); $stmt->execute([$lesson['id']]);
    }
    $registry = json_decode(file_get_contents(__DIR__.'/registry.json'), true, 512, JSON_THROW_ON_ERROR);
    validate_game_content(content_document($conn), $registry, content_lessons($conn));
    $stmt = $conn->prepare('SELECT id FROM valle_admin_accounts WHERE username=?'); $stmt->execute([$username]);
    $createdAdmin = !$stmt->fetchColumn();
    if ($createdAdmin) {
        $stmt = $conn->prepare("INSERT INTO valle_admin_accounts (username,password_hash,role) VALUES (?,?,'ADMIN')"); $stmt->execute([$username,$passwordHash]);
    }
    foreach ($before as $table => $data) {
        if (strpos($table, 'valle_') === 0) continue;
        $now = $conn->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
        if ($table === 'songs') $now = array_values(array_filter($now, function($row) use ($existingIds) { return isset($existingIds[$row['id']]); }));
        if (deployment_fingerprint($data['rows']) !== deployment_fingerprint($now)) throw new RuntimeException('Existing educational data changed; rollback');
    }
    $conn->commit();
    echo json_encode(['ok'=>true,'addedLessonIds'=>array_column($lessons,'id'),'createdAdmin'=>$createdAdmin,'existingEducationalDataUnchanged'=>true]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(409);
    echo json_encode(['error'=>$e->getMessage()]);
}
