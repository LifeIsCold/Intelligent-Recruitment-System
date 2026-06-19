// src/components/SavedJobs.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './SavedJobs.css'

const SavedJobs = ({ onJobApply, onJobSelect }) => {
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchSavedJobs()
  }, [currentPage])

  const fetchSavedJobs = async () => {
    try {
      setLoading(true)
      setError('')
      setDebugInfo(null)
      
      console.log('📡 Fetching saved jobs...')
      const response = await api.getSavedJobs()
      console.log('📦 Saved jobs response:', response)
      
      if (response && response.success) {
        // Handle different response structures
        const jobsData = response.data || []
        setSavedJobs(jobsData)
        setTotalPages(response.meta?.last_page || Math.ceil(jobsData.length / 20) || 1)
      } else {
        setError(response?.message || 'Failed to load saved jobs')
        setDebugInfo({ response })
      }
    } catch (err) {
      console.error('❌ Error fetching saved jobs:', err)
      
      // Extract detailed error information
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      }
      
      console.error('Error details:', errorDetails)
      setDebugInfo(errorDetails)
      
      // Set user-friendly error message
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view saved jobs.')
      } else if (err.response?.status === 404) {
        setError('Saved jobs endpoint not found. Please check your API configuration.')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to load saved jobs. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (jobId) => {
    if (!window.confirm('Remove this job from your saved list?')) return
    
    try {
      setLoading(true)
      const response = await api.unsaveJob(jobId)
      if (response.success) {
        // Remove from local state
        setSavedJobs(prev => prev.filter(job => job.id !== jobId))
        alert('Job removed from saved list')
      } else {
        alert(response.message || 'Failed to remove job')
      }
    } catch (err) {
      console.error('Error unsaving job:', err)
      alert(err.response?.data?.message || 'Failed to remove job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (job) => {
    setSelectedJob(job)
    setShowModal(true)
  }

  const handleApply = (jobId) => {
    if (onJobApply) {
      onJobApply(jobId)
    }
  }

  const handleMatch = (job) => {
    if (onJobSelect) {
      onJobSelect(job)
    }
  }

  // Get work type icon
  const getWorkTypeIcon = (workType) => {
    switch(workType?.toLowerCase()) {
      case 'remote': return 'fas fa-home'
      case 'onsite': return 'fas fa-building'
      default: return 'fas fa-briefcase'
    }
  }

  // Get work type label
  const getWorkTypeLabel = (workType) => {
    switch(workType?.toLowerCase()) {
      case 'remote': return 'Remote'
      case 'onsite': return 'On-site'
      default: return 'Office'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  // Check if job is expired
  const isJobExpired = (job) => {
    return job.closes_at && new Date(job.closes_at) < new Date()
  }

  if (loading && savedJobs.length === 0) {
    return (
      <div className="saved-jobs-container">
        <div className="saved-jobs-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Saved Jobs</h3>
          <p>Please wait...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="saved-jobs-container">
        <div className="saved-jobs-error">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h3>Unable to Load Saved Jobs</h3>
          <p>{error}</p>
          
          {/* Debug Information - Only show in development */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="debug-info" style={{
              marginTop: '20px',
              padding: '15px',
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '6px',
              textAlign: 'left',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>Debug Information:</h4>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <button onClick={fetchSavedJobs} className="retry-button">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="saved-jobs-container">
      <div className="saved-jobs-header">
        <h2>
          <i className="fas fa-bookmark"></i> Saved Jobs
        </h2>
        <p className="saved-jobs-subtitle">
          {savedJobs.length === 0 
            ? "You haven't saved any jobs yet" 
            : `You have ${savedJobs.length} saved job${savedJobs.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="no-saved-jobs">
          <div className="no-saved-icon">
            <i className="fas fa-bookmark"></i>
          </div>
          <h3>No Saved Jobs</h3>
          <p>Browse available jobs and click the bookmark icon to save them for later</p>
          <button 
            className="browse-jobs-btn"
            onClick={() => {
              // Trigger tab change in parent
              const event = new CustomEvent('changeTab', { detail: { tab: 'availableJobs' } })
              window.dispatchEvent(event)
            }}
          >
            <i className="fas fa-briefcase"></i> Browse Jobs
          </button>
        </div>
      ) : (
        <>
          <div className="saved-jobs-grid">
            {savedJobs.map(job => (
              <div key={job.id} className="saved-job-card">
                <div className="saved-job-card-header">
                  <div className="job-title-section">
                    <h3 title={job.title}>{job.title}</h3>
                    <span className={`job-status-badge ${job.work_type?.toLowerCase()}`}>
                      <i className={getWorkTypeIcon(job.work_type)}></i>
                      {getWorkTypeLabel(job.work_type)}
                    </span>
                  </div>
                  <div className="company-name">
                    <i className="fas fa-building"></i>
                    <span>{job.company_name || job.company?.name || 'Unknown Company'}</span>
                  </div>
                  <button 
                    className="unsave-btn"
                    onClick={() => handleUnsave(job.id)}
                    title="Remove from saved"
                    disabled={loading}
                  >
                    <i className="fas fa-bookmark"></i>
                  </button>
                </div>

                <div className="saved-job-card-body">
                  <div className="job-details-grid">
                    <div className="detail-item" title="Salary">
                      <i className="fas fa-money-bill-wave"></i>
                      <span>{job.salary || 'Not specified'}</span>
                    </div>
                    <div className="detail-item" title="Job Type">
                      <i className="fas fa-clock"></i>
                      <span>{job.work_time?.replace('_', ' ') || 'Full Time'}</span>
                    </div>
                    <div className="detail-item" title="Saved On">
                      <i className="fas fa-bookmark"></i>
                      <span>Saved: {formatDate(job.saved_at)}</span>
                    </div>
                    {job.closes_at && (
                      <div className="detail-item" title="Application Deadline">
                        <i className="fas fa-hourglass-end"></i>
                        <span>
                          Closes: {formatDate(job.closes_at)}
                          {isJobExpired(job) && <span className="expired-badge"> (Expired)</span>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="job-description-section">
                    <h4>Description</h4>
                    <p title={job.description}>
                      {job.description?.length > 150 
                        ? `${job.description.substring(0, 150)}...` 
                        : job.description || 'No description available'}
                    </p>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="job-skills-section">
                      <h4>Required Skills</h4>
                      <div className="skills-list">
                        {job.required_skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="skill-badge" title={skill}>
                            {skill}
                          </span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span className="skill-badge more" title={`${job.required_skills.length - 5} more skills`}>
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="job-meta-footer">
                    <div className="industry-tag" title="Industry">
                      <i className="fas fa-tag"></i>
                      <span>{job.industry_name || job.industry?.name || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="saved-job-card-footer">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(job)}
                  >
                    <i className="fas fa-eye"></i> View Details
                  </button>
                  <button 
                    className="action-btn match-btn"
                    onClick={() => handleMatch(job)}
                    title="Match this job with your CV"
                  >
                    <i className="fas fa-chart-line"></i> Match
                  </button>
                  <button 
                    className="action-btn apply-btn"
                    onClick={() => handleApply(job.id)}
                    disabled={isJobExpired(job)}
                    title={isJobExpired(job) ? "This job has expired" : "Apply for this job"}
                  >
                    <i className="fas fa-paper-plane"></i> Apply
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button prev"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button 
                className="pagination-button next"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Job Detail Modal */}
      {showModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Company:</strong> {selectedJob.company_name || selectedJob.company?.name}</p>
              <p><strong>Industry:</strong> {selectedJob.industry_name || selectedJob.industry?.name}</p>
              <p><strong>Salary:</strong> {selectedJob.salary || 'Not specified'}</p>
              <p><strong>Work Type:</strong> {selectedJob.work_type}</p>
              <p><strong>Work Schedule:</strong> {selectedJob.work_time?.replace('_', ' ') || 'Full Time'}</p>
              <p><strong>Saved On:</strong> {formatDate(selectedJob.saved_at)}</p>
              {selectedJob.closes_at && (
                <p><strong>Deadline:</strong> {formatDate(selectedJob.closes_at)}</p>
              )}
              
              <h4>Description</h4>
              <p>{selectedJob.description || 'No description available'}</p>
              
              {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                <>
                  <h4>Required Skills</h4>
                  <div className="skills-list">
                    {selectedJob.required_skills.map((skill, index) => (
                      <span key={index} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button 
                className="modal-btn apply" 
                onClick={() => {
                  handleApply(selectedJob.id)
                  setShowModal(false)
                }}
                disabled={isJobExpired(selectedJob)}
              >
                Apply Now
              </button>
              <button 
                className="modal-btn unsave"
                onClick={() => {
                  handleUnsave(selectedJob.id)
                  setShowModal(false)
                }}
              >
                <i className="fas fa-bookmark"></i> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedJobs