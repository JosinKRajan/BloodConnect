import React, { useState, useEffect } from 'react'
import {
  XIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  HeartPulseIcon,
  CheckIcon,
  Share2Icon,
} from './Icons'

export default function ContactModal({ donor, onClose, onNotify }) {
  const [copied, setCopied] = useState(false)
  const [reqUnits, setReqUnits] = useState('1')
  const [reqHospital, setReqHospital] = useState('')
  const [sentDirectReq, setSentDirectReq] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!donor) return null

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(donor.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onNotify?.({
      type: 'success',
      title: 'Phone copied',
      message: `${donor.name}'s phone number copied to clipboard!`,
    })
  }

  const handleSendDirect = (e) => {
    e.preventDefault()
    setSentDirectReq(true)
    onNotify?.({
      type: 'success',
      title: 'Direct Request Sent',
      message: `Direct emergency ping queued for ${donor.name} (${donor.group}).`,
    })
  }

  const whatsappMessage = encodeURIComponent(
    `Hello ${donor.name}, I found your profile on BloodConnect. We urgently need ${donor.group} blood. Could you please let us know if you are available to donate? Thank you!`
  )

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-donor-brief">
            <div className={`avatar avatar-lg ${donor.tone || 'coral'}`}>{donor.initials}</div>
            <div>
              <div className="donor-name-badge">
                <h3 id="modal-title">{donor.name}</h3>
                {donor.verified && (
                  <span className="badge-verified" title="Identity & Blood Group Verified">
                    <ShieldCheckIcon size={13} /> Verified Donor
                  </span>
                )}
              </div>
              <p className="modal-sub">
                <MapPinIcon size={13} /> {donor.location} • <strong className="text-crimson">{donor.distance}</strong>
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Stats Grid */}
          <div className="donor-quick-stats">
            <div className="stat-pill">
              <span className="stat-lbl">Blood Group</span>
              <span className="stat-val blood-val">{donor.group}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-lbl">Availability</span>
              <span className={`stat-val ${donor.available ? 'text-green' : 'text-muted'}`}>
                {donor.available ? 'Ready to Donate' : 'Cooldown Period'}
              </span>
            </div>
            <div className="stat-pill">
              <span className="stat-lbl">Last Donated</span>
              <span className="stat-val">{donor.lastDonation}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-lbl">Donations</span>
              <span className="stat-val">{donor.donationsCount || 5} times</span>
            </div>
          </div>

          {/* Quick Direct Actions */}
          <div className="contact-actions-grid">
            <a href={`tel:${donor.phone.replace(/\s+/g, '')}`} className="btn-action btn-call" id="btn-call-donor">
              <PhoneIcon size={16} />
              <span>Call {donor.phone}</span>
            </a>

            <a
              href={`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action btn-whatsapp"
              id="btn-whatsapp-donor"
            >
              <span>Message on WhatsApp</span>
            </a>

            <button type="button" className="btn-action btn-copy" onClick={handleCopyPhone} id="btn-copy-phone">
              {copied ? <CheckIcon size={15} /> : <Share2Icon size={15} />}
              <span>{copied ? 'Copied!' : 'Copy Phone'}</span>
            </button>
          </div>

          {/* Direct Request Form */}
          <div className="direct-request-box">
            <h4>
              <HeartPulseIcon size={16} className="text-crimson" /> Send In-App Blood Request
            </h4>
            {sentDirectReq ? (
              <div className="req-success-banner">
                <CheckIcon size={18} />
                <div>
                  <strong>Request Dispatched to {donor.name}!</strong>
                  <p>A priority alert with your hospital details has been recorded. You can also call directly above for urgent cases.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendDirect} className="direct-form">
                <div className="form-row-2">
                  <label className="input-group">
                    <span>Hospital / Clinic Name</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GMC Kottayam, Amrita Hospital, Calicut MCH"
                      value={reqHospital}
                      onChange={(e) => setReqHospital(e.target.value)}
                    />
                  </label>
                  <label className="input-group">
                    <span>Units Required</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={reqUnits}
                      onChange={(e) => setReqUnits(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <button type="submit" className="btn-submit-direct">
                  Send Direct Alert to {donor.name}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <p className="modal-disclaimer">
            BloodConnect never charges any fees for blood donations. Voluntary donation is an altruistic act.
          </p>
        </div>
      </div>
    </div>
  )
}
