import express from 'express'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validateIdParam } from '../utils/validate.js'

const router = express.Router()
const checkId = validateIdParam('id', 'Department id')

router.get('/', getDepartments)
router.post('/', protect, adminOnly, createDepartment)
router.put('/:id', protect, adminOnly, checkId, updateDepartment)
router.delete('/:id', protect, adminOnly, checkId, deleteDepartment)

export default router
