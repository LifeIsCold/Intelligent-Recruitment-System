// JobPostingLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JobSeekerLogin.css'; // Using the same CSS file for consistent styling
import './JobPostingLogin.css';
import api from '../services/api';
import ErrorDisplay from './ErrorDisplay';
import ErrorHandler from '../services/errorHandler';

const JobPostingLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyWebsite: '',
    contactPerson: '',
    industryId: ''
  });
  const [industries, setIndustries] = useState([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null); // Now stores error object
  const [detailedError, setDetailedError] = useState(null); // For ErrorDisplay component
  
  const navigate = useNavigate();

  // Fetch industries on component mount
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const res = await api.getIndustries();
        if (res.data) {
          setIndustries(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch industries:', err);
      }
    };
    fetchIndustries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    // Company Name
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    // Contact Person
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person name is required';
    } else if (formData.contactPerson.trim().length < 2) {
      newErrors.contactPerson = 'Contact person name must be at least 2 characters';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone (optional but validate if provided)
    if (formData.phone && !/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    // Company Website (optional but validate if provided)
    if (formData.companyWebsite && !/^https?:\/\/.+/.test(formData.companyWebsite)) {
      newErrors.companyWebsite = 'Please enter a valid URL (e.g., https://example.com)';
    }
    // Industry (required for recruiter)
    if (!formData.industryId) {
      newErrors.industryId = 'Please select an industry';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleTabClick = (tabType) => {
    setIsLogin(tabType === 'login');
    setRegistrationSuccess(false);
    setErrors({});
    setApiError(null);
    setDetailedError(null);
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      companyWebsite: '',
      industryId: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);
    setDetailedError(null);
    
    if (isLogin) {
      if (!validateLoginForm()) return;

      setIsLoading(true);
      // Try backend login first (include role to restrict to recruiters)
      api.login({ email: formData.email, password: formData.password, role: 'recruiter' })
        .then(data => {
          console.log('✅ Login successful:', data);
          if (data.token) localStorage.setItem('authToken', data.token)
          if (data.user && data.user.role) localStorage.setItem('authRole', data.user.role)
          // Data stored securely in backend only
          alert('Login successful!');
          navigate('/jobposting-dashboard');
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
      if (!validateRegisterForm()) return;

      setIsLoading(true);
      console.log('📤 Sending registration data:', {
        name: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        role: 'recruiter',
        company_name: formData.companyName,
        company_website: formData.companyWebsite,
        company_contact_person: formData.contactPerson,
        company_contact_phone: formData.phone,
        industry_id: parseInt(formData.industryId)
      });

      // Try backend register
      api.register({
        name: formData.contactPerson.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null,
        role: 'recruiter',
        company_name: formData.companyName.trim(),
        company_website: formData.companyWebsite.trim() || null,
        company_contact_person: formData.contactPerson.trim(),
        company_contact_phone: formData.phone.trim() || null,
        industry_id: parseInt(formData.industryId)
      })
        .then(data => {
          console.log('✅ Registration successful:', data);
          if (data.token) localStorage.setItem('authToken', data.token)
          if (data.user && data.user.role) localStorage.setItem('authRole', data.user.role)
          // Data stored securely in backend only
          setRegistrationSuccess(true);
          alert('Registration successful! You are now logged in.');
          navigate('/jobposting-dashboard');
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
        companyName: '',
        contactPerson: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        companyWebsite: '',
        industryId: ''
      });
    }
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

      <div className="auth-header">
        <h1>Intelligent Recruitment Platform</h1>
        <h2>Job Creator Portal</h2>
        <p className="portal-description">
          Hire top talent and manage job postings efficiently
        </p>
      </div>

      <div className="auth-box">
        {registrationSuccess && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Registration successful! You are now logged in.</p>
          </div>
        )}

        {apiError && !detailedError && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{apiError}</p>
          </div>
        )}
        
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

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Enter your company name"
                  className={errors.companyName ? 'input-error' : ''}
                />
                {errors.companyName && <span className="error-text">{errors.companyName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="contactPerson">Contact Person *</label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Enter contact person name"
                  className={errors.contactPerson ? 'input-error' : ''}
                />
                {errors.contactPerson && <span className="error-text">{errors.contactPerson}</span>}
              </div>
            </>
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
              placeholder="Enter company email"
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

              <div className="form-group optional">
                <label htmlFor="phone" className="no-asterisk">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter company phone number"
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="companyWebsite" className="no-asterisk">Company Website</label>
                <input
                  type="url"
                  id="companyWebsite"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className={errors.companyWebsite ? 'input-error' : ''}
                />
                {errors.companyWebsite && <span className="error-text">{errors.companyWebsite}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="industryId">Industry *</label>
                <select
                  id="industryId"
                  name="industryId"
                  value={formData.industryId}
                  onChange={handleInputChange}
                  className={errors.industryId ? 'input-error' : ''}
                >
                  <option value="">-- Select an Industry --</option>
                  {industries.map(industry => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
                {errors.industryId && <span className="error-text">{errors.industryId}</span>}
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register Company')}
          </button>

          <div className="switch-link">
            {isLogin ? (
              <p>
                Don't have a company account?{' '}
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

        <div className="back-link">
          <button 
            onClick={() => navigate('/')}
            className="back-btn"
          >
             Back to Main Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobPostingLogin;  