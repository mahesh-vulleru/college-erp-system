# Git Workflow & Team Collaboration Rules

## 1. Branch Strategy

The repository operates on a strict **Feature Branch + Pull Request** workflow.
- **`main`**: Protected branch. Represents stable, deployable code. **No direct pushes allowed.**
- **`feature/<module>-<description>`**: Working branch for individual developer tickets.

### Assigned Feature Branches:
- **M1 (Tech Lead):** `feature/m1-auth-contracts`
- **M2 (Academic Backend):** `feature/m2-academics-mongo`
- **M3 (Frontend Lead):** `feature/m3-react-dashboards`
- **M4 (Finance & QA):** `feature/m4-fees-testing`

---

## 2. Developer Collaboration Rules

1. **Pull Latest Main Daily:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-feature-name
   git rebase main # or git merge main
   ```
2. **Never Commit Secrets:**
   - Keep all `.env` files in `.gitignore`.
   - Use `.env.example` to document newly introduced environment keys.
3. **Keep Ownership Clear:**
   - **M1:** `apps/server/src/config/`, `apps/server/src/middleware/`, `packages/shared/`
   - **M2:** `apps/server/src/modules/academics/`, `apps/server/src/modules/attendance/`
   - **M3:** `apps/client/src/components/`, `apps/client/src/pages/`
   - **M4:** `apps/server/src/modules/fees/`, `apps/server/tests/`
4. **Pull Request Protocol:**
   - All tests (`npm test`) and builds (`npm run build`) must pass before submitting a PR.
   - At least 1 peer review approval required before merging into `main`.
