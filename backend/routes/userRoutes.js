import express from 'express'
import { getProfile, updateProfile, changePassword, getAllUsers, deleteUser, toggleUserStatus } from '../controllers/userController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.put('/change-password', protect, changePassword)
router.get('/', protect, adminOnly, getAllUsers)
router.delete('/:id', protect, adminOnly, deleteUser)
router.put('/:id/toggle-status', protect, adminOnly, toggleUserStatus)

export default router