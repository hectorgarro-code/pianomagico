<?php
if (PHP_SAPI !== 'cli') {http_response_code(404);exit;}
require dirname(__DIR__).'/dbconfig.php';
require __DIR__.'/lessons.php';
require __DIR__.'/editor.php';
if (!$conn) throw new RuntimeException('Local database unavailable');
content_editor_schema($conn);
$before=content_document($conn);$lessons=content_lessons($conn);
$historyCount=(int)$conn->query('SELECT COUNT(*) FROM valle_content_history')->fetchColumn();
$draftCount=(int)$conn->query('SELECT COUNT(*) FROM valle_content_drafts')->fetchColumn();
$lessonHistoryCount=(int)$conn->query('SELECT COUNT(*) FROM valle_lesson_history')->fetchColumn();
$adminId=-99901;if(content_editor_read_draft($conn,$adminId)!==null)throw new RuntimeException('Fixture ID already occupied');
$passed=0;$conn->beginTransaction();
try {
    content_editor_save_draft($conn,$adminId,$before['revision'],$before);
    $draft=content_editor_read_draft($conn,$adminId);
    if($draft['content']!==$before||$draft['baseRevision']!==$before['revision'])throw new RuntimeException('Draft mismatch');$passed++;
    if(content_document($conn)!==$before)throw new RuntimeException('Saving draft changed published content');$passed++;
    $copy=$before;$copy['revision']=random_int(1000000000,2000000000);
    content_editor_snapshot($conn,$copy,$adminId);content_editor_snapshot($conn,$copy,$adminId);
    $stmt=$conn->prepare('SELECT COUNT(*) FROM valle_content_history WHERE revision=?');$stmt->execute([$copy['revision']]);if((int)$stmt->fetchColumn()!==1)throw new RuntimeException('History not idempotent');$passed++;
    $stmt=$conn->prepare('SELECT payload FROM valle_content_history WHERE revision=?');$stmt->execute([$copy['revision']]);if(json_decode($stmt->fetchColumn(),true)!==$copy)throw new RuntimeException('History mismatch');$passed++;
    $global=array_values(array_filter($lessons,fn($l)=>$l['user_id']===null&&!$l['isUserCreated']))[0];$global['revision']=random_int(1000000000,2000000000);
    content_editor_lesson_snapshot($conn,$global,$adminId);content_editor_lesson_snapshot($conn,$global,$adminId);
    $stmt=$conn->prepare('SELECT payload FROM valle_lesson_history WHERE lesson_id=? AND revision=?');$stmt->execute([$global['id'],$global['revision']]);if(json_decode($stmt->fetchColumn(),true)!==$global)throw new RuntimeException('Lesson snapshot mismatch');$passed++;
}finally{if($conn->inTransaction())$conn->rollBack();}
if(content_document($conn)!==$before||content_lessons($conn)!==$lessons||(int)$conn->query('SELECT COUNT(*) FROM valle_content_history')->fetchColumn()!==$historyCount||(int)$conn->query('SELECT COUNT(*) FROM valle_content_drafts')->fetchColumn()!==$draftCount||(int)$conn->query('SELECT COUNT(*) FROM valle_lesson_history')->fetchColumn()!==$lessonHistoryCount)throw new RuntimeException('Original data changed');
echo json_encode(['passed'=>$passed+1,'originalContentUnchanged'=>true,'originalLessonsUnchanged'=>true,'playerDataTouched'=>false,'fixturesRolledBack'=>true]);
