import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { isValidObjectId } from '../utils/validate.js'

export const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' })

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured')
    return res.status(500).json({ success: false, message: 'Server configuration error' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ success: false, message: 'Token failed' })
  }
  if (!isValidObjectId(decoded?.id)) {
    return res.status(401).json({ success: false, message: 'Token failed' })
  }

  // Database errors are NOT token errors, so they propagate to the error handler (500).
  const user = await User.findById(decoded.id).select('-password')
  if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' })
  if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' })

  req.user = user
  next()
}

export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next()
  res.status(403).json({ success: false, message: 'Admin access required' })
}

// Token format is unchanged: { id } signed with JWT_SECRET.
export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' })
