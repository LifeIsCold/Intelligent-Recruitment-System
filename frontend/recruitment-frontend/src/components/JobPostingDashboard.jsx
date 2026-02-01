// src/components/JobPostingDashboard.jsx - Updated
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './JobPostingDashboard.css' // REMOVE: import "./LoginPage.css"
import api from '../services/api'

const JobPostingDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('postJob')
  const [postedJobs, setPostedJobs] = useState([])
  const [creatorInfo, setCreatorInfo] = useState({ companyName: 'Your Company', email: 'company@example.com',  })
  const [jobForm, setJobForm] = useState({
    jobTitle: '',
    salary: 'Negotiable',
    workHours: 'Full Time',
    workLocation: 'Remote',
    jobDescription: '',
    benefits: '',
    requiredSkills: '' // comma-separated
  })

  useEffect(() => {
    const storedJobs = localStorage.getItem('postedJobs')
    if (storedJobs) {
      setPostedJobs(JSON.parse(storedJobs))
    }
    // Fetch authenticated user's profile to show company details
    api.getProfile().then(data => {
      if (data) {
        const company = data.company || data.company_data || null
        if (company) {
          setCreatorInfo({
            companyName: company.name || creatorInfo.companyName,
            email: company.contact_email || data.user?.email || creatorInfo.email,
            companyId: company.id || null,
            industry_id: company.industry_id || null,
            userId: data.user?.id || data.id || null // Make sure this is set
          })
        } else if (data.user) {
          setCreatorInfo(prev => ({ 
            ...prev, 
            email: data.user.email || prev.email,
            userId: data.user.id || null // Make sure this is set
          }))
        }
      }
    }).catch(() => {})
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setJobForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePostJob = (e) => {
    e.preventDefault()
    
    if (jobForm.jobTitle.trim() === '' || jobForm.jobDescription.trim() === '') {
      alert('Please fill in all required fields')
      return
    }
    
    if (jobForm.jobDescription.split(' ').length > 2000) {
      alert('Job description cannot exceed 2000 words')
      return
    }
    
    // Data is now stored securely in the backend
    // User information should be retrieved from backend session/API
    // In JobPostingDashboard.jsx, inside handlePostJob function
    const newJob = {
      title: jobForm.jobTitle,
      description: jobForm.jobDescription,
      salary: jobForm.salary,
      work_time: jobForm.workHours === 'Full Time' ? 'full_time' : 'part_time',
      work_type: jobForm.workLocation.toLowerCase(),
      company_id: creatorInfo.companyId || 1,
      industry_id: creatorInfo.industry_id || null,
      created_by: creatorInfo.userId || null, // Send the user ID
      benefits: jobForm.benefits || '',
      status: 'open',
      required_skills: jobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
    }
    // Try sending to backend
    api.createJob(newJob)
      .then(created => {
        const payloadJob = created.data?.data || created.data || {}
        const jobItem = {
          id: payloadJob.id || Date.now(),
          jobTitle: jobForm.jobTitle,
          salary: jobForm.salary,
          workHours: jobForm.workHours,
          workLocation: jobForm.workLocation,
          jobDescription: jobForm.jobDescription,
          benefits: jobForm.benefits,
          requiredSkills: jobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
          postedDate: payloadJob.created_at ? new Date(payloadJob.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          status: payloadJob.status || 'Active',
          applications: payloadJob.applications ? payloadJob.applications.length || payloadJob.applications : 0
        }

        const updatedJobs = [jobItem, ...postedJobs]
        setPostedJobs(updatedJobs)
        localStorage.setItem('postedJobs', JSON.stringify(updatedJobs))

        setJobForm({
          jobTitle: '',
          salary: 'Negotiable',
          workHours: 'Full Time',
          workLocation: 'Remote',
          jobDescription: '',
          benefits: ''
        })

        alert('Job posted successfully!')
        setActiveTab('viewJobs')
      })
      .catch(err => {
        console.warn('Create job failed, saving locally:', err.message)
        const jobItem = {
          id: Date.now(),
          jobTitle: jobForm.jobTitle,
          salary: jobForm.salary,
          workHours: jobForm.workHours,
          workLocation: jobForm.workLocation,
          jobDescription: jobForm.jobDescription,
          benefits: jobForm.benefits,
          requiredSkills: jobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
          postedDate: new Date().toLocaleDateString(),
          status: 'Active',
          applications: 0
        }

        const updatedJobs = [jobItem, ...postedJobs]
        setPostedJobs(updatedJobs)
        localStorage.setItem('postedJobs', JSON.stringify(updatedJobs))

        setJobForm({
          jobTitle: '',
          salary: 'Negotiable',
          workHours: 'Full Time',
          workLocation: 'Remote',
          jobDescription: '',
          benefits: ''
        })

        alert('Job posted locally (backend may be unavailable).')
        setActiveTab('viewJobs')
      })
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    navigate('/')
  }

  const handleBack = () => {
    navigate('/')
  }
  
  const deleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        // Call API to delete from database
        await api.deleteJob(jobId);
        
        // Update local state
        const updatedJobs = postedJobs.filter(job => job.id !== jobId);
        setPostedJobs(updatedJobs);
        localStorage.setItem('postedJobs', JSON.stringify(updatedJobs));
        
        alert('Job deleted successfully from database!');
      } catch (error) {
        console.error('Failed to delete job from database:', error);
        
        // Fallback: Delete from local storage only
        const updatedJobs = postedJobs.filter(job => job.id !== jobId);
        setPostedJobs(updatedJobs);
        localStorage.setItem('postedJobs', JSON.stringify(updatedJobs));
        
        alert('Job deleted locally (backend may be unavailable).');
      }
    }
  }

  const [showApplicants, setShowApplicants] = useState(false)
  const [applicants, setApplicants] = useState([])
  const [selectedJobTitle, setSelectedJobTitle] = useState('')

  const viewApplicants = async (jobId, jobTitle) => {
    try {
      const res = await api.getRecruiterJobs()
      const jobs = res.data || res
      const job = Array.isArray(jobs) ? jobs.find(j => j.id === jobId) : (jobs.data ? jobs.data.find(j => j.id === jobId) : null)
      const apps = job?.applications || []
      setApplicants(apps)
      setSelectedJobTitle(jobTitle || (job?.title || 'Applicants'))
      setShowApplicants(true)
    } catch (err) {
      console.error('Failed to fetch applicants', err)
      alert('Failed to fetch applicants. You may need to be logged in as a recruiter.')
    }
  }

  return (
    <div className="jobposting-dashboard">
      <header className="jobposting-header">
        <div className="header-top">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>
          <div className="user-info">
            <div className="company-avatar">
              <i className="fas fa-building"></i>
            </div>
            <div className="company-details">
              <h3>{creatorInfo.companyName}</h3>
              <p>{creatorInfo.email}</p>
            </div>
            <button className="edit-profile-btn" onClick={() => navigate('/edit-profile')}>
              <i className="fas fa-user-edit"></i>
              Edit Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
        
        <div className="header-main">
          <h1>
            <i className="fas fa-briefcase"></i>
            Job Creator Dashboard
          </h1>
          <p>Post jobs and manage applications</p>
        </div>
      </header>

      <div className="jobposting-container">
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'postJob' ? 'active' : ''}`}
              onClick={() => setActiveTab('postJob')}
            >
              <i className="fas fa-plus-circle"></i>
              Post New Job
            </button>
            <button 
              className={`tab ${activeTab === 'viewJobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('viewJobs')}
            >
              <i className="fas fa-list"></i>
              View Posted Jobs ({postedJobs.length})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'postJob' && (
              <div className="post-job-container">
                <div className="form-card">
                  <div className="card-header">
                    <h2><i className="fas fa-edit"></i> Create New Job Posting</h2>
                    <p>Fill in the details below to post a new job</p>
                  </div>

                  <form onSubmit={handlePostJob}>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-heading"></i>
                          JOB TITLE *
                        </label>
                        <input
                          type="text"
                          name="jobTitle"
                          value={jobForm.jobTitle}
                          onChange={handleInputChange}
                          placeholder="e.g., Senior Frontend Developer"
                          required
                        />
                        <div className="form-hint">Enter a clear and descriptive job title</div>
                      </div>

                      <div className="form-group">
                        <label>
                          <i className="fas fa-money-bill-wave"></i>
                          SALARY
                        </label>
                        <input
                          type="text"
                          name="salary"
                          value={jobForm.salary}
                          onChange={handleInputChange}
                          placeholder="Negotiable"
                        />
                        <div className="form-hint">Leave as "Negotiable" if unspecified</div>
                      </div>

                      <div className="form-group">
                        <label>
                          <i className="fas fa-clock"></i>
                          WORK HOURS *
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="workHours"
                              value="Full Time"
                              checked={jobForm.workHours === 'Full Time'}
                              onChange={handleInputChange}
                              required
                            />
                            <span>Full Time</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="workHours"
                              value="Part Time"
                              checked={jobForm.workHours === 'Part Time'}
                              onChange={handleInputChange}
                            />
                            <span>Part Time</span>
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          <i className="fas fa-map-marker-alt"></i>
                          WORK LOCATION *
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="workLocation"
                              value="Remote"
                              checked={jobForm.workLocation === 'Remote'}
                              onChange={handleInputChange}
                              required
                            />
                            <span>Remote</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="workLocation"
                              value="Onsite"
                              checked={jobForm.workLocation === 'Onsite'}
                              onChange={handleInputChange}
                            />
                            <span>Onsite</span>
                          </label>
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-file-alt"></i>
                          JOB DESCRIPTION *
                        </label>
                        <textarea
                          name="jobDescription"
                          value={jobForm.jobDescription}
                          onChange={handleInputChange}
                          placeholder="Describe the job responsibilities, requirements, and expectations..."
                          rows="8"
                          required
                          maxLength="10000"
                        />
                        <div className="textarea-info">
                          <span>{jobForm.jobDescription.split(' ').length} / 2000 words</span>
                          <span>Max 2000 words</span>
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-gift"></i>
                          BENEFITS
                        </label>
                        <textarea
                          name="benefits"
                          value={jobForm.benefits}
                          onChange={handleInputChange}
                          placeholder="List the benefits (health insurance, flexible hours, bonuses, etc.)"
                          rows="4"
                        />
                        <div className="form-hint">Optional: Add benefits to attract more candidates</div>
                      </div>
                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-tools"></i>
                          REQUIRED SKILLS
                        </label>
                        <input
                          type="text"
                          name="requiredSkills"
                          value={jobForm.requiredSkills}
                          onChange={handleInputChange}
                          placeholder="Comma-separated skills (e.g. React, Node.js)"
                        />
                        <div className="form-hint">Enter skills separated by commas</div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" className="preview-btn" onClick={() => alert('Preview feature coming soon!')}>
                        <i className="fas fa-eye"></i>
                        Preview
                      </button>
                      <button type="submit" className="submit-btn">
                        <i className="fas fa-paper-plane"></i>
                        POST JOB
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'viewJobs' && (
              <div className="posted-jobs-container">
                <div className="jobs-header">
                  <h2><i className="fas fa-list"></i> Your Posted Jobs</h2>
                  <div className="jobs-stats">
                    <div className="stat-badge">
                      <i className="fas fa-briefcase"></i>
                      <span>Total: {postedJobs.length}</span>
                    </div>
                    <div className="stat-badge">
                      <i className="fas fa-check-circle"></i>
                      <span>Active: {postedJobs.filter(job => job.status === 'Active').length}</span>
                    </div>
                    <div className="stat-badge">
                      <i className="fas fa-users"></i>
                      <span>Applications: {postedJobs.reduce((sum, job) => sum + job.applications, 0)}</span>
                    </div>
                  </div>
                </div>

                {postedJobs.length === 0 ? (
                  <div className="no-jobs">
                    <i className="fas fa-file-alt fa-3x"></i>
                    <h3>No Jobs Posted Yet</h3>
                    <p>Create your first job posting to get started</p>
                    <button className="primary-btn" onClick={() => setActiveTab('postJob')}>
                      <i className="fas fa-plus"></i>
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="jobs-grid">
                    {postedJobs.map(job => (
                      <div key={job.id} className="posted-job-card">
                        <div className="job-card-header">
                          <div className="job-title-section">
                            <h3>{job.jobTitle}</h3>
                            <span className={`job-status ${job.status.toLowerCase()}`}>
                              {job.status}
                            </span>
                          </div>
                          <div className="job-meta">
                            <span className="meta-item">
                              <i className="fas fa-calendar"></i>
                              Posted: {job.postedDate}
                            </span>
                          </div>
                        </div>
                        
                        <div className="job-card-body">
                          <div className="job-details">
                            <div className="detail-row">
                              <i className="fas fa-money-bill-wave"></i>
                              <strong>Salary:</strong> {job.salary}
                            </div>
                            <div className="detail-row">
                              <i className="fas fa-clock"></i>
                              <strong>Work Hours:</strong> {job.workHours}
                            </div>
                            <div className="detail-row">
                              <i className="fas fa-map-marker-alt"></i>
                              <strong>Location:</strong> {job.workLocation}
                            </div>
                            <div className="detail-row">
                              <i className="fas fa-users"></i>
                              <strong>Applications:</strong> {job.applications}
                            </div>
                          </div>
                          
                          <div className="job-description">
                            <h4>Description:</h4>
                            <p>{job.jobDescription.substring(0, 150)}...</p>
                          </div>
                          
                          {job.benefits && (
                            <div className="job-benefits">
                              <h4>Benefits:</h4>
                              <p>{job.benefits.substring(0, 100)}...</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="job-card-footer">
                          <button className="action-btn view-btn" onClick={() => viewApplicants(job.id, job.jobTitle)}>
                            <i className="fas fa-eye"></i>
                            View
                          </button>
                          <button className="action-btn edit-btn" onClick={() => alert('Edit feature coming soon!')}>
                            <i className="fas fa-edit"></i>
                            Edit
                          </button>
                          <button className="action-btn delete-btn" onClick={() => deleteJob(job.id)}>
                            <i className="fas fa-trash"></i>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showApplicants && (
        <div className="applicants-modal">
          <div className="modal-backdrop" onClick={() => setShowApplicants(false)} />
          <div className="modal-content">
            <h3>Applicants for: {selectedJobTitle}</h3>
            <button className="close-modal" onClick={() => setShowApplicants(false)}>Close</button>
            {applicants.length === 0 ? (
              <p>No applicants yet.</p>
            ) : (
              <ul className="applicants-list">
                {applicants.map(app => (
                  <li key={app.id} className="applicant-item">
                    <strong>Application ID:</strong> {app.id} <br />
                    <strong>Match Score:</strong> {app.match_score ?? 'N/A'}<br />
                    <strong>CV ID:</strong> {app.cv ? app.cv.id : 'N/A'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobPostingDashboard