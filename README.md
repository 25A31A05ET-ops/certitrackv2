# CERTITRACK – Student Certificate Management System

**CERTITRACK** is an enterprise-grade, full-stack web application designed for engineering colleges to centralize student certificate submissions, manage multi-tier faculty verification workflows, enforce departmental data isolation, and generate formatted Excel reports directly from an authoritative SQLite database.

---

## 1. Problem Statement & Purpose

### The Challenge
Colleges frequently collect student extracurricular, co-curricular, and technical certificates via ad-hoc spreadsheets and Google Drive folders:
- **Discrepancy**: Students fill the spreadsheet but forget to upload the certificate, or upload files without registering the entry.
- **Verification Burden**: Faculty manually cross-reference disconnected spreadsheet rows with Drive file names.
- **Accidental Deletions**: Historical student records can be overwritten or deleted accidentally in shared spreadsheets.
- **Security & Privacy Leaks**: Students or faculty can view records from other departments without authorization.

### The CERTITRACK Solution
- **Unified Transaction**: Certificate metadata and document files are submitted in an atomic transaction.
- **Single Source of Truth**: The relational database maintains all records; Excel is used strictly as an export format.
- **Multi-Role RBAC**: Strict separation of concerns between Students, Department Faculty, and Super Administrators.
- **Department Security Enforcement**: Faculty accounts are strictly restricted at the database query level to records matching their assigned department.

---

## 2. System Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, `tsx`
- **Database**: SQLite with `better-sqlite3` (WAL mode, parameterized queries, relational foreign keys)
- **Security & Auth**: `bcryptjs` (password hashing with salt), `jsonwebtoken` (JWT bearer tokens)
- **Document Processing**: `multer` with MIME type and 10MB size validation
- **Reporting**: `exceljs` generating formatted, styled spreadsheets (`.xlsx`) matching openpyxl specifications

---

## 3. Roles & Capabilities

| Capability | STUDENT | FACULTY | SUPER ADMIN |
|---|:---:|:---:|:---:|
| View Personal Submissions | ✅ | ❌ | ✅ |
| Upload Own Certificate | ✅ | ❌ | ❌ |
| Upload Classmate Certificate | ✅ | ❌ | ❌ |
| View Department Certificates | ❌ | ✅ (Own Dept Only) | ✅ (All Depts) |
| Verify / Reject Certificate | ❌ | ✅ (Own Dept Only) | ✅ (All Depts) |
| Search / Filter by Class & Type | ❌ | ✅ (Own Dept Only) | ✅ (All Depts) |
| Export Department Excel | ❌ | ✅ (Own Dept Only) | ✅ (Any / All) |
| Approve / Reject Faculty Signups | ❌ | ❌ | ✅ |
| Manage Faculty Directory | ❌ | ❌ | ✅ |
| Cross-Department Matrix | ❌ | ❌ | ✅ |

---

## 4. Pre-Seeded Demonstration Accounts

For demonstration and testing purposes, the system initializes with predefined test accounts and over 30 seeded student certificates across CSE, ECE, EEE, MECH, and CIVIL:

| Role | Username / Identifier | Password | Department / Notes |
|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin123` | Institutional Oversight & Approvals |
| **CSE Faculty** | `cse.faculty` | `faculty123` | Dr. Rajesh Sharma (CSE Dept Only) |
| **ECE Faculty** | `ece.faculty` | `faculty123` | Prof. Ananya Sen (ECE Dept Only) |
| **Demo Student** | `student` | `student123` | Aarav Patel (Roll: 22CSE045) |
| **Pending Faculty** | `mech.faculty` | `faculty123` | Dr. Vikram Verma (Awaiting Approval) |

*Note: The UI includes an instant Demo Switcher bar at the top for 1-click evaluation of all user roles without manual credential typing.*

---

## 5. Security Architecture & 12 Verified Scenarios

The backend enforces strict server-side validation and authorization:

1. **Student -> Faculty Routes**: Calls to `/api/faculty/*` with a Student token return `403 Forbidden`.
2. **Student -> Admin Routes**: Calls to `/api/admin/*` with a Student token return `403 Forbidden`.
3. **Faculty Cross-Department Access**: A CSE Faculty calling `/api/faculty/certificates?department=ECE` is strictly forced by SQL to return CSE certificates only.
4. **Faculty -> Admin Routes**: Calls to `/api/admin/*` with a Faculty token return `403 Forbidden`.
5. **Unapproved Faculty Login**: Login attempts for unapproved faculty accounts return `403 Forbidden` with the message: *"Your faculty account is pending Super Admin review."*
6. **Super Admin Approval Workflow**: Once Super Admin executes `/api/admin/faculty-requests/:id/approve`, the faculty member can immediately authenticate.
7. **Classmate Upload Attribution**: When a student uploads on behalf of a peer, the classmate is designated as the certificate recipient, and the logged-in student is permanently audited in `uploaded_by_user_id`.
8. **MIME Type Validation**: Uploading files other than PDF, PNG, JPG, or JPEG is rejected with `400 Bad Request`.
9. **Payload Size Limits**: Uploading files exceeding 10 MB is rejected by Multer with `400 Bad Request`.
10. **SQL Injection Prevention**: All queries utilize `better-sqlite3` prepared statements with positional parameters (`?`), neutralizing SQL injection attacks.
11. **Session Token Expiration**: Missing, forged, or expired JWT tokens return `401 Unauthorized`.
12. **Direct File Download Guard**: Direct requests to `/api/certificates/:id/file` verify that faculty cannot access document files belonging to students of other departments (`403 Forbidden`).

---

## 6. How to Run & Build

### Development Mode
```bash
npm install
npm run dev
```
The application boots on `http://localhost:3000` with the Express API server and Vite middleware running concurrently.

### Production Build
```bash
npm run build
npm start
```
- Compiles the React client application into `dist/`.
- Bundles `server.ts` into a self-contained CommonJS artifact (`dist/server.cjs`) via `esbuild`.
- Launches the standalone production server via `node dist/server.cjs`.

---

## 7. API Summary

### Authentication
- `POST /api/auth/login`: Authenticate via email, username, roll number, or faculty ID.
- `POST /api/auth/register`: Register a new student account.
- `POST /api/faculty/request`: Submit a new faculty access request (status: PENDING).
- `GET /api/auth/me`: Retrieve currently authenticated user session.

### Student Endpoints
- `GET /api/students/profile`: Profile information and verification counters.
- `GET /api/students/submissions`: List of submitted certificates.
- `POST /api/certificates/upload`: Upload a certificate for oneself or a classmate.

### Faculty Endpoints
- `GET /api/faculty/dashboard`: Department-scoped metrics and recent pending queue.
- `GET /api/faculty/certificates`: Search and filter department certificates.
- `GET /api/faculty/students`: Department student directory.
- `GET /api/faculty/export`: Download formatted department Excel spreadsheet.
- `POST /api/certificates/:id/verify`: Set certificate status to `VERIFIED` or `UNVERIFIED`.

### Super Admin Endpoints
- `GET /api/admin/dashboard`: Institutional overview and department matrix.
- `GET /api/admin/faculty-requests`: Pending faculty signups.
- `POST /api/admin/faculty-requests/:id/approve`: Approve faculty account.
- `POST /api/admin/faculty-requests/:id/reject`: Reject faculty account.
- `GET /api/admin/faculty`: Complete faculty directory.
- `GET /api/admin/students`: Cross-department student registry.
- `GET /api/admin/certificates`: Institutional certificate ledger.
- `GET /api/admin/export`: Export master Excel report across all or selected departments.
