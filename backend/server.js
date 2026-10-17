// MUST be the first import: it loads .env before any module (e.g. Cloudinary config) reads it.
import 'dotenv/config'
import mongoose from 'mongoose'
import { createApp } from './app.js'

let dbConnectionPromise = null

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return
  if (dbConnectionPromise) {
    await dbConnectionPromise
    return
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI environment variable is missing')

  console.log('Connecting to MongoDB...')
  dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  try {
    await dbConnectionPromise
    console.log('MongoDB connected')
  } catch (error) {
    dbConnectionPromise = null
    console.error('MongoDB connection error:', error.message)
    throw error
  }
}

const app = createApp({ ensureDb: connectDB })

// Local development: start a normal server. (On Vercel the exported app is used instead.)
if (process.env.NODE_ENV !== 'production') {
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 5000
      app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`))
    })
    .catch((error) => console.error('Failed to start server:', error.message))
}

export default app
