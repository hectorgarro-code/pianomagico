import {getTempoBpm} from '../modules/piano-magico/PianoMagico.jsx';

export function normalizeLessonForEditor(lesson) {
  return {...lesson,speed:getTempoBpm(lesson.speed),sequence:Array.isArray(lesson.sequence)?[...lesson.sequence]:[]};
}
export function lessonEditorPayload(value,source) {
  return {...value,speed:Number(source.speed)>300&&value.speed===getTempoBpm(source.speed)?Number(source.speed):value.speed};
}
export function compareLessonVersions(current,snapshot) {
  const before=normalizeLessonForEditor(current),after=normalizeLessonForEditor(snapshot);
  return ['title','speed','rhythm','order_index','stickerId','enabled','sequence'].filter(field=>field==='speed'?Number(current.speed)!==Number(snapshot.speed):JSON.stringify(before[field])!==JSON.stringify(after[field])).map(field=>({field,before:field==='speed'&&Number(current.speed)>300?`${before.speed} BPM (${current.speed} ms)`:before[field],after:field==='speed'&&Number(snapshot.speed)>300?`${after.speed} BPM (${snapshot.speed} ms)`:after[field]}));
}
