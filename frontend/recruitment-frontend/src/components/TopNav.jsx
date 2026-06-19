import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout as doLogout } from '../services/auth'
import NotificationBell from './NotificationBell'

const TopNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('authToken')
  const role = localStorage.getItem('authRole')
  const userName = localStorage.getItem('authUserName') || 'User'

  const handleLogout = () => {
    doLogout(navigate)
  }

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <div style={{
          width: 40,
          height: 40,
          background: '#4f46e5',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="fas fa-brain" style={{ color: 'white', fontSize: '1.2rem' }}></i>
        </div>
        <div>
          <strong style={{ fontSize: '1.2rem', color: '#111827' }}>Intelligent Recruitment</strong>
          {role && (
            <span style={{
              marginLeft: 10,
              fontSize: '0.8rem',
              background: '#f3f4f6',
              padding: '2px 8px',
              borderRadius: 12,
              color: '#4b5563',
              textTransform: 'capitalize'
            }}>
              {role.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {token && <NotificationBell />}

        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36,
                height: 36,
                background: '#4f46e5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 500, color: '#374151' }}>{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              onMouseEnter={e => (e.target.style.background = '#dc2626')}
              onMouseLeave={e => (e.target.style.background = '#ef4444')}
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/jobseeker-login')}
              style={{
                background: 'white',
                color: '#4f46e5',
                border: '2px solid #4f46e5',
                padding: '8px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.target.style.background = '#4f46e5';
                e.target.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'white';
                e.target.style.color = '#4f46e5';
              }}
            >
              Job Seeker
            </button>
            <button
              onClick={() => navigate('/jobposting-login')}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => (e.target.style.background = '#059669')}
              onMouseLeave={e => (e.target.style.background = '#10b981')}
            >
              Recruiter
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default TopNav