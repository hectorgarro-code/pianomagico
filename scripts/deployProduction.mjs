import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { Client } from 'basic-ftp';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const base = 'https://darkseagreen-alligator-732127.hostingersite.com';
const php = process.env.PHP_BINARY || 'C:/xampp/php/php.exe';
const stdin = [];
for await (const chunk of process.stdin) stdin.push(chunk);
const input = JSON.parse(Buffer.concat(stdin).toString());
assert.match(input.username, /^[a-zA-Z0-9_.-]{3,80}$/);
assert.ok(typeof input.password === 'string' && input.password.length >= 12);
const passwordHash = execFileSync(php, ['-r', 'echo password_hash(trim(fgets(STDIN)),PASSWORD_DEFAULT);'], { input: input.password + '\n', encoding: 'utf8' });
const localLessons = JSON.parse(execFileSync(php, ['backend/content/audit-catalog.php'], { encoding: 'utf8' }));
const authorizedLessons = localLessons.filter(lesson => [7, 12, 13].includes(lesson.id));
assert.equal(authorizedLessons.length, 3);
const legacy = await fs.readFile('deploy.js', 'utf8');
const setting = key => legacy.match(new RegExp(`${key}: "([^"]+)"`))?.[1];
const config = { host: setting('host'), user: setting('user'), password: setting('password'), port: 21, remoteRoot: '/' };
try { Object.assign(config, JSON.parse(await fs.readFile('deploy.config.json', 'utf8'))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
assert.equal(config.remoteRoot, '/', 'Verify a changed production root before deploying');
const client = new Client(60000);
const backupDir = path.join(root, 'scratch', `production-backup-${Date.now()}`);
await fs.mkdir(backupDir, { recursive: true });
await fs.writeFile(path.join(backupDir, '.htaccess'), 'Require all denied\n');
const runtime = ['lessons.php', 'security.php', 'validation.php', 'schema.php', 'registry.json', 'seed.json'];
const token = randomBytes(32).toString('hex');
const tokenHash = createHash('sha256').update(token).digest('hex');
const runnerName = `prepare-${randomBytes(16).toString('hex')}.php`;
const runnerPath = `/backend/content/${runnerName}`;
let runnerUploaded = false;
let publishedApi = false;
let publishedFrontend = false;
let cookie = '';
let csrf = '';
const pendingUploads = new Set();
async function connect() {
  // This Hostinger server resets TLS 1.3 data sessions; TLS 1.2 keeps verified FTPS working.
  await client.access({ host: config.host, user: config.user, password: config.password, port: config.port,
    secure: true, secureOptions: { servername: config.tlsServerName || 'hstgr.io', minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' } });
}
async function transfer(operation) {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); }
    catch (error) {
      if (attempt >= 2 || !/ECONNRESET|ETIMEDOUT|EPIPE|closed|timeout|421/i.test(error.message)) throw error;
      console.log('Reconnecting encrypted file transfer.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await connect();
    }
  }
}
async function atomicUpload(remote, write) {
  await transfer(async () => {
    const temporary = `${remote}.upload-${randomBytes(8).toString('hex')}`;
    pendingUploads.add(temporary);
    await write(temporary);
    await client.rename(temporary, remote);
    pendingUploads.delete(temporary);
  });
}
const uploadFile = (local, remote) => atomicUpload(remote, temporary => client.uploadFrom(local, temporary));
async function uploadBuffer(data, remote) {
  await atomicUpload(remote, temporary => client.uploadFrom(Readable.from([Buffer.from(data)]), temporary));
}
async function download(remote) {
  return transfer(async () => {
    const chunks = [];
    await client.downloadTo(new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } }), remote);
    return Buffer.concat(chunks);
  });
}
async function request(action, payload) {
  const response = await fetch(`${base}/backend/content.php?action=${action}`, {
    redirect: 'error', headers: { Cookie: cookie, ...(payload ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}) },
    ...(payload ? { method: 'POST', body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(60000),
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) cookie = cookies.map(value => value.split(';')[0]).join('; ');
  const data = await response.json();
  assert.equal(response.status, 200, `${action}: ${data.error || response.status}`);
  if (data.csrfToken) csrf = data.csrfToken;
  return { data, response };
}
async function prepare(payload) {
  const response = await fetch(`${base}/backend/content/${runnerName}`, { method: 'POST', redirect: 'error',
    headers: { 'Content-Type': 'application/json', 'X-Deploy-Token': token }, body: JSON.stringify(payload), signal: AbortSignal.timeout(60000) });
  const data = await response.json();
  assert.equal(response.status, 200, data.error || 'Production preparation failed');
  return data;
}
async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (dir === 'dist' && entry.name === 'models') continue;
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file); else yield file;
  }
}
try {
  await connect();
  console.log('Backing up current production files.');
  for (const remote of ['/index.html', '/.htaccess', '/backend/api.php']) {
    const data = await download(remote);
    const local = path.join(backupDir, remote === '/.htaccess' ? 'root-htaccess-original' : remote.replace(/^\//, ''));
    await fs.mkdir(path.dirname(local), { recursive: true }); await fs.writeFile(local, data);
  }
  const backendFiles = await transfer(() => client.list('/backend'));
  const originalBackendHtaccess = backendFiles.some(file => file.name === '.htaccess') ? await download('/backend/.htaccess') : Buffer.alloc(0);
  await fs.writeFile(path.join(backupDir, 'backend-htaccess-original'), originalBackendHtaccess);
  await transfer(() => client.ensureDir('/backend/content'));
  for (const file of runtime) await uploadFile(`backend/content/${file}`, `/backend/content/${file}`);
  const template = await fs.readFile('scripts/production-prepare.php', 'utf8');
  const guard = `if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS']==='off' || ($_SERVER['REQUEST_METHOD']??'')!=='POST' || time()>${Math.floor(Date.now()/1000)+1800} || !hash_equals('${tokenHash}',hash('sha256',$_SERVER['HTTP_X_DEPLOY_TOKEN']??''))) { http_response_code(404); exit; }`;
  assert.ok(template.includes("if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }"));
  await uploadBuffer(template.replace("if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }", guard), runnerPath);
  runnerUploaded = true;
  const backup = await prepare({ action: 'backup' });
  await fs.writeFile(path.join(backupDir, 'database.json'), JSON.stringify(backup));
  const ids = new Set(backup.tables.songs.rows.map(row => Number(row.id)));
  const missing = authorizedLessons.filter(lesson => !ids.has(lesson.id));
  const result = await prepare({ action: 'prepare', fingerprints: backup.fingerprints,
    lessons: missing, username: input.username, passwordHash });
  assert.equal(result.existingEducationalDataUnchanged, true);
  console.log(JSON.stringify({ databasePrepared: true, addedLessonIds: result.addedLessonIds, backupDir }));
  const rules = '\n# Runtime only: deny database configuration and auxiliary data files.\n<FilesMatch "(?i)(^dbconfig\\.php$|\\.(sql|json)$)">\nRequire all denied\n</FilesMatch>\n';
  await uploadBuffer(Buffer.concat([originalBackendHtaccess, Buffer.from(rules)]), '/backend/.htaccess');
  await uploadFile('backend/content.php', '/backend/content.php');
  await uploadFile('backend/api.php', '/backend/api.php'); publishedApi = true;
  await request('session');
  const login = await request('login', { username: input.username, password: input.password });
  assert.equal(login.data.authenticated, true);
  assert.ok(login.response.headers.getSetCookie().some(value => /Secure/i.test(value) && /HttpOnly/i.test(value) && /SameSite=Strict/i.test(value)));
  const { data: lessons } = await request('lessons');
  const { data: content } = await request('public_content');
  const available = new Set(lessons.filter(lesson => lesson.enabled && lesson.user_id === null && !lesson.is_user_created).map(lesson => Number(lesson.id)));
  for (const activity of content.activities) if (activity.lessonId !== null) assert.ok(available.has(Number(activity.lessonId)), `Missing lesson for ${activity.id}`);
  await request('logout', {});
  const denied = await fetch(`${base}/backend/content.php?action=lessons`, { redirect: 'error' });
  assert.equal(denied.status, 401);
  const files = execFileSync('git', ['ls-files', 'public/models'], { encoding: 'utf8' }).trim().split(/\r?\n/);
  for await (const file of walk('dist')) if (!['dist/index.html', 'dist/.htaccess'].includes(file)) files.push(file);
  let uploaded = 0;
  let currentDir = '';
  for (const file of files) {
    assert.ok(!/\.(fbx|obj|mtl|url)$/i.test(file));
    const relative = file.replace(/^(?:public|dist)\//, '');
    const dir = path.posix.dirname('/' + relative);
    if (dir !== currentDir) { await transfer(() => client.ensureDir(dir)); currentDir = dir; }
    await uploadFile(file, '/' + relative);
    if (++uploaded % 100 === 0) console.log(`Runtime files uploaded: ${uploaded}/${files.length}`);
  }
  const index = await fs.readFile('dist/index.html');
  await uploadFile('dist/.htaccess', '/.htaccess');
  await uploadBuffer(index, '/index.html'); publishedFrontend = true;
  const live = await fetch(base + '/', { cache: 'no-store', redirect: 'error' });
  assert.equal(live.status, 200); assert.equal(await live.text(), index.toString());
  for (const match of index.toString().matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)) {
    const response = await fetch(base + match[1], { method: 'HEAD', redirect: 'error' }); assert.equal(response.status, 200);
  }
  const adminPage = await fetch(base + '/valle-admin', { redirect: 'error' }); assert.equal(adminPage.status, 200);
  assert.equal(await adminPage.text(), index.toString());
  for (const resource of ['/backend/content/seed.json','/backend/schema.sql','/backend/dbconfig.php']) {
    const response = await fetch(base + resource, { redirect: 'error' }); assert.equal(response.status, 403);
  }
  console.log(JSON.stringify({ deployed: true, url: base, admin: base + '/valle-admin', runtimeFiles: uploaded,
    activeLessons: available.size, existingEducationalDataUnchanged: true, httpsAdminVerified: true, backupDir }));
} catch (error) {
  console.error(`Deployment failed: ${error.message}`);
  if (publishedFrontend) {
    await uploadFile(path.join(backupDir,'index.html'),'/index.html');
    await uploadFile(path.join(backupDir,'root-htaccess-original'),'/.htaccess');
  }
  if (publishedApi) await uploadFile(path.join(backupDir,'backend/api.php'),'/backend/api.php');
  process.exitCode = 1;
} finally {
  if (cookie && csrf) { try { await request('logout', {}); } catch {} }
  if (runnerUploaded) {
    try { await transfer(() => client.remove(runnerPath)); console.log('Temporary preparation endpoint removed.'); }
    catch { console.error(`Remove temporary endpoint manually: ${runnerPath}`); process.exitCode = 1; }
  }
  for (const temporary of pendingUploads) {
    try { await transfer(() => client.remove(temporary)); } catch {}
  }
  client.close();
}
