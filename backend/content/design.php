<?php
function content_design_number($value,$min,$max){return (is_int($value)||is_float($value))&&is_finite((float)$value)&&$value>=$min&&$value<=$max;}
function content_design_point($p){return content_vector($p)&&abs($p[0])<=54&&$p[2]>=-140&&$p[2]<=35&&$p[1]>=-3&&$p[1]<=25;}
function content_validate_design($data){
    if(!isset($data['worldDesign']))return;
    $d=$data['worldDesign'];$keys=['lights','sounds','reveals','terrainPatches','limits','paths','regions','connections','areas'];
    if(!is_array($d)||array_diff(array_keys($d),$keys))throw new InvalidArgumentException('Diseno del mundo invalido');
    $registry=json_decode(file_get_contents(__DIR__.'/design-registry.json'),true,512,JSON_THROW_ON_ERROR);$comps=array_column($registry['compositions'],null,'id');$gates=array_column($registry['gates'],null,'id');$regionIds=array_column($comps,'regionId');$ids=[];
    foreach($keys as $key){$records=$d[$key]??[];$max=['lights'=>8,'sounds'=>8,'reveals'=>20,'terrainPatches'=>32,'limits'=>50,'areas'=>7][$key]??100;
        if(!is_array($records)||!array_is_list($records)||count($records)>$max)throw new InvalidArgumentException('Limite de diseno: '.$key);
        foreach($records as $r){if(!is_array($r))throw new InvalidArgumentException('Registro de diseno invalido');
            $allowed=match($key){'lights'=>['id','position','color','intensity','distance'],'sounds'=>['id','position','pitch','volume','interval','radius'],'reveals'=>['id','position','camera','target','radius','duration'],'terrainPatches'=>['id','position','radius','height'],'limits'=>['id','position','size','regionId'],'paths'=>['id','compositionId','points','width'],'regions'=>['compositionId','spawn','entryPoints','exitPoints'],'connections'=>['id','compositionId','toCompositionId','gateId','points','width'],'areas'=>['id','regionId','min','max']};
            if(array_diff(array_keys($r),$allowed))throw new InvalidArgumentException('Campo de diseno no soportado');
            if($key!=='regions'){if(!content_identifier($r['id']??null)||isset($ids[$key.':'.$r['id']]))throw new InvalidArgumentException('ID de diseno repetido');$ids[$key.':'.$r['id']]=true;}
            if(isset($r['position'])&&!content_design_point($r['position']))throw new InvalidArgumentException('Posicion fuera del Valle');
            if(in_array($key,['lights','sounds','reveals','terrainPatches','limits'],true)&&!isset($r['position']))throw new InvalidArgumentException('Posicion requerida');
            if($key==='lights'&&(!preg_match('/^#[0-9a-fA-F]{6}$/D',$r['color']??'')||!content_design_number($r['intensity']??null,0,8)||!content_design_number($r['distance']??null,2,20)))throw new InvalidArgumentException('Luz invalida');
            if($key==='sounds'&&(!in_array($r['pitch']??'', ['C4','D4','E4','G4','C5','D5','E5','G5'],true)||!content_design_number($r['volume']??null,0,.35)||!content_design_number($r['interval']??null,4,30)||!content_design_number($r['radius']??null,2,18)))throw new InvalidArgumentException('Fuente musical invalida');
            if($key==='reveals'&&(!content_design_point($r['camera']??null)||!content_design_point($r['target']??null)||!content_design_number($r['radius']??null,2,10)||!content_design_number($r['duration']??null,1,3)))throw new InvalidArgumentException('Encuadre invalido');
            if($key==='terrainPatches'&&(!content_design_number($r['radius']??null,2,12)||!content_design_number($r['height']??null,-1.5,1.5)))throw new InvalidArgumentException('Relieve invalido');
            if($key==='limits'&&(!in_array($r['regionId']??'', $regionIds,true)||!is_array($r['size']??null)||count($r['size'])!==2||!content_design_number($r['size'][0],.2,20)||!content_design_number($r['size'][1],.2,20)))throw new InvalidArgumentException('Limite invalido');
            if(in_array($key,['paths','connections'],true)){
                if(!isset($comps[$r['compositionId']??''])||!content_design_number($r['width']??null,1,8)||!is_array($r['points']??null)||count($r['points'])<2||count($r['points'])>32)throw new InvalidArgumentException('Camino invalido');
                foreach($r['points'] as $p)if(!content_design_point($p))throw new InvalidArgumentException('Punto de camino invalido');
                for($i=1;$i<count($r['points']);$i++)if(hypot($r['points'][$i][0]-$r['points'][$i-1][0],$r['points'][$i][2]-$r['points'][$i-1][2])<.1)throw new InvalidArgumentException('Puntos de camino superpuestos');
                if($key==='paths'&&!in_array($r['id'],$comps[$r['compositionId']]['paths'],true))throw new InvalidArgumentException('Camino fuera del registro');
                if($key==='connections'){$gate=$gates[$r['gateId']??'']??null;$to=$comps[$r['toCompositionId']??'']??null;if(!$gate||!$to||!in_array($comps[$r['compositionId']]['regionId'],$gate['from'],true)||$to['regionId']!==$gate['to'])throw new InvalidArgumentException('Conexion altera la topologia educativa');}
            }
            if($key==='regions'){
                $c=$comps[$r['compositionId']??'']??null;if(!$c||isset($ids['region:'.$c['id']]))throw new InvalidArgumentException('Region de diseno invalida');$ids['region:'.$c['id']]=true;
                if(isset($r['spawn'])&&($c['id']!=='Region_Plaza_de_las_Notas'||array_diff(array_keys($r['spawn']),['position','rotation'])||!content_design_point($r['spawn']['position']??null)||!content_vector($r['spawn']['rotation']??null)))throw new InvalidArgumentException('Spawn inicial invalido');
                foreach(['entryPoints'=>'entries','exitPoints'=>'exits'] as $field=>$original)if(isset($r[$field])){if(!is_array($r[$field])||count($r[$field])>12)throw new InvalidArgumentException('Accesos invalidos');$seen=[];foreach($r[$field] as $p){if(!is_array($p)||array_diff(array_keys($p),['id','position','radius','rotation'])||!content_identifier($p['id']??null)||isset($seen[$p['id']])||!content_design_point($p['position']??null)||isset($p['radius'])&&!content_design_number($p['radius'],.5,20)||isset($p['rotation'])&&!content_vector($p['rotation']))throw new InvalidArgumentException('Acceso invalido');$seen[$p['id']]=true;}foreach($c[$original] as $p)if(!isset($seen[$p['id']]))throw new InvalidArgumentException('No eliminar acceso original');}
            }
            if($key==='areas'){
                if(!in_array($r['regionId']??'', $regionIds,true)||isset($ids['area:'.$r['regionId']]))throw new InvalidArgumentException('Area regional invalida');$ids['area:'.$r['regionId']]=true;
                foreach(['min','max'] as $f)if(!is_array($r[$f]??null)||count($r[$f])!==2||!content_design_number($r[$f][0],-54,54)||!content_design_number($r[$f][1],-140,35))throw new InvalidArgumentException('Area fuera del Valle');
                if($r['min'][0]>=$r['max'][0]||$r['min'][1]>=$r['max'][1])throw new InvalidArgumentException('Area regional invertida');
            }
        }
    }
    $areas=$d['areas']??[];foreach($areas as $i=>$a)foreach(array_slice($areas,$i+1) as $b)if(max($a['min'][0],$b['min'][0])<min($a['max'][0],$b['max'][0])&&max($a['min'][1],$b['min'][1])<min($a['max'][1],$b['max'][1]))throw new InvalidArgumentException('Areas regionales superpuestas');
}
