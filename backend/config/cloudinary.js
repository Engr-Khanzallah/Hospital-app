import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import path from 'path'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Use memory storage only — NO local file system (needed for Vercel)
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/
    const isValid = allowed.test(
      path.extname(file.originalname).toLowerCase()
    )
    isValid ? cb(null, true) : cb(new Error('Only image files allowed'))
  }
})

const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'hospital/doctors',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' }
        ]
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

export { cloudinary, upload, uploadToCloudinary }