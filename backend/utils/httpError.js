// Small error type so controllers can throw a status code + a user-safe message.
export class AppError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.isOperational = true
  }
}
