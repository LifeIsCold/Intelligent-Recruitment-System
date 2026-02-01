// src/components/LoginPage.jsx
import React, { useState } from 'react'
import '../App.css'

const LoginPage = ({ userType, onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    fullName: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    if (!formData.email || !formData.password) {
      alert('Please fill in all required fields')
      return
    }
    
    // Simulate API call
    setTimeout(() => {
      alert(`${isLogin ? 'Login' : 'Registration'} successful!`)
      onLogin()
    }, 1000)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getUserTypeTitle = () => {
    switch(userType) {
      case 'jobPosting': return 'Job Poster / Employer'
      case 'admin': return 'Administrator'
      default: return 'User'
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <button className="back-button login-back" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back
        </button>

        <div className="login-header">
          <div className="login-logo">
            <i className="fas fa-brain"></i>
          </div>
          <h1>{getUserTypeTitle()} Portal</h1>
          <p className="login-subtitle">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName">
                <i className="fas fa-user"></i> Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required={!isLogin}
              />
            </div>
          )}

          {!isLogin && userType === 'jobPosting' && (
            <div className="form-group">
              <label htmlFor="company">
                <i className="fas fa-building"></i> Company Name
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter your company name"
                required={!isLogin && userType === 'jobPosting'}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength="6"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-lock"></i> Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required={!isLogin}
              />
            </div>
          )}

          {isLogin && (
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className="forgot-password">
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" className="login-button">
            <i className={isLogin ? "fas fa-sign-in-alt" : "fas fa-user-plus"}></i>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {userType === 'admin' && isLogin && (
            <div className="admin-note">
              <i className="fas fa-shield-alt"></i>
              <p>Administrator access requires additional verification.</p>
            </div>
          )}
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button" 
              className="toggle-form"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? ' Sign Up' : ' Sign In'}
            </button>
          </p>

          <div className="login-terms">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our
            <a href="#"> Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>

        <div className="user-type-info">
          <h4><i className="fas fa-info-circle"></i> {getUserTypeTitle()} Access:</h4>
          <ul>
            {userType === 'jobPosting' && (
              <>
                <li>Post and manage job listings</li>
                <li>View and contact matched candidates</li>
                <li>Access analytics dashboard</li>
              </>
            )}
            {userType === 'admin' && (
              <>
                <li>Manage all users and permissions</li>
                <li>Monitor system performance</li>
                <li>Access admin reports and analytics</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoginPage