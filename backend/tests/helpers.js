import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Doctor from '../models/Doctor.js'
import Appointment from '../models/Appointment.js'
import ContactMessage from '../models/ContactMessage.js'
import Department from '../models/Department.js'
import { createApp } from '../app.js'
import { buildLimiters } from '../middleware/rateLimit.js'
import { hospitalNow, calendarKey } from '../utils/scheduling.js'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.NODE_ENV = 'test'

export const ID = {
  patient: '64b000000000000000000001',
  admin: '64b000000000000000000002',
  inactive: '64b000000000000000000003',
  ghost: '64b000000000000000000004',
  doctor: '64c000000000000000000001',
  appt: '64d000000000000000000001'
}

export const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET)

export const users = {
  [ID.patient]: { _id: ID.patient, name: 'Pat', role: 'patient', isActive: true },
  [ID.admin]: { _id: ID.admin, name: 'Ada', role: 'admin', isActive: true },
  [ID.inactive]: { _id: ID.inactive, name: 'Off', role: 'patient', isActive: false }
}

const models = { User, Doctor, Appointment, ContactMessage, Department }
const originals = new Map()

// Replace static model methods for the duration of a test file.
export const stub = (modelName, methods) => {
  const model = models[modelName]
  for (const [name, fn] of Object.entries(methods)) {
    const key = `${modelName}.${name}`
    if (!originals.has(key)) originals.set(key, model[name])
    model[name] = fn
  }
}
export const restoreAll = () => {
  for (const [key, fn] of originals) {
    const [modelName, name] = key.split('.')
    models[modelName][name] = fn
  }
  originals.clear()
}

// Chainable query stand-in: await-able and supports .select/.populate/.sort/.skip/.limit.
export const query = (result) => {
  const q = {
    select: () => q, populate: () => q, sort: () => q, skip: () => q, limit: () => q,
    then: (res, rej) => Promise.resolve(result).then(res, rej)
  }
  return q
}

export const installAuthStub = () =>
  stub('User', { findById: (id) => query(users[String(id)] || null) })

export const daysFromToday = (offset) => {
  const n = hospitalNow()
  const t = new Date(Date.UTC(n.y, n.m - 1, n.d + offset))
  return calendarKey({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() })
}

export const allDaysDoctor = (overrides = {}) => ({
  _id: ID.doctor, name: 'Test', isActive: true, isAvailable: true, consultationFee: 50,
  availableSlots: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    .map((day) => ({ day, startTime: '00:00', endTime: '23:30', isAvailable: true })),
  ...overrides
})

export const startServer = async ({ limiters, aiReply, env = {} } = {}) => {
  Object.assign(process.env, env)
  const app = createApp({ limiters: limiters || buildLimiters(), aiReply })
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const call = async (method, path, { body, token, headers = {} } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    let json = null
    try { json = await res.json() } catch { /* empty body */ }
    return { status: res.status, body: json, headers: res.headers }
  }
  return { base, call, close: () => new Promise((r) => server.close(r)) }
}
