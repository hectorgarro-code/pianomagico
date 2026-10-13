<?php
function content_lessons($conn) {
    $rows = $conn->query("SELECT s.*, COALESCE(m.enabled,1) AS enabled, COALESCE(m.revision,1) AS revision, m.updated_at FROM songs s LEFT JOIN valle_lesson_meta m ON m.lesson_id=s.id WHERE s.instrument='piano' ORDER BY s.order_index,s.id")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) { $row['sequence'] = json_decode($row['sequence'], true); $row['stickerId'] = (int)$row['sticker_id']; $row['isUserCreated'] = (bool)$row['is_user_created']; $row['enabled'] = (bool)$row['enabled']; $row['source'] = 'MYSQL'; }
    return $rows;
}
function content_document($conn, $lock = false) {
    $row = $conn->query('SELECT revision,updated_at,payload FROM valle_game_content WHERE id=1' . ($lock ? ' FOR UPDATE' : ''))->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new RuntimeException('Content schema not initialized');
    return array_merge(json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR), ['revision' => (int)$row['revision'], 'updated_at' => $row['updated_at']]);
}
function content_save_lesson($conn, $input, $snapshot = null) {
    $lesson = validate_lesson($input['lesson'] ?? null);
    $id = $input['id'] ?? null;
    $conn->beginTransaction();
    try {
        $worldDocument=content_document($conn,true);
        if ($id !== null) {
            $stmt = $conn->prepare("SELECT s.id,COALESCE(m.revision,1) AS revision FROM songs s LEFT JOIN valle_lesson_meta m ON m.lesson_id=s.id WHERE s.id=? AND s.instrument='piano' AND s.user_id IS NULL AND s.is_user_created=0 FOR UPDATE");
            $stmt->execute([$id]); $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) throw new InvalidArgumentException('Solo lecciones globales de piano');
            if ((int)($input['revision'] ?? -1) !== (int)$row['revision']) throw new DomainException('La leccion cambio; recargar antes de guardar');
            if($snapshot)foreach(content_lessons($conn) as $existing)if((int)$existing['id']===(int)$id)$snapshot($existing);
            foreach ($worldDocument['activities'] as $activity) if ($activity['id']==='plaza-first-lesson' && (string)($activity['introLessonId'] ?? 1)===(string)$id) {
                $bpm=$lesson['speed']>300?60000/$lesson['speed']:$lesson['speed'];
                if (!$lesson['enabled']) throw new DomainException('Leccion inicial asignada: reasignar antes de desactivar');
                if ($bpm>100) throw new InvalidArgumentException('La leccion inicial no debe superar 100 BPM');
            }
            if (!$lesson['enabled']) {
                foreach ($worldDocument['activities'] as $activity) if ((string)$activity['lessonId'] === (string)$id) throw new DomainException('Leccion asignada al Valle: reasignar antes de desactivar');
            }
            $stmt = $conn->prepare('UPDATE songs SET title=?,sequence=?,sticker_id=?,speed=?,rhythm=?,order_index=? WHERE id=?');
            $stmt->execute([$lesson['title'], json_encode($lesson['sequence']), $lesson['stickerId'], $lesson['speed'], $lesson['rhythm'], $lesson['order_index'], $id]);
            $stmt = $conn->prepare('INSERT INTO valle_lesson_meta (lesson_id,enabled,revision) VALUES (?,?,2) ON DUPLICATE KEY UPDATE enabled=VALUES(enabled),revision=revision+1');
            $stmt->execute([$id, (int)$lesson['enabled']]);
        } else {
            $stmt = $conn->prepare("INSERT INTO songs (user_id,title,sequence,sticker_id,speed,rhythm,is_user_created,instrument,order_index) VALUES (NULL,?,?,?,?,?,0,'piano',?)");
            $stmt->execute([$lesson['title'], json_encode($lesson['sequence']), $lesson['stickerId'], $lesson['speed'], $lesson['rhythm'], $lesson['order_index']]);
            $id = (int)$conn->lastInsertId();
            $stmt = $conn->prepare('INSERT INTO valle_lesson_meta (lesson_id,enabled,revision) VALUES (?,?,1)'); $stmt->execute([$id,(int)$lesson['enabled']]);
        }
        if($snapshot)foreach(content_lessons($conn) as $saved)if((int)$saved['id']===(int)$id)$snapshot($saved);
        $conn->commit();
        return ['id' => (int)$id];
    } catch (Throwable $e) { if ($conn->inTransaction()) $conn->rollBack(); throw $e; }
}
