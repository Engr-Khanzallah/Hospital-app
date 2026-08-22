import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import 'express-async-errors'

import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import userRoutes from './routes/userRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))

app.options('*', cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hospital API Running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

let isConnected = false

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    bufferCommands: false
  })
  isConnected = true
  console.log('✅ MongoDB Connected')
}

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })

export default app