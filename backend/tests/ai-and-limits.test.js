import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { ID, tokenFor, installAuthStub, restoreAll, startServer } from './helpers.js'
import { buildLimiters } from '../middleware/rateLimit.js'
import { AiServiceError } from '../services/aiService.js'

before(() => installAuthStub())
after(() => restoreAll())

const patient = () => tokenFor(ID.patient)

test.describe('AI chat endpoint', () => {
  let api, calls, behaviour
  before(async () => {
    process.env.AI_USER_RPM = '1000'; process.env.AI_USER_DAILY = '1000'; process.env.AI_GLOBAL_RPM = '1000'
    calls = []
    behaviour = async () => 'Here is some general information.'
    api = await startServer({
      limiters: buildLimiters(),
      aiReply: async (input) => { calls.push(input); return behaviour(input) }
    })
  })
  after(() => api.close())

  const chat = (body, token = patient()) => api.call('POST', '/api/ai/chat', { token, body })

  test('requires a valid login', async () => {
    assert.equal((await chat({ message: 'hi' }, null)).status, 401)
    assert.equal((await chat({ message: 'hi' }, 'junk')).status, 401)
    assert.equal(calls.length, 0)
  })

  test('input validation', async () => {
    assert.equal((await chat({})).status, 400)
    assert.equal((await chat({ message: '' })).status, 400)
    assert.equal((await chat({ message: '   ' })).status, 400)
    assert.equal((await chat({ message: 42 })).status, 400)
    assert.equal((await chat({ message: { $ne: 1 } })).status, 400)
    assert.equal((await chat({ message: 'x'.repeat(2001) })).status, 400)
    assert.equal((await chat({ message: 'hello', history: 'bad' })).status, 400)
    assert.equal((await chat({ message: 'hello', history: [{ role: 'system', content: 'x' }] })).status, 400)
    assert.equal(calls.length, 0)
    assert.equal((await chat({ message: 'x'.repeat(2000) })).status, 200)
  })

  test('success: reply is plain text JSON; message reaches the AI trimmed', async () => {
    calls.length = 0
    const res = await chat({ message: '  Which doctor for skin rash?  ' })
    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.equal(typeof res.body.reply, 'string')
    assert.equal(calls[0].message, 'Which doctor for skin rash?')
    assert.equal(res.body.redacted, false)
  })

  test('privacy: e-mails and long numbers are removed BEFORE the AI sees them', async () => {
    calls.length = 0
    const res = await chat({
      message: 'My email is jo@example.com and CNIC 35202-1234567-1, which doctor for migraine?',
      history: [{ role: 'user', content: 'call me on 0300 1234567' }, { role: 'assistant', content: 'ok' }]
    })
    assert.equal(res.status, 200)
    assert.equal(res.body.redacted, true)
    const sent = JSON.stringify(calls[0])
    assert.ok(!sent.includes('jo@example.com') && !sent.includes('1234567'))
    assert.ok(sent.includes('migraine'))
  })

  test('emergency / self-harm: instant fixed safety reply, the AI is never called', async () => {
    calls.length = 0
    const e = await chat({ message: 'I have crushing chest pain and cannot breathe' })
    assert.equal(e.status, 200)
    assert.equal(e.body.safety, 'emergency')
    assert.match(e.body.reply, /emergency/i)
    const s = await chat({ message: 'I want to end my life' })
    assert.equal(s.body.safety, 'self_harm')
    assert.match(s.body.reply, /emergency|crisis/i)
    assert.equal(calls.length, 0)
  })

  test('upstream failures map to safe, specific statuses and never leak details', async () => {
    const run = async (err) => { behaviour = async () => { throw err }; return chat({ message: 'hello there' }) }
    const quota = await run(new AiServiceError('quota', 'secret-detail'))
    assert.equal(quota.status, 429)
    assert.equal((await run(new AiServiceError('timeout', 'x'))).status, 504)
    assert.equal((await run(new AiServiceError('blocked', 'x'))).status, 422)
    const cfg = await run(new AiServiceError('not_configured', 'API key abc123 rejected'))
    assert.equal(cfg.status, 503)
    assert.ok(!JSON.stringify(cfg.body).includes('abc123'))
    const unknown = await run(new Error('boom with AIza-secret'))
    assert.equal(unknown.status, 503)
    assert.ok(!JSON.stringify(unknown.body).includes('AIza'))
    behaviour = async () => 'ok'
  })
})

test.describe('rate limiting', () => {
  test('login attempts are limited per IP (429 with Retry-After)', async () => {
    process.env.RATE_LOGIN_MAX = '3'
    const api = await startServer({ limiters: buildLimiters() })
    try {
      const statuses = []
      let last
      for (let i = 0; i < 5; i++) {
        last = await api.call('POST', '/api/auth/login', { body: {} })
        statuses.push(last.status)
      }
      assert.deepEqual(statuses, [400, 400, 400, 429, 429])
      assert.ok(Number(last.headers.get('retry-after')) >= 1)
    } finally { delete process.env.RATE_LOGIN_MAX; await api.close() }
  })

  test('AI chat: per-user per-minute limit protects the free quota', async () => {
    process.env.AI_USER_RPM = '2'; process.env.AI_USER_DAILY = '1000'; process.env.AI_GLOBAL_RPM = '1000'
    let called = 0
    const api = await startServer({ limiters: buildLimiters(), aiReply: async () => { called++; return 'ok' } })
    try {
      const send = (token) => api.call('POST', '/api/ai/chat', { token, body: { message: 'hello there' } })
      assert.equal((await send(patient())).status, 200)
      assert.equal((await send(patient())).status, 200)
      assert.equal((await send(patient())).status, 429)
      assert.equal(called, 2) // the third request never reached the AI
      // a different user has their own allowance
      assert.equal((await send(tokenFor(ID.admin))).status, 200)
    } finally { await api.close() }
  })

  test('AI chat: global limit caps total traffic regardless of user', async () => {
    process.env.AI_USER_RPM = '1000'; process.env.AI_GLOBAL_RPM = '2'
    const api = await startServer({ limiters: buildLimiters(), aiReply: async () => 'ok' })
    try {
      const send = (token) => api.call('POST', '/api/ai/chat', { token, body: { message: 'hello there' } })
      assert.equal((await send(patient())).status, 200)
      assert.equal((await send(tokenFor(ID.admin))).status, 200)
      assert.equal((await send(patient())).status, 429)
    } finally { await api.close() }
  })

  test('unauthenticated AI requests do not consume the quota', async () => {
    process.env.AI_USER_RPM = '1000'; process.env.AI_GLOBAL_RPM = '1'
    const api = await startServer({ limiters: buildLimiters(), aiReply: async () => 'ok' })
    try {
      for (let i = 0; i < 5; i++) await api.call('POST', '/api/ai/chat', { body: { message: 'hello' } })
      const ok = await api.call('POST', '/api/ai/chat', { token: patient(), body: { message: 'hello there' } })
      assert.equal(ok.status, 200)
    } finally { await api.close() }
  })

  test('contact form is rate limited', async () => {
    process.env.RATE_CONTACT_MAX = '2'
    const api = await startServer({ limiters: buildLimiters() })
    try {
      const s = []
      for (let i = 0; i < 3; i++) s.push((await api.call('POST', '/api/contact', { body: {} })).status)
      assert.deepEqual(s, [400, 400, 429])
    } finally { delete process.env.RATE_CONTACT_MAX; await api.close() }
  })
})
