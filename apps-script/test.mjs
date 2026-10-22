// Self-check tanpa dependensi: node apps-script/test.mjs
// Menjalankan Code.gs dengan tiruan layanan Google (UrlFetchApp, SpreadsheetApp, dst.).
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function run({ props = { TURNSTILE_SECRET: 's' }, verify = { success: true, hostname: 'grintecs.com' } } = {}) {
  const rows = [];
  const mails = [];
  const sheet = { appendRow: (r) => rows.push(r), setFrozenRows() {} };
  const ctx = {
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null }) },
    UrlFetchApp: { fetch: (url, opt) => ({ getContentText: () => JSON.stringify({ ...verify, _secret: opt.payload.secret }) }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => null, insertSheet: () => sheet }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: (m) => mails.push(m) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ text: t, setMimeType() { return this; } }) },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('./Code.gs', import.meta.url), 'utf8'), ctx);
  const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  return { post, rows, mails };
}

const valid = { name: 'Uji', company: 'PT Contoh', email: 'uji@contoh.test', message: 'Halo', token: 't', lang: 'id', page: '/id/contact/' };

// Sukses: header + 1 baris
let r = run();
assert.deepEqual(r.post(valid), { success: true });
assert.equal(r.rows.length, 2);
assert.equal(r.rows[1][2], 'Uji');

// Tanpa token / Turnstile gagal / hostname asing / secret belum diset -> captcha, tidak ada baris
for (const [opts, body] of [
  [{}, { ...valid, token: '' }],
  [{ verify: { success: false } }, valid],
  [{ verify: { success: true, hostname: 'evil.test' } }, valid],
  [{ props: {} }, valid],
]) {
  r = run(opts);
  assert.deepEqual(r.post(body), { success: false, error: 'captcha' });
  assert.equal(r.rows.length, 0);
}

// Email salah / field wajib kosong -> invalid
r = run();
assert.deepEqual(r.post({ ...valid, email: 'bukan-email' }), { success: false, error: 'invalid' });
assert.deepEqual(r.post({ ...valid, message: '   ' }), { success: false, error: 'invalid' });

// Formula injection dinetralkan, notifikasi email terkirim bila NOTIFY_EMAIL diset
r = run({ props: { TURNSTILE_SECRET: 's', NOTIFY_EMAIL: 'info@grintecs.com' } });
r.post({ ...valid, name: '=HYPERLINK("http://x")' });
assert.equal(r.rows[1][2], '\'=HYPERLINK("http://x")');
assert.equal(r.mails[0].to, 'info@grintecs.com');
assert.equal(r.mails[0].replyTo, 'uji@contoh.test');

console.log('apps-script ok');
