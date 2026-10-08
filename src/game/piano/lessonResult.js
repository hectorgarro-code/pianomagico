export function buildLessonResult({ songId, totalScore, initialScore, errors, medals }) {
  return {
    activityId: songId, songId, completed: errors < 3, score: totalScore,
    xp: Math.max(0, totalScore - initialScore), errors,
    medals: medals.filter(id => String(id) === String(songId))
  };
}
