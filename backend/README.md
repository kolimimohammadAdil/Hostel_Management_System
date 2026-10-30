# HOSTELGUARD AI — Backend Foundation Service

Backend API server for **HOSTELGUARD AI** (Intelligent Hostel Security and Leave Management System Using Face Recognition). Built with Node.js, Express, TypeScript, and strict architectural separation.

---

## 📋 Architectural Overview

- **Runtime**: Node.js (v20+ recommended, v24 supported)
- **Framework**: Express.js
- **Language**: TypeScript (Strict typing enabled)
- **Security**: Helmet HTTP headers, configurable CORS origin restrictions
- **Process Management**: TSX for hot-reload development; TSC for production builds
- **Status**: Operational with MongoDB Atlas connection, Mongoose models, and JWT + RBAC Authentication.

---

## 📁 Directory Structure

```text
server/
├── src/
│   ├── config/
│   │   ├── database.ts            # Mongoose connection & state reporting
│   │   └── env.ts                 # Validated environment settings
│   ├── controllers/
│   │   ├── auth.controller.ts     # Register, Login, and GetMe controllers
│   │   └── health.controller.ts   # Process health and uptime diagnostic controller
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication & role-based authorization (RBAC)
│   │   ├── errorHandler.ts        # Central error handler (sanitizes stack in prod)
│   │   ├── notFound.ts            # Central 404 handler for unmatched routes
│   │   ├── rateLimiter.ts         # In-memory IP rate limiter for auth endpoints
│   │   └── index.ts               # Barrel re-export
│   ├── models/
│   │   ├── user.model.ts          # User schema & 7 roles
│   │   ├── leaveApplication.model.ts
│   │   ├── movementLog.model.ts
│   │   ├── notification.model.ts
│   │   ├── maintenanceRequest.model.ts
│   │   └── index.ts               # Barrel re-export
│   ├── routes/
│   │   ├── auth.routes.ts         # Auth API routes (/api/auth)
│   │   ├── health.routes.ts       # Health endpoint routing (/api/health)
│   │   └── index.ts               # Central /api router
│   ├── services/
│   │   ├── auth.service.ts        # Business logic for auth
│   │   └── index.ts               # Barrel re-export
│   ├── utils/
│   │   └── auth.ts                # Bcrypt password hashing & JWT signing/verification
│   ├── app.ts                     # Express app factory with middleware pipeline
│   └── server.ts                  # HTTP server listener and graceful shutdown
├── .env.example                   # Environment configuration template
├── package.json                   # Backend dependencies and execution scripts
├── tsconfig.json                  # TypeScript compiler options (Node/CommonJS)
├── verify-auth.mjs                # Automated verification for auth & RBAC
├── verify-models.mjs              # Automated validation for Mongoose models
└── README.md                      # Backend documentation
```

---

## ⚙️ Prerequisites

- **Node.js**: `v20.x` or higher (`node -v`)
- **npm**: `v10.x` or higher (`npm -v`)

---

## 🚀 Setup & Installation

### 1. Install Backend Dependencies
Open a terminal in the `server` directory:

```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` template to `.env`:

```bash
# Windows PowerShell
copy .env.example .env

# Bash / macOS / Linux
cp .env.example .env
```

Default variables in `.env`:
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/hostelguard_ai_placeholder
JWT_SECRET=your_jwt_secret_key_placeholder_change_in_production
```

> **Note**: `MONGODB_URI` and `JWT_SECRET` are placeholders reserved for subsequent phases. No database or auth connection is initialized in this foundation phase.

---

## 🏃 Running the Application

### Development Mode (with hot-reloading)
Runs TypeScript directly with `tsx`:

```bash
cd server
npm run dev
```

### Production Build
Compiles TypeScript into production JavaScript in the `dist/` directory:

```bash
cd server
npm run build
```

### Production Execution
Runs the compiled bundle using Node.js:

```bash
cd server
npm start
```

---

## 🌐 Running Fullstack (Frontend + Backend)

To run both frontend and backend concurrently, open two separate terminal windows:

### Terminal 1: React + Vite Frontend
```bash
# From repository root
npm run dev
# -> Runs on http://localhost:5173
```

### Terminal 2: Express + TypeScript Backend
```bash
# From server directory
cd server
npm run dev
# -> Runs on http://localhost:5000
```

---

## 🩺 Health Check & API Verification

### 1. Process Health Check
```http
GET http://localhost:5000/api/health
```

**Sample Response (`200 OK`)**:
```json
{
  "success": true,
  "application": "HostelGuard AI",
  "status": "healthy",
  "message": "HostelGuard AI backend service is running",
  "environment": "development",
  "timestamp": "2026-10-28T12:45:00.000Z",
  "uptimeSeconds": 14,
  "database": {
    "connected": false,
    "status": "not_connected",
    "note": "Database connectivity is not integrated in this foundation phase"
  }
}
```

### 2. Unmatched Route (404 Not Found)
```http
GET http://localhost:5000/api/non-existent-route
```

**Sample Response (`404 Not Found`)**:
```json
{
  "success": false,
  "message": "Resource not found: Cannot GET /api/non-existent-route",
  "path": "/api/non-existent-route",
  "method": "GET",
  "timestamp": "2026-10-28T12:45:05.000Z"
}
```

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

The backend implements JWT-based bearer authentication and multi-tier role authorization.

### Supported Roles
1. `student` (Default public self-registration)
2. `parent` (Public self-registration)
3. `girls_warden` (Privileged — administrative provisioning only)
4. `boys_warden` (Privileged — administrative provisioning only)
5. `gate_security` (Privileged — administrative provisioning only)
6. `mess_incharge` (Privileged — administrative provisioning only)
7. `maintenance_incharge` (Privileged — administrative provisioning only)

### Endpoints

#### 1. Register Account
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "password": "SecurePassword123!",
  "role": "student",
  "rollNumber": "21CS042",
  "hostelName": "ALTS Boys Hostel",
  "roomNumber": "A-101",
  "phone": "9876543210"
}
```
*Note*: Attempting to register as a privileged role (warden, security, mess, maintenance) via the public endpoint is rejected with HTTP 400.

#### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "aarav.sharma@example.com",
  "password": "SecurePassword123!"
}
```
Returns a signed JSON Web Token (`token`) and a sanitized user profile.

#### 3. Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```
Returns the authenticated user's safe profile. Requires a valid token; missing or invalid tokens return HTTP 401.

---

## 🩺 Automated Test Suites

```bash
# Verify Mongoose domain models (35 assertions)
node server/verify-models.mjs

# Verify Authentication, JWT, and RBAC middleware (27 assertions)
node server/verify-auth.mjs

# Verify frontend workflows & state invariants (79 assertions)
node verify-workflows.mjs
```

- **Security Headers**: Managed by `helmet`.
- **CORS**: Configured dynamically to trust `FRONTEND_URL` (default: `http://localhost:5173`) while permitting safe local development.
- **Error Shielding**: Stack traces and internal diagnostics are automatically hidden when `NODE_ENV=production`.
- **Graceful Termination**: Handles `SIGINT` and `SIGTERM` signals cleanly to release sockets without orphaned processes.

