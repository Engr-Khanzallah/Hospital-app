/**
 * MANUAL integration check for the thing unit tests cannot prove: MongoDB itself refusing a
 * double booking when many requests arrive at the same instant.
 *
 * Needs a REAL MongoDB. Use a throw-away database, NOT production:
 *     MONGODB_URI_TEST="mongodb+srv://.../hospital_test" npm run test:concurrency
 * It refuses to run unless the database name contains "test". It only removes documents it created.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import Appointment from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'

const uri = process.env.MONGODB_URI_TEST
if (!uri) { console.error('Set MONGODB_URI_TEST to a throw-away test database.'); process.exit(2) }

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
const dbName = mongoose.connection.name
if (!/test/i.test(dbName)) { console.error(`Refusing to run: database "${dbName}" does not look like a test database.`); process.exit(2) }

const created = { users: [], doctors: [], appointments: [] }
let failed = false
const check = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failed = true }

try {
  await Appointment.syncIndexes()
  const indexes = await Appointment.collection.indexes()
  check(indexes.some((i) => i.name === 'uniq_active_doctor_slot' && i.unique), 'unique partial index exists')

  const stamp = Date.now()
  const patients = await User.insertMany(Array.from({ length: 10 }, (_, i) => ({
    name: `Race ${i}`, email: `race${i}-${stamp}@example.test`, password: 'password123'
  })))
  created.users = patients.map((p) => p._id)
  const doctor = await Doctor.create({
    name: 'Race Doctor', email: `race-doc-${stamp}@example.test`, phone: '0300000000',
    specialty: 'Test', experience: 1, consultationFee: 10
  })
  created.doctors.push(doctor._id)

  const date = new Date('2030-01-01T00:00:00.000Z')
  const attempt = (patient) => Appointment.create({
    patient: patient._id, doctor: doctor._id, appointmentDate: date, timeSlot: '10:00', consultationFee: 10
  })

  const results = await Promise.allSettled(patients.map(attempt))
  const wins = results.filter((r) => r.status === 'fulfilled')
  const dupes = results.filter((r) => r.status === 'rejected' && r.reason?.code === 11000)
  wins.forEach((w) => created.appointments.push(w.value._id))
  check(wins.length === 1, `10 simultaneous bookings of one slot -> exactly 1 succeeded (got ${wins.length})`)
  check(dupes.length === 9, `the other 9 were rejected with duplicate-key errors (got ${dupes.length})`)

  const holder = await Appointment.findById(wins[0].value._id)
  holder.status = 'cancelled'
  await holder.save()
  const rebook = await attempt(patients[5])
  created.appointments.push(rebook._id)
  check(Boolean(rebook._id), 'after cancelling, the slot is free and can be booked again')

  const other = await Appointment.create({ patient: patients[6]._id, doctor: doctor._id, appointmentDate: date, timeSlot: '10:30', consultationFee: 10 })
  created.appointments.push(other._id)
  check(Boolean(other._id), 'a different slot on the same day is unaffected')
} catch (err) {
  failed = true
  console.error('Unexpected error:', err.message)
} finally {
  await Appointment.deleteMany({ _id: { $in: created.appointments } })
  await Doctor.deleteMany({ _id: { $in: created.doctors } })
  await User.deleteMany({ _id: { $in: created.users } })
  await mongoose.disconnect()
}
console.log(failed ? '\nRESULT: FAILED' : '\nRESULT: ALL CHECKS PASSED')
process.exit(failed ? 1 : 0)
