import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getHealthcareAssistantReply, buildSystemInstruction, buildContents, toDirectoryEntry,
  DEFAULT_MODEL, AiServiceError
} from '../services/aiService.js'

const fetchDirectory = async () => JSON.stringify([{ name: 'Dr Real', specialty: 'Cardiology' }])
const okResult = (text = 'Hello') => ({ text })

test('directory entries expose public fields only', () => {
  const e = toDirectoryEntry({
    name: 'A', email: 'secret@x.com', phone: '123', _id: 'abc', specialty: 'S', qualification: ['MBBS'],
    experience: 5, consultationFee: 40, about: 'x'.repeat(1000), isAvailable: true,
    availableSlots: [{ day: 'Monday', startTime: '09:00', endTime: '12:00', isAvailable: true }, { day: 'Tuesday', isAvailable: false }]
  })
  const json = JSON.stringify(e)
  assert.ok(!json.includes('secret@x.com') && !json.includes('123') && !json.includes('abc'))
  assert.equal(e.about.length, 300)
  assert.deepEqual(e.weeklyAvailability, ['Monday 09:00-12:00'])
})

test('system instruction carries the safety rules and the directory as data', () => {
  const s = buildSystemInstruction('[{"name":"Dr Real"}]')
  assert.match(s, /Never diagnose/)
  assert.match(s, /emergency/i)
  assert.match(s, /never say you have done so/)
  assert.match(s, /Never invent doctors/)
  assert.match(s, /<doctor_directory>[\s\S]*Dr Real[\s\S]*<\/doctor_directory>/)
})

test('contents: history first, new message last, merged if the last turn was the user', () => {
  assert.deepEqual(buildContents([], 'hi'), [{ role: 'user', parts: [{ text: 'hi' }] }])
  const c = buildContents([{ role: 'user', text: 'a' }, { role: 'model', text: 'b' }], 'c')
  assert.deepEqual(c.map((x) => x.role), ['user', 'model', 'user'])
})

test('uses the verified default model and passes systemInstruction via config', async () => {
  delete process.env.GEMINI_MODEL
  let seen
  const text = await getHealthcareAssistantReply({ message: 'hi' }, {
    fetchDirectory, generate: async (args) => { seen = args; return okResult('answer') }
  })
  assert.equal(text, 'answer')
  assert.equal(seen.model, DEFAULT_MODEL)
  assert.equal(DEFAULT_MODEL, 'gemini-3.1-flash-lite')
  assert.match(seen.systemInstruction, /MediCare Assistant/)
})

test('a retired GEMINI_MODEL (404) falls back once to the default model', async () => {
  process.env.GEMINI_MODEL = 'gemini-retired-model'
  const calls = []
  try {
    const text = await getHealthcareAssistantReply({ message: 'hi' }, {
      fetchDirectory,
      generate: async ({ model }) => {
        calls.push(model)
        if (model === 'gemini-retired-model') throw Object.assign(new Error('not found'), { status: 404 })
        return okResult('fallback ok')
      }
    })
    assert.equal(text, 'fallback ok')
    assert.deepEqual(calls, ['gemini-retired-model', DEFAULT_MODEL])
  } finally { delete process.env.GEMINI_MODEL }
})

test('errors are classified: quota, config, upstream, timeout, blocked, empty', async () => {
  const run = (generate) => getHealthcareAssistantReply({ message: 'hi' }, { fetchDirectory, generate })
  const codeOf = async (generate) => { try { await run(generate); return 'no-error' } catch (e) { assert.ok(e instanceof AiServiceError); return e.code } }

  assert.equal(await codeOf(async () => { throw Object.assign(new Error('x'), { status: 429 }) }), 'quota')
  assert.equal(await codeOf(async () => { throw Object.assign(new Error('x'), { status: 400 }) }), 'not_configured')
  assert.equal(await codeOf(async () => { throw Object.assign(new Error('x'), { status: 500 }) }), 'upstream')
  assert.equal(await codeOf(async () => ({ text: '', promptFeedback: { blockReason: 'SAFETY' } })), 'blocked')
  assert.equal(await codeOf(async () => ({ text: '   ' })), 'blocked')

  process.env.AI_TIMEOUT_MS = '30'
  try {
    assert.equal(await codeOf(() => new Promise(() => {})), 'timeout')
  } finally { delete process.env.AI_TIMEOUT_MS }
})

test('a missing GEMINI_API_KEY is reported as not_configured (default generator)', async () => {
  const saved = process.env.GEMINI_API_KEY
  delete process.env.GEMINI_API_KEY
  try {
    await assert.rejects(
      getHealthcareAssistantReply({ message: 'hi' }, { fetchDirectory }),
      (e) => e.code === 'not_configured'
    )
  } finally { if (saved) process.env.GEMINI_API_KEY = saved }
})
