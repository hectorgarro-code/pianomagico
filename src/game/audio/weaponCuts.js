export const WEAPON_CUT_FILES=Object.freeze({sword:'knifeSlice.ogg',axe:'knifeSlice2.ogg'});
export const MAGE_IMPACT_FILE='impactPunch_heavy_001.ogg';

export function createWeaponCuts({baseUrl='/',createAudio=url=>new Audio(url)}={}) {
  const sounds=Object.fromEntries(Object.entries({...WEAPON_CUT_FILES,mage:MAGE_IMPACT_FILE}).map(([weapon,file])=>[weapon,Array.from({length:2},()=>{
    const audio=createAudio(`${baseUrl}audio/Audio/${file}`);audio.preload='auto';audio.volume=weapon==='mage'?.18:.2;return audio;
  })]));
  let pending=null,index=0,disposed=false,level=1;
  const stop=()=>{pending=null;for(const voices of Object.values(sounds))for(const audio of voices)if(!audio.paused){audio.pause();audio.currentTime=0;}};
  const play=weapon=>{
    const audio=sounds[weapon][index++%2];audio.pause();audio.currentTime=0;
    audio.volume=(weapon==='mage'?.18:.2)*level;
    try{audio.play()?.catch(()=>{});}catch{/* Audio availability never changes an attack. */}
  };
  return {
    begin(weapon,clip,duration) {
      pending=null;
      const valid=weapon==='mage'?/Melee_Attack|Spellcast/.test(clip || ''):/Melee_Attack_(Slice|Chop|Spin)/.test(clip || '');
      if(disposed || !sounds[weapon] || !valid || !Number.isFinite(duration) || duration<=0)return false;
      pending={weapon,elapsed:0,start:duration*.22,duration};return true;
    },
    impact({silent=false,volume=1}={}) {
      level=Math.max(0,Math.min(1,volume));
      if(disposed || silent){stop();return false;}
      if(pending?.weapon!=='mage')return false;
      pending=null;play('mage');return true;
    },
    update(delta,{silent=false,volume=1}={}) {
      level=Math.max(0,Math.min(1,volume));
      if(disposed)return;
      if(silent){stop();return;}
      if(!pending)return;
      pending.elapsed+=delta;
      if(pending.weapon==='mage'){if(pending.elapsed>pending.duration)pending=null;return;}
      if(pending.elapsed<pending.start)return;
      const weapon=pending.weapon;pending=null;play(weapon);
    },
    stop,
    dispose(){stop();disposed=true;for(const voices of Object.values(sounds))for(const audio of voices){audio.removeAttribute('src');audio.load();}},
  };
}
