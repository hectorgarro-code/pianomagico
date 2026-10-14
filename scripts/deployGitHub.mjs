import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { Client } from 'basic-ftp';
import { BACKEND_RUNTIME, deploymentFiles, verifyLessons } from './deploymentPlan.mjs';

process.chdir(path.resolve(import.meta.dirname, '..'));
const base = 'https://darkseagreen-alligator-732127.hostingersite.com';
for (const key of ['FTP_SERVER', 'FTP_USERNAME', 'FTP_PASSWORD']) assert.ok(process.env[key], `Missing GitHub secret: ${key}`);
assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Only main can deploy');
const client = new Client(60000);
const backupDir = 'scratch/github-deploy-backup';
const snapshots = new Map();
const changed = new Set();
const pending = new Set();
const http = resource => fetch(base + resource, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(60000) });
async function json(resource) {
  const response = await http(resource);
  assert.equal(response.status, 200, resource);
  return response.json();
}
async function preflight() {
  const document = await json('/backend/content.php?action=public_content');
  const lessons = await json('/backend/api.php?action=get_songs&instrument=piano');
  verifyLessons([document, JSON.parse(await fs.readFile('backend/content/seed.json', 'utf8'))], lessons);
  const response = await http('/backend/content.php?action=session');
  assert.equal(response.status, 200);
  const session = await response.json();
  assert.equal(session.configured, true, 'Production schema/admin must be prepared separately');
  assert.equal(session.authenticated, false);
  assert.ok(response.headers.getSetCookie().some(cookie => /;\s*Secure(?:;|$)/i.test(cookie) && /HttpOnly/i.test(cookie) && /SameSite=Strict/i.test(cookie)));
  assert.equal((await http('/backend/content.php?action=lessons')).status, 401);
  for (const resource of ['/backend/content/seed.json', '/backend/schema.sql', '/backend/dbconfig.php']) {
    assert.equal((await http(resource)).status, 403, `Unprotected backend resource: ${resource}`);
  }
}
async function connect() {
  // This hosting resets TLS 1.3 data sessions; keep certificate verification enabled.
  await client.access({ host: process.env.FTP_SERVER, user: process.env.FTP_USERNAME,
    password: process.env.FTP_PASSWORD, port: 21, secure: true,
    secureOptions: { servername: process.env.FTP_TLS_SERVERNAME || 'hstgr.io', minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' } });
}
async function transfer(operation) {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); }
    catch (error) {
      if (attempt >= 2 || !/ECONNRESET|ETIMEDOUT|EPIPE|closed|timeout|421/i.test(error.message)) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
      await connect();
    }
  }
}
async function upload(remote, source, buffer = false) {
  await transfer(async () => {
    const temporary = `${remote}.upload-${randomBytes(12).toString('hex')}`;
    pending.add(temporary);
    await client.uploadFrom(buffer ? Readable.from([source]) : source, temporary);
    // A lost rename response can still mean that the server replaced the file.
    if (snapshots.has(remote)) changed.add(remote);
    await client.rename(temporary, remote);
    pending.delete(temporary);
  });
}
async function snapshot(remote) {
  let data;
  try { data = await transfer(async () => {
    const chunks = [];
    await client.downloadTo(new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } }), remote);
    return Buffer.concat(chunks);
  }); } catch(error) {
    const newRuntime=['/backend/content/editor.php','/backend/content/preflight.php','/backend/content/events.php','/backend/content/design.php','/backend/content/design-registry.json','/backend/content/imports.php'];
    if(error.code!==550||!newRuntime.includes(remote))throw error;
    const listing=await transfer(()=>client.list(path.posix.dirname(remote)));
    if(listing.some(entry=>entry.name===path.posix.basename(remote)))throw error;
    snapshots.set(remote,null);
    await fs.mkdir(backupDir,{recursive:true});
    await fs.writeFile(path.join(backupDir,'new-runtime-files.json'),JSON.stringify([...snapshots].filter(([,data])=>data===null).map(([file])=>file)));
    return;
  }
  snapshots.set(remote, data);
  const local = path.join(backupDir, remote.slice(1));
  await fs.mkdir(path.dirname(local), { recursive: true });
  await fs.writeFile(local, data);
}
async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (dir === 'dist' && entry.name === 'models') continue;
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file); else yield file;
  }
}
try {
  await preflight();
  const built = [];
  for await (const file of walk('dist')) built.push(file);
  const models = execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files', '-z', 'public/models'], { encoding: 'utf8' }).split('\0');
  const files = deploymentFiles(models, built);
  for (const file of [...files.map(file => file.local), ...BACKEND_RUNTIME, 'dist/index.html', 'dist/.htaccess']) await fs.access(file);
  await connect();
  // CI deploys an existing installation, never schemas or accounts.
  for (const remote of ['/index.html', '/.htaccess', '/backend/.htaccess', ...BACKEND_RUNTIME.map(file => '/' + file)]) await snapshot(remote);
  const currentPage = await http('/index.html');
  assert.equal(currentPage.status, 200);
  assert.equal(await currentPage.text(), snapshots.get('/index.html').toString(), 'FTP root does not match the public site');
  let count = 0;
  for (const { local, remote } of files) {
    await transfer(() => client.ensureDir(path.posix.dirname(remote)));
    await upload(remote, local);
    if (++count % 100 === 0) console.log(`Runtime assets: ${count}/${files.length}`);
  }
  for (const file of BACKEND_RUNTIME) await upload('/' + file, file);
  await preflight();
  await upload('/.htaccess', 'dist/.htaccess');
  await upload('/index.html', 'dist/index.html');
  const index = await fs.readFile('dist/index.html', 'utf8');
  for (const route of ['/', '/valle-admin']) {
    const response = await http(route);
    assert.equal(response.status, 200); assert.equal(await response.text(), index);
  }
  for (const match of index.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)) assert.equal((await http(match[1])).status, 200);
  console.log(`Deployment verified: ${base}. Database and educational progress untouched.`);
} catch (error) {
  console.error(`Deployment failed: ${error.message}`);
  process.exitCode = 1;
  // Restore backend before exposing the previous frontend; retain assets for rollback.
  const rollback = [...changed].filter(remote => remote !== '/index.html').reverse();
  if (changed.has('/index.html')) rollback.push('/index.html');
  for (const remote of rollback) {
    try { if(snapshots.get(remote)===null)await transfer(()=>client.remove(remote));else await upload(remote, snapshots.get(remote), true); }
    catch { console.error(`Rollback failed for ${remote}; restore the workflow backup manually.`); }
  }
} finally {
  for (const temporary of pending) {
    try { await transfer(() => client.remove(temporary)); } catch { console.error(`Temporary upload cleanup failed: ${temporary}`); }
  }
  client.close();
}
