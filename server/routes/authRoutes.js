const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Donor = require('../models/Donor')
const auth = require('../middleware/auth')

const router = express.Router()

// @route   POST /api/auth/register
// @desc    Register a new blood donor into MongoDB
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, group, phone, district, location } = req.body

    if (!name || !email || !password || !group || !phone || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' })
    }

    // Check if email already exists
    const existing = await Donor.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({ message: 'A donor with this email already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Compute initials & avatar tone
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BD'

    const tones = ['coral', 'navy', 'mint', 'gold', 'plum', 'sky', 'teal', 'rose']
    const tone = tones[Math.floor(Math.random() * tones.length)]

    // Create and save donor in MongoDB
    const donor = new Donor({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      group,
      phone,
      district: district || 'Kottayam',
      location: location.includes('Kerala') ? location : `${location}, Kerala`,
      distance: '0.8 km',
      available: true,
      verified: true,
      donationsCount: 1,
      lastDonation: 'Ready to donate',
      initials,
      tone,
    })

    await donor.save()

    // Sign JWT Token
    const token = jwt.sign(
      { id: donor._id, email: donor.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    )

    // Return donor details (without password)
    const donorData = donor.toObject()
    delete donorData.password

    res.status(201).json({
      message: 'Donor registered successfully!',
      token,
      donor: donorData,
    })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ message: 'Server error during registration', error: err.message })
  }
})

// @route   POST /api/auth/login
// @desc    Authenticate donor & return token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }

    // Find donor by email
    const donor = await Donor.findOne({ email: email.toLowerCase() })
    if (!donor) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, donor.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: donor._id, email: donor.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    )

    const donorData = donor.toObject()
    delete donorData.password

    res.json({
      message: 'Logged in successfully',
      token,
      donor: donorData,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error during login', error: err.message })
  }
})

// @route   GET /api/auth/me
// @desc    Get logged in donor profile
router.get('/me', auth, async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id).select('-password')
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' })
    }
    res.json(donor)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
