# ⛩️ Dokumen Serah Terima Teknis (Handover) - JITA Project

Dokumen ini ditujukan kepada Tim Development (Frontend & Backend) untuk melanjutkan pengembangan platform JITA (Japan Industry Training Academy).

## 1. Arsitektur Sistem Saat Ini

Proyek ini dipisahkan menjadi dua bagian utama yang di-*hosting* di shared hosting (cPanel):

*   **Frontend (UI/UX):**
    *   **Teknologi:** React, TypeScript, Vite.
    *   **Lokasi di Server (cPanel):** `public_html/jita`
    *   **Base URL Production:** `https://ijon-technology.com/jita`
*   **Backend (API & Auth):**
    *   **Teknologi:** Node.js, Express, `mysql2/promise`.
    *   **Lokasi di Server (cPanel):** `jita-backend` (menggunakan cPanel Node.js Selector / Passenger).
    *   **Base URL API Production:** `https://ijon-technology.com/api`
*   **Database:**
    *   **Teknologi:** MySQL (via cPanel).

## 2. Alur Autentikasi (SSO Pusat Es Kampus)

Fitur utama yang sudah diimplementasikan adalah **SSO (Single Sign-On)** yang terintegrasi dengan portal Pusat Es Kampus, menggunakan JWT (RS256).

**Alur (End-to-End):**
1.  **Frontend:** Pengguna mengklik tombol SSO di halaman `/login` atau `/register`. Tombol ini akan melempar pengguna ke halaman login Pusat Es (beserta parameter `redirect_to`).
    *   *Kode relevan:* `src/pages/auth/Login.tsx` & `Register.tsx`
2.  **Pusat Es:** Pengguna *login* menggunakan kredensial Kampus/Pusat Es. Setelah sukses, server Pusat Es akan melakukan *redirect* kembali ke backend JITA sambil membawa Token JWT di parameter URL.
    *   *Callback URL JITA yang diset di es:* `https://ijon-technology.com/api/sso/login`
3.  **Backend JITA:** Endpoint `GET /api/sso/login` menerima `?token=...`.
4.  **Validasi Token:** Backend memvalidasi token tersebut secara aman dengan menembak API Pusat Es (`/wp-json/ice-sso/v1/validate`).
5.  **Auto-Provisioning (Zero Local Account):**
    *   Jika token valid, backend mengekstrak *Nama*, *Email*, dan *ICE UUID*.
    *   Jika email belum terdaftar di database MySQL JITA, backend otomatis membuatkan akun dengan *role* `student`.
    *   Jika sudah terdaftar, backend hanya melakukan *update session* dan `ice_uuid`.
6.  **Redirect Final:** Backend mengeset *cookie/session* dan melempar pengguna ke halaman *dashboard* JITA (`/jita/student`).
    *   *Kode relevan:* `jita-backend/server.js` (lihat *route* `/api/sso/login`)

## 3. Catatan Penting Konfigurasi cPanel (Backend)

Ada beberapa *quirks* (keunikan) pada server cPanel saat ini yang wajib diperhatikan oleh developer:

*   **Koneksi MySQL:** Karena ada karakter khusus (`!`) pada *password* database, penggunaan URL string `mysql://user:pass@host/db` sering terpotong/gagal *parsing* di lingkungan Node.js cPanel. Oleh karena itu, di `server.js`, koneksi di-*hardcode* sementara menggunakan **object konfigurasi eksplisit** (`host`, `user`, `password`, `database`) di dalam fungsi `mysql.createPool()`. Jika tim dev ingin mengubahnya ke file `.env`, pastikan URL-*encoded* (contoh: `!` menjadi `%21`).
*   **Routing Passenger (cPanel):** Aplikasi Node.js di cPanel di-*mount* pada `ijon-technology.com/api`. Namun, Express JS di `server.js` tidak akan membaca *prefix* `/api` tersebut di dalam `req.url`. Jadi, jika URL yang ditembak adalah `/api/sso/login`, Express akan membacanya sebagai `/sso/login`. Oleh karena itu, *routing* di `server.js` didefinisikan lengkap (contoh: `app.get('/api/sso/login', ...)` agar sinkron dengan konfigurasi internal cPanel).
*   **Bcrypt:** Module `bcrypt` standar sering gagal di-*compile* di shared hosting (CloudLinux) karena limit memori LVE. Gunakan `bcryptjs` (pure javascript) sebagai gantinya. Ini sudah diganti di `package.json` dan `server.js`.

## 4. Panduan Menjalankan di Localhost (Development)

Untuk tim dev yang ingin melanjutkan *coding* di laptop masing-masing:

### A. Setup Backend Lokal
1.  Buka terminal, masuk ke folder `jita-backend`.
2.  Jalankan `npm install`.
3.  Ubah pengaturan database di `server.js` (baris `mysql.createPool`) agar mengarah ke MySQL lokal Anda (XAMPP/MAMP/Laragon), atau buat file `.env` lokal.
4.  Jalankan `node server.js` atau `npm run dev` (jika ada nodemon). Server backend akan menyala di `http://localhost:3000`.

### B. Setup Frontend Lokal
1.  Buka terminal baru, pastikan berada di folder utama proyek (root `JITA`).
2.  Jalankan `npm install`.
3.  Jalankan `npm run dev`.
4.  Buka browser di URL yang diberikan oleh Vite (biasanya `http://localhost:5173/jita/`).
    *   *Note:* Karena `vite.config.ts` menggunakan `base: '/jita/'`, jangan lupa sertakan `/jita/` di akhir URL localhost.

## 5. Panduan Deployment ke Production (cPanel)

### A. Deploy Frontend
1.  Di folder root `JITA`, jalankan perintah: `npm run build`.
2.  Vite akan menghasilkan folder `dist`.
3.  Jadikan isi folder `dist` tersebut ke dalam bentuk `.zip`.
4.  Buka **File Manager cPanel**, masuk ke `public_html/jita`. Hapus file `index.html` dan folder `assets` lama.
5.  *Upload* file `.zip` tersebut dan *Extract*.

### B. Deploy Backend
1.  Jika ada perubahan pada `server.js` atau rute API, *upload* file tersebut ke folder `jita-backend` di cPanel.
2.  Jika ada penambahan *package* baru, Anda bisa mengedit `package.json` di cPanel, lalu klik tombol **Run NPM Install** di menu "Setup Node.js App".
3.  **Wajib:** Buka menu **Setup Node.js App** di cPanel dan klik tombol **Restart** pada aplikasi JITA agar perubahan server diaplikasikan.
