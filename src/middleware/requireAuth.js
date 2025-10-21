import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.vibevault_session
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.userId)
    if (!user) {
      return res.status(401).json({ message: 'Session expired' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid session' })
  }
}

export default requireAuth
