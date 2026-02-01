import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { logout as doLogout } from '../services/auth'

const TopNav = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    doLogout(navigate)
  }

  const role = localStorage.getItem('authRole')
  const location = useLocation()
  const pathname = location.pathname || ''
  const hideButtons = pathname.includes('jobseeker-dashboard') || pathname.includes('jobposting-dashboard') || pathname.includes('/jobseeker') || pathname.includes('/jobposting')

  return (
    <header style={{display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '12px 20px', background: '#fff', borderBottom: '1px solid #eee'}}>
      <div style={{display:'flex', alignItems:'center', gap: 12, cursor: 'pointer'}} onClick={() => navigate('/')}>
        <i className="fas fa-brain" style={{color: '#4f46e5'}}></i>
        <strong>Intelligent Recruitment</strong>
      </div>
      {!hideButtons && (
        <nav style={{display: 'flex', gap: 12}}>
          <div className="left">
            <button onClick={() => navigate('/jobseeker-dashboard')} style={{padding: '8px 12px'}}>Dashboard</button>
            <button onClick={() => navigate('/jobs')} style={{padding: '8px 12px'}}>Jobs</button>
          </div>
          <div className="right">
          {role === 'recruiter' && (
            <button onClick={() => navigate('/jobposting-dashboard')} style={{padding: '8px 12px'}} className="postings-link">Postings</button>
          )}
            <button onClick={() => navigate('/edit-profile')} style={{padding: '8px 12px', background:'#06b6d4', color:'#fff', border:'none', borderRadius:6}}>Edit Profile</button>
            <button onClick={handleLogout} style={{padding: '8px 12px', background:'#ef4444', color:'#fff', border:'none', borderRadius:6}}>Logout</button>
          </div>
        </nav>
      )}
    </header>
  )
}

export default TopNav
