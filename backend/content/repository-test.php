<?php
if (PHP_SAPI !== 'cli') exit;
require dirname(__DIR__).'/dbconfig.php';
require __DIR__.'/validation.php';
require __DIR__.'/lessons.php';
require __DIR__.'/editor.php';
content_editor_schema($conn);
$historyBefore=(int)$conn->query('SELECT COUNT(*) FROM valle_lesson_history')->fetchColumn();
$snapshot=fn($lesson)=>content_editor_lesson_snapshot($conn,$lesson,null);
$before=content_lessons($conn);
$document=content_document($conn);
$payload=['title'=>'__TEMPORARY_CONTENT_REPOSITORY_TEST__','sequence'=>['C:1','D:0.5','R:1'],
    'speed'=>120,'stickerId'=>1,'order_index'=>99999,'rhythm'=>'pop','enabled'=>false];
$created=null; $passed=0;
try {
    $created=content_save_lesson($conn,['id'=>null,'lesson'=>$payload],$snapshot)['id'];
    $row=array_values(array_filter(content_lessons($conn),function($r)use($created){return (int)$r['id']===$created;}))[0];
    if($row['enabled'] || $row['sequence']!==$payload['sequence']) throw new RuntimeException('Create/read mismatch'); $passed++;
    $payload['title'].=' EDITED'; $payload['speed']=1300;
    content_save_lesson($conn,['id'=>$created,'revision'=>$row['revision'],'lesson'=>$payload],$snapshot);
    $row=array_values(array_filter(content_lessons($conn),function($r)use($created){return (int)$r['id']===$created;}))[0];
    if($row['title']!==$payload['title'] || (int)$row['speed']!==1300 || (int)$row['revision']!==2) throw new RuntimeException('Update mismatch'); $passed++;
    $stmt=$conn->prepare('SELECT revision,payload FROM valle_lesson_history WHERE lesson_id=? ORDER BY revision');$stmt->execute([$created]);$versions=$stmt->fetchAll(PDO::FETCH_ASSOC);
    if(count($versions)!==2||json_decode($versions[0]['payload'],true)['title']!== '__TEMPORARY_CONTENT_REPOSITORY_TEST__'||json_decode($versions[1]['payload'],true)['title']!==$payload['title'])throw new RuntimeException('Lesson history mismatch');$passed++;
    try{content_save_lesson($conn,['id'=>$created,'revision'=>2,'lesson'=>$payload],function($saved)use($conn){content_editor_lesson_snapshot($conn,$saved,null);if((int)$saved['revision']===3)throw new RuntimeException('EXPECTED_HISTORY_ROLLBACK');});throw new RuntimeException('History failure was committed');}catch(RuntimeException $e){if($e->getMessage()!=='EXPECTED_HISTORY_ROLLBACK')throw $e;}
    $stmt=$conn->prepare('SELECT COUNT(*) FROM valle_lesson_history WHERE lesson_id=?');$stmt->execute([$created]);
    $unchanged=array_values(array_filter(content_lessons($conn),fn($l)=>(int)$l['id']===$created))[0];if((int)$stmt->fetchColumn()!==2||(int)$unchanged['revision']!==2)throw new RuntimeException('History rollback failed');$passed++;
    try { content_save_lesson($conn,['id'=>$created,'revision'=>1,'lesson'=>$payload]); throw new RuntimeException('Stale write accepted'); } catch(DomainException $e) {$passed++;}
    $payload['sequence']=['INVALID'];
    try { content_save_lesson($conn,['id'=>$created,'revision'=>2,'lesson'=>$payload]); throw new RuntimeException('Invalid write accepted'); } catch(InvalidArgumentException $e) {$passed++;}
    $assignedId=$document['activities'][0]['lessonId'];
    $assigned=array_values(array_filter($before,function($r)use($assignedId){return (int)$r['id']===(int)$assignedId;}))[0];
    $assigned['enabled']=false;
    try { content_save_lesson($conn,['id'=>$assignedId,'revision'=>$assigned['revision'],'lesson'=>$assigned]); throw new RuntimeException('Assigned lesson disabled'); } catch(DomainException $e) {$passed++;}
} finally {
    if($created!==null) {
        $stmt=$conn->prepare('DELETE FROM valle_lesson_history WHERE lesson_id=?');$stmt->execute([$created]);
        $stmt=$conn->prepare('DELETE FROM valle_lesson_meta WHERE lesson_id=?');$stmt->execute([$created]);
        $stmt=$conn->prepare("DELETE FROM songs WHERE id=? AND title LIKE '__TEMPORARY_CONTENT_REPOSITORY_TEST__%' AND user_id IS NULL");$stmt->execute([$created]);
    }
}
if(content_lessons($conn)!=$before || content_document($conn)!=$document || (int)$conn->query('SELECT COUNT(*) FROM valle_lesson_history')->fetchColumn()!==$historyBefore) throw new RuntimeException('Original content changed');
echo json_encode(['passed'=>$passed,'originalLessonsUnchanged'=>true,'playerDataTouched'=>false,'note'=>'Temporary inactive fixture removed; AUTO_INCREMENT may advance']);
