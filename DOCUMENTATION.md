# Rise Fit Gym - Dokumentasi Proyek

Sistem manajemen member gym sederhana yang dibangun dengan **Next.js 16**, **React 19**, dan **Supabase** sebagai database & authentication backend.

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Struktur Proyek](#struktur-proyek)
4. [Database Schema](#database-schema)
5. [Fitur Utama](#fitur-utama)
6. [Authentication & Authorization](#authentication--authorization)
7. [Environment Variables](#environment-variables)
8. [Instalasi & Menjalankan](#instalasi--menjalankan)
9. [Deployment](#deployment)
10. [Development Guide](#development-guide)

---

## Overview

**Rise Fit Gym** adalah aplikasi admin panel untuk mengelola member gym. Aplikasi ini menyediakan:
- Daftar member dengan informasi membership (paket, tanggal expired, status)
- Tambah member baru beserta membership pertamanya
- Perpanjang membership member yang sudah ada
- Autentikasi dengan Supabase Auth (middleware protection)

---

## Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | Next.js | 16.4.0 (App Router) |
| React | React | 19.3.0 |
| Database & Auth | Supabase | 2.117.3 |
| SSR Auth | @supabase/ssr | 0.12.7 |
| Styling | Tailwind CSS | 4.x (via @tailwindcss/turbopack) |
| Linting | ESLint | 9.x + eslint-config-next |
| Compiler | React Compiler (babel-plugin-react-compiler) | 1.0.0 |

---

## Struktur Proyek

```
rise-fit-gym/
├── public/                     # Static assets
│   ├── window.svg
│   ├── vercel.svg
│   ├── next.svg
│   ├── globe.svg
│   └── file.svg
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Global styles + Tailwind import
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Home redirect → /member
│   │   ├── member/
│   │   │   ├── page.js         # Daftar member (Server Component)
│   │   │   ├── baru/
│   │   │   │   └── page.js     # Form tambah member baru (Server Action)
│   │   │   └── [id]/
│   │   │       └── perpanjang/
│   │   │           └── page.js # Form perpanjang membership (Server Action)
│   ├── components/
│   │   └── LogoutButton.js     # Client component untuk logout
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.js       # Supabase client (browser)
│   │       └── server.js       # Supabase client (server/SSR)
│   └── proxy.js                # Middleware auth protection
├── package.json
├── next.config.mjs
├── eslint.config.mjs
├── jsconfig.json
└── README.md
```

---

## Database Schema

Tabel yang dibutuhkan di Supabase (PostgreSQL):

### 1. `member`
```sql
CREATE TABLE member (
    id BIGSERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    no_hp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `membership`
```sql
CREATE TABLE membership (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT REFERENCES member(id) ON DELETE CASCADE,
    paket TEXT NOT NULL,                    -- 'Paket 1 bulan', 'Paket 3 bulan', dll
    tanggal_mulai DATE NOT NULL,
    tanggal_exp DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktif',   -- 'aktif' | 'selesai'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relasi
- 1 `member` memiliki banyak `membership` (one-to-many)
- `membership.member_id` → `member.id` (foreign key)

---

## Fitur Utama

### 1. Daftar Member (`/member`)
- Menampilkan tabel member dengan kolom: Nama, No. HP, Paket, Exp, Status
- Data diambil dengan join ke tabel `membership` (mengambil membership terbaru)
- Tombol "+ Member baru" → redirect ke `/member/baru`
- Tombol "perpanjang" per baris → redirect ke `/member/[id]/perpanjang`
- Tombol "Keluar" (LogoutButton) di header

### 2. Tambah Member Baru (`/member/baru`)
- Form: Nama (required), No. HP, Paket (dropdown 1/3/6/12 bulan), Tanggal mulai (required)
- **Server Action** `tambahMember`:
  1. Insert ke tabel `member` → dapatkan `id`
  2. Hitung `tanggal_exp` = `tanggal_mulai` + durasi bulan
  3. Insert ke tabel `membership` dengan `status: 'aktif'`
  4. Redirect ke `/member`

### 3. Perpanjang Membership (`/member/[id]/perpanjang`)
- Menampilkan nama member
- Default tanggal mulai:
  - Jika membership aktif & belum expired → pakai `tanggal_exp` lama
  - Jika sudah expired → pakai hari ini
- Form: Paket (dropdown), Tanggal mulai (required, pre-filled)
- **Server Action** `perpanjang`:
  1. Update semua membership lama member tersebut → `status: 'selesai'` (riwayat tetap tersimpan)
  2. Insert membership baru dengan `status: 'aktif'`
  3. Redirect ke `/member`

---

## Authentication & Authorization

### Middleware (`src/proxy.js`)
- Melindungi **semua route** kecuali `/login` dan static assets (`_next/static`, `_next/image`, `favicon.ico`)
- Jika user **belum login** & mengakses route selain `/login` → redirect ke `/login`
- Jika user **sudah login** & akses `/login` → tetap diizinkan (logic di middleware hanya cek `!user && !isLoginPage`)

### Supabase Clients

| File | Usage | Environment |
|------|-------|-------------|
| `src/lib/supabase/client.js` | Browser/client-side | `'use client'` components |
| `src/lib/supabase/server.js` | Server/SSR (Server Components, Server Actions, Middleware) | App Router server-side |

Keduanya menggunakan `@supabase/ssr` untuk cookie-based session handling.

### Logout (`src/components/LogoutButton.js`)
- Client component (`'use client'`)
- Memanggil `supabase.auth.signOut()`
- Redirect ke `/login` + `router.refresh()`

---

## Environment Variables

Buat file `.env.local` di root project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Catatan**: Variabel harus diawali `NEXT_PUBLIC_` karena digunakan di client-side (browser).

---

## Instalasi & Menjalankan

### Prasyarat
- Node.js 18+ (direkomendasikan 20+)
- npm / yarn / pnpm / bun
- Akun Supabase project

### Langkah-langkah

```bash
# 1. Clone / masuk ke direktori project
cd rise-fit-gym

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local  # lalu isi dengan kredensial Supabase

# 4. Jalankan development server
npm run dev
```

Akses di: **http://localhost:3000** → otomatis redirect ke `/member`

### Scripts Tersedia

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Development server dengan Turbopack |
| `npm run build` | Production build |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |

---

## Deployment

### Vercel (Recommended)
1. Push ke GitHub/GitLab/Bitbucket
2. Import project di Vercel
3. Tambahkan Environment Variables di Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Manual Build
```bash
npm run build
npm run start
```

---

## Development Guide

### Menambah Route Baru
1. Buat folder di `src/app/` (contoh: `src/app/laporan/page.js`)
2. Export default component (Server Component by default)
3. Gunakan `createClient()` dari `@/lib/supabase/server` untuk data fetching

### Server Actions
- Definiskan fungsi `async` dengan `'use server'` di dalam file page/component
- Gunakan di `form action={namaFungsi}`
- Bisa diakses langsung dari Server Component

### Styling
- Tailwind CSS v4 (import via `@import "tailwindcss"` di `globals.css`)
- Class utility-first, tidak perlu config file `tailwind.config.js`

### Type Safety
- Project menggunakan `jsconfig.json` (bukan TypeScript)
- Path alias: `@/*` → `src/*`

### React Compiler
- Aktif via `next.config.mjs`: `reactCompiler: true`
- Otomatis memoisasi component, mengurangi kebutuhan `useMemo`/`useCallback` manual

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Missing Supabase env vars" | Pastikan `.env.local` ada & variabel benar |
| Middleware redirect loop | Cek `NEXT_PUBLIC_SUPABASE_URL` valid & project Supabase aktif |
| Build error di Vercel | Pastikan env vars di-set di Vercel Dashboard |
| Data tidak muncul | Cek RLS policies di Supabase (pastikan `anon` role bisa `SELECT`) |

---

## Lisensi

Private project - Rise Fit Gym Admin Panel