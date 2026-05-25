import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Department from './models/Department.js'
import Doctor from './models/Doctor.js'

dotenv.config()

const departments = [
  { name: 'Cardiology', description: 'Heart and cardiovascular care', icon: '❤️' },
  { name: 'Neurology', description: 'Brain and nervous system', icon: '🧠' },
  { name: 'Orthopedics', description: 'Bones and joints', icon: '🦴' },
  { name: 'Pediatrics', description: 'Child healthcare', icon: '👶' },
  { name: 'Dermatology', description: 'Skin and hair care', icon: '🌿' },
  { name: 'Ophthalmology', description: 'Eyes and vision', icon: '👁️' },
  { name: 'Dentistry', description: 'Oral healthcare', icon: '🦷' },
  { name: 'General Medicine', description: 'Primary care', icon: '🏥' }
]

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB Connected')

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL })
    if (!adminExists) {
      await User.create({ name: 'Admin User', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin', phone: '+1234567890' })
      console.log('✅ Admin created:', process.env.ADMIN_EMAIL)
    } else {
      console.log('ℹ️  Admin already exists')
    }

    for (const dept of departments) {
      const exists = await Department.findOne({ name: dept.name })
      if (!exists) { await Department.create(dept); console.log(`✅ Department: ${dept.name}`) }
    }

    console.log('\n🏥 Seed complete!')
    console.log('Admin Email:', process.env.ADMIN_EMAIL)
    console.log('Admin Password:', process.env.ADMIN_PASSWORD)
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seedDB()