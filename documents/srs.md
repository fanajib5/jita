# Software Requirements Specification (SRS) 

## 1. Introduction
This document outlines the software requirements for the **JITA (Japan Industry Training Academy)** platform, derived directly from the business proposal. JITA is envisioned as a comprehensive, two-way digital ecosystem designed to bridge the gap between Indonesian professional talents and the needs of Japanese industries.

## 2. Product Overview
Unlike a standard job portal, JITA is a holistic career and learning ecosystem. It tracks a candidate's journey from learning and certification to job placement, culminating in automated CV generation.

### 2.1. Architectural Constraints & Deployment
*   **Platform Type:** Web-Based Application (accessible via universal web browsers without needing mobile apps).
*   **Infrastructure:** On-Premise (deployed directly on the client's local server infrastructure).
*   **Data Security:** Because it is on-premise, the institution retains 100% control over sensitive candidate data (e.g., KTP photos, privacy data) without relying on third-party cloud services.

## 3. Functional Requirements (The 4 Pillars)

The system must implement four core functional pillars:

### Pillar 1: Integrated Authentication & Profiling
*   **Single Sign-On (SSO):** The platform must seamlessly integrate with the **Pusat Es** for user authentication.
*   **Profile Management:** Candidates must be able to create and manage their basic career and educational profiles.

### Pillar 2: Track Record (Learning & Activities)
*   **Calendar Integration:** The system must feature a calendar to track activities with Japanese partners and preparation classes.
*   **Learning Tracking:** The platform must record the candidate's learning progress and competency certifications.
*   **Admin Validation:** System administrators must have the ability to validate and approve certificates uploaded or earned by candidates.

### Pillar 3: CV Builder & Job Matching
*   **Automated CV Builder:** The system must feature an automated document generation tool that converts a candidate's profile and track record into a **Japanese-standard PDF Curriculum Vitae (CV)**.
*   **Two-Way Job Matching:** 
    *   **Apply:** Candidates can proactively apply to listed job openings.
    *   **Scout:** Japanese industry partners (Mitra) can search the database and "scout" suitable candidates.

### Pillar 4: Admin Operations & Notifications
*   **Admin Panel:** A dedicated dashboard for operational staff to verify data (e.g., identity verification, certificate validation).
*   **Notification System:** The system must integrate with an API Gateway to send standardized notification messages to users (e.g., "You have been scouted") or operational groups.

## 4. Delivery and Licensing Terms
*Note: These are project management constraints defined in the proposal.*
*   **Development Methodology:** Agile development focusing strictly on IT software functionality.
*   **Handover Deliverables:** The final product includes the compiled application, installation on the local server, and a User Manual.
*   **Critical Limitations:** 
    1.  **Source Code:** The raw source code is **NOT** included in the handover.
    2.  **Maintenance:** Post-handover maintenance is outside the scope of the proposal.
