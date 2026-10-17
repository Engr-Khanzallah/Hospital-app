import { parseCalendarDate, appointmentDateFromCalendar, getHospitalTimeZone } from './scheduling.js'

/**
 * Pure planning logic for scripts/migrate-appointments.js (no database access, unit tested).
 *
 * Old clients stored `appointmentDate` as the visitor's LOCAL midnight converted to UTC, so the
 * same calendar day was saved as different instants for different timezones. The new code stores
 * 00:00 at the hospital. A local-midnight instant is within +-12h of the intended hospital
 * midnight, so "round to the NEAREST hospital midnight" recovers the intended day.
 */
export const nearestHospitalMidnight = (date, timeZone = getHospitalTimeZone()) => {
  const floorDay = parseCalendarDate(date, timeZone)
  const floorMid = appointmentDateFromCalendar(floorDay, timeZone)
  const nextDay = parseCalendarDate(new Date(floorMid.getTime() + 36 * 3600 * 1000), timeZone)
  const nextMid = appointmentDateFromCalendar(nextDay, timeZone)
  const t = new Date(date).getTime()
  return t - floorMid.getTime() <= nextMid.getTime() - t ? floorMid : nextMid
}

/**
 * @param docs  [{ _id, doctor, patient, appointmentDate, timeSlot, status, createdAt, slotLock }]
 * @returns { updates, duplicateGroups, stats }
 *  updates: [{ _id, set: {appointmentDate?, slotLock?}, unset: {slotLock?}, before: {...} }]
 *  duplicateGroups: groups of ACTIVE appointments that collide on doctor+day+slot after normalizing.
 *     The earliest-created one keeps the slot lock; the others are left UNLOCKED for manual review.
 *     Nothing is ever deleted or cancelled by the migration.
 */
export const planMigration = (docs, timeZone = getHospitalTimeZone()) => {
  const normalized = docs.map((d) => {
    const mid = nearestHospitalMidnight(d.appointmentDate, timeZone)
    return { ...d, normalizedDate: mid, dateChanged: mid.getTime() !== new Date(d.appointmentDate).getTime() }
  })

  const groups = new Map()
  for (const d of normalized) {
    if (d.status === 'cancelled') continue
    const key = `${d.doctor}|${d.normalizedDate.toISOString()}|${d.timeSlot}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(d)
  }

  const lockHolders = new Set()
  const duplicateGroups = []
  for (const members of groups.values()) {
    members.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || String(a._id).localeCompare(String(b._id)))
    lockHolders.add(String(members[0]._id))
    if (members.length > 1) duplicateGroups.push(members.map((m) => ({
      _id: String(m._id), status: m.status, createdAt: m.createdAt, keepsLock: String(m._id) === String(members[0]._id)
    })))
  }

  const updates = []
  for (const d of normalized) {
    const set = {}
    const unset = {}
    if (d.dateChanged) set.appointmentDate = d.normalizedDate
    const shouldLock = d.status !== 'cancelled' && lockHolders.has(String(d._id))
    if (shouldLock && d.slotLock !== true) set.slotLock = true
    if (!shouldLock && d.slotLock === true) unset.slotLock = ''
    if (Object.keys(set).length || Object.keys(unset).length) {
      updates.push({ _id: d._id, set, unset, before: { appointmentDate: d.appointmentDate, slotLock: d.slotLock } })
    }
  }

  return {
    updates,
    duplicateGroups,
    stats: {
      total: docs.length,
      dateWillChange: normalized.filter((d) => d.dateChanged).length,
      slotLockWillBeSet: updates.filter((u) => u.set.slotLock).length,
      duplicateGroups: duplicateGroups.length
    }
  }
}
