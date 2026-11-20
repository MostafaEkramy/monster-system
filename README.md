# MONSTERS TEAM MANAGEMENT SYSTEM
## Mansoura National University — Enterprise Organizational Management Platform

A comprehensive, production-ready web application designed and built specifically for the **Monsters Team at Mansoura National University**.

---

## 🌟 Brand Identity & Official Color System

Following the official Monsters Team visual identity:

- **Primary Green**: `#8EDB2A` (Action buttons, active tabs, highlights)
- **Original Neon Green**: `#A6FC31`
- **Hover Green**: `#A3EB45`
- **Dark Green**: `#6FA51F`
- **Light Green**: `#D9F7A8`
- **Green Surface**: `#1C2B12`

### Themes & Dark/Light Mode
- **Dark Mode (Default)**: `#0B0E0A` (Background), `#11160F` (Sidebar), `#151B13` (Cards), `#1B2318` (Elevated), `#293324` (Borders).
- **Light Mode**: `#F7F9F5` (Background), `#FFFFFF` (Cards & Sidebar), `#E5EBDD` (Borders).
- Theme persists automatically across sessions in `localStorage`.

---

## 🌍 Internationalization (i18n)

Full bidirectional language support:
1. **English (LTR)**
2. **العربية (RTL)**

Features:
- Complete UI translation for all pages, buttons, badges, errors, and dialogs.
- Automatic document direction switching (`dir="rtl"` vs `dir="ltr"`).
- Consistent committee naming in English and Arabic:
  - Logistics / اللوجستيات
  - Creativity / الإبداع
  - Media / الإعلام
  - PR / العلاقات العامة
  - HR / الموارد البشرية
  - Activity / الأنشطة

---

## 🏛️ Organizational Structure & Roles (RBAC)

The system supports strict Role-Based Access Control:

| Role | Permissions |
|---|---|
| **MAGIC (Super Admin)** | Absolute control over all 6 committees, accounts, approval/rejection, role modification, task creation, grading, evaluations, attendance, seasons, activity logs, settings. |
| **PRESIDENT & VICE PRESIDENT** | Global read-only visibility into all 6 committees, tasks, leaderboards, attendance, evaluations, analytics. Cannot mutate operational data. |
| **COMMITTEE LEADER** | Scoped to their own committee only. Create/manage tasks, assign to members, view submissions, record committee attendance, view committee leaderboard. |
| **HR LEADER & HR MEMBERS** | Cross-committee evaluation permissions. Grade task submissions with flexible maximum points, provide constructive feedback, finalize scores, update leaderboards, record attendance across all committees. |
| **REGULAR MEMBERS** | View assigned tasks, submit responses (text + file attachments), view late status indicators, edit/resubmit before evaluation is locked, view earned season points, committee rank, and attendance rate. |

---

## 🚀 Key Modules & Capabilities

1. **Magic Initialization Bootstrap**:
   - Protected one-time setup mechanism at `/magic-setup` with setup secret (`MONSTERS_MAGIC_2024` or via `.env`).
   - Prevents unauthorized registration as Magic.

2. **Pending Registration & Approval**:
   - Public registration assigns `pending` status.
   - Dedicated Magic approval dashboard (`/pending-registrations`) to review applicants, assign committee, and choose starting role.

3. **Task & Deliverables System**:
   - Single member, multiple members, or entire committee assignment.
   - Rich descriptions, priority badges (Low, Medium, High, Urgent), deadlines, and submission requirements.
   - Automatic late submission detection with visible flag (without hard-blocking member delivery).
   - Multi-file uploads via Firebase Storage with progress tracking.
   - Multi-version resubmission history prior to evaluation finalization.

4. **HR Evaluation Engine**:
   - Flexible scoring (no rigid 10 or 100 limit; maximum score defined per task).
   - Real-time score aggregation using Firestore transactions (prevents race conditions or client tampering).
   - Constructive text feedback delivered directly to the member.
   - Locking submission upon finalization.

5. **Independent Committee Leaderboards**:
   - 6 isolated committee leaderboards (Logistics, Creativity, Media, PR, HR, Activity).
   - Podium rendering for 1st, 2nd, and 3rd place with gold/silver/bronze badges.
   - Consistent tie-handling with cumulative points calculation.

6. **Season Management & Archives**:
   - Active season system where scores accumulate for the active period.
   - Zero-point reset upon launching a new season while archiving historical data immutably.

7. **Attendance Tracking**:
   - Session creation with date and committee scope.
   - Attendance statuses: Present, Absent, Late, Excused.
   - Member attendance rate calculated consistently (excused absences excluded from penalties).

8. **Audit Trail (Activity Log)**:
   - Every administrative, assignment, evaluation, and registration action is logged in Firestore with actor ID, timestamp, and metadata.

9. **In-App Notification Center**:
   - Real-time Firestore notification alerts for New Tasks, Deadlines, Evaluation Results, Attendance, and Registrations.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router v7
- **Data & Charts**: Recharts, TanStack Query, React Hook Form, Zod
- **Backend & Cloud**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **Internationalization**: i18next & react-i18next

---

## 📦 Local Setup Instructions

1. **Clone repository & install dependencies**:
   ```bash
   cd "monster system"
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase project configuration credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_MAGIC_SETUP_SECRET=MONSTERS_MAGIC_2024
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔒 Deploying Firebase Security Rules

Deploy the included production security rules to your Firebase console:

```bash
# Firestore rules
firebase deploy --only firestore:rules

# Storage rules
firebase deploy --only storage
```

---

## ☁️ Deployment on Vercel

1. Push the project repository to GitHub / GitLab.
2. In the Vercel Dashboard, click **New Project** and select the repository.
3. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In the **Environment Variables** section, add all variables from your `.env` file (`VITE_FIREBASE_*` and `VITE_MAGIC_SETUP_SECRET`).
5. Click **Deploy**.
6. Set up Single Page App rewrite in `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
