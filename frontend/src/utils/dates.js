import { format } from 'date-fns'

/**
 * Appointment dates are CALENDAR days at the hospital (the backend stores 00:00 hospital time).
 * These helpers show and compare them in the hospital's timezone, so every visitor sees the same
 * day no matter where their browser is. Set VITE_HOSPITAL_TIMEZONE to match the backend's
 * HOSPITAL_TIMEZONE (default Asia/Karachi).
 */
const CONFIGURED = import.meta.env.VITE_HOSPITAL_TIMEZONE || 'Asia/Karachi'

const resolveTimeZone = () => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: CONFIGURED })
    return CONFIGURED
  } catch {
    return undefined // invalid name: fall back to the browser timezone
  }
}
export const HOSPITAL_TIMEZONE = resolveTimeZone()

const partsIn = (date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: HOSPITAL_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
  const p = {}
  formatter.formatToParts(date).forEach((x) => { p[x.type] = x.value })
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) }
}

// A local Date for the hospital calendar day of `value` (safe to pass to date-fns format()).
export const hospitalCalendarDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const { y, m, d } = partsIn(date)
  return new Date(y, m - 1, d)
}

export const formatAppointmentDate = (value, pattern = 'MMM d, yyyy') => {
  const day = hospitalCalendarDate(value)
  return day ? format(day, pattern) : ''
}

// yyyy-MM-dd of a date the user picked in the calendar (a local calendar day).
export const toDateKey = (date) => format(date, 'yyyy-MM-dd')

// Is `time` ('HH:mm') on `dateKey` ('yyyy-MM-dd') already over at the hospital right now?
export const isSlotPast = (dateKey, time) => {
  const now = partsIn(new Date())
  const todayKey = format(new Date(now.y, now.m - 1, now.d), 'yyyy-MM-dd')
  if (dateKey < todayKey) return true
  if (dateKey > todayKey) return false
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m <= now.minutes
}
