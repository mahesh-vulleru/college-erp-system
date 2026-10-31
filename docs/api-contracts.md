# API Contracts & REST Specifications — College ERP

## 1. Protocol & Conventions
- **Base URL**: `http://localhost:5000/api`
- **Current Version**: `v1` (`/api/v1/...`)
- **Transport Security**: JSON over HTTPS / HTTP in development
- **Authentication**: `Authorization: Bearer <JWT_TOKEN>` header
- **Standard Pagination Parameters**:
  - `page`: Integer >= 1 (Default: 1)
  - `limit`: Integer 1-100 (Default: 20)

---

## 2. Standard JSON Response Envelope

### 2.1 Success Response Envelope
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### 2.2 Error Response Envelope
```json
{
  "success": false,
  "message": "Human-readable failure message",
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": [ ... ]
  }
}
```

---

## 3. Standard HTTP Status & Error Codes

| HTTP Status | Meaning | Typical Error Code | Use Case |
| :--- | :--- | :--- | :--- |
| `200 OK` | Success | N/A | Resource read, update, or login successful |
| `201 Created` | Created | N/A | New record (user, subject, fee) created |
| `400 Bad Request` | Validation Error | `VALIDATION_ERROR` | Missing required fields, invalid email format |
| `401 Unauthorized` | Unauthenticated | `UNAUTHORIZED` | Missing or expired JWT token |
| `403 Forbidden` | Insufficient Role | `FORBIDDEN` | Valid JWT, but role has no permission |
| `404 Not Found` | Not Found | `NOT_FOUND` | Record does not exist in MongoDB |
| `409 Conflict` | Duplicate Key | `DUPLICATE_RESOURCE` | Duplicate email, rollNumber, or code |
| `429 Too Many Req`| Rate Limited | `RATE_LIMIT_EXCEEDED`| DoS / brute-force throttle |
| `500 Server Error` | Internal Error | `INTERNAL_ERROR` | Database connection error |

---

## 4. Complete Endpoint Directory

### 4.1 System & Health (`/api`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, database health, uptime, version |

### 4.2 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Validates email/password and returns JWT |
| `POST` | `/api/v1/auth/register` | Public / Admin | Self registration (student) or admin user creation |
| `GET` | `/api/v1/auth/me` | Authenticated | Current authenticated user profile |

### 4.3 Users & Roles (`/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Admin, Principal, HOD, Accounts | Paginated list of college users |
| `GET` | `/api/v1/users/:id` | Admin, Principal, HOD, Accounts | Specific user record |
| `PATCH` | `/api/v1/users/:id/status`| Super Admin only | Activate, suspend, or deactivate user |

### 4.4 Departments & Courses (`/api/v1/departments`, `/api/v1/courses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/departments` | Authenticated | List all 6 engineering departments |
| `POST` | `/api/v1/departments` | Admin, Principal | Create new academic department |
| `GET` | `/api/v1/courses` | Authenticated | List B.Tech degree programs |
| `POST` | `/api/v1/courses` | Admin, Principal, HOD | Define program curriculum |

### 4.5 Curriculum Subjects (`/api/v1/subjects`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/subjects` | Authenticated | Filter subjects by course, semester |
| `POST` | `/api/v1/subjects` | Admin, Principal, HOD | Add new semester subject unit |

### 4.6 Students & Faculty Profiles (`/api/v1/students`, `/api/v1/faculty`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/students` | Admin, Principal, HOD, Faculty, Accounts | Paginated student directory |
| `GET` | `/api/v1/students/me` | Student only | Logged-in student's profile & roll number |
| `POST` | `/api/v1/students` | Admin, Principal, HOD | Register student academic record |
| `GET` | `/api/v1/faculty` | Authenticated | Faculty directory with designations |
| `POST` | `/api/v1/faculty` | Admin, Principal, HOD | Create faculty employee profile |

### 4.7 Timetable (`/api/v1/timetable`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/timetable` | Authenticated | Query timetable by dept, semester, day |
| `POST` | `/api/v1/timetable` | Admin, Principal, HOD | Allocate period slot with clash detection |

### 4.8 Daily Attendance (`/api/v1/attendance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/attendance` | Authenticated | Retrieve attendance records (filtered) |
| `POST` | `/api/v1/attendance/mark` | Admin, Principal, HOD, Faculty | Batch mark period student attendance |
| `GET` | `/api/v1/attendance/summary` | Authenticated | Overall percentage and condonation status |

### 4.9 Examinations & Results (`/api/v1/examinations`, `/api/v1/results`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/examinations` | Authenticated | Exam schedules (Mid-Term, Semester End) |
| `POST` | `/api/v1/examinations` | Admin, Principal, HOD | Schedule examination cycle |
| `GET` | `/api/v1/results` | Authenticated | Student marks & semester grade cards |
| `POST` | `/api/v1/results` | Admin, Principal, HOD, Faculty | Enter internal and external exam marks |

### 4.10 Fees & Payments (`/api/v1/fees`, `/api/v1/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/fees/structures` | Authenticated | Department semester fee structures |
| `POST` | `/api/v1/fees/structures` | Admin, Principal, Accounts | Create tuition & lab fee breakdown |
| `GET` | `/api/v1/payments` | Authenticated | Payment receipts and transaction log |
| `POST` | `/api/v1/payments` | Admin, Principal, Accounts | Record payment & generate receipt |

### 4.11 Notices & Circulars (`/api/v1/notices`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notices` | Authenticated | Circulars targeted to active user role |
| `POST` | `/api/v1/notices` | Admin, Principal, HOD | Publish announcement to college portal |

### 4.12 Executive Reports (`/api/v1/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/academic-summary` | Admin, Principal, HOD | Capacity, student-faculty ratios |
| `GET` | `/api/v1/reports/attendance-overview` | Admin, Principal, HOD | College-wide attendance compliance |
| `GET` | `/api/v1/reports/fee-collection` | Admin, Principal, Accounts | Total revenue & fee clearance |

### 4.13 Security Audit Logs (`/api/v1/audit-logs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit-logs` | Super Admin, Principal | Cryptographic event trail of system actions |
