import express from 'express'
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getFeaturedDoctors
} from '../controllers/doctorController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { upload } from '../config/cloudinary.js'

const router = express.Router()

router.get('/featured', getFeaturedDoctors)
router.get('/', getDoctors)
router.get('/:id', getDoctor)
router.post('/', protect, adminOnly, upload.single('image'), createDoctor)
router.put('/:id', protect, adminOnly, upload.single('image'), updateDoctor)
router.delete('/:id', protect, adminOnly, deleteDoctor)

export default router