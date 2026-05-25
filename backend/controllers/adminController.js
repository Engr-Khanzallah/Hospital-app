import User from '../models/User.js'
import Doctor from '../models/Doctor.js'
import Appointment from '../models/Appointment.js'
import ContactMessage from '../models/ContactMessage.js'

export const getDashboardStats = async (req, res) => {
  const [totalPatients, totalDoctors, totalAppointments, pendingAppointments,
    confirmedAppointments, completedAppointments, cancelledAppointments, unreadMessages] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ status: 'confirmed' }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' }),
    ContactMessage.countDocuments({ isRead: false })
  ])
  const revenueResult = await Appointment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$consultationFee' } } }])
  const recentAppointments = await Appointment.find().populate('patient', 'name email').populate('doctor', 'name specialty image').sort({ createdAt: -1 }).limit(5)
  res.json({
    success: true,
    stats: { totalPatients, totalDoctors, totalAppointments, pendingAppointments, confirmedAppointments, completedAppointments, cancelledAppointments, unreadMessages, revenue: revenueResult[0]?.total || 0 },
    recentAppointments
  })
}