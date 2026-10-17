import express from 'express'
import { register, login, getMe, adminLogin } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

export default function authRoutes({ limiters }) {
  const router = express.Router()

  router.post('/register', limiters.register, register)
  router.post('/login', limiters.login, login)
  router.post('/admin-login', limiters.login, adminLogin)
  router.get('/me', protect, getMe)

  return router
}
