export const FOOTSTEP_FILES = Object.freeze({ grass:'footstep_grass_000.ogg', concrete:'footstep_concrete_004.ogg' });

export function createFootsteps({ baseUrl='/', createAudio=url=>new Audio(url) } = {}) {
  const sounds=Object.fromEntries(Object.entries(FOOTSTEP_FILES).map(([surface,file])=>[surface,Array.from({length:2},()=>{
    const audio=createAudio(`${baseUrl}audio/Audio/${file}`);audio.preload='auto';audio.volume=surface==='grass'?.14:.12;return audio;
  })]));
  let distance=0,lastStep=-Infinity,index=0,disposed=false;
  const stop=()=>{distance=0;for(const voices of Object.values(sounds))for(const audio of voices)if(!audio.paused){audio.pause();audio.currentTime=0;}};
  return {
    update({ moved=0, grounded, running=false, surface='grass', time, silent=false, volume=1 }) {
      if(disposed)return;
      if(!grounded || silent || moved<=.0001){stop();return;}
      distance+=moved;
      const stride=running?2.1:1.45;
      if(distance<stride || time-lastStep<.2)return;
      distance%=stride;lastStep=time;
      const selected=typeof surface==='function'?surface():surface;
      const audio=(sounds[selected] || sounds.grass)[index++%2];audio.pause();audio.currentTime=0;
      audio.volume=(selected==='concrete'?.12:.14)*Math.max(0,Math.min(1,volume));
      try { audio.play()?.catch(()=>{}); } catch { /* A blocked audio gesture never interrupts movement. */ }
    },
    stop,
    dispose(){stop();disposed=true;for(const voices of Object.values(sounds))for(const audio of voices){audio.removeAttribute('src');audio.load();}},
  };
}
