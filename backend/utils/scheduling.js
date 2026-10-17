/**
 * Scheduling helpers.
 *
 * Timezone strategy
 * -----------------
 * An appointment "date" is a CALENDAR day at the hospital, not an instant that depends on the
 * patient's browser. We therefore:
 *   1. read the requested day as 'yyyy-MM-dd' (or, for older clients, convert the ISO instant
 *      they send into the hospital's calendar day),
 *   2. store it as the instant of 00:00 at the hospital in HOSPITAL_TIMEZONE,
 *   3. compare "past" / "today" using the hospital clock.
 *
 * HOSPITAL_TIMEZONE is an IANA name (default Asia/Karachi). Set it in the backend environment
 * if your hospital is elsewhere.
 */

const DEFAULT_TIMEZONE = 'Asia/Karachi'
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOT_MINUTES = 30
const TIME_RE = /^(\d{1,2}):(\d{2})$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

let cachedTz = null
export const getHospitalTimeZone = () => {
  const wanted = process.env.HOSPITAL_TIMEZONE || DEFAULT_TIMEZONE
  if (cachedTz && cachedTz.wanted === wanted) return cachedTz.value
  let value = wanted
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: wanted })
  } catch {
    console.warn(`Invalid HOSPITAL_TIMEZONE "${wanted}", falling back to ${DEFAULT_TIMEZONE}`)
    value = DEFAULT_TIMEZONE
  }
  cachedTz = { wanted, value }
  return value
}

const partsInTz = (ms, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const p = {}
  for (const part of formatter.formatToParts(new Date(ms))) p[part.type] = part.value
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour) % 24, minute: Number(p.minute), second: Number(p.second)
  }
}

const offsetMs = (ms, timeZone) => {
  const p = partsInTz(ms, timeZone)
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return wallAsUtc - Math.floor(ms / 1000) * 1000
}

// Wall-clock time in `timeZone` -> UTC epoch ms (handles DST by re-checking the offset).
const zonedTimeToUtcMs = (y, m, d, hh, mm, timeZone) => {
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0)
  const first = guess - offsetMs(guess, timeZone)
  const second = guess - offsetMs(first, timeZone)
  return second
}

const isRealDate = (y, m, d) => {
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

export const calendarKey = ({ y, m, d }) =>
  `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/**
 * Accepts 'yyyy-MM-dd', an ISO-8601 string with a time part, or a Date.
 * Returns {y, m, d} (the hospital calendar day) or null when the input is not a real date.
 */
export const parseCalendarDate = (input, timeZone = getHospitalTimeZone()) => {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    const match = DATE_RE.exec(trimmed)
    if (match) {
      const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
      return isRealDate(y, m, d) ? { y, m, d } : null
    }
    if (!trimmed.includes('T')) return null
    const ms = Date.parse(trimmed)
    if (Number.isNaN(ms)) return null
    const p = partsInTz(ms, timeZone)
    return { y: p.year, m: p.month, d: p.day }
  }
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    const p = partsInTz(input.getTime(), timeZone)
    return { y: p.year, m: p.month, d: p.day }
  }
  return null
}

// The Date we store: 00:00 of that calendar day at the hospital.
export const appointmentDateFromCalendar = ({ y, m, d }, timeZone = getHospitalTimeZone()) =>
  new Date(zonedTimeToUtcMs(y, m, d, 0, 0, timeZone))

export const dayNameOf = ({ y, m, d }) => DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]

export const hospitalNow = (nowMs = Date.now(), timeZone = getHospitalTimeZone()) => {
  const p = partsInTz(nowMs, timeZone)
  return { y: p.year, m: p.month, d: p.day, minutesSinceMidnight: p.hour * 60 + p.minute }
}

const compareCalendar = (a, b) => (a.y - b.y) || (a.m - b.m) || (a.d - b.d)

const daysBetween = (a, b) =>
  Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)

export const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string') return null
  const match = TIME_RE.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/**
 * Same slot algorithm the booking page uses: 30-minute steps from startTime (inclusive)
 * to endTime (exclusive), formatted 'HH:MM'.
 */
export const generateSlots = (slotConfig) => {
  if (!slotConfig) return []
  const start = parseTimeToMinutes(slotConfig.startTime)
  const end = parseTimeToMinutes(slotConfig.endTime)
  if (start === null || end === null || end <= start) return []
  const out = []
  for (let t = start; t < end; t += SLOT_MINUTES) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return out
}

// The slot config for a weekday, chosen exactly like the booking page does (first available match).
export const slotConfigForDay = (doctor, dayName) =>
  (doctor?.availableSlots || []).find((s) => s.day === dayName && s.isAvailable)

export const getMaxAdvanceDays = () => {
  const n = parseInt(process.env.BOOKING_MAX_ADVANCE_DAYS, 10)
  return Number.isFinite(n) && n > 0 ? n : 60
}

/**
 * Pure booking validation (no database access) so it can be unit tested.
 * Returns { ok: true, calendar, key, appointmentDate, dayName, timeSlot }
 *      or { ok: false, status, message }.
 */
export const validateBookingRequest = ({ doctor, dateInput, timeSlot, nowMs = Date.now() }) => {
  const fail = (status, message) => ({ ok: false, status, message })

  if (!doctor || !doctor.isActive) return fail(404, 'Doctor not found')
  if (doctor.isAvailable === false) return fail(400, 'This doctor is not accepting appointments right now')

  const calendar = parseCalendarDate(dateInput)
  if (!calendar) return fail(400, 'Please choose a valid appointment date')

  const today = hospitalNow(nowMs)
  if (compareCalendar(calendar, today) < 0) return fail(400, 'Appointment date cannot be in the past')
  if (daysBetween(today, calendar) > getMaxAdvanceDays()) {
    return fail(400, `Appointments can only be booked up to ${getMaxAdvanceDays()} days in advance`)
  }

  if (typeof timeSlot !== 'string' || parseTimeToMinutes(timeSlot) === null) {
    return fail(400, 'Please choose a valid time slot')
  }

  const dayName = dayNameOf(calendar)
  const config = slotConfigForDay(doctor, dayName)
  if (!config) return fail(400, `Dr. ${doctor.name} does not see patients on ${dayName}s`)

  if (!generateSlots(config).includes(timeSlot.trim())) {
    return fail(400, `${timeSlot} is not one of this doctor's available time slots on ${dayName}`)
  }

  if (compareCalendar(calendar, today) === 0 && parseTimeToMinutes(timeSlot) <= today.minutesSinceMidnight) {
    return fail(400, 'That time slot has already passed today. Please choose a later slot')
  }

  return {
    ok: true,
    calendar,
    key: calendarKey(calendar),
    dayName,
    timeSlot: timeSlot.trim(),
    appointmentDate: appointmentDateFromCalendar(calendar)
  }
}
