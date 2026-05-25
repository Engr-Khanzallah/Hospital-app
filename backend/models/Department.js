import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: { type: String, default: '🏥' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Department', departmentSchema)