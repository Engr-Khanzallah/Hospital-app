import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: String,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: Date,
  address: { street: String, city: String, state: String, zipCode: String },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)