import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import spotifyRoutes from './routes/spotify.js'
import sessionRoutes from './routes/session.js'
import logger from './utils/logger.js'

const app = express()

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`)
  next()
})

app.use('/auth', authRoutes)
app.use('/api', sessionRoutes)
app.use('/api', spotifyRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 1 })
})

export default app
