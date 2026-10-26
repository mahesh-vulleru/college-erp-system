# Database Schema — College ERP

## 1. Core Models Overview

All models reside in `apps/server/src/modules/` with Mongoose schemas and strict validation rules.

---

### User Model (`User`)
Stores institutional credentials and system roles.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Auto-generated |
| `name` | String | Required, Trim | User's full legal name |
| `email` | String | Required, Unique, Lowercase | Institutional email |
| `password` | String | Required, Min: 6, `select: false` | Bcrypt hash |
| `role` | String | Required, Enum | `super_admin`, `principal`, `hod`, `faculty`, `student`, `accounts` |
| `department`| String | Optional, Trim | Academic department |
| `status` | String | Enum (`active`, `inactive`, `suspended`) | Account state |
| `lastLogin` | Date | Optional | Timestamp of latest login |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Modification timestamp |

---

## 2. Planned Module Schemas (Assigned to M2 & M4)

### Academic Course / Department (`Department` & `Course` - M2 Scope)
```javascript
const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. "CSE-BTECH"
  title: { type: String, required: true },
  department: { type: String, required: true },
  durationYears: { type: Number, default: 4 },
  totalSemesters: { type: Number, default: 8 }
}, { timestamps: true });
```

### Student Profile (`StudentProfile` - M2 Scope)
```javascript
const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rollNumber: { type: String, required: true, unique: true }, // e.g. "23CSE042"
  admissionYear: { type: Number, required: true },
  currentSemester: { type: Number, required: true, min: 1, max: 8 },
  department: { type: String, required: true },
  guardianName: { type: String, required: true },
  contactPhone: { type: String, required: true }
}, { timestamps: true });
```

### Attendance Record (`Attendance` - M2 Scope)
```javascript
const AttendanceSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  period: { type: Number, required: true },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' }
  }]
}, { timestamps: true });
```

### Fee Ledger & Transaction (`FeeTransaction` - M4 Scope)
```javascript
const FeeTransactionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true }, // e.g. "2026-2027"
  semester: { type: Number, required: true },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  receiptNumber: { type: String, unique: true }
}, { timestamps: true });
```
