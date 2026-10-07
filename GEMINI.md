# GEMINI.md — JITA (Jogja IT Academy)

File ini adalah entry point untuk AI assistants yang bekerja di codebase JITA.
Bacalah file ini terlebih dahulu sebelum melakukan apapun.

---

## Purpose (WHY)

JITA adalah platform digital Jogja IT Academy — menghubungkan kandidat (talent mahasiswa/fresh grad IT),
partner industri, dan program pembelajaran/event. Platform terdiri dari:
- **Frontend SPA** (React + Vite + TypeScript)
- **Backend API** (Express.js + TypeScript + MySQL via Kysely)

---

## Quick Orientation (WHAT)

```text
jita-1/
├── src/                    # Frontend React SPA (Vite)
│   ├── app/                # router.tsx, providers.tsx
│   ├── features/           # Feature-first: candidate/, opportunity/, application/, admin/
│   ├── components/         # ui/ (shadcn primitives), shared/ (Header, Sidebar, dll)
│   ├── lib/                # api-client.ts, utils.ts
│   └── routes/             # Page assemblers
├── jita-backend/           # Backend Express.js API
│   ├── server.js           # Entry point & route aggregation
│   ├── scripts/            # Migration & utilities
│   └── uploads/            # File uploads
├── docs/                   # Dokumentasi teknis
├── documents/              # Dokumen bisnis / spesifikasi
├── e2e/                    # Playwright E2E tests
├── docker-compose.yaml     # Local dev stack
├── AGENTS.md               # Aturan arsitektural lengkap (baca juga ini)
└── GEMINI.md               # File ini
```

---

## Architecture

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
                 (Single Source of Truth)
                            │
                            ▼
                     Backend API
               Express.js + TypeScript
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       Modular Services              Async Queue
      (Business Logic)           (BullMQ / Worker)
             │                             │
             ▼                             ▼
        Repositories                  Integrations
      (Kysely + MySQL)             (WA, TG, Storage)
```

---

## Commands

```bash
# Frontend (dari root)
npm run dev          # Dev server Vite
npm run build        # Build produksi (tsc + vite)
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run lint         # oxlint
npm run lint:fix     # oxlint --fix
npm run format       # Prettier

# Backend (dari jita-backend/)
npm run dev          # node server.js
npm run seed         # Seed database
npm run test         # Vitest backend
```

---

## Core Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18, TypeScript, Vite, React Router, TanStack Query v5, React Hook Form + Zod, Tailwind CSS, shadcn/ui, TanStack Table, Lucide Icons |
| **Backend** | Express.js v5, TypeScript/JS, MySQL (`mysql2`), Kysely Query Builder, Zod, Pino, `@asteasolutions/zod-to-openapi` |
| **Infra** | Docker, Nginx, docker-compose (local dev) |

---

## Backend Module Structure (Wajib Diikuti)

Gunakan **Feature-Based / Modular Structure** di `src/modules/`:

```text
src/modules/<feature>/
├── <feature>.routes.ts       # Endpoint Express & middleware
├── <feature>.controller.ts   # Input parsing & HTTP response (THIN)
├── <feature>.service.ts      # Business logic murni
├── <feature>.repository.ts   # Database queries via Kysely
├── <feature>.schema.ts       # Zod schemas (request/response/OpenAPI)
└── <feature>.types.ts        # Type definitions modul
```

Domain modules: `auth`, `users`, `candidates`, `partners`, `learning`, `events`,
`opportunities`, `applications`, `scouting`, `documents`, `notifications`, `admin`

---

## Coding Conventions

### Backend
- **Thin Controller**: Controller hanya parse input → call service → return HTTP response.
  Dilarang query DB atau business logic di controller.
- **Service**: Business logic murni. Tidak boleh akses `req`/`res` Express.
- **Repository**: Semua query SQL via Kysely. Gunakan Kysely transaction untuk multi-tabel.
- **Error Handling**: Gunakan custom `AppError` turunan (`ValidationError` 400,
  `AuthenticationError` 401, `AuthorizationError` 403, `NotFoundError` 404, `ConflictError` 409).
  Tangani secara terpusat di `shared/middleware/errorHandler.ts`.
- **OpenAPI Contract**: Setiap route WAJIB punya Zod schema yang ter-register ke OpenAPI.
- **Type Safety**: Dilarang `any`. Gunakan `z.infer<typeof Schema>`.
- **No Dead Code**: Jangan tinggalkan boilerplate tidak terpakai.

### Frontend
- **Server State** → TanStack Query (`useQuery`, `useMutation`). Dilarang copy ke Zustand.
- **Client/UI State** → `useState`/`useReducer`. Zustand hanya untuk cross-page state.
- **Form** → React Hook Form + Zod resolver. Hindari controlled input manual.
- **Tabel** → TanStack Table untuk sorting/pagination/filtering dinamis.

### Environment Variables
Semua config eksternal (port, DB credentials, JWT secret, URL) dimuat via file config
bervalidasi Zod: `src/config.ts` (frontend) / equivalent di backend.

---

## Response Format Standar

```json
// Success
{ "success": true, "data": { ... } }

// Error
{
  "success": false,
  "error": {
    "code": "APPLICATION_ALREADY_EXISTS",
    "message": "Candidate has already applied for this opportunity",
    "details": []
  }
}
```

---

## Zona Merah (Hati-hati)

- `jita-backend/server.js` — entry point + route aggregation, perubahan di sini berdampak global
- `src/lib/api-client.ts` — auth interceptor, ubah dengan sangat hati-hati
- `src/app/providers.tsx` — root providers tree
- Migration scripts di `jita-backend/scripts/` — irreversible jika salah di production

---

## Dilarang Keras

- ❌ `any` di TypeScript — gunakan strict types atau `z.infer<>`
- ❌ Query database langsung di controller
- ❌ Business logic di controller atau repository
- ❌ Membuat route baru tanpa mendaftarkan OpenAPI schema
- ❌ Copy server state response ke global store (Zustand/Redux)
- ❌ Global layering (`controllers/`, `services/`, `routes/` global) — gunakan modular per domain

---

## Referensi

- [`AGENTS.md`](./AGENTS.md) — Aturan arsitektural lengkap (versi canonical, baca untuk detail)
- [`README.md`](./README.md) — Overview project & setup guide
- [`docs/`](./docs/) — Dokumentasi teknis tambahan
