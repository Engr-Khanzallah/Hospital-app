import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCalendarDate, appointmentDateFromCalendar, dayNameOf, generateSlots, validateBookingRequest
} from '../utils/scheduling.js'

const doctor = {
  name: 'A', isActive: true, isAvailable: true,
  availableSlots: [{ day: 'Tuesday', startTime: '09:00', endTime: '10:00', isAvailable: true }]
}
const friday10amPKT = Date.parse('2026-10-16T05:00:00Z')

test('calendar date: plain date, legacy ISO from any browser timezone, and junk', () => {
  assert.deepEqual(parseCalendarDate('2026-10-20'), { y: 2026, m: 10, d: 20 })
  // Pakistani browser (UTC+5) local midnight of 20 Oct, as the OLD frontend sent it:
  assert.deepEqual(parseCalendarDate('2026-10-19T19:00:00.000Z'), { y: 2026, m: 10, d: 20 })
  assert.equal(parseCalendarDate('2026-02-30'), null)
  assert.equal(parseCalendarDate('tomorrow'), null)
  assert.equal(parseCalendarDate(12345), null)
  assert.equal(parseCalendarDate({ $ne: 1 }), null)
})

test('stored date is hospital-midnight; matches what legacy Pakistani bookings already contain', () => {
  assert.equal(appointmentDateFromCalendar({ y: 2026, m: 10, d: 20 }).toISOString(), '2026-10-19T19:00:00.000Z')
  assert.equal(dayNameOf({ y: 2026, m: 10, d: 20 }), 'Tuesday')
})

test('timezone is configurable and DST-safe', () => {
  process.env.HOSPITAL_TIMEZONE = 'America/New_York'
  try {
    assert.equal(appointmentDateFromCalendar({ y: 2026, m: 11, d: 1 }).toISOString(), '2026-11-01T04:00:00.000Z')
    assert.equal(appointmentDateFromCalendar({ y: 2026, m: 11, d: 2 }).toISOString(), '2026-11-02T05:00:00.000Z')
  } finally { delete process.env.HOSPITAL_TIMEZONE }
})

test('slots follow the same 30-minute algorithm as the booking page', () => {
  assert.deepEqual(generateSlots({ startTime: '09:00', endTime: '10:30' }), ['09:00', '09:30', '10:00'])
  assert.deepEqual(generateSlots({ startTime: '11:00', endTime: '09:00' }), [])
  assert.deepEqual(generateSlots({ startTime: 'x', endTime: '09:00' }), [])
})

test('booking validation: valid request', () => {
  const r = validateBookingRequest({ doctor, dateInput: '2026-10-20', timeSlot: '09:30', nowMs: friday10amPKT })
  assert.equal(r.ok, true)
  assert.equal(r.appointmentDate.toISOString(), '2026-10-19T19:00:00.000Z')
})

test('booking validation: every rejection path', () => {
  const run = (over) => validateBookingRequest({ doctor, dateInput: '2026-10-20', timeSlot: '09:30', nowMs: friday10amPKT, ...over })
  assert.equal(run({ doctor: null }).status, 404)
  assert.equal(run({ doctor: { ...doctor, isActive: false } }).status, 404)
  assert.match(run({ doctor: { ...doctor, isAvailable: false } }).message, /not accepting/)
  assert.match(run({ dateInput: 'nope' }).message, /valid appointment date/)
  assert.match(run({ dateInput: '2026-10-13' }).message, /past/)
  assert.match(run({ dateInput: '2027-03-01' }).message, /in advance/)
  assert.match(run({ dateInput: '2026-10-21' }).message, /does not see patients on Wednesdays/)
  assert.match(run({ timeSlot: '10:00' }).message, /not one of this doctor/)
  assert.match(run({ timeSlot: '9:30' }).message, /not one of this doctor/)
  assert.match(run({ timeSlot: 42 }).message, /valid time slot/)
})

test('booking validation: a slot earlier today is rejected, a later one is accepted', () => {
  const tuesday11am = Date.parse('2026-10-20T06:00:00Z')
  const tuesday7am = Date.parse('2026-10-20T02:00:00Z')
  assert.match(validateBookingRequest({ doctor, dateInput: '2026-10-20', timeSlot: '09:30', nowMs: tuesday11am }).message, /already passed/)
  assert.equal(validateBookingRequest({ doctor, dateInput: '2026-10-20', timeSlot: '09:30', nowMs: tuesday7am }).ok, true)
})
