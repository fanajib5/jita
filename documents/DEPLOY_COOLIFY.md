# Panduan Deploy JITA ke Coolify

Panduan ini melengkapi `HANDOVER_JITA.md` (cPanel) untuk deployment ke instance Coolify milik sendiri, menggunakan Docker Compose.

## Arsitektur Stack

```text
                    Coolify (Traefik proxy + SSL)
                              │
                    https://<domain-kamu>
                              │
                 ┌────────────┴────────────┐
                 │   frontend (nginx:80)   │  ← build Vite, serve dist + SPA fallback
                 │   proxy /api → backend  │
                 └────────────┬────────────┘
                              │ (jaringan internal Docker)
                 ┌────────────┴────────────┐
                 │  backend (node:3000)    │  ← server.js, schema auto-verify saat start
                 └────────────┬────────────┘
                              │
                 ┌────────────┴────────────┐
                 │  mysql:8.0 (volume)     │  ← data persisten di volume mysql-data
                 └─────────────────────────┘
```

Satu stack `docker-compose.yaml` di root repo berisi ketiganya. Upload pengguna (KTP, sertifikat) disimpan di volume `backend-uploads`.

## Langkah Deploy di Coolify

1. **Push repo ini** ke Git remote yang bisa diakses Coolify (GitHub/GitLab/Gitea, atau URL repo publik).
2. Di dashboard Coolify: **+ New Resource → Docker Compose** → pilih repo & branch (mis. `main`).
3. Buka tab **Environment Variables**, isi minimal:
   | Variabel | Contoh |
   |---|---|
   | `MYSQL_ROOT_PASSWORD` | password root MySQL (acak) |
   | `MYSQL_PASSWORD` | password user `jita` (acak) |
   | `SESSION_SECRET` | string acak panjang |
   | `ALLOWED_ORIGINS` | `https://jita.domainkamu.com` |
   | `VITE_BASE_PATH` | `/` |
   (Lihat `.env.example` untuk daftar lengkap termasuk SMTP/webhook opsional.)
4. Set **domain** untuk service `frontend` di layar Compose (mis. `https://jita.domainkamu.com`) — Coolify akan otomatis memasang SSL Let's Encrypt. Tidak perlu mengekspos `backend`/`mysql` ke publik.
5. Klik **Deploy**. Build pertama memakan waktu beberapa menit (npm ci + vite build + image MySQL).
6. **Seed data awal (opsional):** buka terminal container `backend` dari Coolify (layar resource → Terminal) lalu jalankan `npm run seed`.
7. Buka `https://jita.domainkamu.com` — login lokal (`/api/auth/login`) atau SSO.

## Quirks & Catatan Penting

- **SSO Pusat Es Kampus:** callback yang terdaftar di Pusat Es saat ini mengarah ke `https://ijon-technology.com/api/sso/login`. Setelah pindah domain, callback tersebut harus diupdate di sisi Pusat Es, kalau tidak SSO akan me-redirect ke domain lama. Login lokal (email/password) tetap berfungsi normal.
- **Base path:** build frontend default memakai `/` di Coolify. Pola lama cPanel (`/jita/`) tetap dipakai kalau `VITE_BASE_PATH` tidak diset saat build lokal, jadi kedua target deploy tidak saling merusak.
- **Same-origin API:** frontend memanggil API via proxy `/api` di `nginx.conf`, jadi tidak ada masalah CORS dan cookie session (`sameSite: lax`) tetap terkirim. `ALLOWED_ORIGINS` hanya relevan bila API dipanggil lintas domain.
- **Trust proxy:** `server.js` sudah diset `app.set('trust proxy', 1)` agar rate-limit & IP asli benar di belakang Traefik.
- **Health check:** `GET /api/health` memverifikasi koneksi DB; dipakai Docker healthcheck container backend.
- **Uploads:** file upload ada di volume `backend-uploads` — aman terhadap redeploy, tapi masukkan ke strategi backup Coolify (bersama volume `mysql-data`).
- **Perubahan kode:** push ke branch yang dipantau Coolify lalu **Redeploy** (atau aktifkan webhook auto-deploy). Volume database tidak terpengaruh saat redeploy.
- **Local dev tanpa Docker** tetap seperti di `HANDOVER_JITA.md` bagian 4 (`npm run dev` di root dan `jita-backend`).
