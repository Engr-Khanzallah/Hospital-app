import test from 'node:test'
import assert from 'node:assert/strict'
import { str, email, phone, oneOf, number, bool, isValidObjectId, parsePagination, escapeRegex, pick } from '../utils/validate.js'

const throwsStatus400 = (fn) => assert.throws(fn, (e) => e.statusCode === 400)

test('str rejects non-strings (blocks NoSQL operator objects) and enforces length', () => {
  throwsStatus400(() => str({ $ne: null }, 'X', { required: true }))
  throwsStatus400(() => str(['a'], 'X'))
  throwsStatus400(() => str('a', 'X', { min: 2 }))
  throwsStatus400(() => str('a'.repeat(11), 'X', { max: 10 }))
  throwsStatus400(() => str('   ', 'X', { required: true }))
  assert.equal(str('  hi  ', 'X'), 'hi')
  assert.equal(str(undefined, 'X'), undefined)
  assert.equal(str('a\u0000b', 'X'), 'ab')
})

test('email / phone / enum / number / bool', () => {
  assert.equal(email(' Foo@Example.COM '), 'foo@example.com')
  throwsStatus400(() => email('not-an-email'))
  throwsStatus400(() => email({ $gt: '' }))
  assert.equal(phone('+92 300-1234567'), '+92 300-1234567')
  throwsStatus400(() => phone('abc'))
  assert.equal(oneOf('male', ['male', 'female'], 'G'), 'male')
  throwsStatus400(() => oneOf('x', ['male'], 'G'))
  assert.equal(number('12', 'N', { min: 0, max: 20, integer: true }), 12)
  throwsStatus400(() => number('1.5', 'N', { integer: true }))
  throwsStatus400(() => number('NaN', 'N'))
  throwsStatus400(() => number('999', 'N', { max: 10 }))
  assert.equal(bool('true', 'B'), true)
  assert.equal(bool(false, 'B'), false)
  throwsStatus400(() => bool('yes', 'B'))
})

test('object ids, pagination, regex escaping, pick', () => {
  assert.equal(isValidObjectId('64b000000000000000000001'), true)
  assert.equal(isValidObjectId('[object Object]'), false)
  assert.equal(isValidObjectId({ $ne: 1 }), false)
  assert.deepEqual(parsePagination({ page: '0', limit: '9999' }, { maxLimit: 100 }), { page: 1, limit: 100, skip: 0 })
  assert.deepEqual(parsePagination({ page: '3', limit: '10' }), { page: 3, limit: 10, skip: 20 })
  assert.equal(new RegExp(escapeRegex('(a+)+$')).test('(a+)+$'), true)
  assert.deepEqual(pick({ a: 1, b: 2, role: 'admin' }, ['a', 'b']), { a: 1, b: 2 })
})
