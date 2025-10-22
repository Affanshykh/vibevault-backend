import dotenv from 'dotenv'
import mongoose from 'mongoose'
import app from './server.js'
import logger from './utils/logger.js'

dotenv.config()

const PORT = process.env.SERVER_PORT || 5002

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is required')
    }

    await mongoose.connect(process.env.MONGO_URI)
    logger.info('Connected to MongoDB')

    app.listen(PORT, () => {
      logger.info(`Server ready on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

start()
