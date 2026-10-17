import test from 'node:test'
import assert from 'node:assert/strict'
import { planMigration, nearestHospitalMidnight } from '../utils/appointmentMigration.js'

const doc = (over) => ({
  _id: 'id' + Math.random().toString(36).slice(2), doctor: 'D1', patient: 'P1',
  appointmentDate: new Date('2026-10-19T19:00:00.000Z'), timeSlot: '10:00', status: 'pending',
  createdAt: new Date('2026-10-01T00:00:00Z'), slotLock: undefined, ...over
})

test('local-midnight instants from any timezone round to the intended hospital day', () => {
  const iso = (d) => nearestHospitalMidnight(new Date(d)).toISOString()
  assert.equal(iso('2026-10-19T19:00:00.000Z'), '2026-10-19T19:00:00.000Z') // already PKT midnight of 20 Oct
  assert.equal(iso('2026-10-20T04:00:00.000Z'), '2026-10-19T19:00:00.000Z') // US Eastern browser, 20 Oct
  assert.equal(iso('2026-10-19T16:00:00.000Z'), '2026-10-19T19:00:00.000Z') // UTC+8 browser, 20 Oct
  assert.equal(iso('2026-10-20T00:00:00.000Z'), '2026-10-19T19:00:00.000Z') // UTC browser, 20 Oct
})

test('plan: normalizes dates, locks the earliest of a duplicate pair, never deletes', () => {
  const a = doc({ _id: 'a', createdAt: new Date('2026-10-01T10:00:00Z') })
  const b = doc({ _id: 'b', createdAt: new Date('2026-10-02T10:00:00Z'), appointmentDate: new Date('2026-10-20T00:00:00.000Z') }) // same day, different TZ
  const c = doc({ _id: 'c', status: 'cancelled' })
  const plan = planMigration([a, b, c])

  assert.equal(plan.duplicateGroups.length, 1)
  assert.deepEqual(plan.duplicateGroups[0].map((m) => [m._id, m.keepsLock]), [['a', true], ['b', false]])
  const byId = Object.fromEntries(plan.updates.map((u) => [u._id, u]))
  assert.equal(byId.a.set.slotLock, true)
  assert.equal(byId.b.set.slotLock, undefined)               // loser is NOT locked
  assert.equal(byId.b.set.appointmentDate.toISOString(), '2026-10-19T19:00:00.000Z')
  assert.equal(byId.c, undefined)                            // cancelled, nothing to do
  assert.ok(plan.updates.every((u) => u.before)) // every change is reversible from the backup
})

test('plan: already-migrated data produces no updates; stale locks on cancelled rows are removed', () => {
  const ok = doc({ _id: 'ok', slotLock: true })
  const stale = doc({ _id: 'stale', status: 'cancelled', slotLock: true, timeSlot: '11:00' })
  const plan = planMigration([ok, stale])
  assert.equal(plan.updates.length, 1)
  assert.deepEqual(plan.updates[0].unset, { slotLock: '' })
})
