import Appointment, { APPOINTMENT_STATUSES, STATUS_TRANSITIONS } from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'
import { AppError } from '../utils/httpError.js'
import { str, oneOf, requireObjectId, parsePagination } from '../utils/validate.js'
import {
  validateBookingRequest, parseCalendarDate, appointmentDateFromCalendar, calendarKey
} from '../utils/scheduling.js'

const ACTIVE_STATUSES = ['pending', 'confirmed']
const SLOT_TAKEN_MESSAGE = 'This time slot is already booked. Please choose another slot.'

export const bookAppointment = async (req, res) => {
  const body = req.body || {}
  const doctorId = requireObjectId(body.doctorId, 'Doctor')
  const symptoms = str(body.symptoms, 'Symptoms', { max: 1000 })

  const doctor = await Doctor.findById(doctorId)
  const check = validateBookingRequest({
    doctor, dateInput: body.appointmentDate, timeSlot: body.timeSlot
  })
  if (!check.ok) throw new AppError(check.status, check.message)

  // Friendly pre-checks (the unique index below is the real, race-proof guard).
  const slotQuery = {
    doctor: doctor._id, appointmentDate: check.appointmentDate,
    timeSlot: check.timeSlot, status: { $ne: 'cancelled' }
  }
  if (await Appointment.exists(slotQuery)) throw new AppError(409, SLOT_TAKEN_MESSAGE)

  const patientClash = await Appointment.exists({
    patient: req.user._id, appointmentDate: check.appointmentDate,
    timeSlot: check.timeSlot, status: { $in: ACTIVE_STATUSES }
  })
  if (patientClash) throw new AppError(409, 'You already have an appointment at this date and time.')

  let appointment
  try {
    appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      appointmentDate: check.appointmentDate,
      timeSlot: check.timeSlot,
      symptoms,
      consultationFee: doctor.consultationFee
    })
  } catch (err) {
    if (err?.code === 11000) throw new AppError(409, SLOT_TAKEN_MESSAGE)
    throw err
  }

  await appointment.populate(['doctor', 'patient'])
  res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment })
}

// Which slots are already taken for a doctor on a day (so the booking page can disable them).
// Returns only slot labels - no patient information.
export const getBookedSlots = async (req, res) => {
  const doctorId = requireObjectId(req.query.doctorId, 'Doctor')
  const calendar = parseCalendarDate(req.query.date)
  if (!calendar) throw new AppError(400, 'Please provide a valid date (yyyy-MM-dd)')

  const appointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: appointmentDateFromCalendar(calendar),
    status: { $ne: 'cancelled' }
  }).select('timeSlot')

  res.json({
    success: true,
    date: calendarKey(calendar),
    bookedSlots: appointments.map((a) => a.timeSlot)
  })
}

export const getMyAppointments = async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate('doctor', 'name specialty image consultationFee')
    .sort({ appointmentDate: -1 })
  res.json({ success: true, appointments })
}

export const cancelAppointment = async (req, res) => {
  const reason = str(req.body?.reason, 'Reason', { max: 500 })
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) throw new AppError(404, 'Appointment not found')
  if (appointment.patient.toString() !== req.user._id.toString()) throw new AppError(403, 'Not authorized')
  if (appointment.status === 'completed') throw new AppError(400, 'Cannot cancel completed appointment')
  if (appointment.status === 'cancelled') throw new AppError(400, 'Appointment is already cancelled')

  appointment.status = 'cancelled'
  appointment.cancelledBy = 'patient'
  appointment.cancellationReason = reason || 'Cancelled by patient'
  await appointment.save()
  res.json({ success: true, message: 'Appointment cancelled', appointment })
}

export const getAllAppointments = async (req, res) => {
  const status = oneOf(req.query.status, APPOINTMENT_STATUSES, 'Status')
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 })
  const query = status ? { status } : {}

  const total = await Appointment.countDocuments(query)
  const appointments = await Appointment.find(query)
    .populate('patient', 'name email phone')
    .populate('doctor', 'name specialty image')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
  res.json({ success: true, appointments, total, pages: Math.ceil(total / limit), currentPage: page })
}

export const updateAppointmentStatus = async (req, res) => {
  const body = req.body || {}
  const status = oneOf(body.status, APPOINTMENT_STATUSES, 'Status', { required: true })
  const adminNotes = str(body.adminNotes, 'Notes', { max: 1000 })
  const cancellationReason = str(body.cancellationReason, 'Cancellation reason', { max: 500 })

  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) throw new AppError(404, 'Appointment not found')

  if (appointment.status === status) {
    throw new AppError(400, `Appointment is already ${status}`)
  }
  const allowed = STATUS_TRANSITIONS[appointment.status] || []
  if (!allowed.includes(status)) {
    const from = appointment.status
    throw new AppError(400, allowed.length
      ? `An appointment that is ${from} can only be marked: ${allowed.join(' or ')}`
      : `A ${from} appointment can no longer be changed`)
  }

  appointment.status = status
  if (adminNotes) appointment.adminNotes = adminNotes
  if (status === 'cancelled') {
    appointment.cancelledBy = 'admin'
    appointment.cancellationReason = cancellationReason || 'Cancelled by admin'
  }
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
