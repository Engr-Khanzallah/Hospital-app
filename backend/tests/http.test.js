import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  ID, tokenFor, users, stub, restoreAll, query, installAuthStub, daysFromToday, allDaysDoctor, startServer
} from './helpers.js'
import { buildLimiters } from '../middleware/rateLimit.js'

let api
const patient = () => tokenFor(ID.patient)
const admin = () => tokenFor(ID.admin)
const noSecrets = (res) => assert.ok(!JSON.stringify(res.body).includes('test-secret-not-real'))

before(async () => {
  installAuthStub()
  api = await startServer()
})
after(async () => { await api.close(); restoreAll() })

// ---------------------------------------------------------------------------------------------
test.describe('authentication & authorization', () => {
  test('no token / garbage token / unknown user / deactivated user', async () => {
    assert.equal((await api.call('GET', '/api/auth/me')).status, 401)
    assert.equal((await api.call('GET', '/api/auth/me', { token: 'garbage' })).status, 401)
    const ghost = await api.call('GET', '/api/appointments/my', { token: tokenFor(ID.ghost) })
    assert.equal(ghost.status, 401)
    assert.match(ghost.body.message, /no longer exists/)
    const off = await api.call('GET', '/api/appointments/my', { token: tokenFor(ID.inactive) })
    assert.equal(off.status, 403)
    assert.match(off.body.message, /deactivated/)
  })

  test('a token whose payload is not an ObjectId is rejected without touching the database', async () => {
    const res = await api.call('GET', '/api/appointments/my', { token: tokenFor({ $ne: 1 }) })
    assert.equal(res.status, 401)
  })

  test('admin-only routes: patient 403, anonymous 401, admin allowed', async () => {
    stub('Appointment', {
      countDocuments: async () => 0,
      aggregate: async () => []
    })
    assert.equal((await api.call('GET', '/api/appointments/stats')).status, 401)
    assert.equal((await api.call('GET', '/api/appointments/stats', { token: patient() })).status, 403)
    assert.equal((await api.call('GET', '/api/appointments', { token: patient() })).status, 403)
    assert.equal((await api.call('DELETE', `/api/doctors/${ID.doctor}`, { token: patient() })).status, 403)
    assert.equal((await api.call('GET', '/api/users', { token: patient() })).status, 403)
    assert.equal((await api.call('GET', '/api/contact', { token: patient() })).status, 403)
    assert.equal((await api.call('GET', '/api/appointments/stats', { token: admin() })).status, 200)
  })

  test('login: NoSQL operator objects are rejected before any query runs', async () => {
    let queried = false
    stub('User', { findOne: () => { queried = true; return query(null) } })
    const res = await api.call('POST', '/api/auth/login', { body: { email: { $ne: null }, password: { $ne: null } } })
    assert.equal(res.status, 400)
    assert.equal(queried, false)
    const admin = await api.call('POST', '/api/auth/admin-login', { body: { email: { $gt: '' }, password: 'x' } })
    assert.equal(admin.status, 400)
    assert.equal(queried, false)
  })

  test('login: wrong password 401, deactivated 403, success returns token without password', async () => {
    const doc = (over) => ({
      _id: ID.patient, name: 'Pat', email: 'p@x.com', role: 'patient', isActive: true,
      comparePassword: async (p) => p === 'correct-password', ...over
    })
    stub('User', { findOne: () => query(doc()) })
    assert.equal((await api.call('POST', '/api/auth/login', { body: { email: 'p@x.com', password: 'nope' } })).status, 401)
    const ok = await api.call('POST', '/api/auth/login', { body: { email: ' P@X.com ', password: 'correct-password' } })
    assert.equal(ok.status, 200)
    assert.ok(ok.body.token)
    assert.equal(ok.body.user.password, undefined)
    stub('User', { findOne: () => query(doc({ isActive: false })) })
    assert.equal((await api.call('POST', '/api/auth/login', { body: { email: 'p@x.com', password: 'correct-password' } })).status, 403)
    installAuthStub()
  })

  test('register: validates input and can never create an admin', async () => {
    const created = []
    stub('User', {
      findOne: async () => null,
      create: async (data) => { created.push(data); return { _id: ID.patient, ...data } }
    })
    assert.equal((await api.call('POST', '/api/auth/register', { body: { name: 'A', email: 'bad', password: '123456' } })).status, 400)
    assert.equal((await api.call('POST', '/api/auth/register', { body: { name: 'Alice', email: 'a@x.com', password: '123' } })).status, 400)
    assert.equal((await api.call('POST', '/api/auth/register', { body: { name: 'Alice', email: 'a@x.com', password: 'x'.repeat(80) } })).status, 400)
    const ok = await api.call('POST', '/api/auth/register', {
      body: { name: 'Alice', email: 'A@X.com', password: 'secret123', role: 'admin', isActive: false }
    })
    assert.equal(ok.status, 201)
    assert.equal(created.length, 1)
    assert.equal(created[0].role, 'patient')
    assert.equal(created[0].email, 'a@x.com')
    assert.equal(created[0].isActive, undefined)
    installAuthStub()
  })
})

// ---------------------------------------------------------------------------------------------
test.describe('appointment booking', () => {
  let created, existsFor, createError
  beforeEach(() => {
    created = []; existsFor = { slot: false, patient: false }; createError = null
    stub('Doctor', { findById: (id) => query(id === ID.doctor ? allDaysDoctor() : null) })
    stub('Appointment', {
      exists: async (filter) => (filter.doctor ? existsFor.slot : existsFor.patient),
      create: async (data) => {
        if (createError) throw createError
        created.push(data)
        return { ...data, _id: ID.appt, populate: async function () { return this } }
      }
    })
  })
  const book = (over = {}, token = patient()) => api.call('POST', '/api/appointments', {
    token,
    body: { doctorId: ID.doctor, appointmentDate: daysFromToday(3), timeSlot: '10:00', symptoms: 'cough', ...over }
  })

  test('valid booking is created for the logged-in patient with the doctor fee', async () => {
    const res = await book()
    assert.equal(res.status, 201)
    assert.equal(created[0].patient, ID.patient)
    assert.equal(created[0].consultationFee, 50)
    assert.equal(created[0].timeSlot, '10:00')
  })

  test('client cannot choose the patient, fee or status', async () => {
    await book({ patient: ID.admin, consultationFee: 0, status: 'completed' })
    assert.equal(created[0].patient, ID.patient)
    assert.equal(created[0].consultationFee, 50)
    assert.equal(created[0].status, undefined)
  })

  test('requires login', async () => assert.equal((await book({}, null)).status, 401))

  test('invalid / unknown / inactive doctor', async () => {
    assert.equal((await book({ doctorId: 'abc' })).status, 400)
    assert.equal((await book({ doctorId: { $ne: 1 } })).status, 400)
    assert.equal((await book({ doctorId: ID.ghost })).status, 404)
    stub('Doctor', { findById: () => query(allDaysDoctor({ isActive: false })) })
    assert.equal((await book()).status, 404)
    stub('Doctor', { findById: () => query(allDaysDoctor({ isAvailable: false })) })
    assert.equal((await book()).status, 400)
  })

  test('past dates and passed same-day slots are rejected', async () => {
    const past = await book({ appointmentDate: daysFromToday(-1) })
    assert.equal(past.status, 400)
    assert.match(past.body.message, /past/)
    const passedToday = await book({ appointmentDate: daysFromToday(0), timeSlot: '00:00' })
    assert.equal(passedToday.status, 400)
    assert.match(passedToday.body.message, /already passed/)
    assert.equal(created.length, 0)
  })

  test('garbage dates, far-future dates and slots outside the schedule', async () => {
    assert.equal((await book({ appointmentDate: 'tomorrow' })).status, 400)
    assert.equal((await book({ appointmentDate: { $gt: '' } })).status, 400)
    assert.equal((await book({ appointmentDate: daysFromToday(400) })).status, 400)
    assert.equal((await book({ timeSlot: '23:45' })).status, 400)
    assert.equal((await book({ timeSlot: 'noon' })).status, 400)
    stub('Doctor', { findById: () => query(allDaysDoctor({ availableSlots: [] })) })
    assert.match((await book()).body.message, /does not see patients/)
  })

  test('slot already taken -> 409 (friendly pre-check)', async () => {
    existsFor.slot = true
    const res = await book()
    assert.equal(res.status, 409)
    assert.match(res.body.message, /already booked/)
    assert.equal(created.length, 0)
  })

  test('two requests racing past the pre-check: the unique index error becomes a clean 409', async () => {
    createError = Object.assign(new Error('E11000 duplicate key'), { code: 11000, keyPattern: { doctor: 1, appointmentDate: 1, timeSlot: 1 } })
    const res = await book()
    assert.equal(res.status, 409)
    assert.match(res.body.message, /already booked|just booked/)
    noSecrets(res)
  })

  test('patient cannot hold two active appointments at the same time', async () => {
    existsFor.patient = true
    const res = await book()
    assert.equal(res.status, 409)
    assert.match(res.body.message, /already have an appointment/)
  })

  test('booked-slots endpoint returns labels only and validates input', async () => {
    stub('Appointment', { find: () => query([{ timeSlot: '10:00' }, { timeSlot: '10:30' }]) })
    const ok = await api.call('GET', `/api/appointments/booked-slots?doctorId=${ID.doctor}&date=${daysFromToday(3)}`, { token: patient() })
    assert.equal(ok.status, 200)
    assert.deepEqual(ok.body.bookedSlots, ['10:00', '10:30'])
    assert.equal((await api.call('GET', `/api/appointments/booked-slots?doctorId=bad&date=${daysFromToday(3)}`, { token: patient() })).status, 400)
    assert.equal((await api.call('GET', `/api/appointments/booked-slots?doctorId=${ID.doctor}&date=nope`, { token: patient() })).status, 400)
    assert.equal((await api.call('GET', `/api/appointments/booked-slots?doctorId=${ID.doctor}&date=${daysFromToday(3)}`)).status, 401)
  })
})

// ---------------------------------------------------------------------------------------------
test.describe('cancel & status transitions', () => {
  let doc
  const makeDoc = (status, patientId = ID.patient) => {
    doc = {
      _id: ID.appt, status, patient: patientId, saved: false,
      save: async function () { this.saved = true },
      populate: async function () { return this }
    }
    stub('Appointment', { findById: async () => doc })
  }
  const setStatus = (status, extra = {}) =>
    api.call('PUT', `/api/appointments/${ID.appt}/status`, { token: admin(), body: { status, ...extra } })

  test('legitimate transitions work', async () => {
    makeDoc('pending'); assert.equal((await setStatus('confirmed')).status, 200); assert.equal(doc.status, 'confirmed')
    makeDoc('confirmed'); assert.equal((await setStatus('completed')).status, 200)
    makeDoc('pending'); assert.equal((await setStatus('cancelled', { cancellationReason: 'doctor away' })).status, 200)
    assert.equal(doc.cancelledBy, 'admin')
    assert.equal(doc.cancellationReason, 'doctor away')
    makeDoc('confirmed'); assert.equal((await setStatus('cancelled')).status, 200)
  })

  test('invalid transitions and values are refused and nothing is saved', async () => {
    for (const [from, to] of [['completed', 'pending'], ['completed', 'cancelled'], ['cancelled', 'confirmed'], ['cancelled', 'pending'], ['pending', 'completed'], ['confirmed', 'pending'], ['pending', 'pending']]) {
      makeDoc(from)
      const res = await setStatus(to)
      assert.equal(res.status, 400, `${from} -> ${to}`)
      assert.equal(doc.saved, false)
    }
    makeDoc('pending')
    assert.equal((await setStatus('banana')).status, 400)
    assert.equal((await setStatus(undefined)).status, 400)
    assert.equal((await setStatus({ $ne: 1 })).status, 400)
    assert.equal((await api.call('PUT', '/api/appointments/not-an-id/status', { token: admin(), body: { status: 'confirmed' } })).status, 400)
  })

  test('patient cancel: owner only, not twice, not after completion', async () => {
    const cancel = (token = patient()) => api.call('PUT', `/api/appointments/${ID.appt}/cancel`, { token, body: {} })
    makeDoc('pending'); assert.equal((await cancel()).status, 200); assert.equal(doc.cancelledBy, 'patient')
    makeDoc('confirmed'); assert.equal((await cancel()).status, 200)
    makeDoc('cancelled'); assert.equal((await cancel()).status, 400)
    makeDoc('completed'); assert.equal((await cancel()).status, 400)
    makeDoc('pending', ID.admin); assert.equal((await cancel()).status, 403)
  })
})

// ---------------------------------------------------------------------------------------------
test.describe('deletion integrity (history is never silently destroyed)', () => {
  const TARGET = '64b0000000000000000000aa'
  let deleted
  beforeEach(() => {
    deleted = false
    users[TARGET] = { _id: TARGET, role: 'patient', isActive: true, deleteOne: async () => { deleted = true } }
  })

  test('patient with appointments cannot be deleted; without can', async () => {
    stub('Appointment', { countDocuments: async () => 3 })
    const blocked = await api.call('DELETE', `/api/users/${TARGET}`, { token: admin() })
    assert.equal(blocked.status, 409)
    assert.match(blocked.body.message, /Deactivate/)
    assert.equal(deleted, false)
    stub('Appointment', { countDocuments: async () => 0 })
    assert.equal((await api.call('DELETE', `/api/users/${TARGET}`, { token: admin() })).status, 200)
    assert.equal(deleted, true)
    assert.equal((await api.call('DELETE', `/api/users/${ID.admin}`, { token: admin() })).status, 403)
  })

  const doctorDoc = () => ({
    _id: ID.doctor, name: 'Test', isActive: true, isAvailable: true, imagePublicId: undefined,
    saved: false, removed: false,
    save: async function () { this.saved = true },
    deleteOne: async function () { this.removed = true }
  })

  test('doctor: upcoming appointments block, history archives, clean doctor is deleted', async () => {
    let d = doctorDoc()
    stub('Doctor', { findById: () => query(d) })

    stub('Appointment', { countDocuments: async (f) => (f.status ? 2 : 5) })
    const blocked = await api.call('DELETE', `/api/doctors/${ID.doctor}`, { token: admin() })
    assert.equal(blocked.status, 409)
    assert.equal(d.saved || d.removed, false)

    stub('Appointment', { countDocuments: async (f) => (f.status ? 0 : 5) })
    const archived = await api.call('DELETE', `/api/doctors/${ID.doctor}`, { token: admin() })
    assert.equal(archived.status, 200)
    assert.equal(archived.body.archived, true)
    assert.equal(d.isActive, false)
    assert.equal(d.isAvailable, false)
    assert.equal(d.removed, false)

    d = doctorDoc()
    stub('Appointment', { countDocuments: async () => 0 })
    const gone = await api.call('DELETE', `/api/doctors/${ID.doctor}`, { token: admin() })
    assert.equal(gone.status, 200)
    assert.equal(d.removed, true)
  })

  test('department with doctors cannot be deleted', async () => {
    const dept = { _id: ID.doctor, deleteOne: async () => { deleted = true } }
    stub('Department', { findById: async () => dept })
    stub('Doctor', { countDocuments: async () => 4 })
    const res = await api.call('DELETE', `/api/departments/${ID.doctor}`, { token: admin() })
    assert.equal(res.status, 409)
    assert.equal(deleted, false)
  })
})

// ---------------------------------------------------------------------------------------------
test.describe('allowlists - no mass assignment', () => {
  test('doctor update copies only allowed fields and validates department', async () => {
    let update
    const doctor = { _id: ID.doctor, email: 'old@x.com', imagePublicId: 'keep' }
    stub('Doctor', {
      findById: () => query(doctor),
      findByIdAndUpdate: async (id, u) => { update = u; return { ...doctor, ...u.$set } }
    })
    stub('Department', { findById: () => query(null) })

    const badDept = await api.call('PUT', `/api/doctors/${ID.doctor}`, { token: admin(), body: { name: 'New Name', department: '[object Object]' } })
    assert.equal(badDept.status, 400)
    const missingDept = await api.call('PUT', `/api/doctors/${ID.doctor}`, { token: admin(), body: { department: ID.ghost } })
    assert.equal(missingDept.status, 400)
    assert.match(missingDept.body.message, /does not exist/)

    const ok = await api.call('PUT', `/api/doctors/${ID.doctor}`, {
      token: admin(),
      body: { name: 'New Name', rating: 5, totalReviews: 999, imagePublicId: 'attacker', _id: 'x', isActive: false, consultationFee: '75' }
    })
    assert.equal(ok.status, 200)
    assert.deepEqual(Object.keys(update.$set).sort(), ['consultationFee', 'isActive', 'name'])
    assert.equal(update.$set.consultationFee, 75)
  })

  test('doctor create validates fields and availability', async () => {
    stub('Doctor', { findOne: async () => null, create: async (d) => ({ ...d, _id: ID.doctor }) })
    const base = { name: 'Dr X', email: 'x@x.com', phone: '0300 1234567', specialty: 'Cardiology', experience: '5', consultationFee: '50' }
    const post = (body) => api.call('POST', '/api/doctors', { token: admin(), body })
    assert.equal((await post({ ...base, email: 'nope' })).status, 400)
    assert.equal((await post({ ...base, experience: '-1' })).status, 400)
    assert.equal((await post({ ...base, consultationFee: 'abc' })).status, 400)
    assert.equal((await post({ ...base, availableSlots: '[{"day":"Funday","startTime":"09:00","endTime":"10:00"}]' })).status, 400)
    assert.equal((await post({ ...base, availableSlots: '[{"day":"Monday","startTime":"10:00","endTime":"09:00","isAvailable":true}]' })).status, 400)
    assert.equal((await post({ ...base, availableSlots: 'not json' })).status, 400)
    const ok = await post({ ...base, availableSlots: JSON.stringify([{ day: 'Monday', startTime: '09:00', endTime: '12:00', isAvailable: true }, { day: 'Sunday', startTime: '09:00', endTime: '17:00', isAvailable: false }]) })
    assert.equal(ok.status, 201)
    assert.equal(ok.body.doctor.availableSlots.length, 2)
  })

  test('contact form: only whitelisted fields are stored', async () => {
    let data
    stub('ContactMessage', { create: async (d) => { data = d; return d } })
    const res = await api.call('POST', '/api/contact', {
      body: { name: 'Sam', email: 'sam@x.com', subject: 'Hello', message: 'Need help please', isRead: true, repliedAt: '2020-01-01' }
    })
    assert.equal(res.status, 201)
    assert.equal(data.isRead, undefined)
    assert.equal(data.repliedAt, undefined)
    assert.equal((await api.call('POST', '/api/contact', { body: { name: 'S', email: 'bad', subject: 'x', message: 'y' } })).status, 400)
  })

  test('profile update: only allowed fields; empty selects are unset instead of failing', async () => {
    let update
    stub('User', {
      findById: (id) => query(users[String(id)] || null),
      findByIdAndUpdate: async (id, u) => { update = u; return { _id: id, ...u.$set } }
    })
    const res = await api.call('PUT', '/api/users/profile', {
      token: patient(),
      body: { name: 'New Name', gender: '', dateOfBirth: '', phone: '', bloodGroup: 'O+', role: 'admin', isActive: false, email: 'hack@x.com', address: { street: '1 Main', evil: 'x' } }
    })
    assert.equal(res.status, 200)
    assert.deepEqual(Object.keys(update.$set).sort(), ['address.street', 'bloodGroup', 'name'])
    assert.deepEqual(Object.keys(update.$unset).sort(), ['dateOfBirth', 'gender', 'phone'])
    assert.equal((await api.call('PUT', '/api/users/profile', { token: patient(), body: { gender: 'robot' } })).status, 400)
    assert.equal((await api.call('PUT', '/api/users/profile', { token: patient(), body: { dateOfBirth: '2999-01-01' } })).status, 400)
    assert.equal((await api.call('PUT', '/api/users/profile', { token: patient(), body: { role: 'admin' } })).status, 400)
    installAuthStub()
  })
})

// ---------------------------------------------------------------------------------------------
test.describe('error handling', () => {
  test('malformed ids, unknown routes and bad JSON give clean 4xx errors', async () => {
    const badId = await api.call('GET', '/api/doctors/abc')
    assert.equal(badId.status, 400)
    assert.match(badId.body.message, /invalid/)
    assert.equal((await api.call('GET', '/api/does-not-exist')).status, 404)
    const res = await fetch(`${api.base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' })
    assert.equal(res.status, 400)
    assert.equal((await api.call('GET', '/api/doctors?department=nope')).status, 400)
  })

  test('unexpected errors do not leak internals in production', async () => {
    stub('Doctor', { countDocuments: async () => { throw new Error('mongodb://user:pass@secret-host exploded') } })
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const res = await api.call('GET', '/api/doctors')
      assert.equal(res.status, 500)
      assert.ok(!JSON.stringify(res.body).includes('secret-host'))
      assert.equal(res.body.stack, undefined)
    } finally { process.env.NODE_ENV = prev }
  })

  test('security headers are set and x-powered-by is hidden', async () => {
    const res = await api.call('GET', '/')
    assert.equal(res.headers.get('x-powered-by'), null)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  })
})
