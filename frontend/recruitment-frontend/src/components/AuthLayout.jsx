import React, { useEffect } from 'react'
import TopNav from './TopNav'
import { useNavigate, useLocation } from 'react-router-dom'
import './AuthLayout.css'
const AuthLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('authRole');
    const path = location.pathname || '';
    
    console.log('🛡️ Auth Check:', { path, hasToken: !!token, role });
    
    // If no token, redirect to appropriate login
    if (!token) {
      console.log('🛡️ No token - redirecting to login');
      if (path.includes('posting') || path.includes('posting-dashboard')) {
        navigate('/jobposting-login');
      } else if (path.includes('seeker') || path.includes('seeker-dashboard')) {
        navigate('/jobseeker-login');
      }
      return;
    }
    
    // Check role-based access
    if (token && role) {
      const isRecruiterRoute = path.includes('posting') || path.includes('posting-dashboard');
      const isSeekerRoute = path.includes('seeker') || path.includes('seeker-dashboard');
      
      if (isRecruiterRoute && role !== 'recruiter') {
        console.log('🛡️ Role mismatch - recruiter route with seeker role');
        navigate('/jobposting-login');
        return;
      }
      
      if (isSeekerRoute && role !== 'job_seeker') {
        console.log('🛡️ Role mismatch - seeker route with recruiter role');
        navigate('/jobseeker-login');
        return;
      }
      
      // If already authenticated and trying to access login page, redirect to dashboard
      if ((path === '/jobposting-login' && role === 'recruiter') || 
          (path === '/jobseeker-login' && role === 'job_seeker')) {
        console.log('🛡️ Already authenticated - redirecting to dashboard');
        navigate(role === 'recruiter' ? '/jobposting-dashboard' : '/jobseeker-dashboard', { replace: true });
        return;
      }
    }
  }, [location.pathname, navigate]);

  return (
    <div>
      <TopNav />
      <main style={{ padding: '20px' }}>{children}</main>
    </div>
  )
}

export default AuthLayout
