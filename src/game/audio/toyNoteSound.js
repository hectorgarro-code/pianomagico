const frequencies={C4:261.63,D4:293.66,E4:329.63,G4:392,C5:523.25,D5:587.33,E5:659.25,G5:783.99};
export function createToyNoteSound({createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}) {
  let context=null,disposed=false;const voices=new Set(),lastCue=new Map();
  const stop=()=>{for(const voice of voices){try{voice.oscillator.stop();}catch{}voice.oscillator.disconnect();voice.gain.disconnect();voice.pan?.disconnect();}voices.clear();};
  return {
    unlock(){if(disposed)return;try{context ||= createContext();void context.resume()?.catch(()=>{});}catch{}},
    cue(kind,options={}){
      const cues={secret:['G5','E5','C5'],chest:['C4','G4'],reward:['C5','E5','G5'],pet:['E5','G5'],defeat:['G4','C5']};
      if(!cues[kind]||!context||disposed||options.silent)return false;
      const now=context.currentTime;if(now-(lastCue.get(kind)??-Infinity)<1.5)return false;
      lastCue.set(kind,now);
      return cues[kind].map((pitch,index)=>this.play(pitch,{...options,delay:index*.12})).some(Boolean);
    },
    play(pitch,{silent=false,volume=1,position,player,yaw=0,delay=0}={}){
      if(disposed||silent||!context||context.state!=='running'||!frequencies[pitch])return false;
      if(voices.size>=4)stop();
      const level=Math.max(0,Math.min(1,Number.isFinite(volume)?volume:1));if(!level)return false;
      const distance=position&&player?Math.hypot(position.x-player.x,position.z-player.z):0;
      if(distance>18)return false;
      const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;
      oscillator.type='sine';oscillator.frequency.value=frequencies[pitch];gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.09*level*(1-distance/22),at+.012);gain.gain.exponentialRampToValueAtTime(.001*level,at+.3);
      const pan=position&&player&&context.createStereoPanner?context.createStereoPanner():null;
      if(pan){pan.pan.value=Math.max(-.6,Math.min(.6,((position.x-player.x)*Math.cos(yaw)-(position.z-player.z)*Math.sin(yaw))/8));gain.connect(pan);pan.connect(context.destination);}else gain.connect(context.destination);
      oscillator.connect(gain);const voice={oscillator,gain,pan};voices.add(voice);
      oscillator.onended=()=>{voices.delete(voice);oscillator.disconnect();gain.disconnect();pan?.disconnect();};oscillator.start(at);oscillator.stop(at+.32);return true;
    },
    stop,
    dispose(){disposed=true;stop();void context?.close()?.catch(()=>{});},
  };
}
