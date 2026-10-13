import {claimReward} from './gameplayState.js';
import {getGameplayContent} from './gameplayContent.js';
// Approved local demonstration assignment; existing explicit content rewards win.
export const LESSON_REWARD_FALLBACK={'forest-chest-02':'pet-panda','plaza-first-lesson':'pet-elephant'};
export function claimLessonPetReward(state,{result,context,activity,object,userId,performances},content=getGameplayContent()){
  const valid=result?.completed===true&&!result.cancelled&&Number.isInteger(result.errors)&&result.errors>=0&&result.errors<3
    &&context?.stationId===object?.id&&String(result.activityId)===String(context.activityId)
    &&String(activity?.song?.id)===String(context.activityId)&&String(result.stationId)===String(context.stationId)
    &&['LESSON_CHEST','CHALLENGE','PRACTICE_STATION'].includes(object?.type)
    &&Number(result.performanceId)>0&&performances?.some(performance=>String(performance.id)===String(result.performanceId)
      &&String(performance.song_id)===String(context.activityId)&&String(performance.user_id)===String(userId));
  if(!valid)return {state,pet:null,valid:false};
  return {...claimReward(state,object.contentRewardId||LESSON_REWARD_FALLBACK[object.id],content),valid:true};
}
