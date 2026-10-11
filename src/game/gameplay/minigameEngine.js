const choose = (pool, random) => pool[Math.floor(random()*pool.length)];
const shuffle = (items, random) => {const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
export function createMiniSession(definition, random = Math.random) {
  const config=definition.configuration;
  if(definition.type==='RHYTHM') return {type:definition.type,pattern:[...config.pattern],taps:[],startedAt:null};
  const count=definition.type==='NOTE_RECOGNITION' ? config.questionCount : config.rounds;
  const questions=Array.from({length:count},()=>Array.from({length:definition.type==='NOTE_RECOGNITION'?1:config.sequenceLength},()=>choose(config.notePool,random)));
  const choices=definition.type==='NOTE_RECOGNITION'?questions.map(([answer])=>shuffle([answer,...shuffle(config.notePool.filter(note=>note!==answer),random).slice(0,config.difficulty==='easy'?2:config.notePool.length-1)],random)):null;
  return {type:definition.type,round:0,answers:[],questions,choices};
}
export function miniAnswer(session,note) {
  const expected=session.questions[session.round];
  if(!expected || expected[session.answers.length]!==note) return {...session,status:'FAILED'};
  const answers=[...session.answers,note];
  return answers.length===expected.length ? {...session,round:session.round+1,answers:[],status:session.round+1===session.questions.length?'SUCCESS':'NEXT'} : {...session,answers,status:'PLAYING'};
}
export function rhythmResult(session,config) {
  if(session.taps.length!==session.pattern.length) return false;
  const beat=60000/config.bpm;
  return session.taps.every((time,i)=>Math.abs(time-session.startedAt-session.pattern[i]*beat)<=config.toleranceMs);
}
