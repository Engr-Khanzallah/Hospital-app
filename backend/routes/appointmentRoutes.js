import express from 'express'
import { bookAppointment, getBookedSlots, getMyAppointments, cancelAppointment, getAllAppointments, updateAppointmentStatus, getAppointmentStats } from '../controllers/appointmentController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validateIdParam } from '../utils/validate.js'

export default function appointmentRoutes({ limiters }) {
  const router = express.Router()

  router.post('/', protect, limiters.booking, bookAppointment)
  router.get('/booked-slots', protect, getBookedSlots)
  router.get('/my', protect, getMyAppointments)
  router.put('/:id/cancel', protect, validateIdParam('id', 'Appointment id'), cancelAppointment)
  router.get('/stats', protect, adminOnly, getAppointmentStats)
  router.get('/', protect, adminOnly, getAllAppointments)
  router.put('/:id/status', protect, adminOnly, validateIdParam('id', 'Appointment id'), updateAppointmentStatus)

  return router
}
