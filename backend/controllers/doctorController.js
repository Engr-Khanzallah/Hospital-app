import Doctor from '../models/Doctor.js'
import { cloudinary, uploadToCloudinary } from '../config/cloudinary.js'

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
  const doctor = await Doctor.findById(req.params.id)
    .populate('department', 'name icon')
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    })
  }
  res.json({ success: true, doctor })
}

export const createDoctor = async (req, res) => {
  try {
    const {
      name, email, phone, specialty, department,
      qualification, experience, consultationFee,
      about, availableSlots
    } = req.body

    // Check if doctor already exists
    const exists = await Doctor.findOne({ email })
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Doctor email already exists'
      })
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
      about: about || '',
      availableSlots: availableSlots ? JSON.parse(availableSlots) : []
    }

    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname)
        doctorData.image = result.secure_url
        doctorData.imagePublicId = result.public_id
        console.log('Image uploaded to Cloudinary:', result.secure_url)
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError)
        // Continue without image if upload fails
        doctorData.image = ''
      }
    }

    const doctor = await Doctor.create(doctorData)
    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      doctor
    })

  } catch (error) {
    console.error('Create doctor error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create doctor'
    })
  }
}

export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      })
    }

    const updateData = { ...req.body }

    if (req.body.qualification && !Array.isArray(req.body.qualification)) {
      updateData.qualification = req.body.qualification
        .split(',')
        .map(q => q.trim())
    }
    if (
      req.body.availableSlots &&
      typeof req.body.availableSlots === 'string'
    ) {
      updateData.availableSlots = JSON.parse(req.body.availableSlots)
    }

    // Upload new image to Cloudinary if provided
    if (req.file) {
      try {
        // Delete old image from Cloudinary
        if (doctor.imagePublicId) {
          await cloudinary.uploader.destroy(doctor.imagePublicId)
        }
        const result = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        )
        updateData.image = result.secure_url
        updateData.imagePublicId = result.public_id
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError)
      }
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

  } catch (error) {
    console.error('Update doctor error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update doctor'
    })
  }
}

export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      })
    }

    // Delete image from Cloudinary
    if (doctor.imagePublicId) {
      await cloudinary.uploader.destroy(doctor.imagePublicId)
    }

    await doctor.deleteOne()
    res.json({ success: true, message: 'Doctor deleted successfully' })

  } catch (error) {
    console.error('Delete doctor error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete doctor'
    })
  }
}

export const getFeaturedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .populate('department', 'name icon')
      .sort({ rating: -1 })
      .limit(6)
    res.json({ success: true, doctors })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}