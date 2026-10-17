import express from 'express'
import { sendMessage, getMessages, markAsRead, deleteMessage } from '../controllers/contactController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validateIdParam } from '../utils/validate.js'

export default function contactRoutes({ limiters }) {
  const router = express.Router()
  const checkId = validateIdParam('id', 'Message id')

  router.post('/', limiters.contact, sendMessage)
  router.get('/', protect, adminOnly, getMessages)
  router.put('/:id/read', protect, adminOnly, checkId, markAsRead)
  router.delete('/:id', protect, adminOnly, checkId, deleteMessage)

  return router
}
