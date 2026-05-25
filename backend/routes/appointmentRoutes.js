import express from 'express'
import { bookAppointment, getMyAppointments, cancelAppointment, getAllAppointments, updateAppointmentStatus, getAppointmentStats } from '../controllers/appointmentController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, bookAppointment)
router.get('/my', protect, getMyAppointments)
router.put('/:id/cancel', protect, cancelAppointment)
router.get('/stats', protect, adminOnly, getAppointmentStats)
router.get('/', protect, adminOnly, getAllAppointments)
router.put('/:id/status', protect, adminOnly, updateAppointmentStatus)

export default router