import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  symptoms: String,
  notes: String,
  adminNotes: String,
  consultationFee: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending','paid'], default: 'pending' },
  cancelledBy: { type: String, enum: ['patient','admin','doctor'] },
  cancellationReason: String
}, { timestamps: true })

export default mongoose.model('Appointment', appointmentSchema)