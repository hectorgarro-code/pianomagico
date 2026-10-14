<?php
function content_imported_assets($directory=null){
    $directory=$directory??__DIR__.'/imported';$assets=[];
    foreach(glob($directory.'/*.json')?:[] as $file){$record=json_decode(file_get_contents($file),true,64,JSON_THROW_ON_ERROR);if(is_array($record)&&str_starts_with($record['id']??'','imported:'))$assets[]=$record;}
    return $assets;
}
function content_registry(){
    $registry=json_decode(file_get_contents(__DIR__.'/registry.json'),true,512,JSON_THROW_ON_ERROR);
    $registry['assets']=array_merge($registry['assets'],content_imported_assets());return $registry;
}
function content_validate_glb_import($bytes){
    $size=strlen($bytes);if($size<28||$size>4194304)throw new InvalidArgumentException('GLB debe tener hasta 4 MB');
    $header=unpack('a4magic/Vversion/Vlength/VjsonLength/VjsonType',substr($bytes,0,20));
    if($header['magic']!=='glTF'||$header['version']!==2||$header['length']!==$size||$header['jsonType']!==0x4E4F534A||$header['jsonLength']>1048576||$header['jsonLength']%4||20+$header['jsonLength']+8>$size)throw new InvalidArgumentException('Cabecera GLB invalida');
    $doc=json_decode(substr($bytes,20,$header['jsonLength']),true,64,JSON_THROW_ON_ERROR);$offset=20+$header['jsonLength'];$chunk=unpack('Vlength/Vtype',substr($bytes,$offset,8));
    if(($doc['asset']['version']??'')!=='2.0'||$chunk['type']!==0x004E4942||$chunk['length']%4||$offset+8+$chunk['length']!==$size)throw new InvalidArgumentException('GLB autocontenido requerido');
    if(!empty($doc['extensionsRequired'])||!empty($doc['extensionsUsed'])||!empty($doc['skins'])||!empty($doc['animations']))throw new InvalidArgumentException('Primera importacion: modelos estaticos sin extensiones ni rigs');
    if(count($doc['buffers']??[])!==1||isset($doc['buffers'][0]['uri'])||!is_int($doc['buffers'][0]['byteLength']??null)||$doc['buffers'][0]['byteLength']<1||$doc['buffers'][0]['byteLength']>$chunk['length'])throw new InvalidArgumentException('Buffer externo/invalido');
    if(count($doc['nodes']??[])<1||count($doc['nodes'])>200||count($doc['scenes']??[])!==1||count($doc['meshes']??[])<1||count($doc['meshes'])>100||count($doc['accessors']??[])>500||count($doc['images']??[])>8)throw new InvalidArgumentException('Complejidad del modelo excedida');
    $bufferLength=$doc['buffers'][0]['byteLength'];
    foreach($doc['bufferViews']??[] as $view)if(($view['buffer']??0)!==0||!is_int($view['byteLength']??null)||$view['byteLength']<0||!is_int($view['byteOffset']??0)||($view['byteOffset']??0)<0||($view['byteOffset']??0)+$view['byteLength']>$bufferLength)throw new InvalidArgumentException('BufferView fuera de limites');
    $vertices=0;
    foreach($doc['meshes'] as $mesh)foreach($mesh['primitives']??[] as $primitive){if(($primitive['mode']??4)!==4||isset($primitive['targets']))throw new InvalidArgumentException('Solo triangulos estaticos');$accessor=$doc['accessors'][$primitive['attributes']['POSITION']??-1]??null;if(!$accessor||!is_int($accessor['count']??null)||$accessor['count']<1)throw new InvalidArgumentException('Posiciones invalidas');$vertices+=$accessor['count'];}
    if($vertices>100000)throw new InvalidArgumentException('Limite de 100000 vertices');
    foreach($doc['meshes'] as $mesh)foreach($mesh['primitives']??[] as $p){foreach($p['attributes'] as $index)if(!is_int($index)||!isset($doc['accessors'][$index]))throw new InvalidArgumentException('Atributo inexistente');if(isset($p['material'])&&(!is_int($p['material'])||!isset($doc['materials'][$p['material']])))throw new InvalidArgumentException('Material inexistente');if(isset($p['indices'])){$index=$doc['accessors'][$p['indices']]??null;if(!$index||($index['type']??'')!=='SCALAR'||!in_array($index['componentType']??0,[5121,5123,5125],true)||($index['count']??1)%3)throw new InvalidArgumentException('Indices invalidos');}}
    foreach($doc['textures']??[] as $texture){if(!is_int($texture['source']??null)||!isset($doc['images'][$texture['source']])||isset($texture['sampler'])&&!isset($doc['samplers'][$texture['sampler']]))throw new InvalidArgumentException('Referencia de textura invalida');}
    foreach($doc['materials']??[] as $material)foreach(array_merge($material,$material['pbrMetallicRoughness']??[]) as $key=>$value)if(str_ends_with($key,'Texture')&&(!is_array($value)||!is_int($value['index']??null)||!isset($doc['textures'][$value['index']])))throw new InvalidArgumentException('Textura de material inexistente');
    foreach($doc['accessors']??[] as $a){$view=$doc['bufferViews'][$a['bufferView']??-1]??null;$components=['SCALAR'=>1,'VEC2'=>2,'VEC3'=>3,'VEC4'=>4,'MAT2'=>4,'MAT3'=>9,'MAT4'=>16][$a['type']??'']??0;$bytesPer=[5120=>1,5121=>1,5122=>2,5123=>2,5125=>4,5126=>4][$a['componentType']??0]??0;$count=$a['count']??null;$start=$a['byteOffset']??0;$stride=$view['byteStride']??($components*$bytesPer);if(isset($a['sparse'])||!$view||!$components||!$bytesPer||!is_int($count)||$count<1||$count>300000||!is_int($start)||$start<0||!is_int($stride)||$stride<$components*$bytesPer||$stride>252||$start+($count-1)*$stride+$components*$bytesPer>$view['byteLength'])throw new InvalidArgumentException('Accessor fuera de limites');}
    $textureBytes=0;foreach($doc['images']??[] as $image){$view=$doc['bufferViews'][$image['bufferView']??-1]??null;if(isset($image['uri'])||!$view||!in_array($image['mimeType']??'', ['image/png','image/jpeg'],true))throw new InvalidArgumentException('Textura externa/invalida');$info=@getimagesizefromstring(substr($bytes,$offset+8+($view['byteOffset']??0),$view['byteLength']));if(!$info||$info[0]>2048||$info[1]>2048||!in_array($info['mime'],['image/png','image/jpeg'],true))throw new InvalidArgumentException('Textura debe ser PNG/JPEG hasta 2048 px');$textureBytes+=$info[0]*$info[1]*4;}if($textureBytes>33554432)throw new InvalidArgumentException('Memoria de texturas excedida');
    // Refuse cyclic graphs before GLTFLoader can recurse over untrusted nodes.
    $nodes=$doc['nodes']??[];$visited=[];$active=[];$visit=function($index)use(&$visit,&$visited,&$active,$nodes){if(!is_int($index)||!isset($nodes[$index])||isset($active[$index]))throw new InvalidArgumentException('Grafo de nodos invalido');if(isset($visited[$index]))return;$active[$index]=true;foreach($nodes[$index]['children']??[] as $child)$visit($child);unset($active[$index]);$visited[$index]=true;};foreach(array_keys($nodes) as $index)$visit($index);
    $parents=[];$rendered=0;$drawCalls=0;foreach($nodes as $node){foreach($node['children']??[] as $child){if(isset($parents[$child]))throw new InvalidArgumentException('Nodos compartidos no admitidos');$parents[$child]=true;}foreach(['translation'=>3,'rotation'=>4,'scale'=>3,'matrix'=>16] as $field=>$length)if(isset($node[$field])){if(!is_array($node[$field])||count($node[$field])!==$length)throw new InvalidArgumentException('Transform de nodo invalido');foreach($node[$field] as $v)if(!is_numeric($v)||!is_finite((float)$v)||abs($v)>10000)throw new InvalidArgumentException('Transform fuera de rango');}if(isset($node['mesh'])){$mesh=$doc['meshes'][$node['mesh']]??null;if(!$mesh)throw new InvalidArgumentException('Mesh inexistente');foreach($mesh['primitives'] as $p){$rendered+=$doc['accessors'][$p['attributes']['POSITION']]['count'];$drawCalls++;}}}if($rendered>200000||$drawCalls>120)throw new InvalidArgumentException('Complejidad renderizada excedida');
    $roots=[];foreach($doc['scenes'][0]['nodes']??[] as $index){if(!is_int($index)||!isset($nodes[$index])||isset($parents[$index])||isset($roots[$index]))throw new InvalidArgumentException('Escena invalida');$roots[$index]=true;}if(!$roots)throw new InvalidArgumentException('Escena vacia');
    return ['vertices'=>$vertices,'nodes'=>count($nodes),'format'=>'GLB','animations'=>[]];
}
function content_import_asset($input,$root=null,$directory=null){
    $root=$root??content_public_root().'/models/imported';$directory=$directory??__DIR__.'/imported';
    $name=$input['name']??'';$author=$input['author']??'';$license=$input['license']??'';$category=$input['category']??'';
    foreach([$name,$author] as $text)if(!is_string($text)||trim($text)===''||strlen($text)>100||preg_match('/[<>\x00-\x1f]/',$text))throw new InvalidArgumentException('Nombre/autor requerido');
    if(!in_array($license,['CC0','CC-BY-4.0','OWN'],true)||!in_array($category,['PROP','ARCHITECTURE','VEGETATION','DECORATION','DESTRUCTIBLE'],true)||($input['rightsConfirmed']??false)!==true)throw new InvalidArgumentException('Licencia y permiso de uso requeridos');
    $encoded=$input['data']??null;if(!is_string($encoded)||strlen($encoded)>5592408)throw new InvalidArgumentException('Modelo demasiado grande');$bytes=base64_decode($encoded,true);if($bytes===false)throw new InvalidArgumentException('Datos binarios invalidos');$audit=content_validate_glb_import($bytes);$hash=hash('sha256',$bytes);
    foreach([$root,$directory] as $dir)if(!is_dir($dir)&&!mkdir($dir,0755,true)&&!is_dir($dir))throw new RuntimeException('No se pudo preparar almacen de assets');
    if(!is_file($directory.'/.htaccess')&&file_put_contents($directory.'/.htaccess',"Require all denied\n")===false)throw new RuntimeException('No se pudo proteger metadata de assets');
    $lock=fopen($directory.'/.import.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new RuntimeException('Importacion ocupada');
    try{
        if(is_file($directory.'/'.$hash.'.json'))return json_decode(file_get_contents($directory.'/'.$hash.'.json'),true,64,JSON_THROW_ON_ERROR);
        $files=glob($root.'/*.glb')?:[];if(count($files)>=100||array_sum(array_map('filesize',$files))+strlen($bytes)>104857600)throw new InvalidArgumentException('Cuota de importacion alcanzada');
        $record=['id'=>'imported:'.$hash,'name'=>trim($name),'url'=>'/models/imported/'.$hash.'.glb','category'=>$category,'packId'=>'admin-imported','license'=>['type'=>$license,'author'=>trim($author)],'metadataStatus'=>'STATIC_VALIDATED',...$audit];
        if(file_put_contents($root.'/'.$hash.'.glb',$bytes,LOCK_EX)!==strlen($bytes))throw new RuntimeException('No se pudo guardar GLB');
        $temp=$directory.'/'.$hash.'.json.tmp';if(file_put_contents($temp,json_encode($record,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),LOCK_EX)===false||!rename($temp,$directory.'/'.$hash.'.json'))throw new RuntimeException('No se pudo registrar modelo');
        return $record;
    }finally{flock($lock,LOCK_UN);fclose($lock);}
}
