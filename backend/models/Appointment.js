import mongoose from 'mongoose'

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

// Legitimate status flow. completed / cancelled are final.
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
}

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending' },
  symptoms: String,
  notes: String,
  adminNotes: String,
  consultationFee: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending','paid'], default: 'pending' },
  cancelledBy: { type: String, enum: ['patient','admin','doctor'] },
  cancellationReason: String,
  // Internal: true while the appointment occupies its slot (any status except cancelled).
  // A partial UNIQUE index on this flag is what makes double-booking impossible even when two
  // requests arrive at the same instant. Cancelling unsets it, which frees the slot.
  slotLock: { type: Boolean, select: false }
}, { timestamps: true })

appointmentSchema.pre('validate', function (next) {
  this.slotLock = this.status === 'cancelled' ? undefined : true
  next()
})

// One active appointment per doctor + day + slot. Documents without slotLock (cancelled, or
// created before this change) are outside the index, so building it can never fail on old data.
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { slotLock: true }, name: 'uniq_active_doctor_slot' }
)
appointmentSchema.index({ patient: 1, appointmentDate: -1 })
appointmentSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Appointment', appointmentSchema)
