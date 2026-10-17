import express from 'express'
import { protect } from '../middleware/auth.js'
import { getHealthcareAssistantReply, AiServiceError } from '../services/aiService.js'
import {
  MAX_MESSAGE_LENGTH, sanitizeText, redactSensitive, detectUrgency, normalizeHistory,
  EMERGENCY_REPLY, SELF_HARM_REPLY
} from '../services/aiGuard.js'

export default function aiRoutes({ limiters, reply = getHealthcareAssistantReply }) {
  const router = express.Router()

  // Order matters: authenticate first, then the cheap per-user limits, then the global quota guard.
  router.post('/chat', protect, limiters.aiPerUserMinute, limiters.aiPerUserDay, limiters.aiGlobalMinute, async (req, res) => {
    const raw = req.body?.message
    if (typeof raw !== 'string' || !raw.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a message.' })
    }
    if (raw.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` })
    }

    const cleaned = sanitizeText(raw)
    if (!cleaned) return res.status(400).json({ success: false, message: 'Please enter a message.' })

    let history
    try {
      history = normalizeHistory(req.body?.history)
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message })
    }

    // Emergencies / self-harm get a fixed safety answer: instant, free, never wrong.
    const urgency = detectUrgency(cleaned)
    if (urgency) {
      return res.json({
        success: true,
        reply: urgency === 'self_harm' ? SELF_HARM_REPLY : EMERGENCY_REPLY,
        safety: urgency
      })
    }

    // Remove e-mail addresses / long numbers BEFORE anything leaves our server.
    const message = redactSensitive(cleaned)

    try {
      const text = await reply({ message: message.text, history: history.turns })
      return res.json({ success: true, reply: text, redacted: message.redacted || history.redacted })
    } catch (error) {
      const code = error instanceof AiServiceError ? error.code : 'upstream'
      if (code === 'quota') {
        return res.status(429).json({ success: false, message: 'The AI assistant is busy right now. Please try again in a minute.' })
      }
      if (code === 'timeout') {
        return res.status(504).json({ success: false, message: 'The AI assistant took too long to answer. Please try again.' })
      }
      if (code === 'blocked') {
        return res.status(422).json({ success: false, message: 'I could not answer that message. Please rephrase your question.' })
      }
      return res.status(503).json({ success: false, message: 'The AI assistant is temporarily unavailable. Please try again.' })
    }
  })

  return router
}
