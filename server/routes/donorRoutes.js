const express = require('express')
const Donor = require('../models/Donor')

const router = express.Router()

// @route   GET /api/donors
// @desc    Get all donors from MongoDB with optional filters
router.get('/', async (req, res) => {
  try {
    const { group, location, available } = req.query
    const filter = {}

    if (group && group !== 'All') {
      filter.group = group
    }

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { district: { $regex: location, $options: 'i' } },
        { name: { $regex: location, $options: 'i' } },
      ]
    }

    if (available === 'true') {
      filter.available = true
    }

    const donors = await Donor.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })

    res.json(donors)
  } catch (err) {
    console.error('Fetch donors error:', err)
    res.status(500).json({ message: 'Server error fetching donors', error: err.message })
  }
})

// @route   PATCH /api/donors/:id/availability
// @desc    Update donor availability status
router.patch('/:id/availability', async (req, res) => {
  try {
    const { available } = req.body
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { available: Boolean(available) },
      { new: true }
    ).select('-password')

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' })
    }

    res.json({ message: 'Availability updated', donor })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
