import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './JobSeekerLogin.css'

const EditProfile = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState(localStorage.getItem('authRole'))
  const [formData, setFormData] = useState({ 
    // Personal fields (only for job seekers)
    name: '', 
    email: '', 
    phone: '', 
    
    // Company fields (only for recruiters)
    company_name: '', 
    company_website: '', 
    contact_person: '', 
    contact_phone: '',
    contact_email: '',
    industry_id: '' 
  })
  const [industries, setIndustries] = useState([])
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  
  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    // Fetch profile from API to prefill fields with existing data
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        const response = await api.getProfile()
        console.log('Profile API response:', response)
        
        // Handle different response structures
        let userData = null
        let companyData = null
        
        if (response && response.user) {
          // Structure: { user: {...}, company: {...} }
          userData = response.user
          companyData = response.company
        } else if (response && response.data) {
          if (response.data.user) {
            // Structure: { data: { user: {...}, company: {...} } }
            userData = response.data.user
            companyData = response.data.company
          } else {
            // Structure: { data: {...} } where data might be user or company
            if (role === 'recruiter') {
              companyData = response.data
            } else {
              userData = response.data
            }
          }
        } else if (response && response.id) {
          // Structure: direct user object
          if (role === 'recruiter') {
            companyData = response
          } else {
            userData = response
          }
        }
        
        console.log('User data extracted:', userData)
        console.log('Company data extracted:', companyData)
        
        // Update form data based on role
        setFormData(prevData => {
          const newData = { ...prevData }
          
          if (role === 'recruiter') {
            // For recruiters, set company info
            if (companyData) {
              console.log('Setting recruiter data:', companyData)
              
              // Try different possible field names from API
              newData.company_name = companyData.name || 
                                     companyData.company_name || 
                                     companyData.companyName || 
                                     ''
              
              newData.company_website = companyData.website || 
                                        companyData.company_website || 
                                        companyData.companyWebsite || 
                                        ''
              
              newData.contact_person = companyData.contact_person || 
                                       companyData.contactPerson || 
                                       companyData.contact_name || 
                                       ''
              
              newData.contact_phone = companyData.contact_phone || 
                                      companyData.contactPhone || 
                                      companyData.phone || 
                                      companyData.contact_phone_number || 
                                      ''
              
              newData.contact_email = companyData.contact_email || 
                                      companyData.contactEmail || 
                                      companyData.email || 
                                      ''
              
              newData.industry_id = companyData.industry_id || 
                                    companyData.industryId || 
                                    companyData.industry?.id || 
                                    ''
            }
            
            // Also store company info in localStorage
            if (companyData?.name || companyData?.company_name) {
              localStorage.setItem('authCompanyName', companyData.name || companyData.company_name)
            }
          } else {
            // For job seekers, set personal info
            if (userData) {
              console.log('Setting job seeker data:', userData)
              newData.name = userData.name || userData.full_name || userData.fullName || ''
              newData.email = userData.email || ''
              newData.phone = userData.phone || userData.mobile || userData.phone_number || ''
            }
            
            // Store in localStorage as backup
            if (userData?.name) {
              localStorage.setItem('authUserName', userData.name)
            }
            if (userData?.email) {
              localStorage.setItem('authUserEmail', userData.email)
            }
          }
          
          return newData
        })
        
        setInitialDataLoaded(true)
        
      } catch (err) {
        console.error('Error fetching profile:', err)
        
        // Fallback to localStorage
        if (role === 'recruiter') {
          // Try to get company data from localStorage
          const storedCompanyName = localStorage.getItem('authCompanyName')
          if (storedCompanyName) {
            setFormData(prev => ({
              ...prev,
              company_name: storedCompanyName
            }))
          }
        } else {
          // Fallback for job seekers
          const storedName = localStorage.getItem('authUserName')
          const storedEmail = localStorage.getItem('authUserEmail')
          
          setFormData(prev => ({
            ...prev,
            name: storedName || prev.name || '',
            email: storedEmail || prev.email || ''
          }))
        }
        
        // Still show an error message but don't block the form
        setErrors({
          submit: 'Could not load profile data. Please check your connection.'
        })
        setInitialDataLoaded(true) // Still set loaded to true so form shows
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()

    // Fetch industries for recruiter from database
    if (role === 'recruiter') {
      const fetchIndustries = async () => {
        try {
          console.log('Fetching industries from database...')
          const response = await api.getIndustries()
          console.log('Industries API response:', response)
          
          // Handle different response structures
          let industriesData = []
          
          if (Array.isArray(response)) {
            industriesData = response
          } else if (response && response.data && Array.isArray(response.data)) {
            industriesData = response.data
          } else if (response && response.industries && Array.isArray(response.industries)) {
            industriesData = response.industries
          }
          
          console.log('Setting industries:', industriesData)
          setIndustries(industriesData)
        } catch (err) {
          console.error('Error fetching industries:', err)
        }
      }
      
      fetchIndustries()
    }
  }, [role])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    setPasswordErrors(prev => ({ ...prev, [name]: '' }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    }
    return requirements
  }
  
  const getPasswordStrength = (password) => {
    if (!password) return ''
    const requirements = validatePassword(password)
    const validCount = Object.values(requirements).filter(Boolean).length
    if (validCount <= 1) return 'weak'
    if (validCount <= 3) return 'medium'
    return 'strong'
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordErrors({})
    setPasswordSuccess('')

    // Validate
    const newErrors = {}
    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required'
    }
    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required'
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters'
    }
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      newErrors.new_password_confirmation = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors)
      return
    }

    setIsChangingPassword(true)
    try {
      await api.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation
      })
      setPasswordSuccess('Password changed successfully!')
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordData({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        })
        setPasswordSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Password change failed', err)
      if (err.response && err.response.data && err.response.data.errors) {
        setPasswordErrors(err.response.data.errors)
      } else {
        setPasswordErrors({ 
          submit: err.response?.data?.message || 'Failed to change password' 
        })
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let payload = {}
      
      if (role === 'recruiter') {
        // For recruiters, only send company data
        payload = {
          company_name: formData.company_name,
          company_website: formData.company_website,
          contact_person: formData.contact_person,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          industry_id: formData.industry_id || null
        }
      } else {
        // For job seekers, send personal data
        payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      }

      console.log('Submitting payload:', payload)
      const res = await api.updateProfile(payload)
      
      alert('Profile updated successfully')
      
      // Update localStorage with new user data
      if (role === 'recruiter') {
        if (res.company) {
          localStorage.setItem('authCompanyName', res.company.name || formData.company_name)
        } else if (res.data?.company) {
          localStorage.setItem('authCompanyName', res.data.company.name || formData.company_name)
        }
      } else {
        if (res.user) {
          localStorage.setItem('authUserName', res.user.name || formData.name)
          localStorage.setItem('authUserEmail', res.user.email || formData.email)
        } else if (res.data?.user) {
          localStorage.setItem('authUserName', res.data.user.name || formData.name)
          localStorage.setItem('authUserEmail', res.data.user.email || formData.email)
        } else {
          // Fallback to form data
          localStorage.setItem('authUserName', formData.name)
          localStorage.setItem('authUserEmail', formData.email)
        }
      }
      
      navigate(role === 'recruiter' ? '/jobposting-dashboard' : '/jobseeker-dashboard')
    } catch (err) {
      console.error('Profile update failed', err)
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ 
          submit: err.response?.data?.message || 'Failed to update profile' 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while fetching initial data
  if (!initialDataLoaded && isLoading) {
    return (
      <div className="jobseeker-auth-container">
        <div className="auth-header">
          <h1>Loading Profile...</h1>
        </div>
        <div className="auth-box">
          <div className="loading-spinner" style={{ margin: '40px auto', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary-600)' }}></i>
            <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Fetching your profile data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="jobseeker-auth-container">
      <div className="auth-header">
        <h1>Edit Profile</h1>
        <p>{role === 'recruiter' ? 'Update your company information' : 'Update your personal information'}</p>
      </div>

      <div className="auth-box">
        {errors.submit && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{errors.submit}</p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {role === 'recruiter' ? (
            /* Recruiter Form - Company Information Only */
            <>
              <h3 className="section-title">Company Information</h3>
              
              <div className="form-group">
                <label htmlFor="company_name">Company Name *</label>
                <input 
                  id="company_name" 
                  name="company_name" 
                  value={formData.company_name} 
                  onChange={handleChange} 
                  placeholder="Enter company name"
                  disabled={isLoading}
                />
                {errors.company_name && <span className="error-text">{errors.company_name[0] || errors.company_name}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="company_website" className="no-asterisk">Company Website</label>
                <input 
                  id="company_website" 
                  name="company_website" 
                  value={formData.company_website} 
                  onChange={handleChange} 
                  placeholder="https://www.company.com"
                  disabled={isLoading}
                />
                {errors.company_website && <span className="error-text">{errors.company_website[0] || errors.company_website}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="contact_person" className="no-asterisk">Contact Person</label>
                <input 
                  id="contact_person" 
                  name="contact_person" 
                  value={formData.contact_person} 
                  onChange={handleChange} 
                  placeholder="Name of person to contact"
                  disabled={isLoading}
                />
                {errors.contact_person && <span className="error-text">{errors.contact_person[0] || errors.contact_person}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="contact_phone" className="no-asterisk">Contact Phone</label>
                <input 
                  id="contact_phone" 
                  name="contact_phone" 
                  value={formData.contact_phone} 
                  onChange={handleChange} 
                  placeholder="Company contact phone number"
                  disabled={isLoading}
                />
                {errors.contact_phone && <span className="error-text">{errors.contact_phone[0] || errors.contact_phone}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="contact_email" className="no-asterisk">Contact Email</label>
                <input 
                  id="contact_email" 
                  name="contact_email" 
                  type="email"
                  value={formData.contact_email} 
                  onChange={handleChange} 
                  placeholder="company.contact@example.com"
                  disabled={isLoading}
                />
                {errors.contact_email && <span className="error-text">{errors.contact_email[0] || errors.contact_email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="industry_id">Industry *</label>
                <select 
                  id="industry_id" 
                  name="industry_id" 
                  value={formData.industry_id || ''} 
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">-- Select an Industry --</option>
                  {industries.length === 0 ? (
                    <option value="" disabled>Loading industries...</option>
                  ) : (
                    industries.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.industry_id && <span className="error-text">{errors.industry_id[0] || errors.industry_id}</span>}
              </div>
            </>
          ) : (
            /* Job Seeker Form - Personal Information Only */
            <>
              <h3 className="section-title">Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && <span className="error-text">{errors.name[0] || errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
                {errors.email && <span className="error-text">{errors.email[0] || errors.email}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="phone" className="no-asterisk">Phone Number</label>
                <input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="Enter your phone number"
                  disabled={isLoading}
                />
                {errors.phone && <span className="error-text">{errors.phone[0] || errors.phone}</span>}
              </div>
            </>
          )}

          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>

        {/* Change Password Button - Available for all users */}
        <div className="change-password-section">
          <hr className="divider" />
          <button 
            type="button"
            className="change-password-btn"
            onClick={() => setShowChangePassword(true)}
            disabled={isLoading}
          >
            <i className="fas fa-key"></i> Change Password
          </button>
        </div>

        <div style={{marginTop: 16}}>
          <button className="back-btn" onClick={() => navigate(-1)} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-key"></i> Change Password</h2>
              <button className="modal-close" onClick={() => setShowChangePassword(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {passwordSuccess && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i> {passwordSuccess}
                </div>
              )}
              
              {passwordErrors.submit && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {passwordErrors.submit}
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit}>
                {/* Current Password */}
                <div className="password-input-group">
                  <label>
                    <i className="fas fa-lock"></i> Current Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className={passwordErrors.current_password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      <i className={`fas fa-${showPasswords.current ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <span className="error-text">{passwordErrors.current_password}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="password-input-group">
                  <label>
                    <i className="fas fa-lock"></i> New Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className={passwordErrors.new_password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      <i className={`fas fa-${showPasswords.new ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <span className="error-text">{passwordErrors.new_password}</span>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {passwordData.new_password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div className={`strength-bar-fill ${getPasswordStrength(passwordData.new_password)}`}></div>
                      </div>
                      <span className={`strength-text ${getPasswordStrength(passwordData.new_password)}`}>
                        Password strength: {getPasswordStrength(passwordData.new_password)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="password-input-group">
                  <label>
                    <i className="fas fa-lock"></i> Confirm New Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="new_password_confirmation"
                      value={passwordData.new_password_confirmation}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className={passwordErrors.new_password_confirmation ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      <i className={`fas fa-${showPasswords.confirm ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                  {passwordErrors.new_password_confirmation && (
                    <span className="error-text">{passwordErrors.new_password_confirmation}</span>
                  )}
                </div>

                {/* Password Requirements */}
                {passwordData.new_password && (
                  <div className="password-requirements">
                    <h4>Password Requirements:</h4>
                    <ul>
                      <li className={validatePassword(passwordData.new_password).length ? 'valid' : 'invalid'}>
                        <i className={`fas ${validatePassword(passwordData.new_password).length ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        At least 8 characters
                      </li>
                      <li className={validatePassword(passwordData.new_password).uppercase ? 'valid' : 'invalid'}>
                        <i className={`fas ${validatePassword(passwordData.new_password).uppercase ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        At least one uppercase letter
                      </li>
                      <li className={validatePassword(passwordData.new_password).lowercase ? 'valid' : 'invalid'}>
                        <i className={`fas ${validatePassword(passwordData.new_password).lowercase ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        At least one lowercase letter
                      </li>
                      <li className={validatePassword(passwordData.new_password).number ? 'valid' : 'invalid'}>
                        <i className={`fas ${validatePassword(passwordData.new_password).number ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        At least one number
                      </li>
                    </ul>
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowChangePassword(false)}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Changing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditProfile