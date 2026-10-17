# 🏥 MediCare: Hospital Appointment Booking System

Book a doctor in a few clicks, manage everything from an admin panel, and get help from a friendly AI health assistant.

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![AI](https://img.shields.io/badge/AI-Google%20Gemini%20(free%20tier)-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 🌐 Live Demo

| What | Link |
|------|------|
| 🌍 Website (Netlify) | https://hospital-app-bookappointment.netlify.app/ |
| ⚙️ API (Vercel) | https://hospital-backend-app.vercel.app/ |

> Open the API link and you should see `Hospital API Running`. That means the backend is healthy.

---

## ✨ What can it do?

### 👤 For patients
- Create an account and log in securely
- Search doctors by name or specialty and read their profiles and weekly schedules
- Book an appointment: **taken and already-passed time slots are greyed out**
- See, track and cancel your appointments (Pending, Confirmed, Completed, Cancelled)
- Edit your profile and change your password
- Chat with the **AI Assistant** for general health information and help finding the right doctor

### 🛠️ For the admin
- Dashboard with totals for patients, doctors, appointments and revenue
- Add, edit and archive doctors (with photo upload)
- Set each doctor's weekly working hours
- Confirm, complete or cancel appointments
- Activate or deactivate patients
- Read messages sent from the contact form

---

## 🤖 The AI Assistant

Open **AI Assistant** in the menu (you need to be logged in).

**It can:** explain health topics in simple language, suggest which type of doctor to see, and recommend doctors **from your own database**.

**It will not:** diagnose, prescribe medicine, invent doctors or fees, or book appointments for you.

**Built-in safety**
- If someone writes about an emergency (for example chest pain or self-harm), the app answers immediately with a fixed message telling them to contact local emergency services. The AI is not even called.
- Email addresses and long numbers are removed from messages **before** anything is sent to Gemini.
- Only public doctor information (name, specialty, fee, schedule) is shared with the AI. No patient records.
- Answers appear as plain text, never as HTML.
- Per-user and global rate limits protect the free Gemini quota.

> ⚠️ This assistant gives general information only and can make mistakes. It is not a substitute for a real doctor.

---

## 🚀 Quick Start (run it on your computer)

### What you need
- [Node.js](https://nodejs.org/) 18 or newer
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) database
- A free [Cloudinary](https://cloudinary.com/) account (for doctor photos)
- *(Optional)* A free [Gemini API key](https://aistudio.google.com/apikey) for the AI Assistant

### 1️⃣ Get the code
```bash
git clone https://github.com/Engr-Khanzallah/Hospital-app.git
cd Hospital-app
```

### 2️⃣ Start the backend
```bash
cd backend
npm install
```
Create your settings file. Copy `.env.example` to a new file named `.env`:

```bash
# macOS / Linux
cp .env.example .env
# Windows (PowerShell)
copy .env.example .env
```
Open `.env` and fill in your real values (see the table below). Then:

```bash
node seed.js     # creates the admin account and departments (run once)
npm run dev      # backend runs at http://localhost:5000
```
You should see `MongoDB connected` and `Server running on port 5000`.

### 3️⃣ Start the frontend
Open a **second** terminal:
```bash
cd frontend
npm install
```
Create `frontend/.env` with:
```
VITE_API_URL=http://localhost:5000/api
```
Then:
```bash
npm run dev      # website runs at http://localhost:5173
```

🎉 Open http://localhost:5173 and you are in.

---

## 🔑 Settings (environment variables)

Settings live in `backend/.env`. **Never upload this file to GitHub.** It is already ignored by git.

| Setting | Needed? | What it is |
|---------|---------|-----------|
| `MONGODB_URI` | ✅ Yes | Your MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | A long random secret used to sign logins |
| `CLOUDINARY_CLOUD_NAME` `CLOUDINARY_API_KEY` `CLOUDINARY_API_SECRET` | ✅ Yes | Cloudinary details for doctor photos |
| `ADMIN_EMAIL` `ADMIN_PASSWORD` | For `seed.js` | The first admin account. Choose a strong password |
| `GEMINI_API_KEY` | For the AI | Your free Gemini key |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-3.1-flash-lite` |
| `CORS_ORIGINS` | Recommended in production | Your website address(es), separated by commas. Leave empty and any website may call the API |
| `HOSPITAL_TIMEZONE` | Optional | Hospital timezone. Default `Asia/Karachi` |
| `BOOKING_MAX_ADVANCE_DAYS` | Optional | How many days ahead patients can book (default 60) |

The frontend only needs `VITE_API_URL`, the backend address followed by `/api`.

`backend/.env.example` lists every setting (including the optional rate limits) with explanations.

---

## 🔐 How do I log in as admin?

There is **no separate admin login page**.

1. Go to the normal **Login** page.
2. Enter the admin email and password you set in `ADMIN_EMAIL` and `ADMIN_PASSWORD` when you ran `node seed.js`.
3. You are sent to the admin panel automatically. Later, click your **name in the top-right corner** and choose **Admin Panel**.

There is no default or published password. You choose it. To change it later, open the **Change Password** tab on the `/profile` page.

---

## 📅 How booking works

The server checks every booking, so nobody can cheat from the browser:

- The doctor must exist and be accepting appointments
- The date cannot be in the past (and not too far ahead)
- The time must be one of the doctor's real slots for that weekday
- **One active appointment per doctor, day and time.** MongoDB itself enforces this, so two people clicking at the same moment cannot both win
- Status flow: `Pending → Confirmed → Completed`, or cancelled along the way. Completed and cancelled are final
- Dates are **calendar days at the hospital**, so everyone sees the same day, wherever they are

**Safe deleting:** a patient with appointments cannot be deleted (deactivate instead). A doctor with past appointments is **archived**, not erased, and a doctor with upcoming appointments cannot be removed until those are handled. History is never silently lost.

---

## 🧪 Tests

```bash
cd backend
npm test
```
Runs 66 automated tests (login and permissions, booking rules, double-booking, status changes, safe deleting, rate limits, CORS, and the AI endpoint). No database or API key is needed.

For a real double-booking test against a **throw-away** MongoDB (its name must contain `test`):
```bash
# set MONGODB_URI_TEST in .env first
npm run test:concurrency
```

### Already have appointments in your database?
Run this once, **after taking a backup**:
```bash
npm run migrate:appointments               # only shows a report, changes nothing
npm run migrate:appointments -- --apply    # saves a backup file, then applies
```
It never deletes or cancels anything.

---

## 📁 Project structure

```
Hospital-app/
├── backend/
│   ├── app.js               # builds the Express app
│   ├── server.js            # starts the server
│   ├── controllers/         # logic for auth, doctors, appointments, users...
│   ├── middleware/          # login check, rate limiting, error handling
│   ├── models/              # database models
│   ├── routes/              # API routes (including the AI route)
│   ├── services/            # Gemini AI + privacy and safety filters
│   ├── utils/               # validation, dates and time slots
│   ├── scripts/             # migration and real-database test
│   ├── tests/               # automated tests
│   └── seed.js              # creates the admin account and departments
└── frontend/
    └── src/
        ├── pages/           # Home, Doctors, Booking, Assistant, admin and patient pages
        ├── components/      # reusable pieces
        ├── context/         # login state
        └── utils/           # API client and date helpers
```

---

## 🌐 API at a glance

| Area | Examples |
|------|----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Doctors | `GET /api/doctors`, `GET /api/doctors/:id` (admin: create, update, delete) |
| Appointments | `POST /api/appointments`, `GET /api/appointments/my`, `GET /api/appointments/booked-slots` |
| Users | `GET/PUT /api/users/profile`, `PUT /api/users/change-password` |
| AI | `POST /api/ai/chat` (login required) |

When booking, send `appointmentDate` as `yyyy-MM-dd`, for example `2026-11-03`.

---

## ☁️ Deploying

**Backend on Vercel**
1. Import the GitHub repository and set **Root Directory** to `backend`.
2. Add the settings from the table above under *Settings → Environment Variables*.
3. Deploy, then open the API link. You should see `Hospital API Running`.

**Frontend on Netlify**
1. Import the same repository. Base directory `frontend`, build command `npm run build`, publish directory `frontend/dist`.
2. Add `VITE_API_URL` = your Vercel backend address + `/api`.
3. Deploy. The included `_redirects` file makes pages like `/assistant` work after a refresh.

**After deploying:** set `CORS_ORIGINS` on Vercel to your Netlify address, then test login, a booking and the AI Assistant.

---

## 🩹 Something not working?

| What you see | Most likely reason | What to do |
|--------------|--------------------|-----------|
| `MONGODB_URI environment variable is missing` | The backend can't find `.env` | Make sure `backend/.env` exists and is filled in |
| "Cannot reach the server" in the browser | The backend is not running, or `VITE_API_URL` points to the wrong place | Start the backend and check `VITE_API_URL`. Restart `npm run dev` after changing `.env` |
| AI says "could not answer right now" | Problem with the Gemini key or model | Check `GEMINI_API_KEY`. The backend terminal prints the exact reason |
| AI request gets a 404 | Frontend is calling an older backend | Check `VITE_API_URL` and deploy the latest backend |
| "Too many requests" | You hit a rate limit | Wait a minute and try again |
| Changed `.env` but nothing happened | Servers read `.env` only when they start | Stop and start them again |

---

## 🔒 Security notes

- Passwords are hashed. Deactivated or deleted users are rejected on every request.
- Inputs are validated, and only allowed fields are ever saved.
- Login, sign-up, contact, booking and AI chat are rate limited. These limits are kept in server memory, so on Vercel they are a best-effort brake rather than a hard global limit.
- The Gemini free tier may use prompts to improve Google's products, so please do not type personal details into the assistant.
- If a secret is ever shared or published, replace it: your MongoDB password, `JWT_SECRET`, Cloudinary secret, Gemini key and admin password.

---

## 👨‍💻 Author

**Engr. Khanzallah**
GitHub: [@Engr-Khanzallah](https://github.com/Engr-Khanzallah)
Project: [Hospital-app](https://github.com/Engr-Khanzallah/Hospital-app)

---

## 📄 License

Open source for portfolio and learning purposes.

<p align="center">Made with ❤️ for better healthcare access</p>