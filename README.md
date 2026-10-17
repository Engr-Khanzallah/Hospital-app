# 🏥 MediCare - Hospital Appointment Booking System

A full-stack MERN application for hospital appointment booking with patient and admin dashboards and a free-tier AI health assistant.

![MediCare](https://img.shields.io/badge/MediCare-Hospital%20App-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Express](https://img.shields.io/badge/Express.js-Backend-black?style=for-the-badge&logo=express)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=node.js)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🌍 **Frontend (Netlify)** | https://hospital-app-bookappointment.netlify.app/ |
| ⚙️ **Backend API (Vercel)** | https://hospital-backend-app.vercel.app |
| 📡 **API Health Check** | https://hospital-backend-app.vercel.app/ |

---

## 🔐 Admin Account

There is **no default or published admin password**. The administrator is created by the seed script
(`node seed.js`) from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values in your own backend `.env` file.
Choose a strong password and never commit it. After logging in, the admin is redirected to `/admin`.

## 👤 Patient Registration

Patients register on the frontend at `/register`.

---

## ✨ Features

### Patient Side
- ✅ Register & Login with JWT Authentication
- ✅ Browse doctors with search & filter by specialty
- ✅ View detailed doctor profiles with weekly schedule
- ✅ Book appointments: only real free slots are offered, taken or already-passed slots are disabled
- ✅ View & cancel appointments, status badges (Pending / Confirmed / Completed / Cancelled)
- ✅ Edit personal profile & change password
- ✅ **AI Assistant** (`/assistant`): general health information and help finding a doctor

### Admin Panel
- ✅ Dashboard with analytics (total patients, doctors, revenue)
- ✅ Add / Edit / Archive doctors with Cloudinary image upload
- ✅ Weekly schedule management per doctor
- ✅ Manage appointments (Confirm / Complete / Cancel) with enforced status flow
- ✅ Patient list with activate / deactivate / delete (patients with history can only be deactivated)
- ✅ Contact message inbox with read/unread tracking

### Booking rules enforced by the server
- The doctor must exist, be active and be accepting appointments.
- The date must not be in the past (and not more than `BOOKING_MAX_ADVANCE_DAYS` ahead).
- The time slot must be one of the doctor's real slots for that weekday, and not already over today.
- One active appointment per doctor + day + slot. This is guaranteed by a **partial unique index** in MongoDB,
  so two people clicking at the same instant cannot both succeed. The loser gets a clear "slot already booked" message.
- Status flow: `pending → confirmed → completed`, and `pending/confirmed → cancelled`. Completed and cancelled are final.
- Dates are **calendar days at the hospital** (`HOSPITAL_TIMEZONE`), so every visitor sees the same day.

### Data integrity
- A patient who has appointments cannot be deleted (deactivate instead).
- A doctor with upcoming appointments cannot be removed. A doctor with past appointments is **archived** (hidden, history kept); a doctor with no appointments is deleted together with the Cloudinary image.
- A department that still has doctors cannot be deleted.

---

## 🤖 AI Assistant

`POST /api/ai/chat` (login required) calls Google Gemini using the **free tier**. Billing is never required or enabled.

- Body: `{ "message": "text up to 2000 characters", "history": [{ "role": "user" | "assistant", "content": "..." }] }` (history optional, last 6 turns used)
- Response: `{ "success": true, "reply": "plain text", "safety"?: "emergency" | "self_harm", "redacted"?: true }`
- The assistant only shares general information. It does not diagnose, prescribe, invent doctors or fees, or claim to book anything. It only knows the public doctor directory (name, specialty, fee, schedule). **No patient records or accounts are sent to Gemini.**
- Before anything is sent, e-mail addresses and long numbers (phone / ID / card style) are removed.
- Emergency or self-harm wording gets an immediate fixed answer telling the user to contact local emergency services, without calling Gemini.
- Protected by per-user (per minute and per day) and global per-minute limits to protect the free quota.
- The model is set with `GEMINI_MODEL` (default `gemini-3.1-flash-lite`). If the configured model has been retired (HTTP 404), the server retries once with the default model.
- The API key stays on the server. Answers are shown in the browser as plain text (no HTML rendering).

> Free-tier note: Google may use free-tier prompts to improve its products, so users are told not to type personal details.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js + Vite + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT (JSON Web Tokens) |
| **Image Upload** | Cloudinary |
| **AI** | Google Gemini (free tier) via `@google/genai` |
| **Frontend Hosting** | Netlify |
| **Backend Hosting** | Vercel |

---

## 📁 Project Structure

```
hospital-app/
├── backend/
│   ├── app.js                 # builds the Express app (used by server.js and the tests)
│   ├── server.js              # entry point (local server / Vercel export)
│   ├── config/cloudinary.js
│   ├── controllers/           # admin, appointment, auth, contact, department, doctor, user
│   ├── middleware/            # auth, rateLimit, errorHandler
│   ├── models/                # Appointment, ContactMessage, Department, Doctor, User
│   ├── routes/                # incl. aiRoutes.js
│   ├── services/              # aiService.js (Gemini), aiGuard.js (privacy + safety)
│   ├── utils/                 # validate, scheduling (timezone + slots), httpError, appointmentMigration
│   ├── scripts/               # migrate-appointments.js, test-booking-concurrency.mjs
│   ├── tests/                 # node:test suites (npm test)
│   ├── .env.example
│   ├── seed.js
│   └── vercel.json
│
└── frontend/
    ├── public/_redirects
    ├── .env.example
    └── src/
        ├── components/        # admin, appointment, common, doctor
        ├── context/           # AuthContext, AppContext
        ├── pages/             # Home, Doctors, DoctorDetail, BookAppointment, Assistant, ... admin/, patient/
        └── utils/             # api.js, dates.js
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js v18+ (v22 recommended)
- MongoDB Atlas account (free)
- Cloudinary account (free)
- Optional: free Gemini API key from https://aistudio.google.com/apikey

### Step 1 - Clone the repository

```bash
git clone https://github.com/Engr-Khanzallah/Hospital-app.git
cd Hospital-app
```

### Step 2 - Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `backend/.env` and fill in your real values (every variable is explained in `.env.example`).
The required ones are `MONGODB_URI`, `JWT_SECRET`, the three `CLOUDINARY_*` values, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
`GEMINI_API_KEY` is only needed for the AI assistant.

Seed the database (creates the admin account and departments):

```bash
node seed.js
```

Start the backend (http://localhost:5000):

```bash
npm run dev
```

### Step 3 - Frontend

```bash
cd ../frontend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Frontend runs on http://localhost:5173 and talks to `VITE_API_URL` (default `http://localhost:5000/api`).

### Existing database? Run the one-off migration

If your database already contains appointments, run this **once** before relying on the new duplicate-booking protection.
Take a MongoDB backup first (Atlas > Backup, or `mongodump`).

```bash
cd backend
npm run migrate:appointments               # DRY RUN: only prints a report
npm run migrate:appointments -- --apply    # writes a JSON backup first, then applies
```

It normalizes appointment dates to the hospital calendar day, marks active appointments as protected, and builds the unique index.
It never deletes or cancels anything. If two active bookings already collide on one slot, they are listed for you to resolve (for example by cancelling one in the admin panel).

---

## 🧪 Testing

```bash
cd backend
npm test                      # 66 automated tests, no database or API key needed
npm run test:concurrency      # needs a throw-away MongoDB: set MONGODB_URI_TEST (name must contain "test")
```

`npm test` covers validation, authentication/authorization, booking rules, duplicate-booking handling, status transitions,
deletion integrity, rate limiting, CORS and the AI endpoint (with the AI provider stubbed). `npm run test:concurrency` fires
10 simultaneous bookings of one slot against a real MongoDB and expects exactly one to succeed.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Patient register |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/admin-login` | Admin login |
| GET | `/api/auth/me` | Get current user |

### Doctors
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/doctors` | Get all doctors | No |
| GET | `/api/doctors/featured` | Featured doctors | No |
| GET | `/api/doctors/:id` | Single doctor | No |
| POST | `/api/doctors` | Create doctor | Admin |
| PUT | `/api/doctors/:id` | Update doctor | Admin |
| DELETE | `/api/doctors/:id` | Delete or archive doctor | Admin |

### Appointments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/appointments` | Book appointment (`appointmentDate` as `yyyy-MM-dd`) | Patient |
| GET | `/api/appointments/booked-slots?doctorId=&date=` | Taken slots for a doctor and day | Logged in |
| GET | `/api/appointments/my` | My appointments | Patient |
| PUT | `/api/appointments/:id/cancel` | Cancel | Patient |
| GET | `/api/appointments` | All appointments | Admin |
| PUT | `/api/appointments/:id/status` | Update status | Admin |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Get profile | Patient |
| PUT | `/api/users/profile` | Update profile | Patient |
| PUT | `/api/users/change-password` | Change password | Patient |
| GET | `/api/users` | All patients | Admin |
| DELETE | `/api/users/:id` | Delete patient (only without appointments) | Admin |
| PUT | `/api/users/:id/toggle-status` | Activate / deactivate | Admin |

### AI
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/chat` | Ask the AI assistant | Logged in |

---

## 🚀 Deployment

### Backend - Vercel

1. Connect the GitHub repo to Vercel.
2. Set **Root Directory** to `backend` (`vercel.json` already points to `server.js`).
3. Add the environment variables listed below in the Vercel dashboard.
4. Deploy, then open the API health-check URL.

### Frontend - Netlify

1. Connect the GitHub repo to Netlify.
2. **Base directory** `frontend`, **Build command** `npm run build`, **Publish directory** `frontend/dist`.
3. Add `VITE_API_URL` = your backend URL followed by `/api`.
4. Deploy. `public/_redirects` makes client-side routes such as `/assistant` work after a refresh.

### After deploying
- Set `CORS_ORIGINS` on the backend to your Netlify URL (and any custom domain).
- Rate limits are kept in memory per server instance. On Vercel each warm instance has its own counters, so they are a best-effort brake, not a hard global limit.
- Test it: register, log in, book an appointment, open `/assistant`.

---

## 📦 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for explanations and defaults. Never commit real `.env` files.

### Backend
```
Required : MONGODB_URI, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
Seeding  : ADMIN_EMAIL, ADMIN_PASSWORD
Optional : PORT, NODE_ENV, JWT_EXPIRE, CORS_ORIGINS, HOSPITAL_TIMEZONE, BOOKING_MAX_ADVANCE_DAYS
AI       : GEMINI_API_KEY, GEMINI_MODEL, AI_USER_RPM, AI_USER_DAILY, AI_GLOBAL_RPM, AI_TIMEOUT_MS, AI_DOCTOR_LIMIT, AI_DIRECTORY_TTL_MS
Limits   : RATE_LOGIN_MAX, RATE_REGISTER_MAX, RATE_CONTACT_MAX, RATE_BOOKING_MAX
Testing  : MONGODB_URI_TEST
```

### Frontend
```
VITE_API_URL, VITE_HOSPITAL_TIMEZONE (optional)
```

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt; the JWT format is unchanged. Deleted or deactivated users are rejected on every request.
- Inputs are validated and request bodies are never spread into database updates; only allowlisted fields are saved.
- Login, register, contact, booking and AI chat are rate limited. CORS can be restricted with `CORS_ORIGINS`.
- If a secret was ever shared or published (screenshots, zip files, README), rotate it: MongoDB user password, `JWT_SECRET`, Cloudinary API secret, Gemini key and the admin password.

---

## 👨‍💻 Developer

**Engr. Khanzallah**

- GitHub: [@Engr-Khanzallah](https://github.com/Engr-Khanzallah)
- Project: [Hospital-app](https://github.com/Engr-Khanzallah/Hospital-app)

---

## 📄 License

This project is open source and available for portfolio and educational purposes.
