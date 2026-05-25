import express from 'express'
import { sendMessage, getMessages, markAsRead, deleteMessage } from '../controllers/contactController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

router.post('/', sendMessage)
router.get('/', protect, adminOnly, getMessages)
router.put('/:id/read', protect, adminOnly, markAsRead)
router.delete('/:id', protect, adminOnly, deleteMessage)

export default router