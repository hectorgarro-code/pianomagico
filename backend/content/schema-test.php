<?php
if (PHP_SAPI !== 'cli') exit;
require __DIR__.'/validation.php';
require __DIR__.'/security.php';
$seed=json_decode(file_get_contents(__DIR__.'/seed.json'),true);
foreach($seed['activities'] as &$a) if(isset($a['lessonRef'])) $a['lessonId']=2;
unset($a);
$registry=json_decode(file_get_contents(__DIR__.'/registry.json'),true);
$lessons=json_decode(file_get_contents(dirname(__DIR__,2).'/docs/audits/lesson-catalog-snapshot.json'),true)['lessons'];
foreach($lessons as &$row) $row['enabled']=true;
unset($row);
$count=0;
function check($condition,$message) { global $count; if(!$condition) throw new RuntimeException($message); $count++; }
function rejects($change,$message) { global $seed,$registry,$lessons; $copy=$seed; $change($copy); try { validate_game_content($copy,$registry,$lessons); } catch(InvalidArgumentException $e) { check(true,$message); return; } check(false,$message); }
validate_game_content($seed,$registry,$lessons); check(true,'baseline content');
$lesson=['title'=>'Real lesson','sequence'=>['C','D#:0.5','R:1','E4'],'speed'=>1300,'stickerId'=>1,'order_index'=>0,'rhythm'=>'bubble','enabled'=>true];
check(validate_lesson($lesson)['speed']===1300,'legacy speed unchanged');
$lesson['speed']=120; check(validate_lesson($lesson)['speed']===120,'BPM unchanged');
foreach(['H4','C:0','E4:-1','<script>','C4:NaN'] as $invalid) { $copy=$lesson; $copy['sequence']=[$invalid]; try { validate_lesson($copy); check(false,'invalid note accepted'); } catch(InvalidArgumentException $e) { check(true,'note rejected'); } }
$copy=$lesson; $copy['title']='<script>'; try { validate_lesson($copy); check(false,'markup title'); } catch(InvalidArgumentException $e) { check(true,'markup rejected'); }
rejects(function(&$d){$d['activities'][0]['lessonId']=99999;},'missing lesson');
rejects(function(&$d){$d['activities'][0]['requirements']['completedObjects']=[]; $d['activities'][1]['requirements']['completedObjects']=[];},'changed progression');
rejects(function(&$d){$d['world'][0]['instances'][0]['assetUrl']='/../../secret';},'arbitrary path');
rejects(function(&$d){$d['world'][0]['instances'][0]['scale']=[0,1,1];},'invalid scale');
rejects(function(&$d){$d['world'][0]['instances'][]=$d['world'][0]['instances'][0];},'duplicate object');
rejects(function(&$d){$d['world']=[];},'missing region');
rejects(function(&$d){$d['rewards'][]=['id'=>'pet-reward','type'=>'PET','referenceId'=>'missing','presentation'=>'','enabled'=>false];},'missing pet');
rejects(function(&$d){$d['activities'][0]['rewardId']='missing';},'missing reward');
rejects(function(&$d){$d['world'][0]['instances']=[];},'protected reference');
$pet=array_values(array_filter($registry['assets'],function($a){return $a['category']==='PET';}))[0];
$copy=$seed; $copy['rewards'][]=['id'=>'test-pet','type'=>'PET','referenceId'=>$pet['id'],'presentation'=>'Pet','enabled'=>false]; validate_game_content($copy,$registry,$lessons); check(true,'valid pet preparation');
$creature=array_values(array_filter($registry['assets'],function($a){return $a['category']==='WORLD_CREATURE';}))[0];
$target=['id'=>'test-creature','type'=>'WORLD_CREATURE','assetId'=>$creature['id'],'hitsRequired'=>2,'hitReaction'=>'Hit_A','defeatEffect'=>'disappear','behaviorType'=>'stationary','optionalReward'=>null,'enabledInWorld'=>false];
$copy=$seed; $copy['worldActions'][]=$target; validate_game_content($copy,$registry,$lessons); check(true,'valid world creature preparation');
rejects(function(&$d)use($target){$target['hitsRequired']=4;$d['worldActions'][]=$target;},'RPG range');
rejects(function(&$d)use($target){$target['assetId']='missing';$d['worldActions'][]=$target;},'missing creature');
rejects(function(&$d)use($target){$target['enabledInWorld']=true;$d['worldActions'][]=$target;},'no gameplay');
rejects(function(&$d)use($target){$target['hitReaction']='InventedClip';$d['worldActions'][]=$target;},'exact clip');
rejects(function(&$d){$d['gates'][]=['id'=>'gate-qa','minigameId'=>'missing','instanceId'=>null,'enabled'=>false];},'missing minigame');
$copy=$seed;$copy['minigames'][]=['id'=>'mini-qa','type'=>'MEMORY','lessonId'=>2,'enabled'=>false];$copy['gates'][]=['id'=>'gate-qa','minigameId'=>'mini-qa','instanceId'=>null,'enabled'=>false];validate_game_content($copy,$registry,$lessons);check(true,'prepared gate');
$account=['id'=>7,'role'=>'ADMIN','enabled'=>1]; $session=['admin_id'=>7,'authenticated_at'=>100];
check(content_admin_authorized($account,$session,101),'authorized ADMIN');
check(!content_admin_authorized($account,['debug'=>1],101),'debug never auth');
check(!content_admin_authorized(['id'=>7,'role'=>'PLAYER','enabled'=>1],$session,101),'player never ADMIN');
check(!content_admin_authorized(['id'=>7,'role'=>'ADMIN','enabled'=>0],$session,101),'disabled admin');
check(!content_admin_authorized($account,$session,30000),'expired session');
check(!content_admin_authorized($account,['admin_id'=>8,'authenticated_at'=>100],101),'mismatched principal');
echo json_encode(['passed'=>$count]);
