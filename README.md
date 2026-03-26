# Smart Examination Paper Distribution System

Role-based exam paper distribution platform with secure workflows for:
- `ADMIN`
- `PAPER_SETTER`
- `INVIGILATOR`

Built with:
- Frontend: React + Vite + Tailwind + MUI + Recharts
- Backend: Node.js + Express + MongoDB (Mongoose)

## Current Implementation Status

### 1) Database Integration (MongoDB)
- Replaced app data storage from browser-only `localStorage` to MongoDB-backed APIs.
- Added separate collections for core entities:
  - `scheduled_exams`
  - `exam_papers`
  - `print_requests`
  - `notifications`
  - `audit_logs`
- Added role-specific auth collections:
  - `setters`
  - `invigilators`

### 2) Auth and Registration
- Added backend auth APIs:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/google`
- Added new registration page:
  - `/newregister`
  - Supports name, email, password, role (`PAPER_SETTER` / `INVIGILATOR`)
  - Google sign-up with role assignment
- Login supports:
  - Local email/password
  - Google Sign-In

### 3) Google Authentication
- Integrated Google Identity Services in frontend.
- Backend verifies Google ID token using `google-auth-library`.
- Required env vars:
  - `client/.env` -> `VITE_GOOGLE_CLIENT_ID`
  - `server/.env` -> `GOOGLE_CLIENT_ID`
- Must configure OAuth **Authorized JavaScript origins** in Google Cloud Console (for example `http://localhost:5173`).

### 4) Role-Based Assistant Chatbot
- Added floating in-app assistant for all dashboard users.
- Role-aware behavior:
  - Admin assistant
  - Setter assistant
  - Invigilator assistant
- Supports natural-language commands:
  - page navigation
  - sync actions
  - offline/cloud mode switch
  - role-specific summaries from DB
  - notification operations

### 5) UI/UX Updates
- Responsive layout improvements:
  - Mobile sidebar drawer + navbar menu toggle
  - Better mobile spacing and content flow
- `Uploader` page improved for mobile responsiveness.
- `AdminApprovals` redesigned to analytics-first page:
  - status visualization
  - trends
  - course demand chart
  - queue + decision feed

### 6) App Data Workflows Completed
- Scheduler writes/reads exams from DB.
- Paper upload workflow writes to DB and audit logs.
- Print request flow fully DB-backed.
- Admin approval/reject DB-backed with notifications.
- Paper verification/release DB-backed.
- Audit logs and notifications read from DB.

## Project Structure

- `client/` -> frontend app
- `server/` -> backend API + DB models/routes

## Environment Setup

### Server (`server/.env`)
```env
MONGO_URL=mongodb://127.0.0.1:27017/smart_exam_db
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_web_client_id
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
```

## Run Locally

### 1) Backend
```bash
cd server
npm install
npm run dev
```

### 2) Frontend
```bash
cd client
npm install
npm run dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:5000`

## Deployment and CI/CD

### Environment Templates

Use the included templates before running or deploying:

- `server/.env.example`
- `client/.env.example`

Copy them to real env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Docker Deployment

Production-style container assets are included:

- `server/Dockerfile`
- `client/Dockerfile`
- `client/nginx.conf`
- `docker-compose.yml`

Start the full stack with Docker Compose:

```bash
docker compose up --build
```

Default ports:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

### CI Pipeline

GitHub Actions workflow included:

- `.github/workflows/ci.yml`

Current CI checks:

- Server dependency install
- Server automated tests (`npm test`)
- Client dependency install
- Client production build (`npm run build`)

### Database Hardening

An index synchronization script is included for schema/index rollout:

```bash
cd server
npm run db:sync-indexes
```

Use this after deploying new schema/index changes so MongoDB aligns with the latest model definitions.

### Operational Endpoints

Backend health check:

```bash
GET /health
```

Returns uptime, environment, and request ID information.

## Useful MongoDB Collections to Inspect

- `setters`
- `invigilators`
- `print_requests`
- `exam_papers`
- `scheduled_exams`
- `notifications`
- `audit_logs`

## Notes

- Local `.env` files are not meant to be committed.
- Google client secret is not required in frontend flow and should not be exposed.
- Demo OTP mode can be enabled with:
  - `USE_STATIC_OTP=true`
  - `COMMON_OTP=123456`
- For stricter environments, disable static OTP and configure SMTP credentials.
