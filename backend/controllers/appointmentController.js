import Appointment from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'

export const bookAppointment = async (req, res) => {
  const { doctorId, appointmentDate, timeSlot, symptoms } = req.body
  const doctor = await Doctor.findById(doctorId)
  if (!doctor || !doctor.isActive) return res.status(404).json({ success: false, message: 'Doctor not found' })
  const existing = await Appointment.findOne({ doctor: doctorId, appointmentDate: new Date(appointmentDate), timeSlot, status: { $ne: 'cancelled' } })
  if (existing) return res.status(400).json({ success: false, message: 'This time slot is already booked' })
  const appointment = await Appointment.create({ patient: req.user._id, doctor: doctorId, appointmentDate: new Date(appointmentDate), timeSlot, symptoms, consultationFee: doctor.consultationFee })
  await appointment.populate(['doctor', 'patient'])
  res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment })
}

export const getMyAppointments = async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id }).populate('doctor', 'name specialty image consultationFee').sort({ appointmentDate: -1 })
  res.json({ success: true, appointments })
}

export const cancelAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })
  if (appointment.patient.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  if (appointment.status === 'completed') return res.status(400).json({ success: false, message: 'Cannot cancel completed appointment' })
  appointment.status = 'cancelled'; appointment.cancelledBy = 'patient'; appointment.cancellationReason = req.body.reason || 'Cancelled by patient'
  await appointment.save()
  res.json({ success: true, message: 'Appointment cancelled', appointment })
}

export const getAllAppointments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const query = {}
  if (status) query.status = status
  const skip = (page - 1) * limit
  const total = await Appointment.countDocuments(query)
  const appointments = await Appointment.find(query).populate('patient', 'name email phone').populate('doctor', 'name specialty image').sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
  res.json({ success: true, appointments, total, pages: Math.ceil(total / limit), currentPage: Number(page) })
}

export const updateAppointmentStatus = async (req, res) => {
  const { status, adminNotes, cancellationReason } = req.body
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })
  appointment.status = status
  if (adminNotes) appointment.adminNotes = adminNotes
  if (status === 'cancelled') { appointment.cancelledBy = 'admin'; appointment.cancellationReason = cancellationReason || 'Cancelled by admin' }
  await appointment.save()
  await appointment.populate(['patient', 'doctor'])
  res.json({ success: true, message: `Appointment ${status}`, appointment })
}

export const getAppointmentStats = async (req, res) => {
  const total = await Appointment.countDocuments()
  const pending = await Appointment.countDocuments({ status: 'pending' })
  const confirmed = await Appointment.countDocuments({ status: 'confirmed' })
  const completed = await Appointment.countDocuments({ status: 'completed' })
  const cancelled = await Appointment.countDocuments({ status: 'cancelled' })
  const revenueResult = await Appointment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$consultationFee' } } }])
  res.json({ success: true, stats: { total, pending, confirmed, completed, cancelled, revenue: revenueResult[0]?.total || 0 } })
}