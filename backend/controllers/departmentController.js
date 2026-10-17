import Department from '../models/Department.js'
import Doctor from '../models/Doctor.js'
import { AppError } from '../utils/httpError.js'
import { str, bool } from '../utils/validate.js'

const readDepartmentBody = (body = {}, { requireName }) => {
  const data = {}
  const name = str(body.name, 'Name', { min: 2, max: 100, required: requireName })
  if (name !== undefined) data.name = name
  if (Object.prototype.hasOwnProperty.call(body, 'description')) data.description = str(body.description, 'Description', { max: 500 }) ?? ''
  const icon = str(body.icon, 'Icon', { max: 16 })
  if (icon !== undefined) data.icon = icon
  const isActive = bool(body.isActive, 'isActive')
  if (isActive !== undefined) data.isActive = isActive
  return data
}

export const getDepartments = async (req, res) => {
  const departments = await Department.find({ isActive: true })
  res.json({ success: true, departments })
}

export const createDepartment = async (req, res) => {
  const dept = await Department.create(readDepartmentBody(req.body, { requireName: true }))
  res.status(201).json({ success: true, department: dept })
}

export const updateDepartment = async (req, res) => {
  const data = readDepartmentBody(req.body, { requireName: false })
  if (!Object.keys(data).length) throw new AppError(400, 'No changes were provided')
  const dept = await Department.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
  if (!dept) throw new AppError(404, 'Department not found')
  res.json({ success: true, department: dept })
}

export const deleteDepartment = async (req, res) => {
  const dept = await Department.findById(req.params.id)
  if (!dept) throw new AppError(404, 'Department not found')
  const doctorCount = await Doctor.countDocuments({ department: dept._id })
  if (doctorCount > 0) {
    throw new AppError(409, `${doctorCount} doctor(s) belong to this department. Move them to another department first, or mark the department inactive.`)
  }
  await dept.deleteOne()
  res.json({ success: true, message: 'Department deleted' })
}
