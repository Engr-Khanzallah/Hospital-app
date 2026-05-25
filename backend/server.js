import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'express-async-errors'

import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import userRoutes from './routes/userRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => res.json({ message: 'Hospital API Running' }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })