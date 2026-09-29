import { useMemo, useState } from 'react'
import './App.css'

const donors = [
  { name: 'Ananya Sharma', group: 'O+', location: 'Indiranagar, Bengaluru', distance: '1.8 km', lastDonation: '2 months ago', initials: 'AS', tone: 'coral', available: true },
  { name: 'Rohan Mehta', group: 'B+', location: 'Koramangala, Bengaluru', distance: '3.2 km', lastDonation: '4 months ago', initials: 'RM', tone: 'navy', available: true },
  { name: 'Meera Nair', group: 'A-', location: 'HSR Layout, Bengaluru', distance: '4.7 km', lastDonation: '1 month ago', initials: 'MN', tone: 'mint', available: true },
  { name: 'Arjun Rao', group: 'O-', location: 'Jayanagar, Bengaluru', distance: '6.1 km', lastDonation: '3 months ago', initials: 'AR', tone: 'gold', available: false },
  { name: 'Priya Kapoor', group: 'AB+', location: 'Whitefield, Bengaluru', distance: '8.4 km', lastDonation: '5 months ago', initials: 'PK', tone: 'plum', available: true },
  { name: 'Kabir Singh', group: 'B-', location: 'Malleshwaram, Bengaluru', distance: '9.6 km', lastDonation: '6 months ago', initials: 'KS', tone: 'sky', available: true },
]

function App() {
  const [location, setLocation] = useState('')
  const [bloodGroup, setBloodGroup] = useState('All groups')
  const [availableOnly, setAvailableOnly] = useState(true)

  const filteredDonors = useMemo(() => donors.filter((donor) => {
    const matchesLocation = donor.location.toLowerCase().includes(location.toLowerCase())
    const matchesGroup = bloodGroup === 'All groups' || donor.group === bloodGroup
    const matchesAvailability = !availableOnly || donor.available
    return matchesLocation && matchesGroup && matchesAvailability
  }), [availableOnly, bloodGroup, location])

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="BloodConnect home"><span className="brand-mark" aria-hidden="true">+</span><span>Blood<span>Connect</span></span></a>
        <div className="nav-links"><a className="active" href="#find">Find a donor</a><a href="#how-it-works">How it works</a><a href="#about">About us</a></div>
        <button className="outline-button" type="button">Register as donor <span aria-hidden="true">↗</span></button>
      </nav>
      <section className="hero-section" id="top">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> EVERY DROP MATTERS</p><h1>Find the right<br /><em>match.</em> Save a life.</h1><p className="hero-description">Connect with verified blood donors near you. A simple search can become someone&apos;s second chance.</p></div>
        <div className="hero-art" aria-label="Illustration of a blood drop and helping hands" role="img"><div className="sun-ring" /><div className="drop-shape">+</div><div className="art-label">A little help<br /><strong>goes a long way</strong></div></div>
      </section>
      <section className="search-panel" id="find">
        <div className="section-heading"><div><p className="eyebrow">START YOUR SEARCH</p><h2>Find donors near you</h2></div><span className="result-count"><strong>{filteredDonors.length}</strong> donors nearby</span></div>
        <div className="search-controls"><label className="field location-field"><span className="field-icon">⌖</span><span><small>YOUR LOCATION</small><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search city or area" /></span></label><label className="field"><span className="field-icon blood-icon">♥</span><span><small>BLOOD GROUP</small><select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)}><option>All groups</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}</select></span></label><button className="search-button" type="button" onClick={() => document.getElementById('donor-list').scrollIntoView({ behavior: 'smooth' })}>Search donors <span aria-hidden="true">→</span></button></div>
        <label className="availability-toggle"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /><span className="toggle-track" />Show only available donors</label>
      </section>
      <section className="donor-section" id="donor-list">
        <div className="list-heading"><div><p className="eyebrow">YOUR COMMUNITY</p><h2>Donors ready to help</h2></div><button className="sort-button" type="button">Nearest first <span>⌄</span></button></div>
        <div className="donor-grid">{filteredDonors.map((donor) => <article className="donor-card" key={donor.name}><div className={`avatar ${donor.tone}`}>{donor.initials}</div><div className="donor-info"><div className="name-row"><h3>{donor.name}</h3><span className={`status ${donor.available ? '' : 'away'}`}><i />{donor.available ? 'Available' : 'Unavailable'}</span></div><p className="donor-location">⌖ {donor.location}</p><p className="donation-date">Last donation: {donor.lastDonation}</p></div><div className="card-side"><span className="blood-badge">{donor.group}</span><span className="distance">{donor.distance}</span><button className="contact-button" type="button" disabled={!donor.available}>Contact <span aria-hidden="true">↗</span></button></div></article>)}</div>
        {filteredDonors.length === 0 && <div className="empty-state">No donors match these filters. Try a nearby area or another blood group.</div>}
      </section>
      <footer><a className="brand" href="#top"><span className="brand-mark">+</span><span>Blood<span>Connect</span></span></a><p>Built for every moment that matters.</p><span>© 2026 BloodConnect</span></footer>
    </main>
  )
}

export default App
