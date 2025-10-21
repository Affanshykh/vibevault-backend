import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

router.get('/session', requireAuth, (req, res) => {
  const { displayName, spotifyId, profileImage, product } = req.user
  res.json({
    user: {
      displayName,
      spotifyId,
      profileImage,
      product
    }
  })
})

export default router
