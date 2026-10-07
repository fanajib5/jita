# ⛩️ JITA — Japan Industry Training Academy

**JITA (Japan Industry Training Academy)** adalah ekosistem digital dua arah yang dirancang untuk menjembatani talenta profesional Indonesia dengan kebutuhan industri Jepang. Platform ini mencakup siklus karir lengkap: mulai dari pelatihan, sertifikasi, pelacakan riwayat aktivitas, verifikasi berkas, pembuatan CV standar Jepang (*Rirekisho*) secara otomatis, hingga *two-way job matching* (*Apply* & *Scout*).

---

## 🏛️ 4 Pilar Utama Sistem (Functional Requirements)

1. **Pilar 1: Autentikasi Terintegrasi & Profiling**
   - **Single Sign-On (SSO):** Terintegrasi langsung dengan **Pusat Es Kampus** via JWT (RS256) dengan kemampuan *auto-provisioning* akun.
   - **Profile Management:** Pengelolaan identitas talenta, sertifikasi JLPT (N5–N1), spesialisasi teknis, riwayat pendidikan, dan pengalaman kerja.

2. **Pilar 2: Track Record (Learning & Activities)**
   - **Calendar Integration:** Kalender jadwal kelas persiapan dan aktivitas bersama mitra industri Jepang.
   - **Learning Progress:** Pelacakan progres silabus dan modul kursus pelatihan bertahap.
   - **Document Vault & Admin Verification:** Penyimpanan terenkripsi dokumen pribadi (KTP, sertifikat, portofolio, transkrip) dengan verifikasi operasional staf admin.

3. **Pilar 3: CV Builder & Job Matching**
   - **Automated Japanese CV Builder:** Pembuatan Curriculum Vitae (*Rirekisho* / 履歴書) berstandar industri Jepang berformat PDF secara otomatis (menggunakan font Noto Sans CJK JP).
   - **Two-Way Job Matching:**
     - **Apply:** Kandidat melamar pekerjaan yang tersedia.
     - **Scout:** Perusahaan mitra Jepang (*Mitra Jinzai*) mencari dan mengundang kandidat yang telah lolos verifikasi berkas.

4. **Pilar 4: Operasional Admin & Notifikasi**
   - **Admin Verification Panel:** Dashboard verifikasi terpadu untuk persetujuan identitas (KTP) dan sertifikat kompetensi.
   - **Multi-channel Notifications:** Sistem notifikasi otomatis (Email via Nodemailer/SMTP, Webhook, dan In-App) untuk pembaruan status lamaran dan undangan *scout*.

---

## 🛠️ Tech Stack & Arsitektur

```text
                     JITA Architecture
                            │
             ┌──────────────┴──────────────┐
             │                             │
       Frontend (SPA)                Mobile Client
       React + Vite + TS             (Future Scope)
             │                             │
             └──────────────┬──────────────┘
                            │ (Typed HTTP Client)
                            ▼
                  OpenAPI Specification
                   (/api/docs Swagger)
                            │
                            ▼
                     Backend API
               Express.js + TypeScript
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       Modular Services              Async Queue
      (Business Logic)           (Notifications / Mail)
             │                             │
             ▼                             ▼
        Repositories                  Integrations
      (Kysely + MySQL)           (SSO ES, SMTP, Storage)
```

### Frontend (Client-Side)
- **Framework:** React 19, TypeScript, Vite 8
- **Routing:** React Router v7
- **Server State:** TanStack Query (React Query v5)
- **Table Data:** TanStack Table v8
- **Form Handling:** React Hook Form + Zod resolver
- **Design System:** Tailwind CSS v4, shadcn/ui design tokens, Lucide React
- **Testing:** Vitest, React Testing Library, jsdom, Playwright (E2E)

### Backend (Server-Side)
- **Runtime & Framework:** Node.js, Express.js, TypeScript
- **Database & ORM:** MySQL 8, Kysely (Query Builder) + `mysql2` driver
- **Architecture Pattern:** Feature-Based Modular with Repository Pattern (Thin Controller $\rightarrow$ Service $\rightarrow$ Repository)
- **Validation:** Zod v4 & `@asteasolutions/zod-to-openapi`
- **Security:** Helmet, CORS, Express-Rate-Limit
- **Observability:** Pino Logger + `pino-http` (Request ID Tracing)
- **PDF Engine:** PDFKit (Custom Japanese Font Embedding)
- **Testing:** Vitest, Supertest

---

## 📁 Struktur Direktori

```text
jita-1/
├── src/                          # FRONTEND (React SPA)
│   ├── app/                      # Providers (QueryClient, AuthProvider)
│   ├── api/                      # Base axios client & legacy API definitions
│   ├── features/                 # Feature-First Modules
│   │   ├── auth/                 # Auth hooks, mutations & form schemas
│   │   ├── jobs/                 # Jobs query/mutation hooks & types
│   │   ├── profile/              # Profile hooks & mutations
│   │   ├── documents/            # Document vault & verification hooks
│   │   └── admin/                # Admin tables (TanStack Table) & components
│   ├── components/
│   │   ├── ui/                   # UI Primitives (Button, Badge, Card, Modal)
│   │   └── layout/               # App layout, Navbar, Sidebar
│   ├── contexts/                 # Global AuthContext (Session management)
│   ├── pages/                    # Page assembling (student, corporate, educator, admin)
│   ├── styles/                   # Design tokens (variables.css)
│   ├── app.css                   # Global CSS & shadcn/Tailwind root variables
│   └── vite.config.ts            # Vite configuration
│
├── jita-backend/                 # BACKEND (Express API)
│   ├── src/
│   │   ├── modules/              # Domain Business Modules
│   │   │   ├── auth/             # Login, register, credential management
│   │   │   ├── users/            # Candidate profile & scout candidates
│   │   │   ├── jobs/             # Job postings, applications, scout logic
│   │   │   ├── documents/        # File upload & document verification
│   │   │   ├── calendar/         # Activity events & role-based visibility
│   │   │   ├── courses/          # Syllabus, course modules & enrollment progress
│   │   │   ├── cv/               # Japanese Rirekisho PDF generation
│   │   │   ├── notifications/    # Email SMTP, webhook & logging
│   │   │   ├── admin/            # Verification stats & batch actions
│   │   │   └── sso/              # Pusat Es Kampus SSO token validator
│   │   ├── shared/
│   │   │   ├── db/               # Kysely connection pool & schema types
│   │   │   ├── errors/           # Custom AppError classes
│   │   │   ├── logger/           # Pino logger instance
│   │   │   ├── openapi/          # OpenAPI 3.0 Registry & Swagger compiler
│   │   │   └── middleware/       # Auth guard, rate-limit, error handler
│   │   ├── config/               # Environment & database credentials
│   │   ├── app.ts                # Express application setup
│   │   ├── app.test.ts           # Integration tests (Vitest + Supertest)
│   │   └── server.ts             # Server listener & bootstrap
│   └── uploads/                  # Local secure file storage (KTP, Certs)
│
├── documents/                    # DOKUMENTASI PROYEK & SRS
│   ├── srs.md                    # Software Requirements Specification
│   ├── HANDOVER_JITA.md          # Panduan Teknis & Handover Deployment
│   └── developer_delegation.md   # WBS & Pembagian Fitur Tim
│
├── AGENTS.md                     # Aturan Arsitektural AI / Developer
└── README.md                     # Dokumentasi Utama
```

---

## 🚀 Panduan Menjalankan Project (Local Development)

### Prasyarat
- **Node.js**: v20+ atau v25+ (teruji pada Node v25.6.1)
- **Package Manager**: npm atau pnpm
- **Database**: MySQL 8 (lokal via XAMPP/Laragon/Docker)

---

### 1. Setup Backend (`jita-backend`)

1. Masuk ke direktori backend:
   ```bash
   cd jita-backend
   ```
2. Salin dan sesuaikan file environment:
   ```bash
   cp .env.example .env # atau sesuaikan konfigurasi DB di src/config/db.ts
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Jalankan server dalam mode development:
   ```bash
   npm run dev
   ```
   *Backend menyala di `http://localhost:3000` (atau port yang ditentukan di `.env`).*

5. Menjalankan typecheck & testing:
   ```bash
   npm run typecheck   # Typecheck TypeScript (tsc --noEmit)
   npm test            # Unit & Integration test (Vitest + Supertest)
   ```

6. Akses Dokumentasi OpenAPI / Swagger:
   - **Swagger UI:** `http://localhost:3000/api/docs`
   - **OpenAPI JSON Spec:** `http://localhost:3000/api/docs.json`

---

### 2. Setup Frontend (Root)

1. Kembali ke direktori root:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan Vite development server:
   ```bash
   npm run dev
   ```
   *Aplikasi dapat diakses di browser pada `http://localhost:5173/jita/`.*

4. Menjalankan build & testing:
   ```bash
   npm test            # Component tests (Vitest + Testing Library)
   npm run test:e2e    # E2E tests (Playwright)
   npm run build       # Production build (tsc -b && vite build)
   ```

---

## 🌐 Catatan Deployment & Produksi (cPanel / Passenger)

- **Frontend Base URL:** Dibangun dengan base path `/jita/` (`https://ijon-technology.com/jita`).
- **Backend Routing (Passenger):** Passenger me-mount Node.js di `/api`. Express menangani rute modular `/api/*` secara transparan.
- **SSO Callback URL:** `https://ijon-technology.com/api/sso/login?token=...`
- **Keamanan Data On-Premise:** Sesuai dengan batasan SRS, penyimpanan berkas KTP dan sertifikat berada di disk server lokal (`uploads/`), tidak diunggah ke *third-party public cloud* pihak ketiga untuk menjaga kerahasiaan data privasi talenta.

---

## 📜 Panduan Developer & AI Agent

Semua kontributor developer dan AI coding agent **wajib** mengikuti aturan yang telah ditetapkan di [AGENTS.md](AGENTS.md):
- **Feature-First**: Tempatkan logika baru di modulnya masing-masing (`modules/<feature>` di backend dan `features/<feature>` di frontend).
- **Thin Controller**: Dilarang memanggil database Kysely atau menjalankan aturan bisnis langsung di Controller.
- **Single Source of Truth**: Setiap endpoint baru wajib didaftarkan di skema OpenAPI Zod.
- **Type Safety**: Dilarang menggunakan `any`.
