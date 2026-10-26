require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Donor = require('../models/Donor')

const keralaDonors = [
  {
    name: 'Rahul Kurian',
    email: 'rahul.kurian@example.com',
    group: 'O+',
    district: 'Kottayam',
    location: 'Gandhi Nagar, Kottayam',
    distance: '1.4 km',
    lastDonation: '2 months ago',
    donationsCount: 8,
    initials: 'RK',
    tone: 'coral',
    available: true,
    verified: true,
    phone: '+91 94471 23456',
  },
  {
    name: 'Sneha Thomas',
    email: 'sneha.thomas@example.com',
    group: 'A+',
    district: 'Kottayam',
    location: 'Changanassery, Kottayam',
    distance: '3.8 km',
    lastDonation: '4 months ago',
    donationsCount: 5,
    initials: 'ST',
    tone: 'mint',
    available: true,
    verified: true,
    phone: '+91 98472 87654',
  },
  {
    name: 'Akhil Joseph',
    email: 'akhil.joseph@example.com',
    group: 'B+',
    district: 'Kottayam',
    location: 'Pala, Kottayam',
    distance: '5.2 km',
    lastDonation: '1 month ago',
    donationsCount: 11,
    initials: 'AJ',
    tone: 'navy',
    available: true,
    verified: true,
    phone: '+91 97450 34567',
  },
  {
    name: 'Anjali Menon',
    email: 'anjali.menon@example.com',
    group: 'B+',
    district: 'Ernakulam',
    location: 'Edappally, Ernakulam',
    distance: '2.1 km',
    lastDonation: '3 months ago',
    donationsCount: 7,
    initials: 'AM',
    tone: 'plum',
    available: true,
    verified: true,
    phone: '+91 98460 11223',
  },
  {
    name: 'Fahad Kabeer',
    email: 'fahad.kabeer@example.com',
    group: 'O-',
    district: 'Ernakulam',
    location: 'Kakkanad, Ernakulam',
    distance: '3.5 km',
    lastDonation: '5 months ago',
    donationsCount: 14,
    initials: 'FK',
    tone: 'rose',
    available: true,
    verified: true,
    phone: '+91 97441 55667',
  },
  {
    name: 'Arun S. Nair',
    email: 'arun.nair@example.com',
    group: 'A+',
    district: 'Trivandrum',
    location: 'Medical College, Trivandrum',
    distance: '1.2 km',
    lastDonation: '1 month ago',
    donationsCount: 12,
    initials: 'AN',
    tone: 'coral',
    available: true,
    verified: true,
    phone: '+91 94470 99887',
  },
  {
    name: 'Muhammed Rizwan',
    email: 'muhammed.rizwan@example.com',
    group: 'O+',
    district: 'Kozhikode',
    location: 'Mavoor Road, Kozhikode',
    distance: '1.9 km',
    lastDonation: '2 months ago',
    donationsCount: 10,
    initials: 'MR',
    tone: 'rose',
    available: true,
    verified: true,
    phone: '+91 98955 77889',
  },
  {
    name: 'Siddharth Raj',
    email: 'siddharth.raj@example.com',
    group: 'O-',
    district: 'Kollam',
    location: 'Chinnakada, Kollam',
    distance: '2.0 km',
    lastDonation: '2 months ago',
    donationsCount: 7,
    initials: 'SR',
    tone: 'coral',
    available: true,
    verified: true,
    phone: '+91 98470 55443',
  },
]

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bloodconnect'
  console.log(`Connecting to MongoDB at: ${uri}...`)

  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected successfully.')

    // Default password for all seeded sample donors is "password123"
    const salt = await bcrypt.genSalt(10)
    const defaultPassword = await bcrypt.hash('password123', salt)

    await Donor.deleteMany({})
    console.log('Cleared existing donors.')

    const donorsWithPassword = keralaDonors.map((d) => ({
      ...d,
      password: defaultPassword,
    }))

    await Donor.insertMany(donorsWithPassword)
    console.log(`Successfully seeded ${donorsWithPassword.length} Kerala donors into MongoDB!`)

    process.exit(0)
  } catch (err) {
    console.error('Seeding error:', err)
    process.exit(1)
  }
}

seed()
