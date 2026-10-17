const isProd = () => process.env.NODE_ENV === 'production'

const DUPLICATE_LABELS = {
  email: 'Email already registered',
  name: 'That name is already in use'
}

// Turns thrown errors into consistent, user-safe JSON. Never returns stack traces, and in
// production never returns the raw message of an unexpected (non-AppError) failure.
export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
}

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (res.headersSent) return next(err)

  let status = 500
  let message = 'Something went wrong on the server'

  if (err?.isOperational) {
    status = err.statusCode
    message = err.message
  } else if (err?.name === 'ValidationError' && err.errors) {
    status = 400
    message = Object.values(err.errors).map((e) => e.message).join('. ')
  } else if (err?.name === 'CastError') {
    status = 400
    message = `Invalid ${err.path || 'value'}`
  } else if (err?.code === 11000) {
    status = 409
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0]
    if (err.keyPattern && err.keyPattern.timeSlot && err.keyPattern.doctor) {
      message = 'This time slot was just booked by someone else. Please pick another slot.'
    } else {
      message = DUPLICATE_LABELS[field] || (field ? `A record with this ${field} already exists` : 'Duplicate value')
    }
  } else if (err?.name === 'MulterError') {
    status = 400
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller' : 'Invalid file upload'
  } else if (err?.message === 'Only image files allowed') {
    status = 400
    message = 'Only JPG, PNG or WEBP images are allowed'
  } else if (err?.type === 'entity.parse.failed') {
    status = 400
    message = 'Request body is not valid JSON'
  } else if (err?.type === 'entity.too.large') {
    status = 413
    message = 'Request is too large'
  } else if (err?.message === 'Not allowed by CORS') {
    status = 403
    message = 'Origin not allowed'
  } else {
    // Unexpected: log only what is needed (no request body, headers or secrets).
    console.error(`Unhandled error on ${req.method} ${req.path}:`, err?.name, err?.message)
    if (!isProd() && err?.message) message = err.message
  }

  res.status(status).json({ success: false, message })
}
