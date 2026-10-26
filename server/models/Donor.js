const mongoose = require('mongoose')

const donorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    group: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    district: {
      type: String,
      default: 'Kottayam',
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location/Area is required'],
      trim: true,
    },
    distance: {
      type: String,
      default: '1.5 km',
    },
    available: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    donationsCount: {
      type: Number,
      default: 1,
    },
    lastDonation: {
      type: String,
      default: 'Ready to donate',
    },
    initials: {
      type: String,
      default: 'BD',
    },
    tone: {
      type: String,
      default: 'coral',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Donor', donorSchema)
