# Git Workflow & 4-Developer Team Standards — College ERP

## 1. Team Allocation & Code Ownership

To enable parallel development without merge conflicts or overlapping concerns, the team of four engineers has strictly bounded module ownership:

| Member | Institutional Focus | Assigned Feature Branch | Protected Directory Scope |
| :--- | :--- | :--- | :--- |
| **M1** | Tech Lead, Architecture, Auth, DevOps | `feature/m1-auth-contracts` | `apps/server/src/config/`, `apps/server/src/middleware/`, `apps/server/src/modules/auth/`, `apps/server/src/modules/users/`, `apps/server/src/modules/notices/`, `apps/server/src/modules/audit-logs/`, `packages/shared/`, root CI/CD |
| **M2** | Academic Backend, MongoDB Schemas, Curriculum | `feature/m2-academics-mongo` | `apps/server/src/modules/departments/`, `apps/server/src/modules/courses/`, `apps/server/src/modules/subjects/`, `apps/server/src/modules/students/`, `apps/server/src/modules/faculty/`, `apps/server/src/modules/timetable/`, `apps/server/src/modules/attendance/`, `apps/server/src/modules/examinations/`, `apps/server/src/modules/results/` |
| **M3** | Frontend Lead, Dashboards UI, Mobile Responsiveness | `feature/m3-react-dashboards` | `apps/client/src/components/`, `apps/client/src/pages/`, `apps/client/src/context/`, `apps/client/tailwind.config.js` |
| **M4** | Finance, Fee Structures, QA & Integration Testing | `feature/m4-fees-testing` | `apps/server/src/modules/fees/`, `apps/server/src/modules/payments/`, `apps/server/src/modules/reports/`, `apps/server/tests/` |

---

## 2. Git Branching Principles

1. **`main` is Protected:**
   - Always in a buildable, deployable state.
   - Direct commits and force pushes (`git push --force`) are prohibited.
2. **Feature Branch Lifecycle:**
   - Branch off `main` using the assigned branch name:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feature/m2-academics-mongo
     ```
   - Commit logically and write descriptive commit messages:
     ```bash
     git commit -m "feat(academics): add semester timetable clash validation"
     ```
3. **Synchronize Daily with Main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch
   git merge main # or git rebase main
   ```
4. **Mandatory Pre-PR Verification:**
   Before pushing and opening a pull request, run:
   ```bash
   npm test
   npm run build
   ```
   Both must pass with exit code `0`.

---

## 3. Pull Request (PR) Checklist

Every pull request must fulfill:
- [ ] No `.env` or sensitive credentials committed.
- [ ] Server-side authorization verified (no relying purely on client-side route hiding).
- [ ] Code follows existing ESLint, Prettier, and project code conventions.
- [ ] All unit and integration tests pass without warnings or open handles.
- [ ] At least one peer review approval received before squash-and-merge into `main`.

---

## 4. Phase Roadmap

- **Phase 1 (Completed):** Complete frontend & backend architecture, reusable UI kit, routing, server-side RBAC, shared contracts, and test suite.
- **Phase 2 (Subsequent):** Implement full business workflows module-by-module across the designated feature branches.

---

## 3. Pull Request (PR) Checklist

Every pull request must fulfill:
- [ ] No `.env` or sensitive credentials committed.
- [ ] Server-side authorization verified (no relying purely on client-side route hiding).
- [ ] Code follows existing ESLint, Prettier, and project code conventions.
- [ ] All unit and integration tests pass without warnings or open handles.
- [ ] At least one peer review approval received before squash-and-merge into `main`.

---

## 4. Phase Roadmap

- **Phase 1 (Completed):** Complete frontend & backend architecture, reusable UI kit, routing, server-side RBAC, shared contracts, and test suite.
- **Phase 2 (Subsequent):** Implement full business workflows module-by-module across the designated feature branches.

