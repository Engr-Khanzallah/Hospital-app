import mongoose from 'mongoose'

const timeSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  startTime: String,
  endTime: String,
  isAvailable: { type: Boolean, default: true }
})

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialty: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  qualification: [String],
  experience: { type: Number, required: true },
  consultationFee: { type: Number, required: true },
  about: String,
  image: { type: String, default: '' },
  imagePublicId: String,
  availableSlots: [timeSlotSchema],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Doctor', doctorSchema)