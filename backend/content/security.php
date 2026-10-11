<?php
function content_session() {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        ini_set('session.use_strict_mode', '1');
        session_name('valle_admin');
        session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict']);
        session_start();
    }
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
function content_fail($status, $message) {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
function content_admin_authorized($account, $session, $now) {
    return $account && $account['role'] === 'ADMIN' && (int)$account['enabled'] === 1
        && isset($session['admin_id'], $session['authenticated_at'])
        && (int)$session['admin_id'] === (int)$account['id']
        && $now - (int)$session['authenticated_at'] < 28800;
}
function content_admin($conn) {
    content_session();
    $stmt = $conn->prepare('SELECT id, username, role, enabled FROM valle_admin_accounts WHERE id = ?');
    $stmt->execute([$_SESSION['admin_id'] ?? 0]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!content_admin_authorized($account, $_SESSION, time())) content_fail(401, 'Acceso ADMIN requerido');
    return $account;
}
function content_post() {
    content_session();
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') content_fail(405, 'POST requerido');
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) content_fail(403, 'Token CSRF invalido');
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) content_fail(415, 'JSON requerido');
}
function content_legacy_guard($conn, $action, $input) {
    $globalAdd = $action === 'add_song' && !(!empty($input->isUserCreated) || !empty($input->is_user_created));
    if ($action === 'get_admin_songs' || in_array($action, ['update_song', 'delete_song', 'reorder_songs'], true) || $globalAdd) {
        content_admin($conn);
        if ($action !== 'get_admin_songs') content_post();
    }
}
