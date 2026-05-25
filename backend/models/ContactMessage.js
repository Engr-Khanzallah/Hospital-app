import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  repliedAt: Date
}, { timestamps: true })

export default mongoose.model('ContactMessage', contactMessageSchema)