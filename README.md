# Apex Engineering College ERP System — Institutional Platform

A comprehensive, production-ready full-stack enterprise resource planning (ERP) platform designed for a single engineering college serving **<1,000 students** across 6 academic departments. Built on a clean JavaScript monorepo stack with React, Vite, Node.js, Express, and MongoDB Mongoose.

---

## 1. Project Overview & Architecture

The College ERP System is engineered as an institutional monorepo providing server-validated authentication, role-based authorization (RBAC), live metric aggregations, academic management, financial ledgers, and audit trails.

### System Architecture
```text
┌─────────────────────────────────────────────────────────────┐
│               Frontend: React 18 + Vite SPA                 │
│  - Tailwind CSS Responsive Design (Desktop, Tablet, Mobile) │
│  - Centralized AuthContext & ApiClient (Bearer Token Auth)  │
│  - 6 Role Dashboards + 17 Institutional Modules             │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST JSON API (Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│             Backend: Node.js + Express REST API             │
│  - Versioned Routes (/api/v1)                               │
│  - RBAC Middleware (Super Admin, Principal, HOD, Faculty,   │
│    Student, Accounts)                                       │
│  - Input Validation & Sanitization Middleware               │
│  - Safe Diagnostic Logging (Zero Sensitive Leaks)           │
│  - Structured Audit Logger (AuditLog Model)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                    MongoDB Atlas / Local                    │
│  - Users, Departments, Courses, Subjects, Timetable         │
│  - Attendance, Examinations, Results, Invoices, Payments    │
│  - Notices, AuditLogs                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Prerequisites

### Technology Stack
- **Frontend:** React 18, JavaScript (ES Modules), Vite 5, Tailwind CSS, Lucide React icons.
- **Backend:** Node.js, Express 4, Mongoose 8, JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), Helmet, CORS.
- **Database:** MongoDB 7 / MongoDB Atlas.
- **Shared Package:** `@college-erp/shared` (Roles, permissions, user statuses, and HTTP status codes).

### Prerequisites
- Node.js `v18.x`, `v20.x`, or `v24.x`
- npm `v9+` or `v10+`
- MongoDB local instance (`mongodb://127.0.0.1:27017/college_erp_dev`) or MongoDB Atlas cluster URI

---

## 3. Monorepo Repository Structure

```text
college-erp-system/
├── apps/
│   ├── client/                  # React 18 + Vite frontend
│   │   ├── src/
│   │   │   ├── api/             # Universal ApiClient with token interceptors
│   │   │   ├── components/      # Common UI components (Table, Modal, Input, Badge, etc.)
│   │   │   ├── context/         # AuthContext & ToastContext
│   │   │   ├── pages/           # Portals, Dashboards & Institutional Pages
│   │   │   │   ├── academics/   # Departments, Courses, Timetable, Attendance, Exams, Results
│   │   │   │   ├── admin/       # Super Admin Dashboard & User Management
│   │   │   │   ├── fees/        # Fee Structure, Invoices & Payment Ledger
│   │   │   │   ├── notices/     # Campus Announcements & Circulars
│   │   │   │   └── reports/     # Executive Analytics & Academic Reports
│   │   │   ├── App.jsx          # Protected Routing & Subsystem Switchboard
│   │   │   └── main.jsx         # Application entry
│   │   └── package.json
│   └── server/                  # Node.js + Express backend
│       ├── src/
│       │   ├── config/          # MongoDB Atlas connection & environment validator
│       │   ├── middleware/      # Auth, RBAC, input sanitization, error handling
│       │   ├── modules/         # Modular domain subsystems (auth, departments, courses,
│       │   │                    #   timetable, attendance, exams, results, fees, payments,
│       │   │                    #   notices, reports, audit-logs, users)
│       │   ├── utils/           # Logger, audit logger, and standardized responses
│       │   └── server.js        # Express application bootstrap
│       ├── tests/               # Automated unit, integration, and security test suites
│       └── package.json
├── packages/
│   └── shared/                  # Monorepo shared constants, roles, and permissions
├── .env.example                 # Root environment template
└── package.json                 # Monorepo workspaces definition
```

---

## 4. Installation & Local Setup

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/mahesh-vulleru/college-erp-system.git
cd college-erp-system

# Install all monorepo workspace dependencies
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Ensure `.env` contains valid credentials:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/college_erp_dev
JWT_SECRET=institutional_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Populate Development Fixtures
Run the idempotent seed script to populate demo departments, degree programs, subjects, fee schedules, notices, and test credentials:
```bash
npm run seed
```

### Step 4: Run Services
Start the backend and frontend in separate terminals:
```bash
# Terminal 1 - Backend Server (Port 5000)
npm run dev:server

# Terminal 2 - Frontend Client (Port 5173)
npm run dev:client
```

---

## 5. Development, Test & Build Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev:server` | Starts backend with `nodemon` live-reload on port 5000. |
| `npm run dev:client` | Starts Vite development server on port 5173. |
| `npm test` | Executes Jest automated test suites across all packages. |
| `npm run build` | Compiles client SPA for production into `apps/client/dist`. |
| `npm run seed` | Populates development fixtures into MongoDB. |

---

## 6. Six Role-Based Dashboards

Institutional access is strictly role-gated on both frontend routes and backend APIs:

| Role | Route | Description & Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | `/admin` | Institution-wide oversight, user account provisioning, role allocation, audit log inspection, and security diagnostics. |
| **Principal** | `/principal` | Institutional governance, faculty workloads, admission statistics, academic compliance, and executive notice publication. |
| **HOD** | `/hod` | Departmental syllabus management, faculty assignment, class timetable scheduling, and department attendance analytics. |
| **Faculty** | `/faculty` | Daily lecture attendance capture, internal marks entry, student roster review, and timetable inspection. |
| **Student** | `/student` | Academic attendance percentage tracker, published grade card/results view, fee due invoices, and campus notices. |
| **Accounts** | `/accounts` | Institutional fee structure setup, student fee collections, payment reconciliation, offline receipt generation, and dues reporting. |

---

## 7. Status of All 17 Super Admin Modules

| # | Module Name | Route | Status | Description & Capabilities |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Super Admin Portal** | `/admin` | **Working** | User management, password resets, account activation/suspension, system audit. |
| 2 | **Principal & Exec** | `/principal` | **Working** | Executive metric widgets, department performance, institutional notices. |
| 3 | **Department Head (HOD)**| `/hod` | **Working** | Department metrics, faculty allocation, syllabus subjects overview. |
| 4 | **Faculty Workplace** | `/faculty` | **Working** | Assigned classes, rapid attendance shortcuts, internal test mark entry. |
| 5 | **Student Self-Service** | `/student` | **Working** | Personal attendance rate, academic SGPA, fee invoices, campus announcements. |
| 6 | **Accounts & Finance** | `/accounts` | **Working** | Fee collection summary, dues tracking, manual receipt reconciliation. |
| 7 | **System Overview Hub** | `/overview` | **Working** | System diagnostics, subsystem inventory, API endpoint health registry. |
| 8 | **Departments** | `/departments` | **Working** | Department CRUD, unique code enforcement, HOD conflict detection, seat limits. |
| 9 | **Programs & Courses** | `/courses` | **Working** | Degree programs (B.Tech, M.Tech), semester mappings, syllabus subject catalog. |
| 10| **Class Timetable** | `/timetable` | **Working** | Weekly schedule matrix, faculty/room/section conflict checks, CSV export. |
| 11| **Daily Attendance** | `/attendance` | **Working** | Period-wise student roster marking, bulk updates, percentage calculation, CSV export. |
| 12| **Examinations** | `/examinations` | **Working** | Assessment scheduling, venue conflict validation, publication controls. |
| 13| **Results & Grades** | `/results` | **Working** | Marks entry (internal 40, external 60), letter grade computation, student privacy guard. |
| 14| **Fee Schedules & Dues** | `/fees` | **Working** | Fee heads (tuition, lab, library), student invoices, balance calculations. |
| 15| **Notice Board** | `/notices` | **Working** | Pinned announcements, role-targeted visibility, priority tags, markdown content. |
| 16| **Executive Reports** | `/reports` | **Working** | Academic performance, attendance distributions, fee collection ledgers, CSV export. |
| 17| **Security & Audit Logs**| `/audit-logs` | **Working** | Immutable audit event trails, IP/actor tracking, sanitized details (no secrets). |

---

## 8. API Structure, Authentication & Security

### Base URL: `/api/v1`

### Authentication & Authorization
- **JWT Authentication:** Tokens are signed with `HS256` using `JWT_SECRET` and validated in `authenticate` middleware.
- **Passwords:** Encrypted using bcrypt (salt rounds = 10). Passwords and password hashes are never returned in queries (`select: false`).
- **Role Verification:** Backend routes enforce role authorization using `authorizeRoles(...)`. Client-side route guards prevent unauthorized view transitions.
- **Rate Limiting:** Express rate limiter enforces limits on login attempts to mitigate brute-force attacks.
- **Sanitization:** Request bodies are recursively trimmed and sanitized to prevent script injection.

### Privacy & Data Integrity Rules
- **Student Privacy:** Students can only query their own attendance, invoices, and results.
- **Unpublished Exam Protection:** Students can never retrieve or view results for examinations marked `isPublished: false`.
- **Marks Validation:** Marks entries reject values outside the defined bounds (Internal: 0–40, External: 0–60).
- **Audit Sanitization:** Passwords, hashes, tokens, and bank details are masked (`[REDACTED]`) prior to audit persistence.

---

## 9. Payment Provider Configuration

The payment subsystem supports institutional fee receipt generation, payment recording, and balance adjustments:
- Supported methods: `cash`, `cheque`, `bank_transfer`, `upi`, `online` (gateway integration placeholder).
- Online Gateway Integration (Razorpay / Stripe):
  - In production, set `PAYMENT_GATEWAY_KEY_ID` and `PAYMENT_GATEWAY_KEY_SECRET` in `.env`.
  - Webhooks must be verified using HMAC-SHA256 signatures before updating invoice transaction balances.
  - Idempotency keys are enforced on payment transaction records to prevent double-charging or duplicate receipts.

---

## 10. Troubleshooting & Common Setup Issues

1. **MongoDB Atlas SRV Resolution Failure (`querySrv ECONNREFUSED`):**
   - *Cause:* Windows local DNS resolver intermittently fails on Atlas SRV records.
   - *Solution:* The server automatically falls back to Google and Cloudflare DNS (`8.8.8.8`, `1.1.1.1`). Ensure outbound UDP port 53 is not blocked by your local firewall.

2. **Login 401 Unauthorized:**
   - Verify that the selected role card on `/login` matches the registered role of the account.
   - Default seed accounts:
     - Super Admin: `admin@college.edu` (`Admin@12345`) or `superadmin@college.edu` (`Admin@12345`)
     - Principal: `principal@college.edu` (`Password123!`)
     - HOD: `hod.cse@college.edu` (`Password123!`)
     - Faculty: `faculty.turing@college.edu` (`Password123!`)
     - Student: `student.aarav@college.edu` (`Password123!`)
     - Accounts: `accounts@college.edu` (`Password123!`)

3. **Port Conflicts (Port 5000 or 5173 occupied):**
   - Update `PORT=5001` in `.env` and `VITE_API_BASE_URL=http://localhost:5001/api` if port 5000 is occupied.

---

## 11. Known Limitations & Remaining Roadmap

- **Online Payment Webhooks:** Currently running in local institutional ledger mode; live Razorpay/Stripe webhooks require external public URL tunneling (e.g. via ngrok or AWS deployment).
- **Bulk CSV Student Import:** Student profiles are currently provisioned individually or via seed fixtures; bulk CSV roster import will be added in the next release.
- **Email/SMS Notifications:** Notice board circulars publish in-app; external SMTP/Twilio integration is ready for service adapter attachment.
