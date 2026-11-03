/**
 * Penerima form kontak grintecs.com -> Google Sheet.
 * Buat project di script.google.com (atau dari Sheet: Extensions > Apps Script), lalu Deploy > Web app.
 *
 * Script Properties (Project Settings > Script properties):
 *   TURNSTILE_SECRET   wajib, secret key widget Cloudflare Turnstile
 *   SHEET_ID           ID Google Sheet tujuan (bagian URL di antara /d/ dan /edit).
 *                      Boleh kosong bila script dibuat dari Sheet itu sendiri.
 *   SHEET_NAME         opsional, nama tab, default "Leads" (dibuat otomatis bila belum ada)
 *   ALLOWED_HOSTNAMES  opsional, default "grintecs.com,www.grintecs.com,localhost"
 *   NOTIFY_EMAIL       opsional, alamat yang menerima email setiap ada pesan baru
 */

const SHEET_NAME = 'Leads'; // default, bisa diganti lewat Script Property SHEET_NAME
const HEADERS = ['Waktu', 'Bahasa', 'Nama', 'Perusahaan', 'Email', 'Telepon', 'Layanan', 'Pesan', 'Halaman'];
const LIMITS = { name: 120, company: 160, email: 160, phone: 40, service: 120, message: 5000, lang: 5, page: 200 };

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();

    // "Lihat Harga": opt-in email -> catat lead -> kembalikan paket harga (harga tidak pernah ada di HTML situs).
    if (data.action === 'pricing') return handlePricing_(data, props);
    // Cakupan paket untuk ditampilkan di halaman TANPA harga (harga tetap rahasia sampai email masuk).
    if (data.action === 'scopes') return handleScopes_(data, props);

    if (!verifyTurnstile_(data.token, props)) return json_({ success: false, error: 'captcha' });

    const f = {};
    Object.keys(LIMITS).forEach(function (k) {
      f[k] = clean_(data[k], LIMITS[k]);
    });
    if (!f.name || !f.company || !f.message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) {
      return json_({ success: false, error: 'invalid' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_(props).appendRow([new Date(), f.lang, f.name, f.company, f.email, f.phone, f.service, f.message, f.page].map(safeCell_));
    } finally {
      lock.releaseLock();
    }

    const notify = props.getProperty('NOTIFY_EMAIL');
    if (notify) {
      MailApp.sendEmail({
        to: notify,
        replyTo: f.email,
        subject: '[grintecs.com] Pesan baru dari ' + f.name + ' (' + f.company + ')',
        body: HEADERS.slice(1).map(function (h, i) {
          return h + ': ' + [f.lang, f.name, f.company, f.email, f.phone, f.service, f.message, f.page][i];
        }).join('\n'),
      });
    }
    return json_({ success: true });
  } catch (err) {
    console.error(err);
    return json_({ success: false, error: 'server' });
  }
}

// Cek cepat dari browser: buka URL /exec, harus muncul {"ok":true}.
function doGet() {
  return json_({ ok: true });
}

// --- "Lihat Harga" ---------------------------------------------------------
// Email opt-in dicatat di tab "PricingLeads"; harga dibaca dari tab "Prices"
// (bisa diedit Pak Dwi tanpa deploy ulang) lalu dikirim balik sebagai JSON.
const PRICE_LEADS = 'PricingLeads';
const PRICE_LEADS_HEADERS = ['Waktu', 'Email', 'Layanan', 'Sub-layanan', 'Paket', 'Bahasa', 'Halaman'];
const PRICES_SHEET = 'Prices'; // kolom: Key | Bahasa | Paket | Harga | Cakupan | Urutan

function handlePricing_(data, props) {
  if (!verifyTurnstile_(data.token, props)) return json_({ success: false, error: 'captcha' });
  const email = clean_(data.email, 160);
  const key = clean_(data.key, 80);
  const lang = clean_(data.lang, 5);
  const page = clean_(data.page, 200);
  const service = clean_(data.service, 160); // nama layanan induk, mis. "Cyber Security Implementation"
  const sub = clean_(data.sub, 160); // nama sub-layanan, mis. "Phishing Simulation"
  const pkg = clean_(data.pkg, 80); // paket yang diklik calon klien, mis. "Starter"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !key) return json_({ success: false, error: 'invalid' });

  const packages = readPrices_(props, key, lang);
  if (!packages.length) return json_({ success: false, error: 'noprice' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    pricingLeadsSheet_(props).appendRow([new Date(), email, service, sub, pkg, lang, page].map(safeCell_));
  } finally {
    lock.releaseLock();
  }
  return json_({ success: true, packages: packages });
}

// Cakupan tiap paket untuk dirender di halaman. Harga numerik DIHAPUS di sini;
// hanya label non-angka (mis. "Hubungi kami") yang ikut, supaya harga tetap tersembunyi.
function handleScopes_(data, props) {
  const packages = readPrices_(props, clean_(data.key, 80), clean_(data.lang, 5));
  return json_({
    success: true,
    packages: packages.map(function (p) {
      return { name: p.name, scope: p.scope, price: /\d/.test(p.price) ? '' : p.price };
    }),
  });
}

function readPrices_(props, key, lang) {
  const ss = ss_(props);
  const sh = ss.getSheetByName(PRICES_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh
    .getRange(2, 1, sh.getLastRow() - 1, 6)
    .getValues()
    .filter(function (r) { return String(r[0]).trim() === key && String(r[1]).trim() === lang; })
    .sort(function (a, b) { return (Number(a[5]) || 0) - (Number(b[5]) || 0); })
    .map(function (r) { return { name: String(r[2]).trim(), price: String(r[3]).trim(), scope: String(r[4]).trim() }; });
}

function pricingLeadsSheet_(props) {
  const sh = ss_(props).getSheetByName(PRICE_LEADS) || ss_(props).insertSheet(PRICE_LEADS);
  if (sh.getLastRow() === 0) {
    sh.appendRow(PRICE_LEADS_HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ss_(props) {
  const id = props.getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function verifyTurnstile_(token, props) {
  const secret = props.getProperty('TURNSTILE_SECRET');
  if (!secret || !token) return false;
  const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post',
    payload: { secret: secret, response: String(token) },
    muteHttpExceptions: true,
  });
  const out = JSON.parse(res.getContentText() || '{}');
  const allowed = (props.getProperty('ALLOWED_HOSTNAMES') || 'grintecs.com,www.grintecs.com,localhost')
    .split(',')
    .map(function (h) { return h.trim(); });
  return out.success === true && allowed.indexOf(out.hostname) !== -1;
}

function sheet_(props) {
  const id = props.getProperty('SHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  const name = props.getProperty('SHEET_NAME') || SHEET_NAME;
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function clean_(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

// Cegah formula injection: teks yang diawali = + - @ tidak boleh dieksekusi sebagai rumus di Sheet.
function safeCell_(v) {
  return typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
