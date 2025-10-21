import mongoose from 'mongoose'

const minutesSchema = new mongoose.Schema(
  {
    minutes: { type: Number, required: true },
    sampledAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true },
    displayName: { type: String },
    refreshToken: { type: String, required: true },
    accessToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    profileImage: { type: String },
    product: { type: String },
    email: { type: String },
    minutesHistory: { type: [minutesSchema], default: [] }
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User
