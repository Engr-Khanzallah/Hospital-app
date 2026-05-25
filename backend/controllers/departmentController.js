import Department from '../models/Department.js'

export const getDepartments = async (req, res) => {
  const departments = await Department.find({ isActive: true })
  res.json({ success: true, departments })
}

export const createDepartment = async (req, res) => {
  const dept = await Department.create(req.body)
  res.status(201).json({ success: true, department: dept })
}

export const updateDepartment = async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found' })
  res.json({ success: true, department: dept })
}

export const deleteDepartment = async (req, res) => {
  const dept = await Department.findById(req.params.id)
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found' })
  await dept.deleteOne()
  res.json({ success: true, message: 'Department deleted' })
}