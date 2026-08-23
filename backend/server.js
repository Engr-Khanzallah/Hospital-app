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

// ===============================
// CORS
// ===============================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))

app.options('*', cors())

// ===============================
// BODY PARSER
// ===============================

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}))

// ===============================
// UPLOADS
// ===============================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
)

// ===============================
// MONGODB CONNECTION
// ===============================

let dbConnectionPromise = null

const connectDB = async () => {

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return
  }

  // Connection already in progress
  if (dbConnectionPromise) {
    await dbConnectionPromise
    return
  }

  // Check environment variable
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing')
  }

  console.log('🔄 Connecting to MongoDB...')

  dbConnectionPromise = mongoose.connect(
    process.env.MONGODB_URI,
    {
      serverSelectionTimeoutMS: 10000
    }
  )

  try {

    await dbConnectionPromise

    console.log('✅ MongoDB Connected')

  } catch (error) {

    dbConnectionPromise = null

    console.error(
      '❌ MongoDB connection error:',
      error.message
    )

    throw error
  }
}

// ===============================
// DATABASE MIDDLEWARE
// ===============================

// IMPORTANT:
// Make sure MongoDB is connected BEFORE
// any API route tries to use User.findOne(),
// User.create(), etc.

app.use(async (req, res, next) => {

  try {

    await connectDB()

    next()

  } catch (error) {

    console.error(
      '❌ Database connection failed:',
      error.message
    )

    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    })
  }
})

// ===============================
// ROUTES
// ===============================

app.use('/api/auth', authRoutes)

app.use('/api/doctors', doctorRoutes)

app.use('/api/appointments', appointmentRoutes)

app.use('/api/users', userRoutes)

app.use('/api/departments', departmentRoutes)

app.use('/api/contact', contactRoutes)

app.use('/api/admin', adminRoutes)

// ===============================
// HEALTH CHECK
// ===============================

app.get('/', (req, res) => {

  res.status(200).json({

    message: 'Hospital API Running',

    status: 'healthy',

    timestamp: new Date().toISOString()

  })

})

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {

  console.error('Error:', err.message)

  res.status(err.statusCode || 500).json({

    success: false,

    message:
      err.message ||
      'Internal Server Error'

  })

})

// ===============================
// LOCAL DEVELOPMENT
// ===============================

if (process.env.NODE_ENV !== 'production') {

  connectDB()
    .then(() => {

      const PORT =
        process.env.PORT || 5000

      app.listen(
        PORT,
        '0.0.0.0',
        () => {

          console.log(
            `✅ Server running on port ${PORT}`
          )

        }
      )

    })
    .catch((error) => {

      console.error(
        '❌ Failed to start server:',
        error.message
      )

    })
}

// ===============================
// VERCEL
// ===============================

export default app