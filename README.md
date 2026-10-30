# Website GRINTEC

Company profile GRINTEC, *Securing Future Transformation*.

- **Stack:** Astro 7 (output static) + Tailwind CSS 4 (`@tailwindcss/vite`) + Decap CMS 3.16.3
- **Bahasa:** English (default, `/en/`) dan Indonesia (`/id/`)
- **Hosting:** GitHub Pages lewat GitHub Actions, domain `https://grintecs.com` (file `public/CNAME`)
- **Repo:** `grintopsglobal/grintecs-webiste`

## Menjalankan di komputer lokal

Butuh Node.js 22.22 atau lebih baru.

```bash
npm install
npm run dev        # http://localhost:4321/
npm run build      # hasil di dist/
npm run preview    # menyajikan dist/ seperti di produksi
```

Root `/` mengarah ke `/en/`.

## Memakai CMS secara lokal

Jalankan dua terminal:

```bash
npm run dev
npm run cms        # sama dengan: npx decap-server (port 8081)
```

Buka `http://localhost:4321/admin/` lalu klik **Login**. Di localhost, Decap memakai `decap-server` dan langsung menulis ke file di `src/content/` dan `public/uploads/`, tanpa login GitHub.

## Struktur folder

```
.github/workflows/deploy.yml   Build + deploy ke GitHub Pages setiap push ke main
oauth-proxy/                   Cloudflare Worker untuk login GitHub di Decap
apps-script/                   Penerima form kontak (Google Apps Script -> Sheet, verifikasi Turnstile)
public/admin/                  Decap CMS (index.html, config.yml, preview.css)
public/images/brand/           Logo (grintec-logo.png, versi putih, versi HD, mark)
public/uploads/                Media dari CMS (video & poster hero, gambar OG)
src/content.config.ts          Schema Zod semua collection
src/content/<collection>/id|en Konten per bahasa
src/i18n/ui.ts                 Teks UI statis (menu, tombol, label form) + helper t()
src/lib/url.ts                 withBase(): semua path internal & media lewat sini
src/components/                Header, MegaMenu, MobileNav, LanguageSwitcher, HeroVideo, ...
src/pages/[lang]/              Semua halaman per bahasa
```

## Deploy ke GitHub Pages

1. Push project ini ke branch `main` di `github.com/grintopsglobal/grintecs-webiste`.
2. Di GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. Setiap push ke `main` (termasuk commit dari CMS) menjalankan `.github/workflows/deploy.yml`. Situs tersedia di `https://grintecs.com/`.

## Login CMS di situs live (GitHub OAuth + Cloudflare Worker)

GitHub Pages tidak bisa menjalankan server OAuth, jadi login Decap memakai Worker kecil di `oauth-proxy/`.

**1. Deploy Worker** (butuh akun Cloudflare gratis):

```bash
cd oauth-proxy
npx wrangler login
npx wrangler deploy
```

Catat URL-nya, misalnya `https://grintec-decap-oauth.grintopsglobal.workers.dev`.

**2. Buat GitHub OAuth App** di *GitHub > Settings > Developer settings > OAuth Apps > New OAuth App* (sebaiknya dari akun organisasi `grintopsglobal`):

- Homepage URL: `https://grintecs.com/`
- Authorization callback URL: `https://grintec-decap-oauth.grintopsglobal.workers.dev/callback`

Salin **Client ID** lalu buat **Client secret**.

**3. Simpan kredensial di Worker:**

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Jika domain situs berubah, sesuaikan `ALLOWED_ORIGINS` di `oauth-proxy/wrangler.toml` lalu `npx wrangler deploy` lagi. Token hanya dikirim ke origin di daftar itu.

**4. Isi `base_url`** di `public/admin/config.yml` dengan URL Worker, commit, dan push.

Editor perlu akses write ke repo agar bisa menyimpan. Cek cepat Worker tanpa dependensi: `node oauth-proxy/test.mjs`.

## Form kontak ke Google Sheets (Apps Script + Turnstile)

Alurnya: browser, lalu Google Apps Script (`apps-script/Code.gs`), yang memverifikasi token Cloudflare Turnstile ke `siteverify`, lalu menulis satu baris ke Google Sheet yang sudah ada (berdasarkan `SHEET_ID`). Tanpa token Turnstile yang valid untuk hostname yang diizinkan, data ditolak dan tidak ditulis.

**1. Buat widget Turnstile.** Cloudflare dashboard > Turnstile > Add widget. Hostname: `grintecs.com` (tambahkan `www.grintecs.com` bila dipakai). Mode: Managed. Catat **Site key** (publik) dan **Secret key** (rahasia).

**2. Siapkan Google Sheet dan Apps Script.**

1. Buka https://script.google.com > New project. Hapus isi `Code.gs` bawaan, lalu tempel isi `apps-script/Code.gs` dari repo ini. Simpan.
2. Ambil ID Google Sheet yang sudah ada dari URL-nya: `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`. Akun yang men-deploy script harus punya akses edit ke Sheet itu.
3. Project Settings (ikon gerigi) > Script properties > Add script property:
   - `TURNSTILE_SECRET`: secret key Turnstile (wajib)
   - `SHEET_ID`: ID Sheet dari langkah 2 (wajib untuk project terpisah seperti ini)
   - `SHEET_NAME`: nama tab tujuan, default `Leads` (opsional; tab dibuat otomatis bila belum ada)
   - `NOTIFY_EMAIL`: misalnya `info@grintecs.com`, untuk menerima email tiap ada pesan (opsional)
   - `ALLOWED_HOSTNAMES`: default `grintecs.com,www.grintecs.com,localhost` (opsional)
4. Deploy > New deployment > tipe **Web app**. Execute as: **Me**. Who has access: **Anyone**. Klik Deploy dan izinkan akses yang diminta.
5. Salin URL web app (berakhiran `/exec`). Buka URL itu di browser: harus muncul `{"ok":true}`.

Bila tab tujuan belum ada atau masih kosong, tab dan baris judulnya (Waktu, Bahasa, Nama, Perusahaan, Email, Telepon, Layanan, Pesan, Halaman) dibuat otomatis saat pesan pertama masuk. Data di tab lain tidak disentuh.

**3. Isi di CMS.** Pengaturan Situs > Formulir kontak: isi *URL web app Google Apps Script* dan *Cloudflare Turnstile site key*, lalu Publish.

**Mengubah `Code.gs` nanti:** setelah menyimpan, buka Deploy > Manage deployments > Edit > Version: New version > Deploy. URL `/exec` tetap sama.

Catatan teknis:
- Form mengirim JSON sebagai `text/plain` tanpa header custom, karena Apps Script tidak melayani preflight CORS (`OPTIONS`).
- Isi yang diawali `=`, `+`, `-`, atau `@` disimpan dengan awalan `'` agar tidak dieksekusi sebagai rumus. Di Sheets tanda itu tidak terlihat.
- Cek logika tanpa dependensi: `node apps-script/test.mjs`.
- Uji lokal bisa memakai kunci uji resmi Turnstile: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`. Kunci uji melaporkan hostname `example.com`, jadi tambahkan `example.com` ke `ALLOWED_HOSTNAMES` selama pengujian saja.

## SEO & tracking (Search Console, GTM, GA4, Meta Pixel)

Semua diisi lewat CMS: **Pengaturan Situs > SEO & Tracking**. Field yang kosong tidak memuat apa pun.

| Field | Isi | Dari mana |
|---|---|---|
| Google Search Console | hanya kode di `content="..."` | Search Console > Add property (URL prefix `https://grintecs.com/`) > HTML tag |
| Google Tag Manager ID | `GTM-XXXXXXX` | tagmanager.google.com |
| Google Analytics 4 ID | `G-XXXXXXXXXX` | GA4 > Admin > Data streams |
| Meta Pixel ID | angka saja | Meta Events Manager |
| Meta tag tambahan | pasangan `name` / `content` | mis. `msvalidate.01` (Bing), `facebook-domain-verification` |

- Pilih satu jalur: **GTM saja** (GA4 dan Meta Pixel dipasang sebagai tag di dalam GTM), atau GA4/Pixel langsung tanpa GTM. Jangan dua-duanya, nanti page view tercatat ganda.
- Format ID dikunci: build gagal dengan pesan jelas bila formatnya salah, sehingga isian tidak bisa menyisipkan script lain.
- Setelah Search Console terverifikasi, kirim `https://grintecs.com/sitemap.xml` di menu Sitemaps (alias dari `sitemap-index.xml` yang dibuat Astro).
- Untuk pengunjung dari Uni Eropa, GA4 dan Meta Pixel umumnya memerlukan persetujuan cookie (GDPR). Situs belum memiliki banner consent.

## Mengganti video hero

Lewat CMS: **Halaman: Beranda > Hero**, isi *Video WebM*, *Video MP4 (fallback)*, dan *Poster*. Isi untuk ID dan EN boleh berbeda.

Manual: taruh file di `public/uploads/`, lalu ubah `hero.video`, `hero.videoMp4`, dan `hero.poster` di `src/content/pages/id/home.yml` dan `en/home.yml`.

Rekomendasi: di bawah 5 MB, 1080p, 10 sampai 20 detik, tanpa audio, dan bisa di-loop. Poster sebaiknya diambil dari frame video itu sendiri.

```bash
ffmpeg -i video-asli.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 36 -vf scale=1920:-2 public/uploads/hero.webm
ffmpeg -i video-asli.mp4 -an -c:v libx264 -crf 26 -movflags +faststart -vf scale=1920:-2 public/uploads/hero.mp4
ffmpeg -ss 3 -i video-asli.mp4 -frames:v 1 -q:v 4 public/uploads/hero-poster.jpg
```

Video yang terpasang sekarang (`hero.webm` / `hero.mp4`) adalah **placeholder abstrak** buatan ffmpeg dengan warna brand (aliran kode heksadesimal dan garis data). Ganti dengan footage asli bila sudah ada.

Perilaku: poster tampil lebih dulu (aman untuk LCP). Video baru dimuat lewat script jika pengunjung **tidak** mengaktifkan *prefers-reduced-motion* dan tidak memakai mode hemat data.

## Menambah layanan, solusi, industri, atau artikel

**Lewat CMS:** buka koleksinya, klik tombol tambah, lalu isi kedua bahasa (panel kiri ID, kanan EN). *Slug URL* sama untuk kedua bahasa. Field *Urutan* menentukan posisi di menu dan grid.

**Manual:** buat file dengan nama yang sama di kedua folder bahasa, misalnya `src/content/services/id/nama-layanan.md` dan `src/content/services/en/nama-layanan.md`. Contoh frontmatter ada di file yang sudah ada. Field yang wajib bisa dilihat di `src/content.config.ts`. Build akan gagal dengan pesan jelas bila ada field yang salah.

- Ilustrasi header layanan (`heroImage`) diambil dari company profile 2026, disimpan di `public/uploads/services/<slug>.webp` (1600px, rasio sekitar 8:5, teks di gambar sudah dipotong). Gambar yang sama dipakai sebagai gambar share (OG) halaman itu. Ganti lewat CMS di field *Ilustrasi header*.
- Ikon dipilih dari set sendiri di `src/components/Icon.astro`. Daftar yang sama ada di `public/admin/config.yml` (`_icons`).
- Kategori artikel ada di `src/lib/categories.ts`. Jika menambah kategori, perbarui juga label di `src/i18n/ui.ts` dan opsi di `config.yml`.
- Artikel dengan `draft: true` tidak tampil.
- Jika terjemahan satu bahasa belum ada, language switcher mengarah ke halaman daftar bahasa tersebut, bukan 404.

### Sub-layanan (mis. Phishing Simulation di bawah Cyber Security)

Koleksi **Sub-layanan** di CMS (`src/content/subservices/`). Pilih *Layanan induk*; sub-layanan tampil sebagai kartu di halaman layanan itu dan punya landing page sendiri di `/services/<induk>/<slug>/`. Tidak masuk mega menu atau footer. Field: ringkasan, tagline, alur kerja, yang Anda terima, model harga, FAQ, label tombol CTA (tombolnya membuka form kontak dengan layanan sudah terpilih).

- Ilustrasi di `public/uploads/subservices/<slug>.webp`, dipotong dari ilustrasi keamanan siber di company profile 2026. Ganti lewat CMS bila ada ilustrasi khusus (rasio 8:5, latar terang).
- Konten **Phishing Simulation**, **VAPT**, dan **Application Security & Hardening** dari Pak Dwi (30 Okt 2026). **Security Awareness & Training** adalah draft yang perlu direview di CMS (deskripsi, harga, FAQ).

## Domain

Situs memakai `grintecs.com` (`public/CNAME`, `SITE` di `astro.config.mjs`, `site_url` di `public/admin/config.yml`, dan `ALLOWED_ORIGINS` di Worker). DNS apex `grintecs.com` sudah mengarah ke GitHub Pages.

Untuk memakai `www.grintecs.com`: ubah keempat tempat di atas ke `www.grintecs.com`, lalu arahkan DNS `www` (CNAME) ke `grintopsglobal.github.io`. Saat ini `www` masih mengarah ke Cloudflare.

Path media di konten tidak perlu diubah karena disimpan sebagai `/uploads/...`, dan `withBase()` tetap aman bila suatu saat dipakai base path lagi.

## Data yang masih perlu diisi

Semua placeholder ditandai `[REAL DATA]` dan tampil di situs sampai diganti:

| Data | Lokasi di CMS |
|---|---|
| Nomor WhatsApp (jika ada) | Pengaturan Situs > WhatsApp |
| URL Apps Script + site key Turnstile | Pengaturan Situs > Formulir kontak (lihat bagian di atas) |
| Sejarah perusahaan (section tersembunyi selama kosong) | Halaman: Tentang Kami > Sejarah |
| Profil tim (section tersembunyi sampai ada anggota) | Halaman: Tentang Kami > Tim |
| Angka statistik (beserta sumbernya) | Halaman: Beranda > Statistik |

Section statistik sengaja **disembunyikan** sampai ada angka asli. Tidak ada testimoni, logo klien, atau angka yang dikarang. Visi, misi, nilai, deskripsi layanan, dan tiga artikel contoh adalah draft yang perlu ditinjau tim GRINTEC.

Selama URL Apps Script atau site key Turnstile belum diisi, tombol kirim dinonaktifkan dan pengunjung diarahkan ke kontak alternatif.

## Keputusan teknis dan alasannya

- **Warna tombol dan link memakai `#007840`, bukan `#00A048`.** Teks putih di atas `#00A048` hanya 3.43:1 dan gagal WCAG AA (4.5:1). `#007840` memberi 5.58:1. `#00A048` tetap dipakai untuk ikon, garis, dan motif (batas non-text 3:1 terpenuhi).
- **Media CMS di `public/uploads/` dan dirender dengan `<img>` biasa**, bukan `astro:assets`. Decap menyimpan path absolut publik (`/uploads/x.jpg`), sedangkan optimasi `astro:assets` butuh path relatif di `src/`. Supaya editor tidak perlu memikirkan itu, gambar CMS dipakai apa adanya dengan `width`/`height`, `loading="lazy"` di bawah fold, dan `withBase()`. Unggah gambar dalam ukuran wajar (lebar sekitar 1600px, JPG/WebP).
- **Halaman dan pengaturan memakai folder collection dengan `filter`.** Collection bertipe `files` di Decap hanya mendukung i18n `single_file`, sedangkan struktur yang diminta adalah `<collection>/<bahasa>/<file>`.
- **Base path di body markdown ditambahkan oleh `bodyHtml()`** (`src/lib/url.ts`). Astro 7 memakai prosesor markdown Sätteri, dan plugin rehype membutuhkan dependensi tambahan.
- **Video hero dimuat lewat script, bukan atribut `autoplay`**, supaya *prefers-reduced-motion* benar-benar mencegah video terunduh dan diputar.
- **Tema terang tetap (tanpa dark mode)**, karena wordmark logo berwarna hitam dan dirancang untuk latar terang.
- **Font:** Plus Jakarta Sans untuk heading (sans geometris yang dekat dengan wordmark, dan dirancang untuk identitas Jakarta) dan Inter untuk body (sesuai brief).
- **Ikon custom** dengan ujung garis siku, agar senada dengan potongan tegas simbol logo dan tidak memakai set ikon generik.
- **Satu route listing Insights** (`[...path].astro`) untuk halaman, kategori, dan pagination, sehingga semua kombinasi ter-generate statis untuk GitHub Pages.
