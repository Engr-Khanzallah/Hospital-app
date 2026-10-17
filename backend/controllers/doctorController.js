import Doctor from '../models/Doctor.js'
import Department from '../models/Department.js'
import Appointment from '../models/Appointment.js'
import { cloudinary, uploadToCloudinary } from '../config/cloudinary.js'
import { AppError } from '../utils/httpError.js'
import {
  str, email as validateEmail, phone as validatePhone, number, bool,
  isValidObjectId, escapeRegex, parsePagination
} from '../utils/validate.js'
import { appointmentDateFromCalendar, hospitalNow } from '../utils/scheduling.js'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const parseQualification = (value) => {
  if (value === undefined || value === null) return undefined
  const list = Array.isArray(value) ? value : String(value).split(',')
  const cleaned = list.map((q) => String(q).trim()).filter(Boolean)
  if (cleaned.length > 20) throw new AppError(400, 'A doctor can have at most 20 qualifications')
  if (cleaned.some((q) => q.length > 100)) throw new AppError(400, 'Each qualification must be 100 characters or fewer')
  return cleaned
}

// availableSlots arrives as a JSON string (multipart form) or an array. Only known fields survive.
const parseAvailableSlots = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  let raw = value
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { throw new AppError(400, 'Available slots are not valid JSON') }
  }
  if (!Array.isArray(raw)) throw new AppError(400, 'Available slots must be a list')
  if (raw.length > 14) throw new AppError(400, 'Too many availability entries')

  const seenDays = new Set()
  return raw.map((slot) => {
    if (!slot || typeof slot !== 'object') throw new AppError(400, 'Each availability entry must be an object')
    if (!DAYS.includes(slot.day)) throw new AppError(400, `Availability day must be one of: ${DAYS.join(', ')}`)
    if (seenDays.has(slot.day)) throw new AppError(400, `${slot.day} appears more than once in the availability list`)
    seenDays.add(slot.day)

    const isAvailable = slot.isAvailable === undefined ? true : slot.isAvailable === true || slot.isAvailable === 'true'
    const entry = { day: slot.day, isAvailable }
    if (isAvailable) {
      if (!TIME_RE.test(String(slot.startTime)) || !TIME_RE.test(String(slot.endTime))) {
        throw new AppError(400, `${slot.day}: start and end time must look like HH:MM`)
      }
      if (toMinutes(slot.endTime) <= toMinutes(slot.startTime)) {
        throw new AppError(400, `${slot.day}: end time must be after start time`)
      }
    }
    entry.startTime = TIME_RE.test(String(slot.startTime)) ? String(slot.startTime) : '09:00'
    entry.endTime = TIME_RE.test(String(slot.endTime)) ? String(slot.endTime) : '17:00'
    return entry
  })
}

const resolveDepartment = async (value) => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null // explicit "no department"
  if (!isValidObjectId(value)) throw new AppError(400, 'Department is invalid')
  const dept = await Department.findById(value).select('_id')
  if (!dept) throw new AppError(400, 'Selected department does not exist')
  return dept._id
}

// Reads the allowed doctor fields from the request, validating each one.
const readDoctorFields = async (body = {}, { isCreate }) => {
  const data = {}
  const set = (key, value) => { if (value !== undefined) data[key] = value }

  set('name', str(body.name, 'Name', { min: 2, max: 100, required: isCreate }))
  set('email', validateEmail(body.email, 'Email', { required: isCreate }))
  set('phone', validatePhone(body.phone, 'Phone', { required: isCreate }))
  set('specialty', str(body.specialty, 'Specialty', { min: 2, max: 100, required: isCreate }))
  set('experience', number(body.experience, 'Experience', { min: 0, max: 70, integer: true, required: isCreate }))
  set('consultationFee', number(body.consultationFee, 'Consultation fee', { min: 0, max: 1000000, required: isCreate }))
  if (Object.prototype.hasOwnProperty.call(body, 'about')) set('about', str(body.about, 'About', { max: 2000 }) ?? '')
  set('qualification', parseQualification(body.qualification))
  set('availableSlots', parseAvailableSlots(body.availableSlots))
  set('isAvailable', bool(body.isAvailable, 'isAvailable'))
  if (!isCreate) set('isActive', bool(body.isActive, 'isActive'))

  const department = await resolveDepartment(body.department)
  if (department !== undefined) data.department = department
  return data
}

const safeDestroyImage = async (publicId) => {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    // Cleanup must never break the request; log the id only.
    console.warn('Cloudinary cleanup failed for an image:', error?.message)
  }
}

export const getDoctors = async (req, res) => {
  const specialty = str(req.query.specialty, 'Specialty', { max: 100 })
  const search = str(req.query.search, 'Search', { max: 100 })
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 100 })
  const query = { isActive: true }

  if (specialty) query.specialty = { $regex: escapeRegex(specialty), $options: 'i' }
  if (req.query.department !== undefined && req.query.department !== '') {
    if (!isValidObjectId(req.query.department)) throw new AppError(400, 'Department is invalid')
    query.department = req.query.department
  }
  if (search) {
    const re = escapeRegex(search)
    query.$or = [
      { name: { $regex: re, $options: 'i' } },
      { specialty: { $regex: re, $options: 'i' } }
    ]
  }

  const total = await Doctor.countDocuments(query)
  const doctors = await Doctor.find(query)
    .populate('department', 'name icon')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    count: doctors.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    doctors
  })
}

export const getDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('department', 'name icon')
  if (!doctor) throw new AppError(404, 'Doctor not found')
  res.json({ success: true, doctor })
}

export const createDoctor = async (req, res) => {
  const data = await readDoctorFields(req.body, { isCreate: true })
  if (!data.availableSlots) data.availableSlots = []
  if (!data.qualification) data.qualification = []
  if (data.about === undefined) data.about = ''
  if (data.department === null) delete data.department

  if (await Doctor.findOne({ email: data.email })) throw new AppError(400, 'Doctor email already exists')

  let uploaded
  if (req.file) {
    try {
      uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname)
      data.image = uploaded.secure_url
      data.imagePublicId = uploaded.public_id
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError?.message)
      // Same behaviour as before: the doctor is still created, just without an image.
    }
  }

  try {
    const doctor = await Doctor.create(data)
    res.status(201).json({ success: true, message: 'Doctor created successfully', doctor })
  } catch (error) {
    await safeDestroyImage(uploaded?.public_id) // do not leave an orphaned upload behind
    throw error
  }
}

export const updateDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) throw new AppError(404, 'Doctor not found')

  const updateData = await readDoctorFields(req.body, { isCreate: false })

  if (updateData.email && updateData.email !== doctor.email) {
    if (await Doctor.exists({ email: updateData.email, _id: { $ne: doctor._id } })) {
      throw new AppError(400, 'Doctor email already exists')
    }
  }

  let uploaded
  if (req.file) {
    try {
      // Upload the new image FIRST. The old one is removed only after the database update works.
      uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname)
      updateData.image = uploaded.secure_url
      updateData.imagePublicId = uploaded.public_id
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError?.message)
    }
  }

  const $set = { ...updateData }
  const $unset = {}
  if ($set.department === null) { delete $set.department; $unset.department = '' }
  const update = { $set }
  if (Object.keys($unset).length) update.$unset = $unset
  if (!Object.keys($set).length && !Object.keys($unset).length) throw new AppError(400, 'No changes were provided')

  let updated
  try {
    updated = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
  } catch (error) {
    await safeDestroyImage(uploaded?.public_id)
    throw error
  }

  if (uploaded && doctor.imagePublicId && doctor.imagePublicId !== uploaded.public_id) {
    await safeDestroyImage(doctor.imagePublicId)
  }

  res.json({ success: true, message: 'Doctor updated successfully', doctor: updated })
}

/**
 * Deleting a doctor never destroys appointment history:
 *  - no appointments at all  -> the doctor (and Cloudinary image) is permanently deleted;
 *  - has appointment records -> the doctor is ARCHIVED (isActive=false, isAvailable=false):
 *    hidden from patients and the AI assistant, history keeps resolving the doctor's name.
 *  - upcoming pending/confirmed appointments block both, so no patient is left stranded.
 */
export const deleteDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) throw new AppError(404, 'Doctor not found')

  const today = appointmentDateFromCalendar(hospitalNow())
  const upcoming = await Appointment.countDocuments({
    doctor: doctor._id,
    status: { $in: ['pending', 'confirmed'] },
    appointmentDate: { $gte: today }
  })
  if (upcoming > 0) {
    throw new AppError(409, `Dr. ${doctor.name} has ${upcoming} upcoming appointment(s). Cancel or complete them first.`)
  }

  const historyCount = await Appointment.countDocuments({ doctor: doctor._id })
  if (historyCount > 0) {
    doctor.isActive = false
    doctor.isAvailable = false
    await doctor.save()
    return res.json({
      success: true,
      archived: true,
      message: `Doctor archived (${historyCount} appointment record(s) kept for history)`
    })
  }

  await doctor.deleteOne()
  await safeDestroyImage(doctor.imagePublicId)
  res.json({ success: true, message: 'Doctor deleted successfully' })
}

export const getFeaturedDoctors = async (req, res) => {
  const doctors = await Doctor.find({ isActive: true })
    .populate('department', 'name icon')
    .sort({ rating: -1 })
    .limit(6)
  res.json({ success: true, doctors })
}
