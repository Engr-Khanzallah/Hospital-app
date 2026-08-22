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

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))
app.options('*', cors())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hospital API Running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// Connect MongoDB
let isConnected = false

const connectDB = async () => {
  if (isConnected) return
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    isConnected = true
    console.log('✅ MongoDB Connected')
  } catch (err) {
    console.error('❌ MongoDB error:', err.message)
    throw err
  }
}

// For Vercel — export app
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
  })
} else {
  connectDB()
}

export default app