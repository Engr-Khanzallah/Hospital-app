import User from '../models/User.js'
import Appointment from '../models/Appointment.js'
import { AppError } from '../utils/httpError.js'
import { str, phone as validatePhone, oneOf, escapeRegex, parsePagination } from '../utils/validate.js'
import { validatePassword } from './authController.js'

const GENDERS = ['male', 'female', 'other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, user })
}

export const updateProfile = async (req, res) => {
  const body = req.body || {}
  const $set = {}
  const $unset = {}

  // Each field: provided + non-empty -> $set, provided but empty -> $unset, absent -> untouched.
  const apply = (key, value, provided) => {
    if (!provided) return
    if (value === undefined) $unset[key] = ''
    else $set[key] = value
  }
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k)

  if (has('name')) {
    const name = str(body.name, 'Name', { min: 2, max: 100, required: true })
    $set.name = name
  }
  apply('phone', validatePhone(body.phone), has('phone'))
  apply('gender', oneOf(body.gender, GENDERS, 'Gender'), has('gender'))
  apply('bloodGroup', oneOf(body.bloodGroup, BLOOD_GROUPS, 'Blood group'), has('bloodGroup'))

  if (has('dateOfBirth')) {
    if (body.dateOfBirth === '' || body.dateOfBirth === null) {
      $unset.dateOfBirth = ''
    } else {
      const dob = new Date(body.dateOfBirth)
      if (typeof body.dateOfBirth !== 'string' || Number.isNaN(dob.getTime())) throw new AppError(400, 'Date of birth is not a valid date')
      if (dob > new Date()) throw new AppError(400, 'Date of birth cannot be in the future')
      if (dob < new Date('1900-01-01')) throw new AppError(400, 'Date of birth is not valid')
      $set.dateOfBirth = dob
    }
  }

  if (has('address') && body.address !== null) {
    if (typeof body.address !== 'object' || Array.isArray(body.address)) throw new AppError(400, 'Address is invalid')
    for (const key of ['street', 'city', 'state', 'zipCode']) {
      if (Object.prototype.hasOwnProperty.call(body.address, key)) {
        const v = str(body.address[key], `Address ${key}`, { max: 200 })
        if (v === undefined) $unset[`address.${key}`] = ''
        else $set[`address.${key}`] = v
      }
    }
  }

  const update = {}
  if (Object.keys($set).length) update.$set = $set
  if (Object.keys($unset).length) update.$unset = $unset
  if (!Object.keys(update).length) throw new AppError(400, 'No profile changes were provided')

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true })
  res.json({ success: true, message: 'Profile updated', user })
}

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (typeof currentPassword !== 'string' || !currentPassword) throw new AppError(400, 'Current password is required')
  validatePassword(newPassword, 'New password')
  if (currentPassword === newPassword) throw new AppError(400, 'New password must be different from the current password')

  const user = await User.findById(req.user._id).select('+password')
  if (!(await user.comparePassword(currentPassword))) throw new AppError(400, 'Current password is incorrect')
  user.password = newPassword
  await user.save()
  res.json({ success: true, message: 'Password changed successfully' })
}

export const getAllUsers = async (req, res) => {
  const search = str(req.query.search, 'Search', { max: 100 })
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 })
  const query = { role: 'patient' }
  if (search) {
    const re = escapeRegex(search)
    query.$or = [{ name: { $regex: re, $options: 'i' } }, { email: { $regex: re, $options: 'i' } }]
  }
  const total = await User.countDocuments(query)
  const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 })
  res.json({ success: true, users, total, pages: Math.ceil(total / limit), currentPage: page })
}

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new AppError(404, 'User not found')
  if (user.role === 'admin') throw new AppError(403, 'Cannot delete admin')

  // Never silently destroy history: a patient with appointment records is deactivated, not deleted.
  const appointmentCount = await Appointment.countDocuments({ patient: user._id })
  if (appointmentCount > 0) {
    throw new AppError(409, `This patient has ${appointmentCount} appointment record(s) and cannot be deleted. Deactivate the account instead to keep the history.`)
  }
  await user.deleteOne()
  res.json({ success: true, message: 'User deleted' })
}

export const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new AppError(404, 'User not found')
  if (user.role === 'admin') throw new AppError(403, 'Cannot change the status of an admin account')
  user.isActive = !user.isActive
  await user.save()
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user })
}
