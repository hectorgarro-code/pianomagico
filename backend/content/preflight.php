<?php
function content_resource_file($path,$root) {
    if(!is_string($path)||str_contains($path,"\0"))throw new InvalidArgumentException('Recurso invalido');
    $file=realpath($path);$base=realpath($root);
    $normalizedFile=$file?str_replace('\\','/',$file):'';$normalizedBase=$base?str_replace('\\','/',$base):'';
    if(PHP_OS_FAMILY==='Windows'){$normalizedFile=strtolower($normalizedFile);$normalizedBase=strtolower($normalizedBase);}
    if(!$file||!$base||!is_file($file)||!str_starts_with($normalizedFile,$normalizedBase.'/'))throw new InvalidArgumentException('Recurso ausente o fuera de public: '.basename($path));
    return $file;
}
function content_model_document($file) {
    if(strtolower(pathinfo($file,PATHINFO_EXTENSION))==='gltf')return json_decode(file_get_contents($file),true,512,JSON_THROW_ON_ERROR);
    $stream=fopen($file,'rb');
    try {
        $bytes=fread($stream,20);
        if(strlen($bytes)!==20)throw new InvalidArgumentException('GLB incompleto: '.basename($file));
        $header=unpack('a4magic/Vversion/Vlength/VchunkLength/VchunkType',$bytes);
        if($header['magic']!=='glTF'||$header['version']!==2||$header['length']!==filesize($file)||$header['chunkType']!==0x4E4F534A||$header['chunkLength']>4194304||$header['chunkLength']>$header['length']-20)throw new InvalidArgumentException('GLB invalido: '.basename($file));
        return json_decode(fread($stream,$header['chunkLength']),true,512,JSON_THROW_ON_ERROR);
    }finally{fclose($stream);}
}
function content_asset_preflight($data,$registry,$root=null) {
    $root=$root ?? dirname(__DIR__,2).'/public';$assets=array_column($registry['assets'],null,'id');$urls=[];
    foreach($data['world'] as $region)foreach($region['instances'] as $object)$urls[$object['assetUrl']]=true;
    foreach($data['editorTemplates'] ?? [] as $template)foreach($template['instances'] as $object)$urls[$object['assetUrl']]=true;
    foreach($data['worldActions'] as $object)if($object['enabledInWorld'])$urls[$assets[$object['assetId']]['url']]=true;
    foreach($data['pets'] ?? [] as $pet)if($pet['enabled'])$urls[$assets[$pet['assetId']]['url']]=true;
    foreach($data['residents'] ?? [] as $npc)$urls[$assets['player:'.$npc['characterId']]['url']]=true;
    if(array_filter($data['gates'],fn($g)=>$g['enabled']))$urls['/models/props/gate.glb']=true;
    $dependencies=[];
    foreach(array_keys($urls) as $url) {
        if(!str_starts_with($url,'/models/'))throw new InvalidArgumentException('Ruta de modelo invalida');
        $file=content_resource_file($root.'/'.rawurldecode(ltrim($url,'/')),$root);
        $document=content_model_document($file);
        if(!is_array($document)||($document['asset']['version'] ?? '')!=='2.0')throw new InvalidArgumentException('Formato GLTF invalido');
        foreach(array_merge($document['buffers'] ?? [],$document['images'] ?? []) as $resource) {
            $uri=$resource['uri'] ?? null;if($uri===null)continue;
            if(!is_string($uri))throw new InvalidArgumentException('Dependencia invalida');
            if(str_starts_with($uri,'data:'))continue;
            if(preg_match('~^[a-z][a-z0-9+.-]*:|^//~i',$uri)||str_contains($uri,'?')||str_contains($uri,'#'))throw new InvalidArgumentException('Dependencia externa no admitida');
            $path=str_starts_with($uri,'/')?$root.'/'.rawurldecode(ltrim($uri,'/')):dirname($file).'/'.rawurldecode($uri);
            $dependencies[content_resource_file($path,$root)]=true;
        }
    }
    return ['modelsChecked'=>count($urls),'dependenciesChecked'=>count($dependencies)];
}
function content_revision_check($draft,$current) {
    if(!isset($draft['revision'])||!is_int($draft['revision'])||$draft['revision']!==$current['revision'])throw new DomainException('El mundo publicado cambio; recargar y revisar el borrador antes de publicar');
}
