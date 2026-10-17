import ContactMessage from '../models/ContactMessage.js'
import { AppError } from '../utils/httpError.js'
import { str, email as validateEmail, phone as validatePhone } from '../utils/validate.js'

export const sendMessage = async (req, res) => {
  const body = req.body || {}
  // Allowlist: clients cannot set isRead, repliedAt or any other internal field.
  const msg = await ContactMessage.create({
    name: str(body.name, 'Name', { min: 2, max: 100, required: true }),
    email: validateEmail(body.email),
    phone: validatePhone(body.phone),
    subject: str(body.subject, 'Subject', { min: 2, max: 150, required: true }),
    message: str(body.message, 'Message', { min: 5, max: 5000, required: true })
  })
  res.status(201).json({ success: true, message: 'Message sent successfully', data: msg })
}

export const getMessages = async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 })
  res.json({ success: true, messages })
}

export const markAsRead = async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true })
  if (!msg) throw new AppError(404, 'Message not found')
  res.json({ success: true, message: msg })
}

export const deleteMessage = async (req, res) => {
  const msg = await ContactMessage.findById(req.params.id)
  if (!msg) throw new AppError(404, 'Message not found')
  await msg.deleteOne()
  res.json({ success: true, message: 'Message deleted' })
}
