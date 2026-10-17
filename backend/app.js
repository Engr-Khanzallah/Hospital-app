import express from 'express'
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
import aiRoutes from './routes/aiRoutes.js'
import { buildLimiters } from './middleware/rateLimit.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const parseOrigins = () =>
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)

/**
 * CORS: set CORS_ORIGINS (comma separated, e.g. your Netlify URL + http://localhost:5173).
 * If it is NOT set we keep the previous behaviour (allow any origin) and warn once, so an
 * existing deployment does not break the moment this code is deployed. The API uses Bearer
 * tokens (no cookies), which limits the risk of an open policy, but you should still set it.
 */
const buildCors = () => {
  const allowed = parseOrigins()
  const base = {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400
  }
  if (!allowed.length) {
    console.warn('CORS_ORIGINS is not set: allowing requests from any origin. Set it to your frontend URL(s).')
    return cors({ ...base, origin: '*' })
  }
  return cors({
    ...base,
    origin: (origin, callback) => {
      // No Origin header = same-origin, curl, health checks, server-to-server.
      if (!origin || allowed.includes(origin.replace(/\/+$/, ''))) return callback(null, true)
      callback(new Error('Not allowed by CORS'))
    }
  })
}

/**
 * Builds the Express app. `ensureDb` is called before every request so the connection is ready
 * (this matters on serverless hosts); tests pass a no-op.
 */
export function createApp({ ensureDb = async () => {}, limiters = buildLimiters(), aiReply } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // correct client IP behind Vercel/Netlify proxies (rate limiting)

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })

  const corsMiddleware = buildCors()
  app.use(corsMiddleware)
  app.options('*', corsMiddleware)

  // JSON bodies are small (images go through multipart/multer, limited to 5MB there).
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  // Legacy local uploads (kept so any old image URLs keep working).
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hospital API Running', status: 'healthy', timestamp: new Date().toISOString() })
  })

  app.use(async (req, res, next) => {
    try {
      await ensureDb()
      next()
    } catch (error) {
      console.error('Database connection failed:', error.message)
      res.status(500).json({ success: false, message: 'Database connection failed' })
    }
  })

  app.use('/api/auth', authRoutes({ limiters }))
  app.use('/api/ai', aiRoutes({ limiters, ...(aiReply ? { reply: aiReply } : {}) }))
  app.use('/api/doctors', doctorRoutes)
  app.use('/api/appointments', appointmentRoutes({ limiters }))
  app.use('/api/users', userRoutes)
  app.use('/api/departments', departmentRoutes)
  app.use('/api/contact', contactRoutes({ limiters }))
  app.use('/api/admin', adminRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
