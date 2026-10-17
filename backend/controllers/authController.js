import User from '../models/User.js'
import { generateToken } from '../middleware/auth.js'
import { AppError } from '../utils/httpError.js'
import { str, email as validateEmail, phone as validatePhone } from '../utils/validate.js'

const publicUser = (user) => ({
  _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar
})

const validatePassword = (value, label = 'Password') => {
  if (typeof value !== 'string' || !value) throw new AppError(400, `${label} is required`)
  if (value.length < 6) throw new AppError(400, `${label} must be at least 6 characters`)
  // bcrypt only uses the first 72 bytes; refuse longer values instead of silently truncating.
  if (Buffer.byteLength(value, 'utf8') > 72) throw new AppError(400, `${label} must be 72 bytes or fewer`)
  return value
}

export const register = async (req, res) => {
  const body = req.body || {}
  const name = str(body.name, 'Name', { min: 2, max: 100, required: true })
  const email = validateEmail(body.email)
  const password = validatePassword(body.password)
  const phone = validatePhone(body.phone)

  const exists = await User.findOne({ email })
  if (exists) throw new AppError(400, 'Email already registered')

  // role is forced server-side: clients can never self-assign admin.
  const user = await User.create({ name, email, password, phone, role: 'patient' })
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: generateToken(user._id),
    user: publicUser(user)
  })
}

export const login = async (req, res) => {
  const body = req.body || {}
  // Strings only: an object such as { "$ne": null } must never reach the query.
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email || !body.password) {
    throw new AppError(400, 'Please provide email and password')
  }
  const user = await User.findOne({ email: body.email.trim().toLowerCase() }).select('+password')
  if (!user || !(await user.comparePassword(body.password))) {
    throw new AppError(401, 'Invalid email or password')
  }
  if (!user.isActive) throw new AppError(403, 'Account deactivated')

  res.json({
    success: true,
    message: 'Login successful',
    token: generateToken(user._id),
    user: publicUser(user)
  })
}

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, user })
}

export const adminLogin = async (req, res) => {
  const body = req.body || {}
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email || !body.password) {
    throw new AppError(400, 'Please provide email and password')
  }
  const user = await User.findOne({ email: body.email.trim().toLowerCase(), role: 'admin' }).select('+password')
  if (!user || !(await user.comparePassword(body.password))) {
    throw new AppError(401, 'Invalid admin credentials')
  }
  if (!user.isActive) throw new AppError(403, 'Account deactivated')
  res.json({ success: true, token: generateToken(user._id), user: { _id: user._id, name: user.name, email: user.email, role: user.role } })
}

export { validatePassword }
