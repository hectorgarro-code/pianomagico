import {useEffect,useRef,useState} from 'react';
import {Boxes} from 'lucide-react';
import {getAssetThumbnail} from './assetThumbnails.js';

export default function AssetThumbnail({asset}){
  const host=useRef(null),[result,setResult]=useState(null);
  useEffect(()=>{
    if(asset.previewUrl)return;
    let live=true,started=false;
    const load=()=>{if(started)return;started=true;getAssetThumbnail(asset).then(url=>{if(live)setResult({key:asset.url,url});}).catch(()=>{if(live)setResult({key:asset.url,error:true});});};
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}},{rootMargin:'80px'});
    observer.observe(host.current);return()=>{live=false;observer.disconnect();};
  },[asset]);
  const current=result?.key===asset.url?result:null,url=asset.previewUrl||current?.url;
  return <span ref={host} className="asset-thumbnail" title={current?.error?'No se pudo generar la miniatura':asset.name}>{url?<img src={url} alt="" loading="lazy"/>:<Boxes size={24} aria-hidden="true"/>}</span>;
}
