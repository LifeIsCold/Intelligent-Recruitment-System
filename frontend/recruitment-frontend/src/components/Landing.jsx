import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'
import api from '../services/api'

const Landing = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [siteStats, setSiteStats] = useState(null)

  useEffect(() => {
    let mounted = true
    api.getSiteStats().then(res => {
      if (mounted) setSiteStats(res)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const handleCTA = (e, path) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px'
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px'
    ripple.className = 'ripple'
    btn.appendChild(ripple)
    setTimeout(() => { ripple.remove() }, 600)
    setTimeout(() => navigate(path), 180)
  }

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className="landing-logo" onClick={() => navigate('/') }>
            <i className="fas fa-brain"></i>
            <span>Intelligent Recruitment</span>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          {/* login icon */}
          <button className="login-icon-btn" onClick={() => {
            const token = localStorage.getItem('authToken')
            const role = localStorage.getItem('authRole')
            if (token && role === 'recruiter') navigate('/jobposting-dashboard')
            else if (token && role === 'seeker') navigate('/jobseeker-dashboard')
            else setMenuOpen(true)
          }} aria-label="Login">
            <i className="fas fa-user-circle"></i>
          </button>
          <div className="landing-hamburger">
            <button className="hamburger-btn" onClick={() => setMenuOpen(s => !s)} aria-label="Open menu">
              <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu" role="dialog">
            <button className="mobile-item" onClick={(e) => { setMenuOpen(false); handleCTA(e, '/jobseeker-login') }}>Job Seeker</button>
            <button className="mobile-item" onClick={(e) => { setMenuOpen(false); handleCTA(e, '/jobposting-login') }}>Recruiter</button>
          </div>
        )}
      </header>

      <main className="landing-hero">
        <div className="hero-content">
          <h1>Find the right people, faster.</h1>
          <p>AI-assisted CV matching and recruitment tools to connect talent with opportunity.</p>
          <div className="hero-ctas">
            <button className="cta-primary btn-animate" onClick={(e) => handleCTA(e, '/jobseeker-login')}>Get Started (Job Seeker)</button>
            <button className="cta-secondary btn-animate" onClick={(e) => handleCTA(e, '/jobposting-login')}>Post a Job (Recruiter)</button>
          </div>
        </div>
        <div className="hero-illustration">
          <img src="/assets/landing-hero.svg" alt="landing illustration" style={{width: '100%', maxWidth: 420}} />
        </div>
      </main>

      <section className="landing-features">
        <h2>Platform Features</h2>
        <div className="features-grid">
          <div className="feature">
            <i className="fas fa-magic"></i>
            <h3>AI Matching</h3>
            <p>Automatically match CVs to job requirements and rank candidates.</p>
          </div>
          <div className="feature">
            <i className="fas fa-file-upload"></i>
            <h3>Easy CV Uploads</h3>
            <p>Job seekers upload resumes in multiple formats and get recommended jobs.</p>
          </div>
          <div className="feature">
            <i className="fas fa-tasks"></i>
            <h3>Manage Applicants</h3>
            <p>Recruiters can view applicants, shortlist, and track progress.</p>
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <h2>Platform at a glance</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{siteStats ? siteStats.total_users : '—'}</h3>
            <p>Registered users</p>
          </div>
          <div className="stat-card">
            <h3>{siteStats ? siteStats.total_companies : '—'}</h3>
            <p>Companies onboarded</p>
          </div>
          <div className="stat-card">
            <h3>{siteStats ? siteStats.total_jobs : '—'}</h3>
            <p>Jobs posted</p>
          </div>
          <div className="stat-card">
            <h3>{siteStats ? siteStats.total_applications : '—'}</h3>
            <p>Applications submitted</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Intelligent Recruitment — Built for better hiring</p>
      </footer>
    </div>
  )
}

export default Landing
