import React, { useState, useMemo, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useSearchParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toast from './components/Toast'
import ContactModal from './components/ContactModal'
import CompatibilityWidget from './components/CompatibilityWidget'
import {
  initialDonors,
  initialStocks,
  initialDrives,
  emergencyHotlines,
} from './data/mockData'
import {
  SearchIcon,
  MapPinIcon,
  ShieldCheckIcon,
  HeartPulseIcon,
  PhoneIcon,
  ClockIcon,
  Share2Icon,
  Building2Icon,
  UsersIcon,
  SparklesIcon,
  CheckIcon,
  AlertTriangleIcon,
  BloodDropIcon,
  PlusIcon,
  MailIcon,
  ArrowRightIcon,
  XIcon,
} from './components/Icons'
import './App.css'

export default function App() {
  const [donors, setDonors] = useState(initialDonors)
  const [drives, setDrives] = useState(initialDrives)
  const [activeModalDonor, setActiveModalDonor] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bc_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Attempt to load donors from MongoDB on mount
  useEffect(() => {
    fetch('/api/donors')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Server not available')
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize MongoDB documents (_id -> id)
          const mongoDonors = data.map((d) => ({ ...d, id: d._id || d.id }))
          setDonors(mongoDonors)
        }
      })
      .catch(() => {
        // Fallback to local Kerala donors
      })
  }, [])

  const handleRegisterDonor = (newDonor) => {
    setDonors((prev) => [newDonor, ...prev])
    setCurrentUser(newDonor)
    localStorage.setItem('bc_user', JSON.stringify(newDonor))
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    localStorage.setItem('bc_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    localStorage.removeItem('bc_user')
    localStorage.removeItem('bc_token')
    setCurrentUser(null)
    setToast({
      type: 'success',
      title: 'Signed Out Safely',
      message: 'You have been signed out of your donor portal.',
    })
  }

  const handleUpdateAvailability = async (newStatus) => {
    if (!currentUser) return
    const updatedUser = { ...currentUser, available: newStatus }
    setCurrentUser(updatedUser)
    localStorage.setItem('bc_user', JSON.stringify(updatedUser))

    // Update in donors list as well so Find Donor reflects immediately
    setDonors((prev) =>
      prev.map((d) =>
        (d.id === currentUser.id || (d.email && d.email.toLowerCase() === currentUser.email?.toLowerCase()))
          ? { ...d, available: newStatus }
          : d
      )
    )

    const donorId = currentUser._id || currentUser.id
    if (donorId) {
      try {
        await fetch(`/api/donors/${donorId}/availability`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ available: newStatus }),
        })
      } catch {
        // Backend offline, local state updated
      }
    }

    setToast({
      type: 'success',
      title: newStatus ? 'Readiness Activated' : 'Readiness Paused',
      message: newStatus
        ? 'You are now marked as available for immediate emergency donations!'
        : 'Your profile is temporarily marked inactive for emergency calls.',
    })
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar currentUser={currentUser} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/find-donor" replace />} />
            <Route
              path="/find-donor"
              element={
                <FindDonorPage
                  donors={donors}
                  onContact={(donor) => setActiveModalDonor(donor)}
                  onNotify={setToast}
                />
              }
            />
            <Route
              path="/urgent-sos"
              element={<UrgentSosPage onNotify={setToast} />}
            />
            <Route
              path="/blood-stock"
              element={<BloodStockPage onNotify={setToast} />}
            />
            <Route
              path="/drives"
              element={
                <DrivesPage
                  drives={drives}
                  setDrives={setDrives}
                  onNotify={setToast}
                />
              }
            />
            <Route
              path="/request-blood"
              element={<RequestBloodPage onNotify={setToast} />}
            />
            <Route
              path="/donor-login"
              element={
                <DonorLoginPage
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  onUpdateAvailability={handleUpdateAvailability}
                  donors={donors}
                  onRegister={handleRegisterDonor}
                  onNotify={setToast}
                />
              }
            />
            <Route path="*" element={<Navigate to="/find-donor" replace />} />
          </Routes>
        </main>

        <Footer />

        {/* Global Contact Modal */}
        <ContactModal
          donor={activeModalDonor}
          onClose={() => setActiveModalDonor(null)}
          onNotify={setToast}
        />

        {/* Global Toast */}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </BrowserRouter>
  )
}

/* =========================================================================
   PAGE 1: FIND DONOR
   ========================================================================= */
function FindDonorPage({ donors, onContact }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGroupFromUrl = searchParams.get('group') || 'All'

  const [location, setLocation] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(initialGroupFromUrl)
  const [availableOnly, setAvailableOnly] = useState(true)
  const [sortBy, setSortBy] = useState('distance')

  const bloodGroupsList = ['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  const popularAreas = ['Kottayam', 'Ernakulam', 'Trivandrum', 'Kozhikode', 'Kollam', 'Thrissur']

  const filteredDonors = useMemo(() => {
    return donors
      .filter((donor) => {
        const matchesLocation =
          !location.trim() ||
          donor.location.toLowerCase().includes(location.trim().toLowerCase())
        const matchesGroup =
          selectedGroup === 'All' || donor.group === selectedGroup
        const matchesAvail = !availableOnly || donor.available
        return matchesLocation && matchesGroup && matchesAvail
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return parseFloat(a.distance) - parseFloat(b.distance)
        }
        return (b.donationsCount || 0) - (a.donationsCount || 0)
      })
  }, [donors, location, selectedGroup, availableOnly, sortBy])

  const handleGroupSelect = (group) => {
    setSelectedGroup(group)
    if (group === 'All') {
      searchParams.delete('group')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ group })
    }
  }

  const handleClearFilters = () => {
    setLocation('')
    setSelectedGroup('All')
    setAvailableOnly(false)
    searchParams.delete('group')
    setSearchParams(searchParams)
  }

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-pulse" />
            <BloodDropIcon size={14} className="text-crimson" />
            <span>Community Lifeline Network • Free & Verified</span>
          </div>

          <h1 className="hero-title">
            Find voluntary blood donors <span className="title-gradient">in minutes.</span>
          </h1>

          <p className="hero-subtitle">
            Connect with verified voluntary donors across Kerala — Kottayam, Ernakulam, Trivandrum, Kozhikode, Kollam, and more. Search by blood group and district for immediate, reliable support.
          </p>
        </div>
      </section>

      {/* Main Search Panel */}
      <section className="search-filter-card">
        <div className="search-card-top">
          <div className="search-title-wrap">
            <h2>Search Donors</h2>
            <p>Filter by area, blood type, and current donation readiness.</p>
          </div>

          <div className="filter-sort-wrap">
            <label className="sort-label">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                aria-label="Sort donors"
              >
                <option value="distance">Nearest Distance</option>
                <option value="donations">Most Experienced Donors</option>
              </select>
            </label>
          </div>
        </div>

        {/* Search controls */}
        <div className="search-controls-row">
          <div className="search-input-wrap">
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by district or area (e.g. Kottayam, Ernakulam, Trivandrum, Kozhikode, Kollam)..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="search-input"
              aria-label="Search by area"
            />
            {location && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => setLocation('')}
                aria-label="Clear location input"
              >
                ✕
              </button>
            )}
          </div>

          <label className="toggle-switch-wrap">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              aria-label="Filter available donors only"
            />
            <span className="toggle-slider" />
            <span className="toggle-label-text">Available Now Only</span>
          </label>
        </div>

        {/* Quick Location Pills */}
        <div className="popular-areas-row">
          <span className="popular-label">Popular areas:</span>
          {popularAreas.map((area) => (
            <button
              type="button"
              key={area}
              className={`area-chip ${location === area ? 'active' : ''}`}
              onClick={() => setLocation(location === area ? '' : area)}
            >
              <MapPinIcon size={12} />
              <span>{area}</span>
            </button>
          ))}
        </div>

        {/* Blood Group Chips Bar */}
        <div className="blood-groups-selector-wrap">
          <div className="group-selector-header">
            <span className="group-label">Blood Group:</span>
            {(location || selectedGroup !== 'All' || !availableOnly) && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleClearFilters}
              >
                Reset all filters
              </button>
            )}
          </div>
          <div className="blood-chips-scroll">
            {bloodGroupsList.map((bg) => (
              <button
                type="button"
                key={bg}
                className={`blood-select-chip ${selectedGroup === bg ? 'active' : ''}`}
                onClick={() => handleGroupSelect(bg)}
              >
                {bg !== 'All' && <BloodDropIcon size={13} />}
                <span>{bg === 'All' ? 'All Groups' : bg}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Compatibility Widget */}
      <CompatibilityWidget />

      {/* Donor Results Section */}
      <section className="donors-list-section">
        <div className="results-header">
          <div>
            <h3>Available Donors</h3>
            <p>Showing verified individuals ready to help in your area</p>
          </div>
          <span className="results-counter">
            <strong>{filteredDonors.length}</strong> {filteredDonors.length === 1 ? 'donor found' : 'donors found'}
          </span>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="empty-results-box">
            <BloodDropIcon size={40} className="empty-icon text-crimson" />
            <h4>No matching donors found</h4>
            <p>
              We couldn't find available donors matching "{location}" with blood group "{selectedGroup}".
              Try searching a broader area or uncheck "Available Now Only".
            </p>
            <button
              type="button"
              className="btn-empty-reset"
              onClick={handleClearFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="donor-cards-grid">
            {filteredDonors.map((donor) => (
              <article key={donor.id} className="donor-card-modern">
                <div className="donor-card-top">
                  <div className={`donor-avatar ${donor.tone || 'coral'}`}>
                    <span>{donor.initials}</span>
                    <span
                      className={`donor-status-dot ${donor.available ? 'online' : 'offline'}`}
                      title={donor.available ? 'Available' : 'Unavailable'}
                    />
                  </div>

                  <div className="donor-info-col">
                    <div className="donor-title-row">
                      <h4>{donor.name}</h4>
                      {donor.verified && (
                        <span className="verified-pill" title="Verified Identity & Blood Group">
                          <ShieldCheckIcon size={12} />
                        </span>
                      )}
                    </div>
                    <p className="donor-location-line">
                      <MapPinIcon size={13} />
                      <span>{donor.location}</span>
                    </p>
                  </div>

                  <div className="donor-blood-tag">
                    <span className="blood-tag-drop">{donor.group}</span>
                  </div>
                </div>

                <div className="donor-meta-row">
                  <div className="meta-item">
                    <span className="meta-lbl">Distance</span>
                    <span className="meta-val text-crimson">
                      <strong>{donor.distance}</strong> away
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Last Donated</span>
                    <span className="meta-val">{donor.lastDonation}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Total Given</span>
                    <span className="meta-val">{donor.donationsCount || 4} donations</span>
                  </div>
                </div>

                <div className="donor-card-actions">
                  <button
                    type="button"
                    className="btn-donor-contact"
                    onClick={() => onContact(donor)}
                    id={`contact-${donor.id}`}
                  >
                    <PhoneIcon size={15} />
                    <span>Contact Donor</span>
                  </button>

                  <Link
                    to={`/request-blood?donorId=${donor.id}&group=${encodeURIComponent(donor.group)}`}
                    className="btn-donor-request"
                  >
                    <span>Send Request</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* =========================================================================
   PAGE 2: URGENT SOS
   ========================================================================= */
function UrgentSosPage({ onNotify }) {
  const [patientName, setPatientName] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [hospital, setHospital] = useState('')
  const [area, setArea] = useState('')
  const [units, setUnits] = useState('2')
  const [phone, setPhone] = useState('')
  const [urgency, setUrgency] = useState('Immediate (Life Critical)')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
    onNotify({
      type: 'sos',
      title: '🚨 Emergency SOS Dispatched!',
      message: `SOS alert broadcast for ${patientName || 'Patient'} (${bloodGroup || 'Blood'}) at ${hospital || 'Hospital'}.`,
    })
  }

  const broadcastMessage = `🚨 URGENT BLOOD SOS REQUEST 🚨
Patient: ${patientName || '[Patient Name]'}
Blood Group: ${bloodGroup || '[Blood Group]'}
Units Needed: ${units}
Hospital: ${hospital || '[Hospital Name]'}, ${area || '[Area]'}
Urgency: ${urgency}
Contact Attendant: ${phone || '[Phone Number]'}
Generated via BloodConnect emergency network.`

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(broadcastMessage)}`
    window.open(url, '_blank')
  }

  const handleCopySOS = () => {
    navigator.clipboard?.writeText(broadcastMessage)
    onNotify({
      type: 'success',
      title: 'SOS Message Copied',
      message: 'Emergency message copied. Paste to WhatsApp groups or SMS.',
    })
  }

  return (
    <div className="page-container page-sos">
      {/* SOS Banner Header */}
      <section className="sos-header-banner">
        <div className="sos-banner-content">
          <div className="sos-pill-badge">
            <span className="sos-pulse-ring" />
            <AlertTriangleIcon size={16} />
            <span>CRITICAL PRIORITY RESPONSE</span>
          </div>

          <h1 className="sos-title">
            Urgent Blood <span className="sos-highlight">SOS Broadcast</span>
          </h1>

          <p className="sos-desc">
            Broadcast an immediate requirement to active donors within a 15km radius of the hospital.
          </p>
        </div>
      </section>

      {/* Emergency Phone Hotlines Strip */}
      <section className="hotlines-cards-row">
        {emergencyHotlines.map((hotline) => (
          <a
            key={hotline.number}
            href={`tel:${hotline.number}`}
            className="hotline-card"
            title={`Call ${hotline.name}`}
          >
            <div className="hotline-icon-wrap">
              <PhoneIcon size={18} />
            </div>
            <div className="hotline-details">
              <span className="hotline-num">{hotline.number}</span>
              <strong>{hotline.name}</strong>
              <small>{hotline.desc}</small>
            </div>
          </a>
        ))}
      </section>

      {/* Two Column Layout: Form + Live Broadcast Preview */}
      <div className="sos-grid-layout">
        <div className="sos-form-col">
          <div className="sos-form-card">
            <div className="form-card-header">
              <h2>Emergency Details</h2>
              <p>Please enter accurate details to avoid delay in matching.</p>
            </div>

            {isSubmitted ? (
              <div className="sos-dispatched-screen">
                <div className="dispatched-icon-wrap">
                  <CheckIcon size={32} />
                </div>
                <h3>SOS Broadcast is Active</h3>
                <p>
                  Your emergency alert has been queued to verified donors matching blood group <strong>{bloodGroup}</strong> in <strong>{area || hospital}</strong>.
                </p>

                <div className="dispatched-actions">
                  <button type="button" className="btn-share-wa" onClick={handleShareWhatsApp}>
                    <Share2Icon size={16} />
                    <span>Share to WhatsApp Groups Now</span>
                  </button>
                  <button type="button" className="btn-copy-sos" onClick={handleCopySOS}>
                    Copy Message Text
                  </button>
                </div>

                <div className="dispatched-note">
                  <strong>Important:</strong> Keep your phone line reachable. Donors and hospital blood banks may call you directly.
                </div>

                <button
                  type="button"
                  className="btn-create-another"
                  onClick={() => setIsSubmitted(false)}
                >
                  Edit or Submit Another SOS
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="emergency-form">
                <div className="form-grid-2">
                  <label className="form-field">
                    <span className="field-label">Patient Full Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Blood Group Required *</span>
                    <select
                      required
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      <option value="" disabled>Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="field-label">Hospital Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GMC Kottayam, Amrita Hospital, Calicut MCH"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">City or Area *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gandhi Nagar, Kottayam or Edappally, Kochi"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Units Needed *</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Attendant Contact Phone *</span>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                </div>

                <label className="form-field full-width">
                  <span className="field-label">Urgency Level</span>
                  <div className="urgency-selector">
                    {['Immediate (Life Critical)', 'Within 4-6 Hours', 'Within 24 Hours'].map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        className={`urgency-pill ${urgency === lvl ? 'active' : ''}`}
                        onClick={() => setUrgency(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </label>

                <button type="submit" className="btn-sos-submit">
                  <AlertTriangleIcon size={18} />
                  <span>Broadcast Emergency SOS Alert</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Live Broadcast Preview Column */}
        <div className="sos-preview-col">
          <div className="preview-card">
            <div className="preview-card-header">
              <span className="live-tag">LIVE PREVIEW</span>
              <h4>Donor Notification Card</h4>
            </div>

            <div className="preview-beacon">
              <div className="beacon-header">
                <span className="beacon-blood">{bloodGroup || 'O+'}</span>
                <div>
                  <strong className="beacon-title">URGENT BLOOD REQUIRED</strong>
                  <span className="beacon-urgency">{urgency}</span>
                </div>
              </div>

              <div className="beacon-details">
                <div className="b-row">
                  <span>Patient:</span>
                  <strong>{patientName || 'Patient Name'}</strong>
                </div>
                <div className="b-row">
                  <span>Hospital:</span>
                  <strong>{hospital || 'Hospital Name'}</strong>
                </div>
                <div className="b-row">
                  <span>Location:</span>
                  <strong>{area || 'Kerala'}</strong>
                </div>
                <div className="b-row">
                  <span>Units:</span>
                  <strong>{units} Unit(s)</strong>
                </div>
                <div className="b-row">
                  <span>Phone:</span>
                  <strong>{phone || '+91 98XXX XXXXX'}</strong>
                </div>
              </div>

              <div className="beacon-footer">
                <span>Verified SOS broadcast via BloodConnect</span>
              </div>
            </div>

            <div className="preview-quick-share">
              <button type="button" className="btn-preview-copy" onClick={handleCopySOS}>
                <Share2Icon size={14} /> Copy SOS Text
              </button>
              <button type="button" className="btn-preview-wa" onClick={handleShareWhatsApp}>
                Share to WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   PAGE 3: BLOOD STOCK
   ========================================================================= */
function BloodStockPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('All')
  const [onlyShortage, setOnlyShortage] = useState(false)

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  const filteredStocks = useMemo(() => {
    return initialStocks.filter((stock) => {
      const matchSearch =
        !searchTerm.trim() ||
        `${stock.hospital} ${stock.area}`.toLowerCase().includes(searchTerm.trim().toLowerCase())

      if (!matchSearch) return false

      if (onlyShortage) {
        const hasLow = Object.values(stock.groups).some((count) => count <= 2)
        if (!hasLow) return false
      }

      if (filterGroup !== 'All') {
        const count = stock.groups[filterGroup] ?? 0
        return count >= 0
      }

      return true
    })
  }, [searchTerm, filterGroup, onlyShortage])

  const getStockStatus = (count) => {
    if (count <= 2) return { label: 'Critical', class: 'status-crit' }
    if (count <= 5) return { label: 'Low', class: 'status-low' }
    return { label: 'In Stock', class: 'status-ok' }
  }

  return (
    <div className="page-container">
      <section className="hero-section hero-compact">
        <div className="hero-content">
          <div className="hero-badge">
            <Building2Icon size={14} className="text-crimson" />
            <span>Hospital Blood Bank Inventory</span>
          </div>
          <h1 className="hero-title">
            Blood Bank <span className="title-gradient">Stock Status</span>
          </h1>
          <p className="hero-subtitle">
            Browse verified sample inventory across major hospitals in Kerala. Always call the blood bank to reserve units before travelling.
          </p>
        </div>
      </section>

      {/* Stock Search Controls */}
      <section className="search-filter-card">
        <div className="search-controls-row">
          <div className="search-input-wrap">
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search hospital or district (e.g. GMC Kottayam, Amrita, Calicut MCH, Kollam)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <label className="toggle-switch-wrap">
            <input
              type="checkbox"
              checked={onlyShortage}
              onChange={(e) => setOnlyShortage(e.target.checked)}
            />
            <span className="toggle-slider" />
            <span className="toggle-label-text">Show Shortages (&le; 2 units)</span>
          </label>
        </div>

        {/* Blood group chips */}
        <div className="popular-areas-row">
          <span className="popular-label">Filter Blood Group:</span>
          {['All', ...bloodGroups].map((bg) => (
            <button
              type="button"
              key={bg}
              className={`area-chip ${filterGroup === bg ? 'active' : ''}`}
              onClick={() => setFilterGroup(bg)}
            >
              <span>{bg}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Stock Cards Grid */}
      <section className="stock-list-section">
        {filteredStocks.length === 0 ? (
          <div className="empty-results-box">
            <Building2Icon size={40} className="empty-icon text-crimson" />
            <h4>No hospitals found</h4>
            <p>No hospital blood banks matched "{searchTerm}". Try a different search term.</p>
          </div>
        ) : (
          <div className="stock-grid">
            {filteredStocks.map((stock) => (
              <article key={stock.hospital} className="hospital-stock-card">
                <div className="hospital-top-row">
                  <div>
                    <div className="hosp-name-wrap">
                      <h3>{stock.hospital}</h3>
                      {stock.verified && (
                        <span className="verified-pill" title="Verified Hospital">
                          <ShieldCheckIcon size={12} />
                        </span>
                      )}
                    </div>
                    <p className="hosp-area">
                      <MapPinIcon size={13} /> {stock.area}
                    </p>
                  </div>

                  <div className="hosp-actions-col">
                    <span className="stock-updated-pill">{stock.updated}</span>
                    <a href={`tel:${stock.phone.replace(/\s+/g, '')}`} className="btn-call-hosp">
                      <PhoneIcon size={14} />
                      <span>{stock.phone}</span>
                    </a>
                  </div>
                </div>

                {/* Blood Group Grid */}
                <div className="units-matrix">
                  {Object.entries(stock.groups).map(([group, count]) => {
                    const status = getStockStatus(count)
                    const isSelected = filterGroup === group
                    return (
                      <div
                        key={group}
                        className={`unit-cell ${status.class} ${isSelected ? 'cell-highlight' : ''}`}
                      >
                        <div className="cell-top">
                          <span className="group-abbr">{group}</span>
                          <span className="status-pill">{status.label}</span>
                        </div>
                        <div className="cell-count">
                          <strong>{count}</strong>
                          <small>units</small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* =========================================================================
   PAGE 4: DONATION DRIVES
   ========================================================================= */
function DrivesPage({ drives, setDrives, onNotify }) {
  const [registeredDrives, setRegisteredDrives] = useState([])

  const handleToggleRegister = (drive) => {
    const isReg = registeredDrives.includes(drive.id)
    if (isReg) {
      setRegisteredDrives((prev) => prev.filter((id) => id !== drive.id))
      setDrives((prev) =>
        prev.map((d) =>
          d.id === drive.id
            ? { ...d, registeredCount: Math.max(0, d.registeredCount - 1) }
            : d
        )
      )
      onNotify({
        type: 'info',
        title: 'Registration Cancelled',
        message: `RSVP cancelled for "${drive.title}".`,
      })
    } else {
      setRegisteredDrives((prev) => [...prev, drive.id])
      setDrives((prev) =>
        prev.map((d) =>
          d.id === drive.id
            ? { ...d, registeredCount: d.registeredCount + 1 }
            : d
        )
      )
      onNotify({
        type: 'success',
        title: 'You are Registered! 🎉',
        message: `Your spot for "${drive.title}" has been confirmed. See you on ${drive.day} ${drive.month}!`,
      })
    }
  }

  return (
    <div className="page-container">
      <section className="hero-section hero-compact">
        <div className="hero-content">
          <div className="hero-badge">
            <UsersIcon size={14} className="text-crimson" />
            <span>Community Giving Camps</span>
          </div>
          <h1 className="hero-title">
            Upcoming <span className="title-gradient">Donation Drives</span>
          </h1>
          <p className="hero-subtitle">
            Join fellow community lifesavers at upcoming blood donation drives in your neighbourhood. Free health screening provided.
          </p>
        </div>
      </section>

      {/* Drives Grid */}
      <section className="drives-list-section">
        <div className="drives-grid">
          {drives.map((drive) => {
            const isRegistered = registeredDrives.includes(drive.id)
            const spotsRemaining = Math.max(0, drive.targetCount - drive.registeredCount)
            const percentFilled = Math.min(100, Math.round((drive.registeredCount / drive.targetCount) * 100))

            return (
              <article key={drive.id} className="drive-card-modern">
                <div className="drive-calendar-block">
                  <span className="cal-day">{drive.day}</span>
                  <span className="cal-month">{drive.month}</span>
                </div>

                <div className="drive-info-content">
                  <div className="drive-host-tag">
                    <ShieldCheckIcon size={12} />
                    <span>Hosted by {drive.host}</span>
                  </div>

                  <h3 className="drive-title">{drive.title}</h3>

                  <div className="drive-loc-time">
                    <p>
                      <MapPinIcon size={14} /> <span>{drive.venue}</span>
                    </p>
                    <p>
                      <ClockIcon size={14} /> <span>{drive.time}</span>
                    </p>
                  </div>

                  {/* Perks badges */}
                  <div className="drive-perks-row">
                    {drive.perks.map((perk) => (
                      <span key={perk} className="perk-chip">
                        <CheckIcon size={11} /> {perk}
                      </span>
                    ))}
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="drive-capacity-bar">
                    <div className="capacity-label-row">
                      <span>{drive.registeredCount} Donors Registered</span>
                      <span>{spotsRemaining} Spots Left</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percentFilled}%` }} />
                    </div>
                  </div>
                </div>

                <div className="drive-action-col">
                  <button
                    type="button"
                    className={`btn-drive-register ${isRegistered ? 'registered' : ''}`}
                    onClick={() => handleToggleRegister(drive)}
                  >
                    {isRegistered ? (
                      <>
                        <CheckIcon size={16} />
                        <span>Registered</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon size={16} />
                        <span>Register to Donate</span>
                      </>
                    )}
                  </button>
                  <small className="register-hint">
                    {isRegistered ? 'Click to cancel RSVP' : 'Takes 10 seconds'}
                  </small>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   PAGE 5: REQUEST BLOOD
   ========================================================================= */
function RequestBloodPage({ onNotify }) {
  const [searchParams] = useSearchParams()
  const initialGroup = searchParams.get('group') || ''

  const [patientName, setPatientName] = useState('')
  const [bloodGroup, setBloodGroup] = useState(initialGroup)
  const [hospital, setHospital] = useState('')
  const [area, setArea] = useState('')
  const [units, setUnits] = useState('2')
  const [phone, setPhone] = useState('')
  const [neededDate, setNeededDate] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    onNotify({
      type: 'success',
      title: 'Blood Request Published',
      message: `Your request for ${units} unit(s) of ${bloodGroup} blood has been registered under ID #BC-${Math.floor(1000 + Math.random() * 9000)}.`,
    })
  }

  return (
    <div className="page-container">
      <section className="hero-section hero-compact">
        <div className="hero-content">
          <div className="hero-badge">
            <HeartPulseIcon size={14} className="text-crimson" />
            <span>Patient Assistance Request</span>
          </div>
          <h1 className="hero-title">
            Post a Blood <span className="title-gradient">Requirement</span>
          </h1>
          <p className="hero-subtitle">
            Need blood for a planned surgery, ongoing transfusion, or medical procedure? Register your requirement with our donor network.
          </p>
        </div>
      </section>

      <div className="request-form-wrapper">
        <div className="request-card">
          {submitted ? (
            <div className="request-success-box">
              <div className="success-icon-wrap">
                <CheckIcon size={36} />
              </div>
              <h2>Request Registered Successfully</h2>
              <p className="req-id-badge">Reference ID: #BC-8924</p>
              <p className="success-explanation">
                Your requirement for <strong>{units} Unit(s) of {bloodGroup} blood</strong> at <strong>{hospital}</strong> has been saved. We are alerting compatible donors in the <strong>{area}</strong> vicinity.
              </p>

              <div className="next-steps-list">
                <h4>Recommended Next Steps:</h4>
                <div className="step-item">
                  <span className="step-num">1</span>
                  <span>Keep your phone (<strong>{phone}</strong>) active to answer donor inquiries.</span>
                </div>
                <div className="step-item">
                  <span className="step-num">2</span>
                  <span>Check <Link to="/blood-stock" className="text-crimson underline">Hospital Blood Banks</Link> to check if immediate units are available in stock.</span>
                </div>
                <div className="step-item">
                  <span className="step-num">3</span>
                  <span>If patient condition becomes critical, use our <Link to="/urgent-sos" className="text-crimson underline">Urgent SOS Broadcast</Link>.</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-create-another"
                onClick={() => setSubmitted(false)}
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="standard-req-form">
              <div className="form-section-header">
                <h3>1. Patient & Medical Details</h3>
              </div>

              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Patient Full Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="Full name of recipient"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Blood Group Required *</span>
                  <select
                    required
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="" disabled>Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-section-header">
                <h3>2. Hospital & Location</h3>
              </div>

              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Hospital or Clinic Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amrita Hospital, Caritas Hospital, MCH Trivandrum"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">City / Locality *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gandhi Nagar, Kottayam or Edappally, Ernakulam"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-section-header">
                <h3>3. Units & Timeline</h3>
              </div>

              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Number of Blood Units *</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Required By Date & Time *</span>
                  <input
                    type="datetime-local"
                    required
                    value={neededDate}
                    onChange={(e) => setNeededDate(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Attendant Contact Phone *</span>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Doctor's Note / Remarks (Optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. Planned elective surgery, replacement needed"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  />
                </label>
              </div>

              <button type="submit" className="btn-submit-request">
                <span>Submit Blood Requirement</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   PAGE 6: DONOR LOGIN & REGISTRATION
   ========================================================================= */
function DonorLoginPage({
  currentUser,
  onLoginSuccess,
  onLogout,
  onUpdateAvailability,
  donors,
  onRegister,
  onNotify,
}) {
  const [tab, setTab] = useState('signin') // default to 'signin' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Registration state
  const [regName, setRegName] = useState('')
  const [regGroup, setRegGroup] = useState('O+')
  const [regPhone, setRegPhone] = useState('')
  const [regArea, setRegArea] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  // -------------------------------------------------------------
  // If donor is logged in, show their details & dashboard PERMANENTLY
  // -------------------------------------------------------------
  if (currentUser) {
    const initials =
      currentUser.initials ||
      (currentUser.name
        ? currentUser.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'BD')
    const tone = currentUser.tone || 'coral'
    const donationsCount = currentUser.donationsCount || 1
    const livesSaved = donationsCount * 3

    return (
      <div className="page-container donor-dashboard">
        <section className="hero-section hero-compact">
          <div className="hero-content">
            <div className="hero-badge">
              <SparklesIcon size={14} className="text-crimson" />
              <span>Personal Lifesaver Dashboard</span>
            </div>
            <h1 className="hero-title">
              Welcome, <span className="title-gradient">{currentUser.name}</span>
            </h1>
            <p className="hero-subtitle">
              Your registered donor account is active. Manage your emergency readiness, view your life-saving stats, or find matching patients across Kerala.
            </p>
          </div>
        </section>

        <div className="dashboard-grid">
          {/* Left Column: Profile & Readiness */}
          <div className="dashboard-card">
            {/* User Profile Banner */}
            <div className="dashboard-user-banner">
              <div className={`donor-avatar dashboard-avatar ${tone}`}>
                <span>{initials}</span>
                <span className={`donor-status-dot ${currentUser.available ? 'online' : 'offline'}`} />
              </div>
              <div className="dashboard-user-info">
                <h2>
                  <span>{currentUser.name}</span>
                  <span className="dashboard-blood-pill">
                    <BloodDropIcon size={14} />
                    <span>{currentUser.group}</span>
                  </span>
                </h2>
                <div className="badge-verified">
                  <ShieldCheckIcon size={13} />
                  <span>Verified Voluntary Donor</span>
                </div>
              </div>
            </div>

            {/* Availability Readiness Controller */}
            <div className={`readiness-block ${currentUser.available ? 'available' : 'inactive'}`}>
              <div className="readiness-header">
                <span className="readiness-tag">
                  {currentUser.available ? (
                    <>
                      <span className="readiness-pulse-dot" />
                      <span>Ready & Available to Donate</span>
                    </>
                  ) : (
                    <span>⏸️ Cooldown / Temporarily Inactive</span>
                  )}
                </span>
                <span className="text-muted text-xs">
                  {currentUser.available ? 'Live on Find Donor' : 'Hidden from Urgent Search'}
                </span>
              </div>
              <p className="readiness-desc">
                {currentUser.available
                  ? `Your phone (${currentUser.phone}) is active for direct emergency calls and WhatsApp requests from verified patients in ${currentUser.district || 'Kerala'}.`
                  : 'You are currently marked as unavailable (e.g. resting after recent donation or traveling). Patients will not call you while paused.'}
              </p>
              <button
                type="button"
                className={`btn-toggle-readiness ${currentUser.available ? 'active' : 'paused'}`}
                onClick={() => onUpdateAvailability(!currentUser.available)}
              >
                {currentUser.available ? (
                  <>
                    <span>Pause Availability (Take a Break)</span>
                  </>
                ) : (
                  <>
                    <CheckIcon size={16} />
                    <span>Resume Availability (Ready to Save Lives)</span>
                  </>
                )}
              </button>
            </div>

            {/* Profile Metadata List */}
            <div className="dashboard-meta-list">
              <div className="dashboard-meta-item">
                <MailIcon size={16} />
                <span className="dashboard-meta-label">Email:</span>
                <span className="dashboard-meta-value">{currentUser.email}</span>
              </div>
              <div className="dashboard-meta-item">
                <PhoneIcon size={16} />
                <span className="dashboard-meta-label">Phone:</span>
                <span className="dashboard-meta-value">{currentUser.phone}</span>
              </div>
              <div className="dashboard-meta-item">
                <MapPinIcon size={16} />
                <span className="dashboard-meta-label">Location:</span>
                <span className="dashboard-meta-value">
                  {currentUser.location || currentUser.district || 'Kerala'}
                </span>
              </div>
              <div className="dashboard-meta-item">
                <ClockIcon size={16} />
                <span className="dashboard-meta-label">Last Donated:</span>
                <span className="dashboard-meta-value">
                  {currentUser.lastDonation || 'Ready to donate'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Life-Saving Impact & Tools */}
          <div className="dashboard-card">
            <h3 className="section-title">
              <HeartPulseIcon size={18} className="text-crimson" />
              <span>Your Life-Saving Impact</span>
            </h3>

            {/* 4 Stat Cards */}
            <div className="donor-impact-grid">
              <div className="impact-stat-card">
                <div className="impact-stat-number">{donationsCount}</div>
                <div className="impact-stat-label">Donations</div>
                <div className="impact-stat-sub">Completed drives</div>
              </div>
              <div className="impact-stat-card">
                <div className="impact-stat-number">{livesSaved}+</div>
                <div className="impact-stat-label">Lives Saved</div>
                <div className="impact-stat-sub">Patients impacted</div>
              </div>
              <div className="impact-stat-card">
                <div className="impact-stat-number">{currentUser.group}</div>
                <div className="impact-stat-label">Blood Group</div>
                <div className="impact-stat-sub">Lifesaver type</div>
              </div>
              <div className="impact-stat-card">
                <div className="impact-stat-number" style={{ fontSize: '18px', paddingTop: '6px' }}>
                  Hero 🏅
                </div>
                <div className="impact-stat-label">Donor Tier</div>
                <div className="impact-stat-sub">Active community volunteer</div>
              </div>
            </div>

            {/* Emergency Quick Actions */}
            <div className="dashboard-actions-list">
              <Link
                to={`/find-donor?group=${encodeURIComponent(currentUser.group)}`}
                className="dashboard-action-item"
              >
                <div className="dashboard-action-left">
                  <SearchIcon size={16} />
                  <span>Find Patients Seeking {currentUser.group} Blood</span>
                </div>
                <ArrowRightIcon size={16} />
              </Link>

              <Link to="/blood-stock" className="dashboard-action-item">
                <div className="dashboard-action-left">
                  <Building2Icon size={16} />
                  <span>Check Kerala Blood Bank Reserves</span>
                </div>
                <ArrowRightIcon size={16} />
              </Link>

              <Link to="/urgent-sos" className="dashboard-action-item">
                <div className="dashboard-action-left">
                  <AlertTriangleIcon size={16} />
                  <span>Broadcast Emergency SOS Alert</span>
                </div>
                <ArrowRightIcon size={16} />
              </Link>
            </div>

            {/* Sign Out Button */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                type="button"
                className="btn-donor-signout"
                onClick={onLogout}
              >
                <XIcon size={16} />
                <span>Sign Out of Donor Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // If not logged in, show Sign In / Register Forms
  // -------------------------------------------------------------
  const handleSignIn = async (e) => {
    e.preventDefault()
    let loggedInUser = null

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.donor) {
        if (data.token) localStorage.setItem('bc_token', data.token)
        loggedInUser = { ...data.donor, id: data.donor._id || data.donor.id }
      }
    } catch {
      // Backend offline or network error
    }

    // Fallback if backend is offline or user is testing with mock credentials
    if (!loggedInUser) {
      const matched = donors.find(
        (d) => d.email && d.email.toLowerCase() === email.toLowerCase()
      )
      if (matched) {
        loggedInUser = { ...matched }
      } else {
        const namePart = email.split('@')[0]
        const formattedName = namePart
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())

        loggedInUser = {
          id: `d-${Date.now()}`,
          name: formattedName || 'Registered Donor',
          email: email.toLowerCase(),
          group: 'O+',
          phone: '+91 94471 23456',
          district: 'Kottayam',
          location: 'Gandhi Nagar, Kottayam, Kerala',
          distance: '1.2 km',
          available: true,
          verified: true,
          donationsCount: 3,
          lastDonation: 'Ready to donate',
          initials: (formattedName || 'RD')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          tone: 'coral',
        }
      }
    }

    onLoginSuccess(loggedInUser)
    onNotify({
      type: 'success',
      title: 'Welcome Back, Lifesaver! 🎉',
      message: `Signed in successfully as ${loggedInUser.name} (${loggedInUser.group}).`,
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const initials =
      regName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'BD'

    const payload = {
      name: regName,
      email: regEmail,
      password: regPassword || 'password123',
      group: regGroup,
      phone: regPhone,
      district: regArea.includes('Kottayam')
        ? 'Kottayam'
        : regArea.includes('Ernakulam')
        ? 'Ernakulam'
        : regArea.includes('Trivandrum')
        ? 'Trivandrum'
        : regArea.includes('Kozhikode')
        ? 'Kozhikode'
        : 'Kottayam',
      location: regArea.includes('Kerala') ? regArea : `${regArea}, Kerala`,
    }

    let savedDonor = null

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.donor) {
        if (data.token) localStorage.setItem('bc_token', data.token)
        savedDonor = { ...data.donor, id: data.donor._id || data.donor.id }
      }
    } catch {
      // Backend offline, fallback to React state
    }

    if (!savedDonor) {
      savedDonor = {
        id: `d-${Date.now()}`,
        name: regName,
        group: regGroup,
        location: payload.location,
        district: payload.district,
        distance: '0.8 km',
        lastDonation: 'Ready to donate',
        donationsCount: 1,
        initials,
        tone: 'coral',
        available: true,
        verified: true,
        phone: regPhone,
        email: regEmail,
      }
    }

    onRegister(savedDonor)
    onLoginSuccess(savedDonor)
    onNotify({
      type: 'success',
      title: 'Welcome to BloodConnect! 🎉',
      message: `${savedDonor.name} (${savedDonor.group}) is now registered and active!`,
    })
  }

  return (
    <div className="page-container">
      <section className="hero-section hero-compact">
        <div className="hero-content">
          <div className="hero-badge">
            <SparklesIcon size={14} className="text-crimson" />
            <span>Voluntary Donor Network</span>
          </div>
          <h1 className="hero-title">
            Donor <span className="title-gradient">Portal & Join</span>
          </h1>
          <p className="hero-subtitle">
            Sign in to access your donor dashboard, or register as a voluntary lifesaver in your Kerala neighborhood.
          </p>
        </div>
      </section>

      <div className="portal-grid">
        {/* Left: Form Card with Tabs */}
        <div className="portal-card">
          <div className="portal-tabs">
            <button
              type="button"
              className={`portal-tab ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => setTab('signin')}
            >
              Donor Sign In
            </button>
            <button
              type="button"
              className={`portal-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >
              Register as Donor
            </button>
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="portal-form">
              <h3>Sign In to Your Donor Account</h3>
              <p className="form-subtext">Access your profile, donation statistics, and readiness toggle.</p>

              <label className="form-field">
                <span className="field-label">Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.kurian@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Password</span>
                <input
                  type="password"
                  required
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button type="submit" className="btn-portal-action">
                Sign In to Donor Dashboard
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="portal-form">
              <h3>Become a Registered Donor</h3>
              <p className="form-subtext">Takes 30 seconds. Help someone when it matters most.</p>

              <label className="form-field">
                <span className="field-label">Full Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahil Verma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </label>

              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Blood Group *</span>
                  <select
                    value={regGroup}
                    onChange={(e) => setRegGroup(e.target.value)}
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="field-label">Contact Phone *</span>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Your Locality / District *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gandhi Nagar, Kottayam or Kakkanad, Ernakulam"
                    value={regArea}
                    onChange={(e) => setRegArea(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Email Address *</span>
                  <input
                    type="email"
                    required
                    placeholder="sahil@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </label>
              </div>

              <label className="form-field">
                <span className="field-label">Set Account Password *</span>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters (e.g. password123)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </label>

              <button type="submit" className="btn-portal-action">
                Complete Registration & Join
              </button>
            </form>
          )}
        </div>

        {/* Right: Donor Benefits & Eligibility Checklist */}
        <div className="portal-sidebar">
          <div className="sidebar-box">
            <h4>
              <ShieldCheckIcon size={18} className="text-crimson" /> Donor Eligibility Checklist
            </h4>
            <div className="eligibility-list">
              <div className="el-item">
                <CheckIcon size={15} />
                <span>Age between 18 and 65 years</span>
              </div>
              <div className="el-item">
                <CheckIcon size={15} />
                <span>Body weight above 50 kg</span>
              </div>
              <div className="el-item">
                <CheckIcon size={15} />
                <span>Normal blood pressure and hemoglobin (&gt; 12.5 g/dL)</span>
              </div>
              <div className="el-item">
                <CheckIcon size={15} />
                <span>At least 90 days since your last whole blood donation</span>
              </div>
            </div>
          </div>

          <div className="sidebar-box impact-box">
            <h4>
              <HeartPulseIcon size={18} className="text-crimson" /> The Impact You Make
            </h4>
            <p>
              A single whole blood donation is separated into red blood cells, platelets, and plasma — potentially saving up to <strong>3 separate lives</strong>.
            </p>
            <div className="impact-quote">
              "You don't need to be a doctor to save a life. Just roll up your sleeve."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}