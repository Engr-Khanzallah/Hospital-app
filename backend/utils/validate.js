import { AppError } from './httpError.js'

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/
// Deliberately simple: syntax check only. Real validation = the user can receive mail.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[0-9+\-()\s]{5,30}$/
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export const isValidObjectId = (value) => typeof value === 'string' && OBJECT_ID_RE.test(value)

export const requireObjectId = (value, label = 'Id') => {
  if (!isValidObjectId(value)) throw new AppError(400, `${label} is invalid`)
  return value
}

// Express middleware factory: rejects malformed :id params before they reach Mongoose
// (which would otherwise throw a CastError -> 500).
export const validateIdParam = (paramName = 'id', label = 'Id') => (req, res, next) => {
  if (!isValidObjectId(req.params[paramName])) {
    return res.status(400).json({ success: false, message: `${label} is invalid` })
  }
  next()
}

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Validate a string field. Rejects non-strings (this is what blocks NoSQL-operator objects
 * such as { "$ne": null } from reaching a query).
 * Returns the trimmed string, or undefined for an optional field that was not provided.
 */
export const str = (value, label, { min = 0, max = 200, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError(400, `${label} is required`)
    return undefined
  }
  if (typeof value !== 'string') throw new AppError(400, `${label} must be text`)
  const trimmed = value.trim().replace(CONTROL_CHARS_RE, '')
  if (!trimmed) {
    if (required) throw new AppError(400, `${label} is required`)
    return undefined
  }
  if (trimmed.length < min) throw new AppError(400, `${label} must be at least ${min} characters`)
  if (trimmed.length > max) throw new AppError(400, `${label} must be ${max} characters or fewer`)
  return trimmed
}

export const email = (value, label = 'Email', { required = true } = {}) => {
  const v = str(value, label, { max: 254, required })
  if (v === undefined) return undefined
  const lower = v.toLowerCase()
  if (!EMAIL_RE.test(lower)) throw new AppError(400, `Please enter a valid ${label.toLowerCase()}`)
  return lower
}

export const phone = (value, label = 'Phone', { required = false } = {}) => {
  const v = str(value, label, { max: 30, required })
  if (v === undefined) return undefined
  if (!PHONE_RE.test(v)) throw new AppError(400, `Please enter a valid ${label.toLowerCase()} number`)
  return v
}

export const oneOf = (value, allowed, label, { required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError(400, `${label} is required`)
    return undefined
  }
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new AppError(400, `${label} must be one of: ${allowed.join(', ')}`)
  }
  return value
}

export const number = (value, label, { min = -Infinity, max = Infinity, integer = false, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError(400, `${label} is required`)
    return undefined
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) throw new AppError(400, `${label} must be a number`)
  if (integer && !Number.isInteger(n)) throw new AppError(400, `${label} must be a whole number`)
  if (n < min || n > max) throw new AppError(400, `${label} must be between ${min} and ${max}`)
  return n
}

// Multipart forms send booleans as the strings "true"/"false".
export const bool = (value, label) => {
  if (value === undefined || value === null || value === '') return undefined
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  throw new AppError(400, `${label} must be true or false`)
}

export const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query?.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query?.limit, 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

// Copy only the listed keys (and only if they are defined). Prevents mass-assignment.
export const pick = (source, keys) => {
  const out = {}
  for (const key of keys) {
    if (source && source[key] !== undefined) out[key] = source[key]
  }
  return out
}

export const stripControlChars = (text) => String(text).replace(CONTROL_CHARS_RE, '')
