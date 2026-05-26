# 🏥 MediCare - Hospital Appointment Booking System

A full-stack MERN application for hospital appointment booking with patient and admin dashboards.

## 🚀 Tech Stack

- **Frontend:** React.js + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens)
- **Image Upload:** Cloudinary
- **Notifications:** React Hot Toast

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
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   │   └── AdminLayout.jsx
    │   │   ├── appointment/
    │   │   │   └── StatusBadge.jsx
    │   │   ├── common/
    │   │   │   ├── Footer.jsx
    │   │   │   ├── Layout.jsx
    │   │   │   └── Navbar.jsx
    │   │   └── doctor/
    │   │       └── DoctorCard.jsx
    │   ├── context/
    │   │   ├── AppContext.jsx
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── AdminAppointments.jsx
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── AdminDoctors.jsx
    │   │   │   ├── AdminMessages.jsx
    │   │   │   └── AdminPatients.jsx
    │   │   ├── patient/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── MyAppointments.jsx
    │   │   │   └── Profile.jsx
    │   │   ├── About.jsx
    │   │   ├── BookAppointment.jsx
    │   │   ├── Contact.jsx
    │   │   ├── DoctorDetail.jsx
    │   │   ├── Doctors.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (free tier works)

---

### 1. Clone / Download Project

```bash
# If using git
git clone <your-repo-url>
cd hospital-app

# Or just unzip and open the folder in VS Code
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_db
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123456

NODE_ENV=development
```

**Seed the database** (creates admin user + sample data):

```bash
node seed.js
```

**Start the backend server:**

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs on: `https://ospital-app-engr-khanzallah684-hgd3f2ea.leapcell.dev`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

**Start the frontend:**

```bash
npm run dev
```

Frontend runs on: `https://medicare-hospital-app.netlify.app/`

---

## 🔐 Default Login Credentials

After running `node seed.js`:

| Role  | Email                  | Password      |
|-------|------------------------|---------------|
| Admin | admin@hospital.com     | Admin@123456  |

> Patients register themselves via the Register page.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint              | Description         | Auth |
|--------|-----------------------|---------------------|------|
| POST   | /api/auth/register    | Patient register    | No   |
| POST   | /api/auth/login       | User login          | No   |
| POST   | /api/auth/admin-login | Admin login         | No   |
| GET    | /api/auth/me          | Get current user    | Yes  |

### Doctors
| Method | Endpoint              | Description         | Auth  |
|--------|-----------------------|---------------------|-------|
| GET    | /api/doctors          | Get all doctors     | No    |
| GET    | /api/doctors/featured | Featured doctors    | No    |
| GET    | /api/doctors/:id      | Get single doctor   | No    |
| POST   | /api/doctors          | Create doctor       | Admin |
| PUT    | /api/doctors/:id      | Update doctor       | Admin |
| DELETE | /api/doctors/:id      | Delete doctor       | Admin |

### Appointments
| Method | Endpoint                       | Description             | Auth    |
|--------|--------------------------------|-------------------------|---------|
| POST   | /api/appointments              | Book appointment        | Patient |
| GET    | /api/appointments/my           | My appointments         | Patient |
| PUT    | /api/appointments/:id/cancel   | Cancel appointment      | Patient |
| GET    | /api/appointments              | All appointments        | Admin   |
| PUT    | /api/appointments/:id/status   | Update status           | Admin   |
| GET    | /api/appointments/stats        | Appointment stats       | Admin   |

### Users
| Method | Endpoint                    | Description        | Auth    |
|--------|-----------------------------|--------------------|---------|
| GET    | /api/users/profile          | Get profile        | Patient |
| PUT    | /api/users/profile          | Update profile     | Patient |
| PUT    | /api/users/change-password  | Change password    | Patient |
| GET    | /api/users                  | All patients       | Admin   |
| DELETE | /api/users/:id              | Delete patient     | Admin   |

### Departments
| Method | Endpoint             | Description       | Auth  |
|--------|----------------------|-------------------|-------|
| GET    | /api/departments     | All departments   | No    |
| POST   | /api/departments     | Create department | Admin |
| PUT    | /api/departments/:id | Update department | Admin |
| DELETE | /api/departments/:id | Delete department | Admin |

### Contact
| Method | Endpoint              | Description     | Auth  |
|--------|-----------------------|-----------------|-------|
| POST   | /api/contact          | Send message    | No    |
| GET    | /api/contact          | All messages    | Admin |
| PUT    | /api/contact/:id/read | Mark as read    | Admin |
| DELETE | /api/contact/:id      | Delete message  | Admin |

### Admin
| Method | Endpoint            | Description       | Auth  |
|--------|---------------------|-------------------|-------|
| GET    | /api/admin/dashboard| Dashboard stats   | Admin |

---

## ✨ Features

### Patient
- Register / Login with JWT
- Browse & search doctors by name or specialty
- Filter by specialty
- View doctor profile with schedule
- Book appointments with date/time slot selection
- View & cancel appointments
- Status badges: Pending / Confirmed / Completed / Cancelled
- Edit personal profile

### Admin
- Secure admin dashboard
- Analytics: total patients, doctors, appointments, revenue
- Full doctor CRUD (with Cloudinary image upload)
- Weekly schedule management per doctor
- Appointment management (confirm / complete / cancel)
- Patient list with activate/deactivate/delete
- Contact message inbox with read/unread tracking

---

## 🎨 Design

- Clean white + blue medical theme
- Responsive (mobile-first)
- Smooth hover animations
- Modern cards with shadows
- Sticky navigation
- Loading skeletons

---

## ☁️ Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free)
2. In your dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Paste into your backend `.env`

Doctor images are automatically resized to 500×500 and stored in the `hospital/doctors` folder.

---

## 🛠️ Build for Production

### Backend
```bash
cd backend
NODE_ENV=production node server.js
```

### Frontend
```bash
cd frontend
npm run build
# Output in dist/ folder - deploy to Netlify, Vercel, etc.
```

---

## 📦 Dependencies

### Backend
- express, mongoose, bcryptjs, jsonwebtoken
- cloudinary, multer, multer-storage-cloudinary
- cors, dotenv, express-async-errors, express-validator

### Frontend
- react, react-dom, react-router-dom
- axios, react-hot-toast, react-icons
- date-fns, tailwindcss

---

## 🤝 Portfolio Notes

This project demonstrates:
- Full MERN stack architecture
- REST API design with MVC pattern
- JWT authentication & protected routes
- Role-based access control (Patient / Admin)
- File upload with Cloudinary
- Responsive UI with Tailwind CSS
- Real-world database modeling
- Admin dashboard with analytics
