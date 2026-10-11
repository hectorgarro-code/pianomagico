<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/dbconfig.php';
$username = trim($argv[1] ?? '');
if (!preg_match('/^[a-zA-Z0-9_.-]{3,80}$/D', $username)) { fwrite(STDERR, "Usage: php create-admin.php username (password via stdin, never CLI arguments)\n"); exit(1); }
$password = rtrim(fgets(STDIN), "\r\n");
if (strlen($password) < 12 || strlen($password) > 128) { fwrite(STDERR, "Password must have 12-128 characters\n"); exit(1); }
$stmt = $conn->prepare("INSERT INTO valle_admin_accounts (username,password_hash,role) VALUES (?,?,'ADMIN')");
$stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);
echo "ADMIN account created. No educational profile changed.\n";
