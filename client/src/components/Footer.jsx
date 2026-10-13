import React from 'react'
import { Link } from 'react-router-dom'
import { BloodDropIcon, HeartPulseIcon, PhoneIcon } from './Icons'

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-top-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/find-donor" className="footer-brand-link">
              <div className="brand-logo-mark logo-sm">
                <BloodDropIcon size={18} className="text-white" />
              </div>
              <span className="brand-title">Blood<span>Connect</span></span>
            </Link>
            <p className="footer-description">
              Connecting voluntary blood donors with patients in urgent need. Built to ensure no life is lost waiting for blood.
            </p>
            <div className="footer-pledge">
              <HeartPulseIcon size={16} className="text-crimson" />
              <span>100% Free • Voluntary • Community-Driven</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Navigation</h4>
            <ul>
              <li><Link to="/find-donor">Find Nearby Donors</Link></li>
              <li><Link to="/urgent-sos">Urgent Emergency SOS</Link></li>
              <li><Link to="/blood-stock">Hospital Blood Banks</Link></li>
              <li><Link to="/drives">Upcoming Donation Drives</Link></li>
              <li><Link to="/request-blood">Post Blood Requirement</Link></li>
              <li><Link to="/donor-login">Donor Sign In & Portal</Link></li>
            </ul>
          </div>

          {/* Blood Groups */}
          <div className="footer-col">
            <h4>Blood Groups</h4>
            <div className="footer-groups-chips">
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                <Link key={bg} to={`/find-donor?group=${encodeURIComponent(bg)}`} className="footer-bg-chip">
                  {bg}
                </Link>
              ))}
            </div>
            <p className="footer-small-note">
              Every drop makes a difference. One single donation can save up to 3 separate lives.
            </p>
          </div>

          {/* Emergency Direct Help */}
          <div className="footer-col">
            <h4>Emergency Hotlines</h4>
            <div className="footer-hotlines">
              <div className="hotline-item">
                <PhoneIcon size={14} />
                <div>
                  <strong>108</strong>
                  <span>Emergency Ambulance</span>
                </div>
              </div>
              <div className="hotline-item">
                <PhoneIcon size={14} />
                <div>
                  <strong>104</strong>
                  <span>National Health Helpline</span>
                </div>
              </div>
              <div className="hotline-item">
                <PhoneIcon size={14} />
                <div>
                  <strong>1910</strong>
                  <span>Red Cross Blood Desk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2026 BloodConnect. Open community initiative.</p>
          <div className="footer-bottom-links">
            <Link to="/donor-login">Donor Guidelines</Link>
            <span className="dot-sep">•</span>
            <Link to="/urgent-sos">Emergency Protocols</Link>
            <span className="dot-sep">•</span>
            <Link to="/find-donor">Privacy & Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
