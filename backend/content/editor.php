<?php
function content_editor_schema($conn) {
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_content_drafts (admin_id INT PRIMARY KEY,base_revision INT NOT NULL,payload LONGTEXT NOT NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_content_history (id INT AUTO_INCREMENT PRIMARY KEY,revision INT NOT NULL UNIQUE,payload LONGTEXT NOT NULL,admin_id INT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $conn->exec("CREATE TABLE IF NOT EXISTS valle_lesson_history (lesson_id INT NOT NULL,revision INT NOT NULL,payload LONGTEXT NOT NULL,admin_id INT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(lesson_id,revision)) ENGINE=InnoDB");
}
function content_editor_lesson_snapshot($conn,$lesson,$adminId) {
    if(($lesson['user_id'] ?? null)!==null || !empty($lesson['isUserCreated']))throw new InvalidArgumentException('Solo historial global');
    $stmt=$conn->prepare('INSERT IGNORE INTO valle_lesson_history (lesson_id,revision,payload,admin_id) VALUES (?,?,?,?)');
    $stmt->execute([$lesson['id'],$lesson['revision'],json_encode($lesson,JSON_UNESCAPED_UNICODE),$adminId]);
}
function content_editor_snapshot($conn,$document,$adminId) {
    $stmt=$conn->prepare('INSERT IGNORE INTO valle_content_history (revision,payload,admin_id) VALUES (?,?,?)');
    $stmt->execute([$document['revision'],json_encode($document,JSON_UNESCAPED_UNICODE),$adminId]);
}
function content_editor_save_draft($conn,$adminId,$revision,$document) {
    if (!is_array($document) || ($document['schemaVersion'] ?? null)!==1) throw new InvalidArgumentException('Borrador invalido');
    $stmt=$conn->prepare('INSERT INTO valle_content_drafts (admin_id,base_revision,payload) VALUES (?,?,?) ON DUPLICATE KEY UPDATE base_revision=VALUES(base_revision),payload=VALUES(payload)');
    $stmt->execute([$adminId,$revision,json_encode($document,JSON_UNESCAPED_UNICODE)]);
}
function content_editor_read_draft($conn,$adminId) {
    $stmt=$conn->prepare('SELECT base_revision,updated_at,payload FROM valle_content_drafts WHERE admin_id=?');$stmt->execute([$adminId]);$row=$stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? ['baseRevision'=>(int)$row['base_revision'],'updated_at'=>$row['updated_at'],'content'=>json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR)] : null;
}
function content_editor_action($conn,$action,$input,$admin) {
    content_editor_schema($conn);
    if(in_array($action,['lesson_history','lesson_history_content'],true)) {
        if($_SERVER['REQUEST_METHOD']==='POST')content_post();
        $id=(int)($input['id'] ?? $_GET['id'] ?? 0);
        $stmt=$conn->prepare("SELECT id FROM songs WHERE id=? AND user_id IS NULL AND is_user_created=0 AND instrument='piano'");$stmt->execute([$id]);
        if(!$stmt->fetchColumn())throw new InvalidArgumentException('Solo historial de lecciones globales');
        if($action==='lesson_history') {$stmt=$conn->prepare('SELECT revision,created_at FROM valle_lesson_history WHERE lesson_id=? ORDER BY revision DESC LIMIT 100');$stmt->execute([$id]);return $stmt->fetchAll(PDO::FETCH_ASSOC);}
        $stmt=$conn->prepare('SELECT payload FROM valle_lesson_history WHERE lesson_id=? AND revision=?');$stmt->execute([$id,(int)($input['revision'] ?? -1)]);$payload=$stmt->fetchColumn();
        if(!$payload)throw new InvalidArgumentException('Version de leccion inexistente');
        return json_decode($payload,true,512,JSON_THROW_ON_ERROR);
    }
    if ($action==='save_draft') {
        content_post();
        content_editor_save_draft($conn,$admin['id'],(int)($input['revision'] ?? -1),$input['content'] ?? null);
        return ['ok'=>true];
    }
    if ($action==='draft') {
        return content_editor_read_draft($conn,$admin['id']);
    }
    if ($action==='history') return $conn->query('SELECT revision,created_at,admin_id FROM valle_content_history ORDER BY revision DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC);
    if ($action==='history_content') {
        if ($_SERVER['REQUEST_METHOD']==='POST') content_post();
        $stmt=$conn->prepare('SELECT payload FROM valle_content_history WHERE revision=?');$stmt->execute([(int)($input['revision'] ?? $_GET['revision'] ?? -1)]);$payload=$stmt->fetchColumn();
        if (!$payload) throw new InvalidArgumentException('Version inexistente');
        return json_decode($payload,true,512,JSON_THROW_ON_ERROR);
    }
    throw new InvalidArgumentException('Accion de editor inexistente');
}
