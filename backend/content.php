<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require __DIR__ . '/dbconfig.php';
require __DIR__ . '/content/security.php';
require __DIR__ . '/content/validation.php';
require __DIR__ . '/content/lessons.php';
require __DIR__ . '/content/editor.php';
require __DIR__ . '/content/preflight.php';
require __DIR__ . '/content/imports.php';
if (!$conn) content_fail(503, 'Database unavailable');
try {
    $action = $_GET['action'] ?? '';
    if ($action === 'public_content') { echo json_encode(content_document($conn), JSON_UNESCAPED_UNICODE); exit; }
    if ($action === 'public_assets') {echo json_encode(['assets'=>content_imported_assets()],JSON_UNESCAPED_UNICODE);exit;}
    content_session();
    if ($action === 'session') {
        $stmt = $conn->prepare('SELECT id,username,role,enabled FROM valle_admin_accounts WHERE id=?'); $stmt->execute([$_SESSION['admin_id'] ?? 0]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['authenticated' => (bool)content_admin_authorized($account,$_SESSION,time()), 'username' => $account['username'] ?? null,
            'csrfToken' => $_SESSION['csrf'], 'configured' => (bool)$conn->query('SELECT COUNT(*) FROM valle_admin_accounts WHERE enabled=1')->fetchColumn()]); exit;
    }
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > ($action==='import_asset'?6291456:2097152)) content_fail(413, 'Contenido demasiado grande');
    $input = $_SERVER['REQUEST_METHOD'] === 'POST' ? json_decode(file_get_contents('php://input'),true,128,JSON_THROW_ON_ERROR) : null;
    if ($action === 'login') {
        content_post();
        $username = trim($input['username'] ?? ''); $password = $input['password'] ?? '';
        if (!is_string($password) || strlen($password) > 128 || strlen($username) > 80) content_fail(401,'Credenciales invalidas');
        $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . strtolower($username));
        $stmt = $conn->prepare('SELECT failures,UNIX_TIMESTAMP(last_attempt) AS last_time FROM valle_admin_attempts WHERE attempt_key=?'); $stmt->execute([$key]); $attempt = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($attempt && $attempt['failures'] >= 5 && time() - $attempt['last_time'] < 900) content_fail(429,'Demasiados intentos; esperar 15 minutos');
        $stmt = $conn->prepare('SELECT * FROM valle_admin_accounts WHERE username=?'); $stmt->execute([$username]); $account = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$account || $account['role'] !== 'ADMIN' || !$account['enabled'] || !password_verify($password,$account['password_hash'])) {
            $failures = $attempt && time() - $attempt['last_time'] < 900 ? $attempt['failures'] + 1 : 1;
            $stmt = $conn->prepare('INSERT INTO valle_admin_attempts (attempt_key,failures) VALUES (?,?) ON DUPLICATE KEY UPDATE failures=VALUES(failures),last_attempt=CURRENT_TIMESTAMP'); $stmt->execute([$key,$failures]);
            content_fail(401,'Credenciales invalidas');
        }
        $stmt = $conn->prepare('DELETE FROM valle_admin_attempts WHERE attempt_key=?'); $stmt->execute([$key]);
        session_regenerate_id(true); $_SESSION['admin_id'] = (int)$account['id']; $_SESSION['authenticated_at'] = time(); $_SESSION['csrf'] = bin2hex(random_bytes(32));
        echo json_encode(['authenticated' => true, 'username' => $account['username'], 'csrfToken' => $_SESSION['csrf']]); exit;
    }
    $admin = content_admin($conn);
    if($action==='import_asset'){content_post();echo json_encode(content_import_asset($input),JSON_UNESCAPED_UNICODE);exit;}
    if (in_array($action,['draft','save_draft','history','history_content','lesson_history','lesson_history_content'],true)) { echo json_encode(content_editor_action($conn,$action,$input,$admin),JSON_UNESCAPED_UNICODE); exit; }
    if ($action === 'logout') { content_post(); $_SESSION = []; session_destroy(); echo json_encode(['ok'=>true]); exit; }
    if ($action === 'lessons') { echo json_encode(content_lessons($conn),JSON_UNESCAPED_UNICODE); exit; }
    if ($action === 'save_lesson') { content_post();content_editor_schema($conn);echo json_encode(content_save_lesson($conn,$input,fn($lesson)=>content_editor_lesson_snapshot($conn,$lesson,$admin['id']))); exit; }
    if ($action === 'content') { echo json_encode(content_document($conn),JSON_UNESCAPED_UNICODE); exit; }
    if ($action === 'validate_content') {
        content_post();
        $registry=content_registry();
        $draft=$input['content'] ?? null;
        content_revision_check($draft,content_document($conn));
        $checked=validate_game_content($draft,$registry,content_lessons($conn));
        $assets=content_asset_preflight($checked,$registry);
        echo json_encode(['ok'=>true,'revision'=>$draft['revision'],...$assets]);exit;
    }
    if ($action === 'save_content') {
        content_post();
        content_editor_schema($conn);
        $registry = content_registry();
        $conn->beginTransaction();
        $current = content_document($conn,true);
        if ((int)($input['revision'] ?? -1) !== $current['revision']) throw new DomainException('El contenido cambio; recargar antes de guardar');
        $data = validate_game_content($input['content'] ?? null,$registry,content_lessons($conn));
        content_asset_preflight($data,$registry);
        content_editor_snapshot($conn,$current,$admin['id']);
        $stmt = $conn->prepare('UPDATE valle_game_content SET payload=?,revision=revision+1 WHERE id=1'); $stmt->execute([json_encode($data,JSON_UNESCAPED_UNICODE)]);
        $published = content_document($conn);
        content_editor_snapshot($conn,$published,$admin['id']);
        $conn->commit(); echo json_encode($published,JSON_UNESCAPED_UNICODE); exit;
    }
    content_fail(404,'Accion inexistente');
} catch (InvalidArgumentException $e) { if ($conn->inTransaction()) $conn->rollBack(); content_fail(422,$e->getMessage()); }
catch (JsonException $e) { if ($conn->inTransaction()) $conn->rollBack(); content_fail(400,'JSON invalido'); }
catch (DomainException $e) { if ($conn->inTransaction()) $conn->rollBack(); content_fail(409,$e->getMessage()); }
catch (Throwable $e) { if ($conn->inTransaction()) $conn->rollBack(); error_log('Valle content: '.$e->getMessage()); content_fail(503,'Servicio de contenido no disponible; revisar configuracion local'); }
