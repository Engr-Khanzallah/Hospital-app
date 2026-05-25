import User from '../models/User.js'

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, user })
}

export const updateProfile = async (req, res) => {
  const { name, phone, gender, dateOfBirth, address, bloodGroup } = req.body
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone, gender, dateOfBirth, address, bloodGroup }, { new: true, runValidators: true })
  res.json({ success: true, message: 'Profile updated', user })
}

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select('+password')
  if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ success: false, message: 'Current password is incorrect' })
  user.password = newPassword
  await user.save()
  res.json({ success: true, message: 'Password changed successfully' })
}

export const getAllUsers = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query
  const query = { role: 'patient' }
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
  const skip = (page - 1) * limit
  const total = await User.countDocuments(query)
  const users = await User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 })
  res.json({ success: true, users, total, pages: Math.ceil(total / limit), currentPage: Number(page) })
}

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' })
  await user.deleteOne()
  res.json({ success: true, message: 'User deleted' })
}

export const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  user.isActive = !user.isActive
  await user.save()
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user })
}