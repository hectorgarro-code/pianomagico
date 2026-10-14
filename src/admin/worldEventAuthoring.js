import {newId} from './editorState.js';
export function createWorldEvent(regionId,position){return {id:newId('event'),name:'Eco escondido',regionId,position:[...position],trigger:'NEAR_PLAYER',sourceId:null,pitch:'C5',noteCount:1,revealRadius:5,secret:true,enabled:true};}
