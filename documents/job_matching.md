# 🤝 Dokumentasi Teknis: Two-Way Job Matching Engine (JITA)

Dokumen ini menjelaskan arsitektur, aturan bisnis, implementasi teknis, skema database, serta mekanisme matching (pencocokan kerja dua arah) yang ada di platform JITA.

---

## 1. Konsep & Filosofi Bisnis

Job Matching di JITA mengacu pada **Pilar 3 SRS (CV Builder & Job Matching)**. Berbeda dengan job board umum yang hanya bersifat pasif (satu arah), JITA mengadopsi model **Two-Way Matching**:

```text
       ┌────────────────────────────────────────────────────────┐
       │                   JITA Matching Engine                 │
       └────────────────────────────────────────────────────────┘
                 ▲                                    ▲
                 │ (1) Proactive Apply                │ (2) Talent Scout
                 │                                    │
       ┌─────────┴──────────┐               ┌─────────┴──────────┐
       │  Talenta / Student │               │ Perusahaan / Mitra │
       │  (Indonesia)       │               │ (Jepang / Industri)│
       └────────────────────┘               └────────────────────┘
```

1. **Candidate-Driven (Apply):** Talenta secara mandiri mencari lowongan yang sesuai kualifikasi mereka dan mengirimkan lamaran beserta Rirekisho (CV standar Jepang).
2. **Company-Driven (Scout):** Perusahaan mencari database talenta terverifikasi dan mengirimkan undangan interview (*scout request*) langsung ke kandidat.

---

## 2. Status Algoritma Saat Ini: Rule-Based & Constraint Filtering

Implementasi saat ini berjalan secara deterministik menggunakan kombinasi **Database Constraints, Hard Filtering (Eligibility Gate), dan Substring Matching**.

### A. Alur & Algoritma Sisi Perusahaan (Scouting)

* **Endpoint Pencarian:** `GET /api/jobs/scout-candidates` (atau `/api/scout/candidates`)
* **Endpoint Eksekusi Scout:** `POST /api/jobs/:id/scout` (atau `/api/scout`)

#### Algoritma Filtering:
1. **Hard Eligibility Gate (Kualifikasi Mutlak):**
   * Role pengguna harus `student`.
   * Akun belum dihapus (`deleted_at IS NULL`).
   * **Wajib Terverifikasi:** `profile_verified = 1`. Kandidat yang belum diverifikasi oleh admin JITA (validasi KTP & track record) tidak akan pernah muncul di daftar scout maupun bisa dikirimi undangan.
2. **Kriteria Pencocokan (Filtering Parameters):**
   * **Bahasa Jepang (JLPT):** Mencocokkan level JLPT (`jlpt_level = ?`).
   * **Spesialisasi:** Pencocokan substring SQL (`specialization LIKE %?%`).
3. **Pencegahan Duplikasi & State Integrity:**
   * Sebelum mengirim scout, sistem memeriksa tabel `job_applications` dengan `job_id`, `candidateId`, dan `type = 'scout'`.
   * Jika sudah ada relasi aktif, API mengembalikan HTTP `409 Conflict`.
   * Status awal lamaran otomatis menjadi `shortlisted`.
   * Sistem otomatis men-trigger notifikasi email/in-app ke kandidat via template `scout_received`.

---

### B. Alur & Algoritma Sisi Kandidat (Job Board & Apply)

* **Endpoint Pencarian:** `GET /api/jobs`
* **Endpoint Eksekusi Lamaran:** `POST /api/jobs/:id/apply`

#### Algoritma Filtering:
1. **Ketersediaan Lowongan:**
   * Status aktif (`is_active = 1`).
   * Belum dihapus (`deleted_at IS NULL`).
2. **Kriteria Pencocokan:**
   * **Kata Kunci & Spesialisasi:** `(jp.title LIKE %?% OR jp.specialization LIKE %?%)`.
   * **Syarat Minimum Bahasa:** `jp.min_jlpt = ?`.
   * **Lokasi Kerja:** `jp.location LIKE %?%` (Prefektur di Jepang / Wilayah kerja).
3. **Validasi Lamaran:**
   * Memastikan lowongan masih aktif sebelum submit.
   * Memvalidasi keunikan lamaran `(job_id, user_id, 'apply')` untuk mencegah spam lamaran ganda (HTTP `409 Conflict`).
   * Status awal lamaran dicatat sebagai `submitted`.
   * Sistem men-trigger notifikasi ke kontak perusahaan pembuat lowongan.

---

## 3. Skema Data & Relasi (Database Schema)

Relasi job matching dimodelkan pada 3 entitas utama di MySQL:

```text
┌─────────────────┐       1:N       ┌─────────────────┐
│   companies     ├────────────────►│  job_postings   │
└─────────────────┘                 └────────┬────────┘
                                             │ 1:N
                                             ▼
┌─────────────────┐       1:N       ┌─────────────────┐
│     users       ├────────────────►│job_applications│
└─────────────────┘                 └─────────────────┘
```

### Tabel `job_postings`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | Primary Key |
| `company_id` | `INT` | Foreign Key ke `companies(id)` |
| `title` / `title_jp` | `VARCHAR(255)` | Judul posisi (Romaji/ID & Kanji) |
| `specialization` | `VARCHAR(500)` | Kategori/keahlian (misal: Manufaktur, IT, CNC) |
| `min_jlpt` | `VARCHAR(10)` | Syarat bahasa: N5, N4, N3, N2, N1 |
| `location` | `VARCHAR(255)` | Lokasi kerja (contoh: Tokyo, Osaka, Aichi) |
| `is_active` | `TINYINT(1)` | Flag status rekrutmen |

### Tabel `job_applications`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | Primary Key |
| `job_id` | `INT` | Foreign Key ke `job_postings(id)` |
| `user_id` | `INT` | Foreign Key ke `users(id)` (kandidat) |
| `type` | `ENUM('apply','scout')` | Asal inisiatif: Apply (talenta) atau Scout (mitra) |
| `status` | `ENUM(...)` | `submitted`, `shortlisted`, `rejected`, `accepted`, `withdrawn` |
| `message` | `TEXT` | Pesan pengantar lamaran / penawaran rekruter |
| `created_at` | `TIMESTAMP` | Waktu submit |

> **Constraint Integritas:**  
> `UNIQUE KEY uniq_job_user_type (job_id, user_id, type)` menjamin tidak terjadi duplikasi lamaran untuk kombinasi tipe yang sama.

---

## 4. Analisis Batasan & Roadmap Pengembangan

Algoritma sistem kini telah ditingkatkan ke **Fase 2 (Weighted Rule-Based Scoring & Ordinal Comparison)**:

```text
Fase 1 (Awal)              Fase 2 (Terimplementasi)       Fase 3 (Mendatang)
┌──────────────────────┐    ┌───────────────────────────┐  ┌───────────────────────────┐
│ Deterministic SQL    │───►│ Weighted Rule-Based       │─►│ Semantic AI / Vector      │
│ Exact String Match   │    │ Scoring (0-100%) + Ordinal│  │ Embeddings (Postgres+pgv) │
└──────────────────────┘    └───────────────────────────┘  └───────────────────────────┘
```

### Implementasi Algoritma Matching (Fase 2):

1. **Hierarki Level JLPT (Ordinal Comparison):**
   * Peringkat ordinal: `N1=5 > N2=4 > N3=3 > N4=2 > N5=1`.
   * **Sisi Siswa (`GET /api/jobs`):** Ketika talenta memfilter level kemampuan bahasa, query mengecek `FIELD(jp.min_jlpt, 'N5','N4','N3','N2','N1') <= FIELD(?, 'N5','N4','N3','N2','N1')`, sehingga talenta berkualifikasi tinggi (misal N3) tetap dapat melihat lowongan yang mensyaratkan N4 atau N5.
   * **Sisi Rekruter (`GET /api/jobs/scout-candidates`):** Rekruter memfilter kandidat dengan `FIELD(jlpt_level, ...) >= FIELD(?, ...)`, sehingga memfilter minimal N4 otomatis menyertakan talenta dengan N4, N3, N2, dan N1.

2. **Weighted Rule-Based Scoring (0–100%):**
   * **Tingkat Bahasa (Bobot 35%):** Nilai 100% jika level kandidat $\ge$ syarat lowongan, 50% jika 1 tingkat di bawah, 10% jika lebih rendah.
   * **Irisan Spesialisasi / Skills (Bobot 45%):** Dihitung menggunakan **Jaccard Similarity** kata kunci antara himpunan keterampilan kandidat dan requirement lowongan:
     $$\text{Similarity} = \frac{|A \cap B|}{|A \cup B|}$$
   * **Preferensi Lokasi (Bobot 20%):** 100% jika kota/lokasi cocok, 70% jika berbeda prefektur/relokasi Jepang.
   * **Tampilan Visual:** Ditampilkan dalam bentuk badge `⚡ Match XX%` pada kartu lowongan (sisi talenta) dan kartu kandidat (sisi corporate & dashboard).

3. **Semantic AI Matching (Fase 3 - Future Roadmap):**
   * Menggunakan model text-embedding multilingual (misalnya OpenAI `text-embedding-3-small` atau model open-source) untuk meng-embed profil bio/track record kandidat dan requirement lowongan, lalu menghitung Cosine Similarity.

---

## 5. React Data Integration (Frontend Layer)

Sesuai task Dev B *"React Data Integration"* di `timeline_schedule.md`, seluruh komponen frontend berikut sudah berfungsi dan terhubung ke API backend.

### Halaman & Komponen Utama

| Halaman | Path File | Pengguna | Fungsi |
|---|---|---|---|
| **Bursa Lowongan Kerja** | `src/pages/student/JobsBoardPage.tsx` | Student/Talenta | Browse lowongan, filter JLPT/spesialisasi/lokasi, kirim lamaran Apply |
| **Scout Kandidat** | `src/pages/corporate/ScoutPage.tsx` | Corporate/Mitra | Cari kandidat terverifikasi, filter JLPT/spesialisasi, kirim undangan Scout |
| **Corporate Dashboard** | `src/pages/corporate/CorporateDashboard.tsx` | Corporate/Mitra | Ringkasan statistik + banner Smart Talent Matching + preview daftar kandidat |
| **Kelola Lowongan** | `src/pages/corporate/CorporateJobsPage.tsx` | Corporate/Mitra | CRUD lowongan kerja (buat, edit status, hapus) |

### API Hooks (TanStack Query)

Semua komunikasi ke backend dikelola via hooks di `src/api/hooks.ts`:

| Hook | Deskripsi |
|---|---|
| `useJobs(filters?)` | Fetch daftar lowongan aktif dengan parameter filter & pagination |
| `useScoutCandidates(filters?)` | Fetch daftar kandidat `profile_verified = 1` untuk keperluan scouting |
| `useMyApplications()` | Fetch riwayat lamaran kandidat yang sedang login |
| `useApplyJob()` | Mutation: submit lamaran ke endpoint `POST /api/jobs/:id/apply` |

API client utama ada di `src/api/jobs.ts` (termasuk method `jobApi.scout(jobId, candidateId, message)`).

### Alur State Management di Frontend

**Sisi Kandidat (JobsBoardPage):**
1. Filter form (spesialisasi, JLPT, lokasi) dikontrol via local state.
2. Saat submit filter, `activeFilter` diupdate → TanStack Query otomatis refetch dengan parameter baru.
3. Pagination (`page`, `limit: 6`) dikelola di komponen, dikirim sebagai query param ke backend.
4. Tombol *"Lamar"* memanggil `applyMutation.mutate({ jobId })` dan menampilkan alert inline sukses/error.

**Sisi Corporate (ScoutPage):**
1. Filter (spesialisasi, minJlpt) dikirim ke backend sebagai query param via `useScoutCandidates(appliedFilter)` — filtering dilakukan **di sisi server**, bukan di klien.
2. Tombol *"Request Scout"* membuka `ScoutModal` → form pilih lowongan + tulis pesan → submit via `jobApi.scout()`.
3. Guard di frontend: jika perusahaan belum punya lowongan aktif, scout diblokir sebelum modal terbuka (menggunakan `activeJobs.length === 0`).

