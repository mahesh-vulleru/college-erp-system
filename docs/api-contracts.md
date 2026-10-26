# API Contracts & Endpoints — College ERP

## Base URL
- Local: `http://localhost:5000/api`
- Content-Type: `application/json`
- Authentication: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Health & Diagnostic API

### `GET /api/health`
Public system status and database connectivity endpoint.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-26T10:15:00.000Z",
  "uptime": "120s",
  "environment": "development",
  "database": {
    "status": "connected",
    "readyState": 1,
    "databaseName": "college_erp_dev"
  },
  "service": "college-erp-api",
  "version": "1.0.0"
}
```

---

## 2. Authentication API (`/api/v1/auth`)

### `POST /api/v1/auth/login`
Authenticates a user and returns a signed JWT.

**Request Body**:
```json
{
  "email": "principal@college.edu",
  "password": "SecurePassword123"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "671cc8a1f2b4c19e34567890",
    "name": "Dr. R. K. Sharma",
    "email": "principal@college.edu",
    "role": "principal",
    "department": "Administration"
  }
}
```

**Response `400 Bad Request`**:
```json
{
  "success": false,
  "message": "Request validation failed",
  "errors": ["Please provide a valid email format"]
}
```

**Response `401 Unauthorized`**:
```json
{
  "success": false,
  "message": "Invalid email or password credentials."
}
```

---

### `POST /api/v1/auth/register`
Creates a new account. Super Admin can assign privileged roles; unauthenticated signups default strictly to `student`.

**Request Body**:
```json
{
  "name": "Mahesh Vulleru",
  "email": "student001@college.edu",
  "password": "Password@2026",
  "department": "Computer Science & Engineering"
}
```

**Response `201 Created`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "671cc8b3f2b4c19e34567891",
    "name": "Mahesh Vulleru",
    "email": "student001@college.edu",
    "role": "student",
    "department": "Computer Science & Engineering"
  }
}
```

---

### `GET /api/v1/auth/me`
Fetches current authenticated profile.

**Headers**:
`Authorization: Bearer <TOKEN>`

**Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "671cc8b3f2b4c19e34567891",
    "name": "Mahesh Vulleru",
    "email": "student001@college.edu",
    "role": "student",
    "department": "Computer Science & Engineering",
    "status": "active"
  }
}
```

---

## 3. Standard Response Format

All future API endpoints added by M2, M3, and M4 must adhere to this standard wrapper format:

```json
// Success Response
{
  "success": true,
  "message": "Optional human-readable confirmation",
  "data": { ... }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": ["Optional specific validation error items"]
}
```
