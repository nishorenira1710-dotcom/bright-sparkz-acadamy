# Bright Sparkz Academy - Tuition Center Management System

A production-grade, secure, mobile-first Tuition Center Management System for **Bright Sparkz Academy** designed for tuition centers managing active student cohorts with multi-year historical retention. Built with React 19, TypeScript, Vite, Tailwind CSS, Google Cloud Firestore, and Firebase Authentication.

---

## Table of Contents
1. [Section A: Local Development](#section-a-local-development)
2. [Section B: Firebase Project & Infrastructure Setup](#section-b-firebase-project--infrastructure-setup)
3. [Section C: Initial Administrator Provisioning](#section-c-initial-administrator-provisioning)
4. [Section D: Firestore & Storage Security Rules](#section-d-firestore--storage-security-rules)
5. [Section E: Production Deployment](#section-e-production-deployment)
6. [Section F: Backend Dependencies & Privileged Operations](#section-f-backend-dependencies--privileged-operations)
7. [Section G: Production Verification & Readiness Checklist](#section-g-production-verification--readiness-checklist)

---

## Section A: Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm / yarn)

### 2. Dependency Installation
```bash
npm install
```

### 3. Environment Setup
Copy the sample environment file to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase credentials in `.env` (see Section B).

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 5. Running Linting & Type Checking
```bash
npm run lint
```

### 6. Building for Production
```bash
npm run build
```

---

## Section B: Firebase Project & Infrastructure Setup

This application connects directly to Google Firebase. Follow these manual steps in the Firebase Console:

### 1. Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**, name it `bright-sparkz-academy` (or your preferred name), and choose whether to enable Google Analytics.
3. Select your cloud billing and default resource location (e.g. `asia-south1` for India or `us-central1`).

### 2. Register the Web Application
1. In the Project Overview page, click the **Web** icon (`</>`) to add a web application.
2. Enter the app nickname (e.g. `Bright Sparkz Web`).
3. Click **Register app** and locate the `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 3. Enable Firebase Authentication
1. In the left navigation, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable **Email/Password** and click **Save**.
5. *Security Note:* Public signup is disabled in the frontend to protect private student and financial records. Administrator accounts and parent accounts are provisioned exclusively by tuition administration.

### 4. Provision Cloud Firestore
1. In the left navigation, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** (which enables security rules).
4. Select your preferred Cloud Firestore region (e.g., `asia-south1` or `nam5`).
5. Click **Enable**.

### 5. Configure Local `.env`
Update your local `.env` file with the keys obtained in Step 2:
```env
VITE_FIREBASE_API_KEY="AIzaSyYourGeneratedApiKey..."
VITE_FIREBASE_AUTH_DOMAIN="bright-sparkz-academy.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="bright-sparkz-academy"
VITE_FIREBASE_STORAGE_BUCKET="bright-sparkz-academy.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
```

### 6. Deploy Firestore Security Rules & Composite Indexes
Install the Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
firebase login
firebase use --add bright-sparkz-academy
```
Deploy the rules and composite indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

---

## Section C: Initial Administrator Provisioning

**Security Requirement:** Public self-registration for the `ADMIN` role is strictly disabled. The administrator role is verified server-side against `users/{uid}` in Cloud Firestore.

### Procedure to Provision the First Administrator:
1. In the Firebase Console, go to **Authentication** > **Users** tab.
2. Click **Add user**.
3. Enter the administrator's email (e.g., `admin@brightsparkz.edu`) and set a secure password. Click **Add user**.
4. Copy the newly created user's **User UID** (e.g., `K9xL2mQp7Rt4...`).
5. In **Firestore Database**, click **Start collection**:
   - **Collection ID:** `users`
   - **Document ID:** Paste the administrator's User UID (e.g., `K9xL2mQp7Rt4...`)
6. Add the following document fields:
   | Field | Type | Value |
   | :--- | :--- | :--- |
   | `uid` | `string` | *(Paste the administrator UID)* |
   | `email` | `string` | `admin@brightsparkz.edu` |
   | `displayName` | `string` | `Tuition Center Director` |
   | `role` | `string` | `ADMIN` |
   | `active` | `boolean` | `true` |
   | `phoneNumber` | `string` | `+91 98450 12345` |
   | `createdAt` | `string` | `2026-10-21T00:00:00.000Z` |
   | `updatedAt` | `string` | `2026-10-21T00:00:00.000Z` |
7. Click **Save**.
8. The administrator can now navigate to `/login` and sign in with their credentials. The system verifies their role and redirects directly to `/admin/dashboard`.

### Provisioning Parent Accounts:
1. Administrators create parent accounts directly in the admin portal under `/admin/parents`.
2. This creates the user profile document and establishes deterministic parent-student links:
   `parentStudentLinks/{parentUid}_{studentId}`.
3. Parents can only view students who are explicitly linked and authorized.

---

## Section D: Firestore & Storage Security Rules

The application uses `rules_version = '2'` with strict default-deny architecture.

### Key Rules Protections:
1. **Users (`/users/{userId}`):**
   - Read allowed only if authenticated user is the document owner or an active `ADMIN`.
   - Creation restricted to admins.
   - Users cannot escalate their own role (`role == resource.data.role`).
   - Parents cannot change their own `active` status or tamper with immutable `uid`.
2. **Students (`/students/{studentId}`):**
   - Full read/write for admins.
   - Parents can read **only** if linked via `parentStudentLinks/{parentUid}_{studentId}` with `authorized == true`.
   - Global listing by parents is strictly denied.
3. **Attendance (`/attendance/{attendanceId}`):**
   - Document ID must follow `{studentId}_{sessionId}`.
   - Only admins can write attendance.
   - `PRESENT` records require valid arrival timestamps.
   - `LEFT` status requires prior `PRESENT` and preserves original arrival timestamp.
   - Departure timestamp must not precede arrival timestamp.
4. **Fees & Payments (`/feeRecords` & `/payments`):**
   - Currency stored exclusively in integer paise (`₹1,500.00` = `150000`).
   - Payments must be `CASH` or `UPI`.
   - Confirmed payment records cannot be deleted. Corrections require an audited `REVERSED` status with non-empty reason.
5. **Storage Rules (`storage.rules`):**
   - Tuition Center logo: Public read, Admin write (< 2MB, MIME `image/*`).
   - Student Exit Reports: Restricted exclusively to active administrators.

---

## Section E: Production Deployment

### Building the SPA
```bash
npm run build
```
The compiled production bundle is generated in `/dist`.

### Deploying to Firebase Hosting:
```bash
firebase deploy --only hosting
```

### Hosting Configuration (`firebase.json`):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Section F: Backend Dependencies & Privileged Operations

### Firebase Spark Plan Compatibility:
- Cloud Firestore and Firebase Authentication operate fully within Firebase Spark (free) tier limits for ~100 students:
  - Document reads: 50,000 / day
  - Document writes: 20,000 / day
  - Document deletes: 20,000 / day
  - Simultaneous connections: 100
- **Optimizations Implemented:**
  - Pagination on student and payment directories (`limit` and cursor queries).
  - Selective document fetches instead of whole-collection streaming listeners.
  - Snapshot listeners unsubscribe on unmount to prevent lingering listeners.

### Privileged Operations & Future Microservices:
- **Student Exit & Permanent Deletion:** Executed via the 5-step audited job state machine (`REQUESTED` -> `REPORT_GENERATING` -> `REPORT_STORED` -> `REPORT_VERIFIED` -> `DELETING` -> `COMPLETED`).
- In high-compliance environments, permanent deletion can be delegated to a Firebase Cloud Function using the Firebase Admin SDK to execute transactional batch purges.

---

## Section G: Production Verification & Readiness Checklist

- [x] **Zero Mock Data:** All mock services, fake logins, demo role switches, and demo toggles removed.
- [x] **Branding Asset:** Official Bright Sparkz logo (`Bright_sparkz_ffb722c0.jpg`) integrated into header, login, receipts, loading animations, and reports with aspect ratio preservation.
- [x] **Liquid-Glass Design:** Translucent layered glass surfaces, `backdrop-blur-xl`, fine semi-transparent borders, and layered shadows.
- [x] **Role Isolation:** Strict separation between `ADMIN` and `PARENT` portals.
- [x] **Financial Integrity:** All monetary balances and fees stored in integer paise.
- [x] **Printable Receipts:** Print-ready CSS styles with center details, receipt numbers, and payment breakdown.
- [x] **Security Rules:** Comprehensive `firestore.rules` and `storage.rules` with unit test suite in `tests/firestore.rules.test.ts`.
- [x] **Production Build:** Passes `npm run build` and `npm run lint` cleanly.
