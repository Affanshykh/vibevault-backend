import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { exchangeCodeForToken, fetchSpotifyProfile, refreshAccessToken } from '../services/spotify.js'
import mongoose from 'mongoose'

const router = Router()

router.get('/all', async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const users = await User.find({})
    res.status(200).json({users})
  } catch (error) {
    res.status(400).json({error: error.message || error})
  }
})

router.get('/login', (req, res) => {
  const scopes = ['user-top-read', 'user-read-recently-played']
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes.join(' '),
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    show_dialog: 'false'
  })
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
})

router.get('/callback', async (req, res) => {
  // await mongoose.connect(process.env.MONGO_URI);
  const code = req.query.code
  if (!code) {
    return res.status(400).json({ message: 'Authorization code missing' })
  }

  try {
    const tokenSet = await exchangeCodeForToken(code)
    const profile = await fetchSpotifyProfile(tokenSet.access_token)
    
    return res.status(500).json({ profile })
    const existingUser = await User.findOne({ spotifyId: profile.id })
    if (existingUser) {
      existingUser.refreshToken = tokenSet.refresh_token || existingUser.refreshToken
      existingUser.accessToken = tokenSet.access_token
      existingUser.accessTokenExpiresAt = new Date(Date.now() + tokenSet.expires_in * 1000)
      existingUser.displayName = profile.display_name
      existingUser.profileImage = profile.images?.[0]?.url
      existingUser.product = profile.product
      existingUser.email = profile.email
      await existingUser.save()
    } else {
      await User.create({
        spotifyId: profile.id,
        displayName: profile.display_name,
        refreshToken: tokenSet.refresh_token,
        accessToken: tokenSet.access_token,
        accessTokenExpiresAt: new Date(Date.now() + tokenSet.expires_in * 1000),
        profileImage: profile.images?.[0]?.url,
        product: profile?.product,
        email: profile?.email
      })
    }

    const user = await User.findOne({ spotifyId: profile.id })

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })

    res.cookie('vibevault_session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    const redirectUrl = `${process.env.FRONTEND_URL || 'https://vibevault-delta.vercel.app'}/dashboard`
    res.redirect(redirectUrl)
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed', error: error.message || error })
  }
})

router.get('/logout', (req, res) => {
  res.clearCookie('vibevault_session', { httpOnly: true, sameSite: 'lax' })
  res.redirect(process.env.FRONTEND_URL || 'https://vibevault-delta.vercel.app')
})

router.post('/refresh', async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const { spotifyId } = req.body
    const user = await User.findOne({ spotifyId })
    if (!user || !user.refreshToken) {
      return res.status(400).json({ message: 'User not found or refresh token missing' })
    }

    const refreshed = await refreshAccessToken(user.refreshToken)
    user.accessToken = refreshed.access_token
    user.accessTokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
    await user.save()

    res.json({ accessToken: refreshed.access_token })
  } catch (error) {
    res.status(500).json({ message: 'Could not refresh token' })
  }
})

export default router
