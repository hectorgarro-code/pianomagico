export const DOOR_SOUND_FILE='doorOpen_1.ogg';

export function createDoorSound({baseUrl='/',createAudio=url=>new Audio(url),now=()=>performance.now()}={}) {
  const voices=Array.from({length:2},()=>{const audio=createAudio(`${baseUrl}audio/Audio/${DOOR_SOUND_FILE}`);audio.preload='auto';return audio;});
  const pending=new Map();let index=0,disposed=false;
  const stop=()=>{for(const audio of voices)if(!audio.paused){audio.pause();audio.currentTime=0;}};
  return {
    opened(id,position){if(!disposed)pending.set(id,{position:{x:position.x,z:position.z},at:now()});},
    update({active=true,silent=false,player,volume=1}) {
      if(disposed)return;
      if(silent){pending.clear();stop();return;}
      for(const [id,event] of pending)if(now()-event.at>10000)pending.delete(id);
      if(!active){stop();return;}
      for(const [id,event] of pending){
        pending.delete(id);const distance=Math.hypot(player.x-event.position.x,player.z-event.position.z);
        if(distance>18)continue;
        const audio=voices[index++%2];audio.pause();audio.currentTime=0;audio.volume=.22*(1-distance/22)*Math.max(0,Math.min(1,volume));
        try{audio.play()?.catch(()=>{});}catch{/* Opening remains functional if audio is blocked. */}
      }
    },
    stop,
    reset(){pending.clear();stop();},
    dispose(){pending.clear();stop();disposed=true;for(const audio of voices){audio.removeAttribute('src');audio.load();}},
  };
}
