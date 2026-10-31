# System Architecture — College ERP

## 1. System Overview
The College ERP is an enterprise management platform designed for a single engineering college serving **<1,000 students** across 6 academic departments. The platform emphasizes clean architectural boundaries, zero data exposure, strong server-side Role-Based Access Control (RBAC), and smooth execution across Android mobile browsers and desktop browsers.

```
                          [ Client Layer ]
              React 18 + Vite + Tailwind CSS (SPA)
             Responsive Web (Mobile Android Browser)
                               │
                       REST API (JSON)
                      JWT Bearer Tokens
                               │
                               ▼
                          [ API Layer ]
              Node.js + Express (Port 5000)
    Helmet • CORS • Rate Limiting • Centralized Error Handler
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ Auth & RBAC ]                 [ Future Modules ]
      Bcrypt Password Hash            M2: Academics & Marks
      Server-side RBAC                M4: Fees & Payment Gateway
               │
               ▼
                        [ Data Layer ]
                      MongoDB + Mongoose
                    Single Institutional DB
```

---

## 2. Directory Structure & Monorepo Organization

```text
college-erp-system/
├── apps/
│   ├── client/              # React 18 + Vite + Tailwind frontend application
│   │   ├── src/
│   │   │   ├── api/         # Centralized API client with JWT interceptor
│   │   │   ├── components/  # Reusable UI library (Card, Table, Button, etc.)
│   │   │   ├── context/     # AuthContext session management
│   │   │   └── pages/       # Role-aware dashboards and login screens
│   └── server/              # Express + Node.js backend service
│       ├── src/
│       │   ├── config/      # Environment validation & MongoDB connection
│       │   ├── middleware/  # JWT auth, server-side RBAC, error handling
│       │   ├── modules/     # Domain modules (Auth, Academics, Fees)
│       │   ├── routes/      # Versioned API routes (/api/v1/...)
│       │   └── utils/       # Sensitive data masking logger
│       └── tests/           # Automated endpoint tests (Jest + Supertest)
├── packages/
│   └── shared/              # Shared roles, permissions, constants
├── docs/                    # Technical architecture & team standards
├── .github/                 # Issue templates and PR checklist
├── .env.example             # Safe environment variable template
└── package.json             # Root workspace orchestration
```

---

## 3. Technology Stack Rationale

| Layer | Selection | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite (JavaScript) | Instant HMR, lightweight bundle, zero build overhead, high mobile browser performance. |
| **Styling** | Tailwind CSS | Utility-first, mobile-first responsive layout tailored for low-bandwidth student devices. |
| **Backend** | Express + Node.js (JavaScript) | Non-blocking I/O, simple middleware composition, standard REST conventions. |
| **Database** | MongoDB + Mongoose | Schema validation with flexible document structures for academic marks and fee ledgers. |
| **Auth** | JWT + Bcrypt | Stateless authentication; secrets never exposed to frontend code. |

---

## 4. Security Architecture

1. **Authentication:**
   - Passwords hashed with `bcryptjs` (salt rounds: 10).
   - Passwords explicitly excluded from query projections (`select: false`).
   - JWT tokens signed using `JWT_SECRET` (min 32 characters required in production).
2. **Authorization (RBAC):**
   - Role evaluation strictly enforced on the server via `authorizeRoles` and `requirePermissions` middleware.
   - Client UI role checks are for presentation convenience only and never trusted for security.
3. **Transport & Data Safety:**
   - `helmet` sets HTTP security headers (X-Frame-Options, X-Content-Type-Options).
   - Rate limiting on `/api` prevents credential stuffing and brute-force attacks.
   - Centralized error handler sanitizes stack traces and internal errors in production.
   - Logger utility masks passwords, tokens, and authorization headers.
