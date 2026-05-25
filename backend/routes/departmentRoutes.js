import express from 'express'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getDepartments)
router.post('/', protect, adminOnly, createDepartment)
router.put('/:id', protect, adminOnly, updateDepartment)
router.delete('/:id', protect, adminOnly, deleteDepartment)

export default router