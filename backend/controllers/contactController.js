import ContactMessage from '../models/ContactMessage.js'

export const sendMessage = async (req, res) => {
  const msg = await ContactMessage.create(req.body)
  res.status(201).json({ success: true, message: 'Message sent successfully', data: msg })
}

export const getMessages = async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 })
  res.json({ success: true, messages })
}

export const markAsRead = async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true })
  if (!msg) return res.status(404).json({ success: false, message: 'Message not found' })
  res.json({ success: true, message: msg })
}

export const deleteMessage = async (req, res) => {
  const msg = await ContactMessage.findById(req.params.id)
  if (!msg) return res.status(404).json({ success: false, message: 'Message not found' })
  await msg.deleteOne()
  res.json({ success: true, message: 'Message deleted' })
}