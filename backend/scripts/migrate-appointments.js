/**
 * One-off, SAFE data migration for the new booking rules.
 *
 *   npm run migrate:appointments            -> DRY RUN: prints a report, changes nothing
 *   npm run migrate:appointments -- --apply -> writes a JSON backup first, then applies
 *
 * What it does (and only this):
 *   1. normalizes appointmentDate to 00:00 at HOSPITAL_TIMEZONE (see utils/scheduling.js),
 *   2. sets the internal `slotLock` flag on active appointments so the unique index protects them,
 *   3. builds the unique index.
 * It NEVER deletes or cancels an appointment. If two ACTIVE appointments collide on the same
 * doctor/day/slot, the earliest keeps the lock and the others are listed for you to resolve.
 *
 * Take a MongoDB backup/snapshot before running with --apply (Atlas: Backup tab / mongodump).
 */
import 'dotenv/config'
import fs from 'fs'
import mongoose from 'mongoose'
import Appointment from '../models/Appointment.js'
import { planMigration } from '../utils/appointmentMigration.js'
import { getHospitalTimeZone } from '../utils/scheduling.js'

const apply = process.argv.includes('--apply')

const main = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  console.log(`Connected to database "${mongoose.connection.name}". Hospital timezone: ${getHospitalTimeZone()}`)
  console.log(apply ? 'MODE: APPLY (changes will be written)\n' : 'MODE: DRY RUN (no changes will be written)\n')

  const docs = await Appointment.find({}).select('+slotLock').lean()
  const plan = planMigration(docs)

  console.log('Appointments in database          :', plan.stats.total)
  console.log('Dates that will be normalized     :', plan.stats.dateWillChange)
  console.log('Slot locks that will be set       :', plan.stats.slotLockWillBeSet)
  console.log('Duplicate active slot groups found:', plan.stats.duplicateGroups)

  if (plan.duplicateGroups.length) {
    console.log('\nDUPLICATE ACTIVE BOOKINGS (resolve manually, e.g. cancel one in the admin panel):')
    plan.duplicateGroups.forEach((group, i) => {
      console.log(`  Group ${i + 1}:`)
      group.forEach((m) => console.log(`    ${m._id}  status=${m.status}  created=${new Date(m.createdAt).toISOString()}  ${m.keepsLock ? '(keeps the slot)' : '(left unlocked - needs review)'}`))
    })
  }

  if (!apply) {
    console.log('\nDry run only. Re-run with  --apply  after taking a backup.')
    return
  }
  if (!plan.updates.length) {
    console.log('\nNothing to change.')
  } else {
    const file = `migration-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    fs.writeFileSync(file, JSON.stringify(plan.updates.map((u) => ({ _id: u._id, before: u.before })), null, 2))
    console.log(`\nBackup of the ${plan.updates.length} documents to change written to ${file} (keep it until you are happy).`)

    const ops = plan.updates.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: {
          ...(Object.keys(u.set).length ? { $set: u.set } : {}),
          ...(Object.keys(u.unset).length ? { $unset: u.unset } : {})
        }
      }
    }))
    // Native collection: avoids touching updatedAt and avoids model hooks.
    const result = await Appointment.collection.bulkWrite(ops, { ordered: false })
    console.log(`Updated ${result.modifiedCount} appointment(s).`)
  }

  try {
    await Appointment.createIndexes()
    console.log('Unique slot index is in place.')
  } catch (err) {
    console.error('Could not build the unique index:', err.message)
    console.error('This usually means duplicate active bookings remain - resolve the groups above and re-run.')
    process.exitCode = 1
  }
}

main()
  .catch((err) => { console.error('Migration failed:', err.message); process.exitCode = 1 })
  .finally(() => mongoose.disconnect())
