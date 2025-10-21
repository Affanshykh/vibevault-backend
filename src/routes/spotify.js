import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import {
  fetchTopArtists,
  fetchTopTracks,
  buildGenreBreakdown,
  fetchRecentlyPlayed,
  ensureFreshAccessToken
} from '../services/spotify.js'

const router = Router()

router.get('/top/tracks', requireAuth, async (req, res) => {
  try {
    const user = await ensureFreshAccessToken(req.user)
    const items = await fetchTopTracks(user.accessToken)
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top tracks' })
  }
})

router.get('/top/artists', requireAuth, async (req, res) => {
  try {
    const user = await ensureFreshAccessToken(req.user)
    const items = await fetchTopArtists(user.accessToken)
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top artists' })
  }
})

router.get('/top/genres', requireAuth, async (req, res) => {
  try {
    const user = await ensureFreshAccessToken(req.user)
    const artists = await fetchTopArtists(user.accessToken, 'short_term')
    const items = buildGenreBreakdown(artists)
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch genres' })
  }
})

router.get('/minutes', requireAuth, async (req, res) => {
  try {
    const user = await ensureFreshAccessToken(req.user)
    const recentlyPlayed = await fetchRecentlyPlayed(user.accessToken)
    const minutes = recentlyPlayed.reduce((sum, item) => sum + item.track.duration_ms / 60000, 0)
    if (minutes > 0) {
      user.minutesHistory.push({ minutes: Math.round(minutes) })
      if (user.minutesHistory.length > 100) {
        user.minutesHistory = user.minutesHistory.slice(-100)
      }
      await user.save()
    }
    res.json({ minutes: Math.round(minutes) })
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate minutes listened' })
  }
})

export default router
