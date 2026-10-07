# JITA Project - Phase 2 Delegation Plan

This document provides the technical diagrams and work breakdown structure needed to onboard two full-stack developers to complete Phase 2 of the JITA project.

## 1. Work Breakdown Structure (Vertical Delegation)

To prevent the two developers from blocking each other, the work is divided into **Feature Verticals**. This means each developer will handle both the frontend integration and backend APIs for their specific features.

```mermaid
gantt
    title JITA Phase 2 - Fullstack Delegation
    dateFormat  YYYY-MM-DD
    axisFormat %W

    section Dev A: Learning & CV
    DB Schema (Courses, Vault)      :a1, 2026-09-04, 3d
    File Upload APIs (Vault)        :a2, after a1, 4d
    Courses & Activity APIs         :a3, after a2, 5d
    React Data Integration          :a4, after a3, 5d
    Automated PDF CV Builder        :a5, after a4, 5d

    section Dev B: Jobs & Admin
    DB Schema (Jobs, Companies)     :b1, 2026-09-04, 3d
    Job Matching APIs (Scout/Apply) :b2, after b1, 6d
    Admin Dashboard (Verifications) :b3, after b2, 5d
    React Data Integration          :b4, after b3, 5d
    Notification System             :b5, after b4, 3d
```

### 👨‍💻 Developer A (Learning & Profile Track)
**Focus:** Building the core user profile, file storage, and the learning ecosystem.
1.  **Document Vault:** Implement `multer` for file uploads (KTP, Certificates) to the server.
2.  **Learning Ecosystem:** Build the backend CRUD and frontend integration for Courses, Modules, and User Track Records.
3.  **CV Engine (Critical):** Implement the logic for `/api/cv/generate` using `puppeteer` or `pdfkit` to automatically generate the Japanese-standard PDF CV based on the user's profile and track record.

### 👩‍💻 Developer B (Job Matching & Admin Track)
**Focus:** Building the marketplace aspect and operational controls.
1.  **Job Marketplace:** Build the backend CRUD and frontend integration for Companies and Job Postings.
2.  **Two-Way Matching:** Implement the logic for Candidates to "Apply" and Companies to "Scout".
3.  **Admin Panel:** Build the data verification dashboard for admins to approve KTPs and certificates.
4.  **Notifications:** Implement the API gateway/email logic for system alerts (e.g., "You have been scouted!").

---

## 2. System Architecture (Current vs Future)

This diagram shows how the frontend, backend, and external services interact.

```mermaid
flowchart TD
    subgraph Client [Client Side]
        UI[React + Vite Frontend\n/jita]
    end

    subgraph Server [cPanel Shared Hosting]
        API[Node.js + Express Backend\n/api]
        DB[(MySQL Database)]
        Storage[(Local File Storage\nKTP, CV, Certs)]
    end

    subgraph External [External Services]
        es[Pusat Es Kampus\nSSO Provider]
    end

    %% Phase 1 (Completed)
    UI -- "1. Login Request" --> es
    es -- "2. JWT Token (RS256)" --> API
    API -- "3. Validate Token" --> es
    API -- "4. Auto-Provision" --> DB
    
    %% Phase 2 (To Be Built by Devs)
    UI -. "Fetch Dashboard Data" .-> API
    API -. "CRUD Operations" .-> DB
    API -. "Save/Load Files" .-> Storage
    
    style Client fill:#e1f5fe,stroke:#01579b
    style Server fill:#f3e5f5,stroke:#4a148c
    style External fill:#fff3e0,stroke:#e65100
```

---

## 3. Recommended Database Schema (ERD)

This is a conceptual blueprint for the MySQL tables that need to be created. Currently, only the `users` table exists.

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : uploads
    USERS ||--o{ COURSE_ENROLLMENTS : has
    USERS ||--o{ JOB_APPLICATIONS : submits
    
    COMPANIES ||--o{ JOB_POSTINGS : creates
    JOB_POSTINGS ||--o{ JOB_APPLICATIONS : receives
    
    COURSES ||--o{ COURSE_MODULES : contains
    COURSES ||--o{ COURSE_ENROLLMENTS : tracks

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role "student, educator, admin, corporate"
        string ice_uuid
    }

    DOCUMENTS {
        int id PK
        int user_id FK
        string type "KTP, Certificate, Portfolio"
        string file_path
        string verification_status "Pending, Approved, Rejected"
    }

    COURSES {
        int id PK
        string title
        string description
        int educator_id FK
    }

    JOB_POSTINGS {
        int id PK
        int company_id FK
        string title
        string requirements
        boolean is_active
    }

    JOB_APPLICATIONS {
        int id PK
        int user_id FK
        int job_id FK
        string status "Applied, Scouted, Accepted, Rejected"
    }
```

## 4. Key Directives for the Developers
*   **Database connection:** Remember that the MySQL connection in `server.js` is intentionally hardcoded as a config object (not a URL string) to bypass cPanel character parsing issues.
*   **Routing:** The Express app handles routing assuming it receives paths like `/sso/login` (cPanel Passenger strips the `/api` prefix internally). Ensure all new routes match this behavior as documented in `server.js`.
*   **Memory Limits:** Be mindful of CloudLinux LVE memory limits on the shared hosting. When implementing the PDF generation (CV Builder), prefer lightweight libraries if possible, or ensure heavy background processes don't crash the Node.js app.
