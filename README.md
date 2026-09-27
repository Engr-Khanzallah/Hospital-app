# 🏥 MediCare - Hospital Appointment Booking System

A full-stack MERN application for hospital appointment booking with patient and admin dashboards.

![MediCare](https://img.shields.io/badge/MediCare-Hospital%20App-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Express](https://img.shields.io/badge/Express.js-Backend-black?style=for-the-badge&logo=express)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=node.js)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🌍 **Frontend (Netlify)** | https://medicare-hospital-app.netlify.app |
| ⚙️ **Backend API (Vercel)** | https://hospital-backend-app.vercel.app |
| 📡 **API Health Check** | https://hospital-backend-app.vercel.app/ |

---

## 🔐 Admin Login Credentials

| Field | Value |
|-------|-------|
| **URL** | https://medicare-hospital-app.netlify.app/login |
| **Email** | admin@hospital.com |
| **Password** | Admin@123456 |
| **Role** | Administrator |

> After login, admin is automatically redirected to `/admin` dashboard.

---

## 👤 Patient Registration

Patients can register at:
```
https://medicare-hospital-app.netlify.app/register
```

---

## ✨ Features

### Patient Side
- ✅ Register & Login with JWT Authentication
- ✅ Browse all doctors with search & filter by specialty
- ✅ View detailed doctor profiles with schedule
- ✅ Book appointments with date & time slot selection
- ✅ View & cancel appointments
- ✅ Appointment status badges (Pending / Confirmed / Completed / Cancelled)
- ✅ Edit personal profile & change password

### Admin Panel
- ✅ Dashboard with analytics (total patients, doctors, revenue)
- ✅ Add / Edit / Delete doctors with Cloudinary image upload
- ✅ Weekly schedule management per doctor
- ✅ Manage appointments (Confirm / Complete / Cancel)
- ✅ Patient list with activate / deactivate / delete
- ✅ Contact message inbox with read/unread tracking

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js + Vite + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT (JSON Web Tokens) |
| **Image Upload** | Cloudinary |
| **Frontend Hosting** | Netlify |
| **Backend Hosting** | Vercel |

---

## 📁 Project Structure

```
hospital-app/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── contactController.js
│   │   ├── departmentController.js
│   │   ├── doctorController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Appointment.js
│   │   ├── ContactMessage.js
│   │   ├── Department.js
│   │   ├── Doctor.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── userRoutes.js
│   ├── vercel.json
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── _redirects
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   ├── appointment/
    │   │   ├── common/
    │   │   └── doctor/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── AppContext.jsx
    │   ├── pages/
    │   │   ├── admin/
    │   │   ├── patient/
    │   │   ├── Home.jsx
    │   │   ├── Doctors.jsx
    │   │   ├── DoctorDetail.jsx
    │   │   ├── BookAppointment.jsx
    │   │   ├── About.jsx
    │   │   ├── Contact.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   └── utils/
    │       └── api.js
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free)
- Cloudinary account (free)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Engr-Khanzallah/Hospital-app.git
cd Hospital-app
```

### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the `backend` folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123456
NODE_ENV=development
```

Seed the database (creates admin + departments):

```bash
node seed.js
```

Start the backend:

```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

### Step 3 — Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Patient register |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Doctors
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/doctors` | Get all doctors | No |
| GET | `/api/doctors/featured` | Featured doctors | No |
| GET | `/api/doctors/:id` | Single doctor | No |
| POST | `/api/doctors` | Create doctor | Admin |
| PUT | `/api/doctors/:id` | Update doctor | Admin |
| DELETE | `/api/doctors/:id` | Delete doctor | Admin |

### Appointments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/appointments` | Book appointment | Patient |
| GET | `/api/appointments/my` | My appointments | Patient |
| PUT | `/api/appointments/:id/cancel` | Cancel | Patient |
| GET | `/api/appointments` | All appointments | Admin |
| PUT | `/api/appointments/:id/status` | Update status | Admin |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Get profile | Patient |
| PUT | `/api/users/profile` | Update profile | Patient |
| GET | `/api/users` | All patients | Admin |
| DELETE | `/api/users/:id` | Delete patient | Admin |

---

## 🚀 Deployment

### Backend — Vercel

1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `backend`
3. Add environment variables in Vercel dashboard
4. Deploy

### Frontend — Netlify

1. Connect GitHub repo to Netlify
2. Set **Base directory** to `frontend`
3. Set **Build command** to `npm run build`
4. Set **Publish directory** to `frontend/dist`
5. Add environment variable:
   ```
   VITE_API_URL = https://hospital-backend-app.vercel.app/api
   ```
6. Deploy

---

## 📦 Environment Variables

### Backend (Vercel)
```
MONGODB_URI
JWT_SECRET
JWT_EXPIRE
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
NODE_ENV
```

### Frontend (Netlify)
```
VITE_API_URL
```

---

## 👨‍💻 Developer

**Engr. Khanzallah**

- GitHub: [@Engr-Khanzallah](https://github.com/Engr-Khanzallah)
- Project: [Hospital-app](https://github.com/Engr-Khanzallah/Hospital-app)

---

## 📄 License

This project is open source and available for portfolio and educational purposes.