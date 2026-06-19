// src/components/JobSeekerDashboard.jsx
import React, { useState, useEffect } from 'react'
import CVUpload from './CVUpload'
import AvailableJobs from './AvailableJobs'
import MatchJobs from './MatchJobs'
import ApplyForJob from './ApplyForJob'
import SavedJobs from './SavedJobs'
import ProfilePictureUpload from './ProfilePictureUpload'
import './JobSeeker.css'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const JobSeekerDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('uploadCV')
  const [uploadedCVs, setUploadedCVs] = useState([])
  const [selectedJobForMatching, setSelectedJobForMatching] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [myApplications, setMyApplications] = useState([])
  const [stats, setStats] = useState({
    cvs: 0,
    applications: 0,
    savedJobs: 0
  })
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const role = localStorage.getItem('authRole')
    const storedProfilePicture = localStorage.getItem('userProfilePicture')
    
    // Set stored profile picture if exists
    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture)
    }
    
    if (!token) {
      navigate('/jobseeker-login', { replace: true })
      return
    }
    
    if (role === 'recruiter') {
      navigate('/jobposting-dashboard', { replace: true })
      return
    }
    
    if (['seeker', 'job_seeker'].includes(role)) {
      fetchDashboardData()
    } else {
      localStorage.clear()
      navigate('/jobseeker-login', { replace: true })
    }
  }, [navigate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchUserProfile(),
        fetchUserCVs(),
        fetchMyApplications(),
        fetchSavedJobs()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await api.getProfile()
      if (response.success) {
        setUser(response.data)
        
        // Store profile picture in state and localStorage
        if (response.data.profile_picture_url) {
          setProfilePicture(response.data.profile_picture_url)
          localStorage.setItem('userProfilePicture', response.data.profile_picture_url)
        } else {
          // If no profile picture from API, keep the stored one or clear
          const storedPicture = localStorage.getItem('userProfilePicture')
          if (storedPicture) {
            setProfilePicture(storedPicture)
          }
        }
        
        localStorage.setItem('authUserName', response.data.name || '')
        localStorage.setItem('authUserEmail', response.data.email || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserCVs = async () => {
    try {
      const response = await api.getCVs()
      if (response.success) {
        const cvs = response.data || []
        setUploadedCVs(cvs)
        setStats(prev => ({ ...prev, cvs: cvs.length }))
      }
    } catch (error) {
      console.error('Error fetching CVs:', error)
    }
  }

  const fetchMyApplications = async () => {
    try {
      const response = await api.getMyApplications()
      if (response.success) {
        const apps = response.data || []
        setMyApplications(apps)
        setStats(prev => ({ ...prev, applications: apps.length }))
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchSavedJobs = async () => {
    try {
      const response = await api.getSavedJobs()
      if (response.success) {
        const saved = response.data || []
        setStats(prev => ({ ...prev, savedJobs: saved.length }))
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
    }
  }

  const handleCVUpload = async (cvData) => {
    await fetchUserCVs()
    return { success: true, message: 'CV uploaded successfully!', data: cvData }
  }

  const handleJobSelectForMatching = (job) => {
    setSelectedJobForMatching(job)
    setActiveTab('matchJob')
  }

  const handleJobApply = (jobId) => {
    setSelectedJobId(jobId)
    setIsApplying(true)
  }

  const handleApplicationSuccess = () => {
    setIsApplying(false)
    setSelectedJobId(null)
    fetchMyApplications()
  }

  const handleSetDefaultCV = async (cvId) => {
    try {
      const response = await api.setDefaultCV(cvId)
      if (response.success) {
        await fetchUserCVs()
      }
    } catch (error) {
      console.error('Error setting default CV:', error)
    }
  }

  const handleDeleteCV = async (cvId) => {
    if (window.confirm('Are you sure you want to delete this CV?')) {
      try {
        const response = await api.deleteCV(cvId)
        if (response.success) {
          await fetchUserCVs()
        }
      } catch (error) {
        console.error('Error deleting CV:', error)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.clear()
      navigate('/')
    }
  }

  const handleEditProfile = () => {
    navigate('/edit-profile')
  }

  // Accept offer handler
  const handleAcceptOffer = async (applicationId) => {
    if (!window.confirm('Are you sure you want to accept this offer?')) return
    try {
      await api.acceptOffer(applicationId)
      await fetchMyApplications()
    } catch (error) {
      alert('Failed to accept offer. Please try again.')
    }
  }

  // Decline offer handler
  const handleDeclineOffer = async (applicationId) => {
    if (!window.confirm('Are you sure you want to decline this offer?')) return
    try {
      await api.declineOffer(applicationId)
      await fetchMyApplications()
    } catch (error) {
      alert('Failed to decline offer. Please try again.')
    }
  }

  // Delete application handler
  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) return
    
    setDeleting(true)
    try {
      const response = await api.deleteApplication(applicationId)
      if (response.success) {
        alert('Application deleted successfully')
        await fetchMyApplications() // Refresh the list
      } else {
        alert(response.message || 'Failed to delete application')
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      alert(error.response?.data?.message || 'Failed to delete application')
    } finally {
      setDeleting(false)
    }
  }

  // Check if application can be deleted
  const canDelete = (status) => {
    // Allow deletion for pending, reviewed, and withdrawn applications
    return status === 'pending' || status === 'reviewed' || status === 'withdrawn'
  }

  const handleJobSave = () => {
    fetchSavedJobs()
  }

  const handleProfilePictureUpdate = (data) => {
    if (data && data.profile_picture) {
      setProfilePicture(data.profile_picture)
      localStorage.setItem('userProfilePicture', data.profile_picture)
    } else {
      setProfilePicture(null)
      localStorage.removeItem('userProfilePicture')
    }
    // Refresh user data to get updated profile
    fetchUserProfile()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="jobseeker-container">
      {/* Dashboard Header */}
      <header className="jobseeker-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
          
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'J'}
            </div>
            <div className="user-details">
              <h3>{user?.name || 'Job Seeker'}</h3>
              <p>Job Seeker Dashboard</p>
            </div>
            <button className="edit-profile-btn" onClick={handleEditProfile}>
              <i className="fas fa-user-edit"></i> Edit Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <div className="header-main">
          <h1>
            <i className="fas fa-user-tie"></i> Job Seeker Portal
          </h1>
          <p>Find jobs, upload your CV, and get matched with opportunities</p>
        </div>
      </header>

      {/* Main Container */}
      <div className="jobseeker-main-container">
        <div className="tabs-container">
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'uploadCV' ? 'active' : ''}`}
              onClick={() => setActiveTab('uploadCV')}
            >
              <i className="fas fa-upload"></i> Upload CV
              {stats.cvs > 0 && (
                <span className="tab-badge">{stats.cvs}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'availableJobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('availableJobs')}
            >
              <i className="fas fa-briefcase"></i> Available Jobs
            </button>
            <button 
              className={`tab ${activeTab === 'matchJob' ? 'active' : ''}`}
              onClick={() => setActiveTab('matchJob')}
              disabled={uploadedCVs.length === 0}
            >
              <i className="fas fa-chart-line"></i> Match Job
              {uploadedCVs.length === 0 && (
                <span className="tab-hint">(Upload CV first)</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'savedJobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('savedJobs')}
            >
              <i className="fas fa-bookmark"></i> Saved Jobs
              {stats.savedJobs > 0 && (
                <span className="tab-badge">{stats.savedJobs}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'myApplications' ? 'active' : ''}`}
              onClick={() => setActiveTab('myApplications')}
            >
              <i className="fas fa-file-alt"></i> My Applications
              {stats.applications > 0 && (
                <span className="tab-badge">{stats.applications}</span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'uploadCV' && (
              <CVUpload 
                onUpload={handleCVUpload}
                uploadedCVs={uploadedCVs}
                onSetDefault={handleSetDefaultCV}
                onDelete={handleDeleteCV}
              />
            )}
            
            {activeTab === 'availableJobs' && (
              <AvailableJobs 
                onJobSelect={handleJobSelectForMatching}
                onJobApply={handleJobApply}
                uploadedCVs={uploadedCVs}
                onJobSave={handleJobSave}
              />
            )}
            
            {activeTab === 'matchJob' && (
              <MatchJobs 
                uploadedCVs={uploadedCVs}
                selectedJob={selectedJobForMatching}
                onJobApply={handleJobApply}
              />
            )}
            
            {activeTab === 'savedJobs' && (
              <SavedJobs 
                onJobApply={handleJobApply}
                onJobSelect={handleJobSelectForMatching}
              />
            )}
            
            {activeTab === 'myApplications' && (
              <div className="applications-tab">
                <h2><i className="fas fa-file-alt"></i> My Applications</h2>

                {/* Pending Offers Section */}
                {myApplications.filter(app => app.status === 'offer_extended').length > 0 && (
                  <div className="pending-offers-section">
                    <h3><i className="fas fa-gift"></i> Pending Job Offers</h3>
                    {myApplications
                      .filter(app => app.status === 'offer_extended')
                      .map(app => (
                        <div key={app.id} className="offer-card">
                          <h4>{app.job?.title} at {app.job?.company?.name}</h4>
                          <p><strong>Start Date:</strong> {app.start_date || 'Not specified'}</p>
                          <p><strong>Workplace:</strong> {app.workplace_address || 'Not specified'}</p>
                          <div className="offer-actions">
                            <button 
                              className="accept-btn"
                              onClick={() => handleAcceptOffer(app.id)}
                            >
                              <i className="fas fa-check"></i> Accept
                            </button>
                            <button 
                              className="decline-btn"
                              onClick={() => handleDeclineOffer(app.id)}
                            >
                              <i className="fas fa-times"></i> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* All Applications */}
                {myApplications.filter(app => app.status !== 'offer_extended').length === 0 ? (
                  <div className="no-applications">
                    <i className="fas fa-file-alt"></i>
                    <h3>No applications found</h3>
                    <p>Apply to jobs from the Available Jobs tab</p>
                  </div>
                ) : (
                  <div className="applications-list">
                    {myApplications
                      .filter(app => app.status !== 'offer_extended')
                      .map((app) => (
                        <div key={app.id} className="application-card">
                          <div className="application-header">
                            <h4>{app.job?.title || 'Unknown Job'}</h4>
                            <span className={`status-badge ${app.status || 'pending'}`}>
                              {app.status === 'offer_extended' ? 'Offer Pending' : 
                               app.status === 'withdrawn' ? 'Withdrawn' : 
                               app.status}
                            </span>
                          </div>
                          <div className="application-details">
                            <p><strong>Company:</strong> {app.job?.company?.name || 'Unknown Company'}</p>
                            <p><strong>Applied:</strong> {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Match Score:</strong> {app.match_score || 0}%</p>
                          </div>
                          <div className="application-actions">
                            <button 
                              className="view-details-btn"
                              onClick={() => {
                                setSelectedApplication(app)
                                setShowApplicationModal(true)
                              }}
                            >
                              <i className="fas fa-eye"></i> View Details
                            </button>
                            {canDelete(app.status) && (
                              <button 
                                className="delete-btn"
                                onClick={() => handleDeleteApplication(app.id)}
                                disabled={deleting}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Stats Sidebar */}
        <div className="user-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3><i className="fas fa-user-circle"></i> Your Profile</h3>
            </div>
            <div className="user-profile-summary">
              {/* Profile Picture Upload Component */}
              <ProfilePictureUpload 
                currentPicture={profilePicture || user?.profile_picture_url}
                userName={user?.name || 'Job Seeker'}
                onUpdate={handleProfilePictureUpdate}
              />
              <h4>{user?.name || 'Job Seeker'}</h4>
              <p className="user-email">{user?.email || 'user@example.com'}</p>
              {user?.phone && (
                <p className="user-phone">
                  <i className="fas fa-phone"></i> {user.phone}
                </p>
              )}
            </div>
            
            <div className="sidebar-stats">
              <div className="stat-item">
                <div className="stat-value">{stats.cvs}</div>
                <div className="stat-label">CVs Uploaded</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.applications}</div>
                <div className="stat-label">Applications</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.savedJobs}</div>
                <div className="stat-label">Saved Jobs</div>
              </div>
            </div>

            <div className="sidebar-actions">
              <button 
                className="sidebar-btn primary"
                onClick={handleEditProfile}
              >
                <i className="fas fa-user-edit"></i> Update Profile
              </button>
              <button 
                className="sidebar-btn secondary"
                onClick={() => setActiveTab('uploadCV')}
              >
                <i className="fas fa-upload"></i> Upload CV
              </button>
              <button 
                className="sidebar-btn danger"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="sidebar-card tips-card">
            <div className="sidebar-header">
              <h3><i className="fas fa-lightbulb"></i> Quick Tips</h3>
            </div>
            <ul className="tips-list">
              <li>
                <i className="fas fa-check-circle"></i>
                <span>Upload your most recent CV for better matching</span>
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                <span>Include all your skills in your CV</span>
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                <span>Update your profile regularly</span>
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                <span>Apply to jobs with high match scores</span>
              </li>
            </ul>
          </div>

          {/* Recent Applications Card */}
          {myApplications.length > 0 && (
            <div className="sidebar-card applications-card">
              <div className="sidebar-header">
                <h3><i className="fas fa-history"></i> Recent Applications</h3>
              </div>
              <div className="recent-applications">
                {myApplications.slice(0, 3).map((app) => (
                  <div key={app.id} className="recent-application">
                    <div className="recent-job">
                      <strong>{app.job?.title || 'Unknown Job'}</strong>
                      <span>{app.job?.company?.name || 'Unknown Company'}</span>
                    </div>
                    <div className={`recent-status ${app.status || 'pending'}`}>
                      {app.status || 'pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {isApplying && (
        <div className="modal-overlay" onClick={() => setIsApplying(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <ApplyForJob 
              key={`apply-${selectedJobId}-${uploadedCVs.length}`}
              jobId={selectedJobId}
              initialCVs={uploadedCVs}
              onSuccess={handleApplicationSuccess}
              onCancel={() => setIsApplying(false)}
              onCVsUpdated={fetchUserCVs}
            />
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-file-alt"></i> Application Details</h3>
              <button className="close-btn" onClick={() => setShowApplicationModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="application-detail-card">
                <div className="detail-section">
                  <h4><i className="fas fa-briefcase"></i> Job Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Job Title:</strong> {selectedApplication.job?.title || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Company:</strong> {selectedApplication.job?.company?.name || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Location:</strong> {selectedApplication.job?.work_type || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Salary:</strong> {selectedApplication.job?.salary || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4><i className="fas fa-info-circle"></i> Application Status</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Status:</strong> 
                      <span className={`status-badge ${selectedApplication.status || 'pending'}`}>
                        {selectedApplication.status === 'offer_extended' ? 'Offer Pending' : 
                         selectedApplication.status === 'withdrawn' ? 'Withdrawn' :
                         selectedApplication.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Applied On:</strong> {selectedApplication.applied_at ? new Date(selectedApplication.applied_at).toLocaleString() : 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Match Score:</strong> 
                      <span className="score-badge" style={{
                        backgroundColor: selectedApplication.match_score >= 80 ? '#28a745' : 
                                      selectedApplication.match_score >= 60 ? '#ffc107' : '#dc3545'
                      }}>
                        {selectedApplication.match_score || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4><i className="fas fa-file"></i> CV Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>CV Used:</strong> {selectedApplication.cv?.name || selectedApplication.cv?.title || 'Unknown CV'}
                    </div>
                    {selectedApplication.cv?.file_type && (
                      <div className="detail-item">
                        <strong>File Type:</strong> {selectedApplication.cv.file_type}
                      </div>
                    )}
                    {selectedApplication.cv?.parsed_at && (
                      <div className="detail-item">
                        <strong>Parsed On:</strong> {new Date(selectedApplication.cv.parsed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {selectedApplication.job?.description && (
                  <div className="detail-section">
                    <h4><i className="fas fa-align-left"></i> Job Description</h4>
                    <div className="description-text">
                      {selectedApplication.job.description}
                    </div>
                  </div>
                )}

                {selectedApplication.job?.required_skills?.length > 0 && (
                  <div className="detail-section">
                    <h4><i className="fas fa-code"></i> Required Skills</h4>
                    <div className="skills-container">
                      {selectedApplication.job.required_skills.map((skill, index) => (
                        <span key={index} className="skill-badge">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApplicationModal(false)}>
                Close
              </button>
              {canDelete(selectedApplication.status) && (
                <button 
                  className="btn-danger"
                  onClick={() => {
                    handleDeleteApplication(selectedApplication.id)
                    setShowApplicationModal(false)
                  }}
                  disabled={deleting}
                >
                  <i className="fas fa-trash"></i> Delete Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="jobseeker-footer">
        <p>
          <i className="fas fa-info-circle"></i> Need help? Contact support@example.com
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} Intelligent Recruitment Platform
        </p>
      </footer>
    </div>
  )
}

export default JobSeekerDashboard