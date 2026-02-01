import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './JobSeekerLogin.css'

const EditProfile = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState(localStorage.getItem('authRole'))
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company_name: '', company_website: '', company_contact_person: '', company_contact_phone: '', industry_id: '' })
  const [industries, setIndustries] = useState([])
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Pre-fill with stored user info if present in localStorage (best-effort)
    const storedName = localStorage.getItem('authUserName')
    const storedEmail = localStorage.getItem('authUserEmail')
    if (storedName) setFormData(fd => ({ ...fd, name: storedName }))
    if (storedEmail) setFormData(fd => ({ ...fd, email: storedEmail }))

    // Try to fetch profile from API to prefill fields
    api.getProfile().then(data => {
      if (data && data.user) {
        setFormData(fd => ({
          ...fd,
          name: data.user.name || fd.name,
          email: data.user.email || fd.email,
          phone: data.user.phone || fd.phone,
        }))
        if (data.company) {
          setFormData(fd => ({
            ...fd,
            company_name: data.company.name || fd.company_name,
            company_website: data.company.website || fd.company_website,
            company_contact_person: data.company.contact_person || fd.company_contact_person,
            company_contact_phone: data.company.contact_phone || fd.company_contact_phone,
            industry_id: data.company.industry_id || fd.industry_id
          }))
        }
      }
    }).catch(() => {})

    if (role === 'recruiter') {
      api.getIndustries().then(data => {
        // api.getIndustries returns the data directly
        if (Array.isArray(data)) setIndustries(data)
      }).catch(() => {})
    }
  }, [role])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
      if (role === 'recruiter') {
        payload.company_name = formData.company_name
        payload.company_website = formData.company_website
        payload.company_contact_person = formData.company_contact_person
        payload.company_contact_phone = formData.company_contact_phone
        payload.industry_id = formData.industry_id || null
      }

      const res = await api.updateProfile(payload)
      alert('Profile updated successfully')
      // Optionally store updated name/email locally
      if (res.user) {
        localStorage.setItem('authUserName', res.user.name)
        localStorage.setItem('authUserEmail', res.user.email)
      }
      navigate(role === 'recruiter' ? '/jobposting-dashboard' : '/jobseeker-dashboard')
    } catch (err) {
      console.error('Profile update failed', err)
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors)
      } else {
        alert('Failed to update profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="jobseeker-auth-container">
      <div className="auth-header">
        <h1>Edit Profile</h1>
        <p>Update your personal and company information</p>
      </div>

      <div className="auth-box">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input id="name" name="name" value={formData.name} onChange={handleChange} />
            {errors.name && <span className="error-text">{errors.name[0] || errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input id="email" name="email" value={formData.email} onChange={handleChange} />
            {errors.email && <span className="error-text">{errors.email[0] || errors.email}</span>}
          </div>

          <div className="form-group optional">
            <label htmlFor="phone" className="no-asterisk">Phone Number</label>
            <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            {errors.phone && <span className="error-text">{errors.phone[0] || errors.phone}</span>}
          </div>

          {role === 'recruiter' && (
            <>
              <div className="form-group">
                <label htmlFor="company_name">Company Name *</label>
                <input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} />
                {errors.company_name && <span className="error-text">{errors.company_name[0] || errors.company_name}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="company_website" className="no-asterisk">Company Website</label>
                <input id="company_website" name="company_website" value={formData.company_website} onChange={handleChange} />
                {errors.company_website && <span className="error-text">{errors.company_website[0] || errors.company_website}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="company_contact_person" className="no-asterisk">Company Contact Person</label>
                <input id="company_contact_person" name="company_contact_person" value={formData.company_contact_person} onChange={handleChange} />
                {errors.company_contact_person && <span className="error-text">{errors.company_contact_person[0] || errors.company_contact_person}</span>}
              </div>

              <div className="form-group optional">
                <label htmlFor="company_contact_phone" className="no-asterisk">Company Contact Phone</label>
                <input id="company_contact_phone" name="company_contact_phone" value={formData.company_contact_phone} onChange={handleChange} />
                {errors.company_contact_phone && <span className="error-text">{errors.company_contact_phone[0] || errors.company_contact_phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="industry_id">Industry *</label>
                <select id="industry_id" name="industry_id" value={formData.industry_id} onChange={handleChange}>
                  <option value="">-- Select an Industry --</option>
                  {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                {errors.industry_id && <span className="error-text">{errors.industry_id[0] || errors.industry_id}</span>}
              </div>
            </>
          )}

          <button className="submit-btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</button>
        </form>

        <div style={{marginTop: 16}}>
          <button className="back-btn" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default EditProfile
