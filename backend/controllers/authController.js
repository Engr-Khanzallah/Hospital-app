import User from '../models/User.js'
import { generateToken } from '../middleware/auth.js'

export const register = async (req, res) => {
  const { name, email, password, phone } = req.body
  const exists = await User.findOne({ email })
  if (exists) return res.status(400).json({ success: false, message: 'Email already registered' })
  const user = await User.create({ name, email, password, phone, role: 'patient' })
  const token = generateToken(user._id)
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar }
  })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' })
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' })
  const token = generateToken(user._id)
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar }
  })
}

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, user })
}

export const adminLogin = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email, role: 'admin' }).select('+password')
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
  const token = generateToken(user._id)
  res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } })
}