# College ERP System — Institutional Foundation

A clean, production-ready, monorepo foundation for a single engineering college ERP serving **<1,000 students** across 6 academic departments. Built with JavaScript, React + Vite, Express, and MongoDB.

---

## 1. Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (JavaScript SPA, responsive on Android mobile browsers)
- **Backend:** Node.js, Express, Helmet, CORS, Rate-Limiting, Bcrypt, JWT (JavaScript)
- **Database:** MongoDB, Mongoose
- **Shared Package:** `@college-erp/shared` (Centralized roles, permissions, HTTP constants)
- **Version Control:** Git & GitHub Pull Requests

---

## 2. Monorepo Structure

```text
college-erp-system/
├── apps/
│   ├── client/                  # React + Vite frontend
│   │   ├── src/api/             # ApiClient with JWT Bearer injection
│   │   ├── src/components/      # Reusable UI (Button, Card, Table, Input, etc.)
│   │   ├── src/context/         # AuthContext
│   │   └── src/pages/           # LoginPage, DashboardPage
│   └── server/                  # Express REST backend
│       ├── src/config/          # MongoDB connection & env validation
│       ├── src/middleware/      # Auth, RBAC, errorHandler, rateLimiter
│       ├── src/modules/auth/    # Auth controller, model, routes, validator
│       └── tests/               # Health & Auth automated tests
├── packages/
│   └── shared/                  # Common roles, constants, permissions
├── docs/                        # Architecture, DB Schema, API Contracts, Workflow
├── .github/                     # PR & Issue templates
└── package.json                 # Monorepo workspaces configuration
```

---

## 3. Quick Start & Local Setup

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- MongoDB local instance or MongoDB Atlas URI

### Step 1: Clone and Install
```bash
git clone https://github.com/mahesh-vulleru/college-erp-system.git
cd college-erp-system

# Install all workspace dependencies
npm install
```

### Step 2: Configure Environment
```bash
# Copy root template
cp .env.example .env

# Copy app specific templates
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Ensure `JWT_SECRET` is set in `.env` (min 32 characters in production).

### Step 3: Populate Development Fixtures (Optional)
```bash
# Populate safe development seed data (<1,000 students, 6 depts, demo users)
npm run seed
```

### Step 4: Run the Services

#### Run Backend Service:
```bash
npm run dev:server
# Server listens on http://localhost:5000
# Health Check: http://localhost:5000/api/health
```

#### Run Frontend Client:
```bash
npm run dev:client
# Vite Client opens on http://localhost:5173
```

---

## 4. Testing & Verification

Run the automated test suite:
```bash
npm test
```

Build the frontend client for production:
```bash
npm run build
```

---

## 5. Team Roles & Assignment

Four team members will develop their respective modules in dedicated feature branches:

| Member | Focus | Assigned Branch |
| :--- | :--- | :--- |
| **M1** | Tech Lead, Core Auth, Shared Contracts, DevOps | `feature/m1-auth-contracts` |
| **M2** | Academic Backend, MongoDB Models, Attendance/Marks | `feature/m2-academics-mongo` |
| **M3** | React Dashboards, Reusable UI Atoms, Mobile Responsiveness | `feature/m3-react-dashboards` |
| **M4** | Fee Structures, Payments, Integration Tests & QA | `feature/m4-fees-testing` |

See [docs/git-workflow.md](docs/git-workflow.md) for full branch and pull request rules.
