import {miniAnswer} from './minigameEngine.js';
export function createWorldSequence(definition,completed=false){
  if(definition.type!=='SEQUENCE_MEMORY')throw Error('Unsupported world music type');
  return {phase:completed?'OPEN':'IDLE',elapsed:0,played:-1,flash:null,
    session:{questions:[[...definition.sequence]],round:0,answers:[]}};
}
export function advanceWorldSequence(state,delta,near){
  if(state.phase==='OPEN')return {...state,elapsed:state.elapsed+delta};
  if(!near)return {...state,phase:'IDLE',elapsed:0,played:-1,flash:null,session:{...state.session,round:0,answers:[],status:undefined}};
  if(state.phase==='IDLE')return {...state,phase:'LISTEN',elapsed:0,played:-1};
  const elapsed=state.elapsed+delta;
  if(state.phase==='ERROR'&&elapsed>=1)return {...state,phase:'LISTEN',elapsed:0,played:-1,flash:null,session:{...state.session,answers:[],status:undefined}};
  if(state.phase==='LISTEN'){
    const played=Math.min(state.session.questions[0].length-1,Math.floor(Math.max(-1,(elapsed-.65)/.8)));
    if(elapsed>=.65+state.session.questions[0].length*.8)return {...state,phase:'ANSWER',elapsed:0,flash:null};
    return {...state,elapsed,played,flash:played>=0?state.session.questions[0][played]:null};
  }
  return {...state,elapsed,flash:elapsed<.4?state.flash:null};
}
export function answerWorldSequence(state,pitch){
  if(state.phase!=='ANSWER')return state;
  const session=miniAnswer(state.session,pitch);
  return {...state,session,elapsed:0,flash:pitch,phase:session.status==='FAILED'?'ERROR':session.status==='SUCCESS'?'OPEN':'ANSWER'};
}
