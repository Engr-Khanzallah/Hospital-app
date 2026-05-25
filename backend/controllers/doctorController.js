import Doctor from '../models/Doctor.js'
import { cloudinary } from '../config/cloudinary.js'

export const getDoctors = async (req, res) => {
  const { specialty, search, department, page = 1, limit = 12 } = req.query
  const query = { isActive: true }

  if (specialty) query.specialty = { $regex: specialty, $options: 'i' }
  if (department) query.department = department
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { specialty: { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (page - 1) * limit
  const total = await Doctor.countDocuments(query)
  const doctors = await Doctor.find(query)
    .populate('department', 'name icon')
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    count: doctors.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    doctors
  })
}

export const getDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('department', 'name icon')
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }
  res.json({ success: true, doctor })
}

export const createDoctor = async (req, res) => {
  const {
    name, email, phone, specialty, department,
    qualification, experience, consultationFee,
    about, availableSlots
  } = req.body

  const exists = await Doctor.findOne({ email })
  if (exists) {
    return res.status(400).json({ success: false, message: 'Doctor email already exists' })
  }

  const doctorData = {
    name,
    email,
    phone,
    specialty,
    department: department || undefined,
    qualification: qualification
      ? (Array.isArray(qualification)
          ? qualification
          : qualification.split(',').map(q => q.trim()))
      : [],
    experience: Number(experience),
    consultationFee: Number(consultationFee),
    about,
    availableSlots: availableSlots ? JSON.parse(availableSlots) : []
  }

  if (req.file) {
    doctorData.image = `http://localhost:5000/uploads/${req.file.filename}`
    doctorData.imagePublicId = req.file.filename
  }

  const doctor = await Doctor.create(doctorData)
  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    doctor
  })
}

export const updateDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }

  const updateData = { ...req.body }

  if (req.body.qualification && !Array.isArray(req.body.qualification)) {
    updateData.qualification = req.body.qualification.split(',').map(q => q.trim())
  }
  if (req.body.availableSlots && typeof req.body.availableSlots === 'string') {
    updateData.availableSlots = JSON.parse(req.body.availableSlots)
  }

  if (req.file) {
    updateData.image = `http://localhost:5000/uploads/${req.file.filename}`
    updateData.imagePublicId = req.file.filename
  }

  const updated = await Doctor.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  res.json({
    success: true,
    message: 'Doctor updated successfully',
    doctor: updated
  })
}

export const deleteDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }
  await doctor.deleteOne()
  res.json({ success: true, message: 'Doctor deleted successfully' })
}

export const getFeaturedDoctors = async (req, res) => {
  const doctors = await Doctor.find({ isActive: true })
    .populate('department', 'name icon')
    .sort({ rating: -1 })
    .limit(6)
  res.json({ success: true, doctors })
}