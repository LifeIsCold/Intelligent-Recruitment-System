import React, { useEffect } from 'react'
import TopNav from './TopNav'
import { useNavigate, useLocation } from 'react-router-dom'

const AuthLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const role = localStorage.getItem('authRole')
    // If no token redirect to proper login page depending on route
    const path = location.pathname || ''
    const needsRecruiter = path.includes('posting') || path.includes('posting-dashboard')
    if (!token) {
      if (needsRecruiter) navigate('/jobposting-login')
      else navigate('/jobseeker-login')
    }
    // If token exists but role mismatched, redirect to proper portal
    if (token && role) {
      if (needsRecruiter && role !== 'recruiter') navigate('/jobposting-login')
      if (!needsRecruiter && role !== 'seeker') navigate('/jobseeker-login')
    }
  }, [location.pathname])

  return (
    <div>
      <TopNav />
      <main style={{ padding: '20px' }}>{children}</main>
    </div>
  )
}

export default AuthLayout
