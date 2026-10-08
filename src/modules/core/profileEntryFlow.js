export function profileEntryReducer(userId, action) {
  if (action.type === 'EXIT_VALLE') return null;
  if (action.type === 'SELECT_PROFILE') {
    const selected = Number(action.userId);
    return Number.isSafeInteger(selected) && selected > 0 ? selected : userId;
  }
  return userId;
}

export const getEntryScreen = userId => userId === null ? 'PROFILE' : 'VALLE';
