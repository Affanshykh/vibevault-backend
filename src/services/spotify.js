import User from '../models/User.js'

const tokenEndpoint = 'https://accounts.spotify.com/api/token'
const apiBaseUrl = 'https://api.spotify.com/v1'

const basicAuthHeader = () => {
  const credentials = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

export const exchangeCodeForToken = async (code) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!response.ok) {
    throw new Error('Token exchange failed')
  }

  return response.json()
}

export const refreshAccessToken = async (refreshToken) => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!response.ok) {
    throw new Error('Refresh token failed')
  }

  return response.json()
}

export const ensureFreshAccessToken = async (user) => {
  if (!user.accessToken || !user.accessTokenExpiresAt || user.accessTokenExpiresAt < new Date(Date.now() + 60 * 1000)) {
    const refreshed = await refreshAccessToken(user.refreshToken)
    user.accessToken = refreshed.access_token
    user.accessTokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
    if (refreshed.refresh_token) {
      user.refreshToken = refreshed.refresh_token
    }
    await user.save()
  }
  return user
}

export const fetchSpotifyProfile = async (accessToken) => {
  if(!accessToken){
    throw new Error('No access token provided')
  }
  const response = await fetch(`${apiBaseUrl}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch profile with ${accessToken}`)
  }
  return response.json()
}

export const fetchTopTracks = async (accessToken, timeRange = 'short_term') => {
  const response = await fetch(`${apiBaseUrl}/me/top/tracks?time_range=${timeRange}&limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch top tracks')
  }
  const data = await response.json()
  return data.items
}

export const fetchTopArtists = async (accessToken, timeRange = 'medium_term') => {
  const response = await fetch(`${apiBaseUrl}/me/top/artists?time_range=${timeRange}&limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch top artists')
  }
  const data = await response.json()
  return data.items
}

export const fetchRecentlyPlayed = async (accessToken) => {
  const response = await fetch(`${apiBaseUrl}/me/player/recently-played?limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch recently played tracks')
  }
  const data = await response.json()
  return data.items
}

export const buildGenreBreakdown = (artists) => {
  const genreMap = artists.reduce((acc, artist) => {
    artist.genres.forEach((genre) => {
      const normalized = genre.trim()
      if (!acc[normalized]) {
        acc[normalized] = { name: normalized, count: 0, score: 0 }
      }
      acc[normalized].count += 1
      acc[normalized].score += Math.round(artist.popularity / 10)
    })
    return acc
  }, {})

  const totalScore = Object.values(genreMap).reduce((sum, genre) => sum + genre.score, 0) || 1

  return Object.values(genreMap)
    .map((genre) => ({
      ...genre,
      percentage: Math.round((genre.score / totalScore) * 100)
    }))
    .sort((a, b) => b.score - a.score)
}

export const findUserBySpotifyId = async (spotifyId) => {
  return User.findOne({ spotifyId })
}
