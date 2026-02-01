import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ErrorHandler from '../services/errorHandler';
import ErrorDisplay from './ErrorDisplay';
import './JobSeekerLogin.css';

const JobSeekerLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [detailedError, setDetailedError] = useState(null);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegistrationForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError('');
    setDetailedError(null);
    
    if (isLogin) {
      // Validate login form
      if (!validateLoginForm()) {
        return;
      }

      setIsLoading(true);

      // Call backend login API (send role to restrict login to job seekers)
      api.login({
        email: formData.email.trim(),
        password: formData.password,
        role: 'seeker'
      })
        .then(data => {
          console.log('✅ Login successful:', data);
          // store token and role
          if (data.token) localStorage.setItem('authToken', data.token)
          if (data.user && data.user.role) localStorage.setItem('authRole', data.user.role)
          setRegistrationSuccess(true);
          alert('Login successful! Welcome back.');
          navigate('/jobseeker-dashboard');
        })
        .catch(err => {
          console.error('❌ Login error occurred');
          const errorObj = ErrorHandler.parseError(err);
          ErrorHandler.logDetails(errorObj, 'Login');
          setDetailedError(errorObj);
          setApiError(errorObj.message);
          setIsLoading(false);
        });
    } else {
      // Validate registration form
      if (!validateRegistrationForm()) {
        return;
      }

      setIsLoading(true);

      // Call backend register API for seeker (use backend role `job_seeker`)
      api.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null,
        role: 'seeker'
      })
        .then(data => {
          console.log('✅ Registration successful:', data);
          if (data.token) localStorage.setItem('authToken', data.token)
          if (data.user && data.user.role) localStorage.setItem('authRole', data.user.role)
          // Data stored securely in backend only
          setRegistrationSuccess(true);
          alert('Registration successful! You are now logged in.');
          navigate('/jobseeker-dashboard');
        })
        .catch(err => {
          console.error('❌ Registration error occurred');
          const errorObj = ErrorHandler.parseError(err);
          ErrorHandler.logDetails(errorObj, 'Registration');
          setDetailedError(errorObj);
          setApiError(errorObj.message);
          setIsLoading(false);
        });

      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
      });
    }
  };

  const handleTabClick = (tabType) => {
    setIsLogin(tabType === 'login');
    setRegistrationSuccess(false);
    setApiError('');
    setDetailedError(null);
    setErrors({});
    // Clear form when switching tabs
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
  };

  return (
    <div className="jobseeker-auth-container">
      {/* Error Display Component */}
      {detailedError && (
        <ErrorDisplay
          error={detailedError}
          onClose={() => setDetailedError(null)}
          showDetails={true}
          title={isLogin ? 'Login Error' : 'Registration Error'}
        />
      )}

      {/* Header */}
      <div className="auth-header">
        <h1>Intelligent Recruitment Platform</h1>
        <h2>Job Seeker Portal</h2>
        <p className="portal-description">
          Find your next opportunity and grow your career
        </p>
      </div>

      {/* Main Auth Box */}
      <div className="auth-box">
        {/* Show success message if just registered */}
        {registrationSuccess && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>{isLogin ? 'Login successful! Welcome back.' : 'Registration successful! You are now logged in.'}</p>
          </div>
        )}

        {apiError && !detailedError && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{apiError}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="auth-tabs">
          <button 
            className={`tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => handleTabClick('login')}
          >
            Login
          </button>
          <button 
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => handleTabClick('register')}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Enter your full name"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="8"
              placeholder={isLogin ? "Enter your password" : "Create a password (min 8 chars)"}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            {!isLogin && <small style={{color: '#666', marginTop: '4px', display: 'block'}}>At least 8 characters, 1 uppercase, 1 number</small>}
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>

          <div className="switch-link">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <span onClick={() => handleTabClick('register')} className="link-text">
                  Register here
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <span onClick={() => handleTabClick('login')} className="link-text">
                  Login here
                </span>
              </p>
            )}
          </div>
        </form>

        {!isLogin && (
          <div className="info-box">
            <h4>Benefits for Job Seekers:</h4>
            <ul>
              <li>✓ Browse thousands of job opportunities</li>
              <li>✓ Save job listings for later</li>
              <li>✓ Apply with your profile in one click</li>
              <li>✓ Track your applications in real-time</li>
              <li>✓ Get matched with relevant opportunities</li>
            </ul>
          </div>
        )}

        {/* Back to Main Dashboard */}
        <div className="back-link">
          <button 
            onClick={() => navigate('/')}
            className="back-btn"
          >
            ← Back to Main Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerLogin;