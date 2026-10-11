let csrfToken = '';
const api = new URL('backend/content.php', new URL(import.meta.env?.BASE_URL || '/', globalThis.location?.origin || 'http://localhost')).pathname;
export async function contentRequest(action, payload) {
  const response = await fetch(`${api}?action=${encodeURIComponent(action)}`, {
    credentials: 'same-origin', ...(payload !== undefined ? { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(payload) } : {}) });
  const data = await response.json();
  if (!response.ok || data.error) {
    const error = new Error(data.error || 'Content service unavailable'); error.status = response.status; throw error;
  }
  if (data.csrfToken) csrfToken = data.csrfToken;
  return data;
}
export const loadGameContent = () => contentRequest('public_content');
