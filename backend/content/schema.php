<?php
function prepare_content_schema($conn, $seed) {
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_admin_accounts (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(80) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'ADMIN', enabled BOOLEAN NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_admin_attempts (attempt_key CHAR(64) PRIMARY KEY, failures INT NOT NULL DEFAULT 0, last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_lesson_meta (lesson_id INT PRIMARY KEY, enabled BOOLEAN NOT NULL DEFAULT 1, revision INT NOT NULL DEFAULT 1, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_game_content (id INT PRIMARY KEY, schema_version INT NOT NULL, revision INT NOT NULL, payload LONGTEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $first = $conn->query("SELECT id FROM songs WHERE instrument='piano' AND user_id IS NULL AND is_user_created=0 ORDER BY order_index,id LIMIT 1")->fetchColumn();
    foreach ($seed['activities'] as &$activity) if (($activity['lessonRef'] ?? '') === 'first-song') $activity['lessonId'] = (int)$first;
    unset($activity);
    $stmt = $conn->prepare('INSERT IGNORE INTO valle_game_content (id, schema_version, revision, payload) VALUES (1,1,1,?)');
    $stmt->execute([json_encode($seed, JSON_UNESCAPED_UNICODE)]);
    $conn->exec("INSERT IGNORE INTO valle_lesson_meta (lesson_id) SELECT id FROM songs WHERE instrument='piano'");
}
