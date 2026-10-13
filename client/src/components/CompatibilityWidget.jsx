import React, { useState } from 'react'
import { compatibilityData } from '../data/mockData'
import { SparklesIcon, BloodDropIcon } from './Icons'

const groups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

export default function CompatibilityWidget() {
  const [selectedGroup, setSelectedGroup] = useState('O-')
  const [isOpen, setIsOpen] = useState(false)

  const info = compatibilityData[selectedGroup]

  return (
    <div className="compatibility-card">
      <div className="compatibility-header" onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(!isOpen) }}>
        <div className="compatibility-title-wrap">
          <span className="compatibility-badge">
            <SparklesIcon size={14} /> Quick Guide
          </span>
          <h3>Blood Group Compatibility Checker</h3>
        </div>
        <button type="button" className="compatibility-toggle-btn" aria-expanded={isOpen}>
          {isOpen ? 'Hide Guide ▲' : 'Check Compatibility ▼'}
        </button>
      </div>

      {isOpen && (
        <div className="compatibility-body">
          <p className="compatibility-desc">
            Select a blood type to see who they can safely donate blood to, and which blood types they can safely receive from.
          </p>

          <div className="group-chips-grid">
            {groups.map((group) => (
              <button
                type="button"
                key={group}
                className={`compat-chip ${selectedGroup === group ? 'active' : ''}`}
                onClick={() => setSelectedGroup(group)}
              >
                <BloodDropIcon size={14} />
                <span>{group}</span>
              </button>
            ))}
          </div>

          {info && (
            <div className="compat-results-grid">
              <div className="compat-col compat-give">
                <div className="compat-col-title">
                  <span className="dot dot-give" />
                  <strong>Can Donate To:</strong>
                </div>
                <div className="compat-pills-row">
                  {info.giveTo.map((g) => (
                    <span key={g} className="blood-tag blood-tag-give">{g}</span>
                  ))}
                </div>
              </div>

              <div className="compat-col compat-receive">
                <div className="compat-col-title">
                  <span className="dot dot-receive" />
                  <strong>Can Receive From:</strong>
                </div>
                <div className="compat-pills-row">
                  {info.receiveFrom.map((g) => (
                    <span key={g} className="blood-tag blood-tag-receive">{g}</span>
                  ))}
                </div>
              </div>

              <div className="compat-note-box">
                <p>💡 {info.note}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
