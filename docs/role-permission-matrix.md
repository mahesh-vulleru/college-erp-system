# Role-Permission Matrix — College ERP

## 1. System Roles

The ERP manages six institutional roles:
1. **Super Admin (`super_admin`)**: Technical administrator, initial system setup, database backups, security auditing.
2. **Principal / Management (`principal`)**: Institutional executive, campus-wide academic reports, fee collections overview, faculty performance.
3. **Head of Department (`hod`)**: Departmental head (e.g. CSE, ECE), course allocation, faculty attendance review, marks approval.
4. **Faculty (`faculty`)**: Teaching staff, daily period attendance entry, internal test marks recording.
5. **Student (`student`)**: Enrolled undergraduate, attendance self-check, marks review, fee receipt download.
6. **Accounts (`accounts`)**: Finance office, fee ledger creation, offline receipt issuance, payment reconciliations.

---

## 2. Server-Side Permission Matrix

| Feature / Action | Super Admin | Principal | HOD | Faculty | Student | Accounts |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Settings & Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create / Manage User Accounts** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Institutional Reports** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Department Course Setup** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Assign Faculty to Subjects** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Mark Daily Attendance** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **View Department Attendance** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Own Attendance** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Enter Internal / Lab Marks** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Approve Semester Marks** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Own Marks & Grade Card** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Configure Fee Structures** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Record Fee Payment / Receipts** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Fee Collection Reports** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **View Own Fee Dues & Receipts** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 3. Server Enforcement Implementation

Role checks must **always** be performed using server middleware:

```javascript
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

// Example: Only HOD and Faculty can mark attendance
router.post(
  '/attendance/mark',
  authenticate,
  authorizeRoles(ROLES.HOD, ROLES.FACULTY),
  attendanceController.markAttendance
);
```
