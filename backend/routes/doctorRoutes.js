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
import { validateIdParam } from '../utils/validate.js'

const router = express.Router()
const checkId = validateIdParam('id', 'Doctor id')

router.get('/featured', getFeaturedDoctors)
router.get('/', getDoctors)
router.get('/:id', checkId, getDoctor)
router.post('/', protect, adminOnly, upload.single('image'), createDoctor)
router.put('/:id', protect, adminOnly, checkId, upload.single('image'), updateDoctor)
router.delete('/:id', protect, adminOnly, checkId, deleteDoctor)

export default router
