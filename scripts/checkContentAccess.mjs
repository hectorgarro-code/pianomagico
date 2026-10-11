import assert from 'node:assert/strict';
const base = process.env.CONTENT_TEST_BASE || 'http://127.0.0.1/pianomagicoweb/backend/';
let passed = 0;
for (const action of ['lessons', 'content', 'save_lesson', 'save_content']) {
  const response = await fetch(`${base}content.php?action=${action}&debug=1`, { method: action.startsWith('save') ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' }, ...(action.startsWith('save') ? { body: '{}' } : {}) });
  assert.equal(response.status, 401, action); passed++;
}
for (const action of ['get_admin_songs','update_song','delete_song','reorder_songs','add_song']) {
  const response=await fetch(`${base}api.php?action=${action}`, { method: action==='get_admin_songs'?'GET':'POST',
    headers:{'Content-Type':'application/json'}, ...(action==='get_admin_songs'?{}:{body:'{}'}) });
  assert.equal(response.status,401,action); passed++;
}
const publicContent = await fetch(`${base}content.php?action=public_content`);
assert.equal(publicContent.status,200);
const doc=await publicContent.json(); assert.equal(doc.schemaVersion,1); assert.equal(doc.activities.length,15); passed++;
const active=await fetch(`${base}api.php?action=get_songs&instrument=piano`);
assert.equal((await active.json()).length,Number(process.env.CONTENT_TEST_LESSON_COUNT || 40)); passed++;
const session=await fetch(`${base}content.php?action=session`);
const state=await session.json(); assert.equal(state.authenticated,false); passed++;
const cookie=session.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
assert.ok(session.headers.getSetCookie().some(c=>/HttpOnly/i.test(c)&&/SameSite=Strict/i.test(c))); passed++;
if (base.startsWith('https://')) { assert.ok(session.headers.getSetCookie().some(c=>/;\s*Secure(?:;|$)/i.test(c))); passed++; }
const invalidCsrf=await fetch(`${base}content.php?action=login`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({username:'unauthorized',password:'not-a-real-password'})});
assert.equal(invalidCsrf.status,403); passed++;
console.log(JSON.stringify({passed, configured:state.configured, revision:doc.revision, credentialsUsed:false}));
