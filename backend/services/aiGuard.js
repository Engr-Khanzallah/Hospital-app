/**
 * Pure helpers that run BEFORE anything is sent to the external AI service.
 *  - sanitizeText: strips control characters / collapses whitespace
 *  - redactSensitive: removes e-mail addresses and long digit strings (phone, CNIC, card, MRN)
 *  - detectUrgency: catches emergency / self-harm wording so we can answer with a fixed safety
 *    message immediately (no AI call, no quota use, no chance of a wrong answer)
 *  - normalizeHistory: validates the optional previous turns the browser sends
 * Nothing here logs the user's text.
 */
import { stripControlChars } from '../utils/validate.js'

export const MAX_MESSAGE_LENGTH = 2000
export const MAX_HISTORY_TURNS = 6
export const MAX_HISTORY_TURN_LENGTH = 1000

export const sanitizeText = (text) =>
  stripControlChars(text).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const DIGIT_RUN_RE = /\+?\d[\d\s().-]{5,}\d/g

export const redactSensitive = (text) => {
  let redacted = false
  let out = text.replace(EMAIL_RE, () => { redacted = true; return '[email removed]' })
  out = out.replace(DIGIT_RUN_RE, (match) => {
    const digits = match.replace(/\D/g, '').length
    if (digits >= 7) { redacted = true; return '[number removed]' }
    return match
  })
  return { text: out, redacted }
}

const EMERGENCY_PATTERNS = [
  /chest (pain|pressure|tightness)/i,
  /heart attack/i,
  /(can('|no)?t|cannot|unable to|struggling to|trouble|difficulty) (breathe|breathing)/i,
  /shortness of breath/i,
  /not breathing/i,
  /\bstroke\b/i,
  /(face|mouth) (is )?droop/i,
  /slurred speech/i,
  /sudden(ly)? (weakness|numbness|confusion|loss of vision)/i,
  /(unconscious|unresponsive|passed out|fainted|collapsed)/i,
  /seizure|convulsion/i,
  /(severe|heavy|uncontrol\w*) bleeding|bleeding (won't|will not|wont) stop/i,
  /(vomit\w*|cough\w*|spitting) (up )?blood/i,
  /overdos/i,
  /poison/i,
  /throat (is )?(closing|swelling)|swelling of (the )?(tongue|face|throat)|anaphyla/i,
  // Roman Urdu / common transliterations
  /seen[ey]? (m[ae]i?n|me) dard|sine (m[ae]i?n|me) dard/i,
  /s[ae]ans? nah(i|in) (aa|a)/i,
  /behosh|be-?hosh/i
]

const SELF_HARM_PATTERNS = [
  /kill (myself|my self)/i,
  /suicid/i,
  /(want|wanna|going) to die/i,
  /end (my|my own) life/i,
  /(hurt|harm|cut) myself/i,
  /khud ?kushi|khudkushi/i,
  /marna chah(ta|ti)/i
]

export const detectUrgency = (text) => {
  if (SELF_HARM_PATTERNS.some((re) => re.test(text))) return 'self_harm'
  if (EMERGENCY_PATTERNS.some((re) => re.test(text))) return 'emergency'
  return null
}

export const EMERGENCY_REPLY =
  'What you describe could be a medical emergency. Please call your local emergency number or go to the nearest emergency department right now. Do not wait for an online appointment, and if someone is with you, ask them to help.\n\n' +
  'I am an AI assistant and cannot assess symptoms or give emergency care. Once you are safe, I can help you find a suitable doctor on MediCare.'

export const SELF_HARM_REPLY =
  'I am really sorry you are going through this, and I am glad you said something. If you might act on these thoughts or you are in immediate danger, please call your local emergency number or go to the nearest emergency department now.\n\n' +
  'If you can, contact someone you trust and stay with them, and reach out to a local crisis line or a mental-health professional. If it would help, I can show you the psychiatry doctors available on MediCare.'

/**
 * Accepts [{ role: 'user' | 'assistant' | 'model', content | text }], returns
 * { turns: [{ role: 'user' | 'model', text }], redacted } or throws a plain Error with
 * `.statusCode = 400` for malformed input.
 */
export const normalizeHistory = (history) => {
  if (history === undefined || history === null) return { turns: [], redacted: false }
  const bad = (message) => Object.assign(new Error(message), { statusCode: 400, isOperational: true })
  if (!Array.isArray(history)) throw bad('Conversation history must be a list')

  let redacted = false
  const turns = []
  for (const item of history.slice(-MAX_HISTORY_TURNS)) {
    if (!item || typeof item !== 'object') throw bad('Conversation history is invalid')
    const role = item.role === 'assistant' || item.role === 'model' ? 'model' : item.role === 'user' ? 'user' : null
    const raw = typeof item.content === 'string' ? item.content : typeof item.text === 'string' ? item.text : null
    if (!role || raw === null) throw bad('Conversation history is invalid')
    const cleaned = sanitizeText(raw).slice(0, MAX_HISTORY_TURN_LENGTH)
    if (!cleaned) continue
    const r = redactSensitive(cleaned)
    redacted = redacted || r.redacted
    turns.push({ role, text: r.text })
  }

  // Gemini conversations must begin with a user turn; merge consecutive same-role turns.
  while (turns.length && turns[0].role !== 'user') turns.shift()
  const merged = []
  for (const turn of turns) {
    const last = merged[merged.length - 1]
    if (last && last.role === turn.role) last.text += `\n${turn.text}`
    else merged.push({ ...turn })
  }
  return { turns: merged, redacted }
}
