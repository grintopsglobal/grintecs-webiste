---
title: "Lima pemeriksaan keamanan sebelum aplikasi go-live"
slug: "five-security-checks-before-go-live"
date: "2026-10-21T10:00:00+07:00"
author: "Tim GRINTEC"
category: "security"
tags: ["keamanan", "aplikasi", "go-live"]
cover: ""
excerpt: "Daftar periksa singkat yang bisa dijalankan tim sebelum aplikasi baru dibuka untuk pengguna."
draft: false
---

Tenggat go-live sering membuat pemeriksaan keamanan ditunda ke "fase berikutnya". Lima pemeriksaan berikut cukup ringan untuk dijalankan dalam beberapa hari dan menutup celah yang paling sering dimanfaatkan.

## 1. Autentikasi dan sesi

Pastikan akun admin memakai MFA, password disimpan dengan hashing yang kuat, dan sesi berakhir setelah tidak aktif. Coba juga apakah pengguna biasa bisa membuka halaman admin dengan menebak URL.

## 2. Rahasia tidak tersimpan di kode

API key, password database, dan token pihak ketiga harus disimpan di secret manager atau variabel lingkungan, bukan di repository. Periksa juga riwayat commit, karena rahasia yang pernah ter-commit tetap bisa ditemukan.

## 3. Dependensi diperiksa

Jalankan pemindaian kerentanan untuk library yang dipakai aplikasi. Perbarui yang punya celah kritis sebelum rilis, dan catat sisanya beserta rencana perbaikannya.

## 4. Log yang berguna

Login gagal, perubahan hak akses, dan error server harus tercatat di tempat yang tidak bisa dihapus oleh aplikasi itu sendiri. Pastikan log tidak memuat data pribadi yang tidak perlu.

## 5. Backup yang sudah dicoba dipulihkan

Backup yang belum pernah dipulihkan belum terbukti berfungsi. Lakukan satu kali pemulihan ke lingkungan terpisah dan catat berapa lama prosesnya.

## Kaitannya dengan regulasi

Regulasi pelindungan data seperti GDPR di Uni Eropa dan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi di Indonesia mewajibkan pengendali data menjaga keamanan data yang diprosesnya. Lima pemeriksaan di atas bukan pengganti penilaian kepatuhan lengkap, tetapi menjadi dasar yang baik untuk memulainya.
