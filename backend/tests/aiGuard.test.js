import test from 'node:test'
import assert from 'node:assert/strict'
import { redactSensitive, detectUrgency, normalizeHistory, sanitizeText } from '../services/aiGuard.js'

test('redaction removes e-mails and long numbers but keeps ordinary numbers', () => {
  const r = redactSensitive('mail me at jo.doe@example.com or call +92 300 1234567, cnic 35202-1234567-1. I am 30 and have had it for 2 weeks')
  assert.equal(r.redacted, true)
  assert.ok(!r.text.includes('example.com'))
  assert.ok(!r.text.includes('1234567'))
  assert.ok(r.text.includes('30') && r.text.includes('2 weeks'))
  assert.equal(redactSensitive('I have had a headache for 3 days, 2 times a day').redacted, false)
})

test('urgency detection: emergencies, self-harm, and normal questions', () => {
  assert.equal(detectUrgency('I have severe chest pain and my left arm is numb'), 'emergency')
  assert.equal(detectUrgency("I can't breathe properly"), 'emergency')
  assert.equal(detectUrgency('seene mein dard ho raha hai'), 'emergency')
  assert.equal(detectUrgency('my father has slurred speech and face drooping'), 'emergency')
  assert.equal(detectUrgency('I want to kill myself'), 'self_harm')
  assert.equal(detectUrgency('Which doctor treats skin allergies?'), null)
  assert.equal(detectUrgency('How much is a cardiologist consultation?'), null)
})

test('sanitizeText strips control characters and collapses whitespace', () => {
  assert.equal(sanitizeText('a\u0000b\u0007   c\n\n\n\nd'), 'ab c\n\nd')
})

test('history: roles mapped, bad input rejected, limits applied, same-role merged', () => {
  const ok = normalizeHistory([
    { role: 'assistant', content: 'dropped: model first' },
    { role: 'user', content: 'hello' },
    { role: 'user', content: 'again' },
    { role: 'assistant', content: 'hi there' }
  ])
  assert.deepEqual(ok.turns.map((t) => t.role), ['user', 'model'])
  assert.equal(ok.turns[0].text, 'hello\nagain')

  assert.throws(() => normalizeHistory('nope'), /list/)
  assert.throws(() => normalizeHistory([{ role: 'system', content: 'x' }]), /invalid/)
  assert.throws(() => normalizeHistory([{ role: 'user', content: { a: 1 } }]), /invalid/)

  const many = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }))
  assert.ok(normalizeHistory(many).turns.length <= 6)
  assert.equal(normalizeHistory([{ role: 'user', content: 'x'.repeat(5000) }]).turns[0].text.length, 1000)
  assert.equal(normalizeHistory([{ role: 'user', content: 'mail a@b.co' }]).redacted, true)
})
