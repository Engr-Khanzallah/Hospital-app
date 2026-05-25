import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `doctor-${Date.now()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase())
    isValid ? cb(null, true) : cb(new Error('Only image files allowed'))
  }
})

// Dummy cloudinary export so other files don't break
const cloudinary = { uploader: { destroy: async () => {} } }

export { cloudinary, upload }