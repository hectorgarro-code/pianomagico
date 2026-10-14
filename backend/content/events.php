<?php
function content_validate_world_events($data,$registry) {
    $events=$data['worldEvents'] ?? [];
    if(!is_array($events)||count($events)>100)throw new InvalidArgumentException('Eventos invalidos');
    $targets=array_column($data['worldActions'],null,'id');$seen=[];
    foreach($events as $event) {
        if(!is_array($event)||array_diff(array_keys($event),['id','name','regionId','position','trigger','sourceId','pitch','noteCount','revealRadius','secret','enabled','editor']))throw new InvalidArgumentException('Campos de evento no admitidos');
        if(!content_identifier($event['id'] ?? null)||!str_starts_with($event['id'],'editor-event-')||isset($seen[$event['id']]))throw new InvalidArgumentException('ID de evento invalido');$seen[$event['id']]=true;
        if(!is_string($event['name'] ?? null)||trim($event['name'])===''||strlen($event['name'])>80||preg_match('/[<>\x00-\x1f]/',$event['name']))throw new InvalidArgumentException('Nombre de evento invalido');
        if(!in_array($event['regionId'] ?? '',array_column($registry['compositions'],'regionId'),true)||!content_vector($event['position'] ?? null)||abs($event['position'][0])>60||$event['position'][2]<-145||$event['position'][2]>35||$event['position'][1]<-.5||$event['position'][1]>3)throw new InvalidArgumentException('Posicion de evento fuera del Valle');
        if(!in_array($event['trigger'] ?? '',['NEAR_PLAYER','TARGET_DEFEATED','WORLD_MECHANISM_COMPLETED'],true)||!is_bool($event['enabled'] ?? null)||!is_bool($event['secret'] ?? null))throw new InvalidArgumentException('Disparador de evento invalido');
        if(($event['sourceId'] ?? null)!==null&&!content_identifier($event['sourceId']))throw new InvalidArgumentException('Fuente de evento invalida');
        if(!is_string($event['pitch'] ?? null)||!preg_match('/^[A-G][3-6]$/D',$event['pitch'])||!is_int($event['noteCount'] ?? null)||$event['noteCount']<1||$event['noteCount']>3||!is_numeric($event['revealRadius'] ?? null)||$event['revealRadius']<2||$event['revealRadius']>10)throw new InvalidArgumentException('Notas de evento invalidas');
        if($event['trigger']==='NEAR_PLAYER'&&($event['sourceId'] ?? null)!==null)throw new InvalidArgumentException('Evento cercano no requiere fuente');
        if($event['trigger']==='TARGET_DEFEATED'&&$event['enabled']&&(!isset($targets[$event['sourceId'] ?? ''])||!$targets[$event['sourceId']]['enabledInWorld']||($targets[$event['sourceId']]['firstMinutesOnly'] ?? false)))throw new InvalidArgumentException('Fuente de evento ausente, desactivada o protegida');
        if($event['trigger']==='WORLD_MECHANISM_COMPLETED'&&!in_array($event['sourceId'] ?? '',['forest-three-runes','ruins-side-runes'],true))throw new InvalidArgumentException('Mecanismo de evento inexistente');
    }
    return $events;
}
