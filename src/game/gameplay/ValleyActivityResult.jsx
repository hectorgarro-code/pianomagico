import { PawPrint, Play, Star } from 'lucide-react';
import { ValleyButton } from '../presentation/ValleyUI.jsx';
import AssetStage from './AssetStage.jsx';

export default function ValleyActivityResult({result,pet,activityName,onContinue,onEquip}) {
  return <div className="gameplay-overlay gameplay-celebration"><section className="gameplay-panel gameplay-result" role="dialog" aria-modal="true" aria-label={pet?'Nueva mascota':'Resultado de actividad'}>
    <p className="gameplay-kicker">{pet?<><PawPrint/>Nueva mascota</>:result.completed?'Leccion completada':'Sigue practicando'}</p>
    <h2>{pet?.name || activityName}</h2>
    {pet?<><AssetStage petId={pet.assetId} celebration/><p>Se unio a tu aventura.</p></>:<div className="gameplay-stars">{[0,1,2].map(i=><Star key={i} size={38} fill={result.completed && i<(result.errors===0?3:2)?'#ffc952':'none'}/>)}</div>}
    {result.xp!=null && <p>{activityName} · {result.xp} XP{result.errors!=null && ` · ${result.errors} errores`}</p>}
    <div className="gameplay-buttons">{pet && <ValleyButton onClick={onEquip}><PawPrint/>Equipar ahora</ValleyButton>}<ValleyButton tone={pet?'violet':'green'} onClick={onContinue}><Play/>Continuar aventura</ValleyButton></div>
  </section></div>;
}
