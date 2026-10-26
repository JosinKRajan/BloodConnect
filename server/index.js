require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const donorRoutes = require('./routes/donorRoutes')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bloodconnect'

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/donors', donorRoutes)

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting']
  res.json({
    status: 'OK',
    server: 'BloodConnect API',
    database: states[dbState] || 'Unknown',
  })
})

// Connect to MongoDB
console.log('Connecting to MongoDB...')
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully to database: bloodconnect')
    app.listen(PORT, () => {
      console.log(`🚀 BloodConnect Server is running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message)
    console.log('\nTip: If you do not have MongoDB running locally:')
    console.log('1. Start your local MongoDB service: "mongod" or via MongoDB Compass')
    console.log('2. Or paste a free cloud connection string from MongoDB Atlas into server/.env')
    // Still listen so health check and helpful error is visible
    app.listen(PORT, () => {
      console.log(`⚠️ Server running on port ${PORT} (Database pending connection)`)
    })
  })
