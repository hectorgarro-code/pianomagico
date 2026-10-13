export const IMPACT_SOUNDS=Object.freeze({
  creature:{file:'impactPunch_medium_000.ogg',volume:.16},
  defeat:{file:'impactPlate_light_001.ogg',volume:.12},
  hurt:{file:'impactPunch_heavy_001.ogg',volume:.2},
  woodHit:{file:'impactPlank_medium_000.ogg',volume:.14},
  woodBreak:{file:'impactWood_heavy_000.ogg',volume:.2},
  stoneHit:{file:'impactPlate_medium_000.ogg',volume:.12},
  stoneBreak:{file:'impactPlate_heavy_000.ogg',volume:.16},
});

export function targetImpactSound(target) {
  if(target.type==='DESTRUCTIBLE' && /barrel|wood|plank|box|crate|keg/i.test(target.assetId || ''))return target.defeated?'woodBreak':'woodHit';
  if(target.type==='DESTRUCTIBLE')return target.defeated?'stoneBreak':'stoneHit';
  return target.type==='WORLD_CREATURE'&&target.defeated?'defeat':'creature';
}

export function createImpactSounds({baseUrl='/',createAudio=url=>new Audio(url),now=()=>performance.now()}={}) {
  const banks=Object.fromEntries(Object.entries(IMPACT_SOUNDS).map(([kind,{file}])=>[kind,{index:0,last:-Infinity,voices:Array.from({length:2},()=>{
    const audio=createAudio(`${baseUrl}audio/Audio/${file}`);audio.preload='auto';return audio;
  })}]));
  let disposed=false;
  const stop=()=>{for(const bank of Object.values(banks))for(const audio of bank.voices)if(!audio.paused){audio.pause();audio.currentTime=0;}};
  return {
    play(kind,{silent=false,position,player,volume=1}={}) {
      const bank=banks[kind];if(disposed || !bank || silent)return false;
      const distance=position&&player?Math.hypot(position.x-player.x,position.z-player.z):0;
      const time=now();if(distance>18 || time-bank.last<80)return false;
      bank.last=time;const audio=bank.voices[bank.index++%2];audio.pause();audio.currentTime=0;
      audio.volume=IMPACT_SOUNDS[kind].volume*(1-distance/22)*Math.max(0,Math.min(1,volume));
      try{audio.play()?.catch(()=>{});}catch{/* Sound failures never alter a collision or reward. */}
      return true;
    },
    stop,
    dispose(){stop();disposed=true;for(const bank of Object.values(banks))for(const audio of bank.voices){audio.removeAttribute('src');audio.load();}},
  };
}
