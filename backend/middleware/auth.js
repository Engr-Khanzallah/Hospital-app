import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token failed' })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next()
  res.status(403).json({ success: false, message: 'Admin access required' })
}

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' })