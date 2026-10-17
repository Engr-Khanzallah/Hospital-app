import test from 'node:test'
import assert from 'node:assert/strict'
import { startServer, restoreAll, installAuthStub } from './helpers.js'

test('CORS: with CORS_ORIGINS set only listed origins are allowed', async () => {
  installAuthStub()
  const api = await startServer({ env: { CORS_ORIGINS: 'https://my-site.netlify.app/, http://localhost:5173' } })
  try {
    const ok = await api.call('GET', '/', { headers: { Origin: 'https://my-site.netlify.app' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://my-site.netlify.app')

    const local = await api.call('GET', '/', { headers: { Origin: 'http://localhost:5173' } })
    assert.equal(local.status, 200)

    const evil = await api.call('GET', '/', { headers: { Origin: 'https://evil.example' } })
    assert.equal(evil.status, 403)
    assert.equal(evil.headers.get('access-control-allow-origin'), null)

    const noOrigin = await api.call('GET', '/')
    assert.equal(noOrigin.status, 200)

    const preflight = await fetch(`${api.base}/api/auth/login`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' }
    })
    assert.ok([200, 204].includes(preflight.status))
  } finally { delete process.env.CORS_ORIGINS; await api.close(); restoreAll() }
})

test('CORS: without CORS_ORIGINS behaviour stays open (backwards compatible)', async () => {
  delete process.env.CORS_ORIGINS
  const api = await startServer()
  try {
    const res = await api.call('GET', '/', { headers: { Origin: 'https://anything.example' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), '*')
  } finally { await api.close() }
})
