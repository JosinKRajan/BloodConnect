import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BloodDropIcon, MenuIcon, XIcon, PhoneIcon, AlertTriangleIcon } from './Icons'

const navLinks = [
  { label: 'Find Donor', path: '/find-donor' },
  { label: 'Urgent SOS', path: '/urgent-sos', isSos: true },
  { label: 'Blood Stock', path: '/blood-stock' },
  { label: 'Donation Drives', path: '/drives' },
  { label: 'Request Blood', path: '/request-blood' },
  { label: 'Donor Portal', path: '/donor-login' },
]

export default function Navbar({ currentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Emergency Helpline Banner */}
      <div className="helpline-strip">
        <div className="helpline-container">
          <div className="helpline-left">
            <span className="live-pulse-dot" />
            <span>24/7 Lifeline Emergency Assistance</span>
          </div>
          <div className="helpline-right">
            <a href="tel:108" className="helpline-link">
              <PhoneIcon size={12} />
              <span>Ambulance: <strong>108</strong></span>
            </a>
            <span className="sep">•</span>
            <a href="tel:1056" className="helpline-link">
              <span>Disha: <strong>1056</strong></span>
            </a>
            <span className="sep">•</span>
            <a href="tel:104" className="helpline-link">
              <span>Blood Directory: <strong>104</strong></span>
            </a>
            <span className="sep">•</span>
            <Link to="/urgent-sos" className="helpline-sos-link">
              <AlertTriangleIcon size={12} />
              <span>Broadcast SOS</span>
            </Link>
          </div>
        </div>
      </div>

      <header className="main-navbar">
        <div className="nav-container">
          <Link to="/find-donor" className="nav-brand" aria-label="BloodConnect Home">
            <div className="brand-logo-mark">
              <BloodDropIcon size={20} className="text-white" />
            </div>
            <div className="brand-text">
              <span className="brand-title">Blood<span>Connect</span></span>
              <span className="brand-tagline">Save a Life Today</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" aria-label="Primary Navigation">
            {navLinks.map((item) => {
              const isLogin = item.path === '/donor-login'
              const label = isLogin && currentUser
                ? `My Profile (${currentUser.group})`
                : item.label

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''} ${item.isSos ? 'nav-item-sos' : ''} ${isLogin && currentUser ? 'nav-item-user' : ''}`
                  }
                >
                  {item.isSos && <span className="sos-pulse" />}
                  {isLogin && currentUser && <span className="user-active-dot" />}
                  <span>{label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Action button */}
          <div className="nav-actions">
            <Link to="/request-blood" className="btn-nav-primary">
              <span>Request Blood</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer" role="navigation" aria-label="Mobile Navigation">
            <div className="mobile-links">
              {navLinks.map((item) => {
                const isLogin = item.path === '/donor-login'
                const label = isLogin && currentUser
                  ? `My Profile (${currentUser.group})`
                  : item.label

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `mobile-link ${isActive ? 'active' : ''} ${item.isSos ? 'mobile-link-sos' : ''}`
                    }
                  >
                    {isLogin && currentUser && <span className="user-active-dot" />}
                    <span>{label}</span>
                    {item.isSos && <span className="mobile-sos-tag">Urgent</span>}
                  </NavLink>
                )
              })}
              <div className="mobile-cta-wrap">
                <Link
                  to="/request-blood"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-mobile-cta"
                >
                  Create Blood Request
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
