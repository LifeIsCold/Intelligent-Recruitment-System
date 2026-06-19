// src/components/AvailableJobs.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/api'
import '../App.css'
import './AvailableJobs.css'

const AvailableJobs = ({ onJobSelect, onJobApply, uploadedCVs, onJobSave }) => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('All')
  const [industries, setIndustries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const [savingJobs, setSavingJobs] = useState(new Set())
  const hasCVs = uploadedCVs && uploadedCVs.length > 0;

  // Fetch jobs and industries on component mount
  useEffect(() => {
    fetchJobsAndIndustries()
    fetchSavedStatus()
  }, [currentPage, sortBy])

  const fetchJobsAndIndustries = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch jobs
      const jobsResponse = await api.getJobs();
      console.log('Jobs API response:', jobsResponse);
      
      // Fetch industries
      const industriesResponse = await api.getIndustries();
      console.log('Industries API response:', industriesResponse);
      
      let jobsData = [];
      let industriesData = [];
      
      // Handle jobs response format
      if (jobsResponse && jobsResponse.success && Array.isArray(jobsResponse.data)) {
        jobsData = jobsResponse.data;
      } else if (Array.isArray(jobsResponse)) {
        jobsData = jobsResponse;
      } else if (jobsResponse && jobsResponse.data && Array.isArray(jobsResponse.data)) {
        jobsData = jobsResponse.data;
      }
      
      // Handle industries response format
      if (industriesResponse && industriesResponse.success && Array.isArray(industriesResponse.data)) {
        industriesData = industriesResponse.data;
      } else if (Array.isArray(industriesResponse)) {
        industriesData = industriesResponse;
      } else if (industriesResponse && Array.isArray(industriesResponse)) {
        industriesData = industriesResponse;
      }
      
      // Map jobs to consistent format - INCLUDING closes_at
      const mappedJobs = jobsData.map(job => ({
        id: job.id,
        title: job.title || 'Untitled Position',
        company: job.company?.name || job.company_name || 'Unknown Company',
        location: job.location || 'Remote',
        industry: job.industry?.name || job.industry_name || 'General',
        description: job.description || '',
        skills: job.required_skills || [],
        salary: job.salary || 'Negotiable',
        postedDate: job.created_at 
        ? new Date(job.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Recently',
        work_type: job.work_type || 'remote',
        applications_count: job.applications_count || 0,
        employment_type: job.work_time || 'full_time',
        closes_at: job.closes_at
      }));
      
      setJobs(mappedJobs);
      setFilteredJobs(mappedJobs);
      setIndustries(industriesData);
      
      // Calculate total pages (assuming 10 jobs per page)
      setTotalPages(Math.ceil(mappedJobs.length / 10));
      
    } catch (err) {
      console.error('Error fetching jobs or industries:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const fetchSavedStatus = async () => {
    try {
      const response = await api.getSavedJobs()
      if (response.success) {
        const ids = new Set(response.data.map(job => job.id))
        setSavedJobIds(ids)
      }
    } catch (error) {
      console.error('Error fetching saved status:', error)
    }
  }

  const handleSaveJob = async (jobId) => {
    setSavingJobs(prev => new Set(prev).add(jobId))
    try {
      const response = await api.saveJob(jobId)
      if (response.success) {
        setSavedJobIds(prev => new Set(prev).add(jobId))
        if (onJobSave) onJobSave()
      } else {
        alert(response.message || 'Failed to save job')
      }
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Failed to save job. Please try again.')
    } finally {
      setSavingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleUnsaveJob = async (jobId) => {
    setSavingJobs(prev => new Set(prev).add(jobId))
    try {
      const response = await api.unsaveJob(jobId)
      if (response.success) {
        setSavedJobIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        if (onJobSave) onJobSave()
      } else {
        alert(response.message || 'Failed to remove job')
      }
    } catch (error) {
      console.error('Error unsaving job:', error)
      alert('Failed to remove job. Please try again.')
    } finally {
      setSavingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleViewDetails = (job) => {
    setSelectedJob(job)
    setShowModal(true)
  }

  // Helper function to extract salary number from string
  const extractSalaryNumber = (salaryString) => {
    if (!salaryString) return 0
    const matches = salaryString.match(/\d+/g)
    if (matches && matches.length > 0) {
      return parseInt(matches[0])
    }
    return 0
  }

  // Sort jobs based on sortBy value
  const sortJobs = (jobsList) => {
    if (!jobsList) return [];
    
    const sorted = [...jobsList];
    
    switch(sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
      case 'salary-high':
        return sorted.sort((a, b) => extractSalaryNumber(b.salary) - extractSalaryNumber(a.salary));
      case 'salary-low':
        return sorted.sort((a, b) => extractSalaryNumber(a.salary) - extractSalaryNumber(b.salary));
      default:
        return sorted;
    }
  };

  // Update filtered jobs when search, filter, or sort changes
  useEffect(() => {
    if (jobs.length > 0) {
      let result = jobs;
      
      // Filter by search term
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(job =>
          (job.title && job.title.toLowerCase().includes(searchLower)) ||
          (job.company && job.company.toLowerCase().includes(searchLower)) ||
          (job.description && job.description.toLowerCase().includes(searchLower)) ||
          (job.skills && job.skills.some(skill => skill && skill.toLowerCase().includes(searchLower)))
        );
      }
      
      // Filter by industry
      if (selectedIndustry !== 'All') {
        result = result.filter(job => job.industry === selectedIndustry);
      }
      
      // Apply sorting
      const sortedResult = sortJobs(result);
      setFilteredJobs(sortedResult);
      setTotalPages(Math.ceil(sortedResult.length / 10));
      setCurrentPage(1);
    }
  }, [searchTerm, selectedIndustry, jobs, sortBy]);

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedIndustry('All')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Trigger search
    }
  }

  // Get industry statistics
  const getIndustryStats = () => {
    const stats = {}
    industries.forEach(industry => {
      stats[industry.name] = jobs.filter(job => job.industry === industry.name).length
    })
    return stats
  }

  const industryStats = getIndustryStats()

  // Get work type icon
  const getWorkTypeIcon = (workType) => {
    switch(workType?.toLowerCase()) {
      case 'remote': return 'fas fa-home'
      case 'hybrid': return 'fas fa-blender-phone'
      case 'onsite':
      case 'on_site': return 'fas fa-building'
      default: return 'fas fa-briefcase'
    }
  }

  // Get work type label
  const getWorkTypeLabel = (workType) => {
    switch(workType?.toLowerCase()) {
      case 'remote': return 'Remote'
      case 'hybrid': return 'Hybrid'
      case 'onsite':
      case 'on_site': return 'On-site'
      default: return 'Office'
    }
  }

  // Get current page jobs
  const getCurrentPageJobs = () => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredJobs.slice(startIndex, endIndex);
  }

  // Check if job is expired
  const isJobExpired = (job) => {
    return job.closes_at && new Date(job.closes_at) < new Date();
  }

  // Loading state
  if (loading) {
    return (
      <div className="available-jobs-container">
        <div className="jobs-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Available Jobs</h3>
          <p>Fetching the latest job opportunities...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="available-jobs-container">
        <div className="jobs-error">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h3>Unable to Load Jobs</h3>
          <p>{error}</p>
          <button onClick={fetchJobsAndIndustries} className="retry-button">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="available-jobs-container">
      {/* Header */}
      <div className="jobs-header">
        <h1><i className="fas fa-briefcase"></i> Available Jobs</h1>
        <p className="jobs-subtitle">Browse and apply for opportunities that match your skills</p>
      </div>

      {/* Stats Summary */}
      <div className="jobs-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-briefcase"></i>
          </div>
          <div className="summary-content">
            <h3>{jobs.length}</h3>
            <p>Total Jobs</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-industry"></i>
          </div>
          <div className="summary-content">
            <h3>{new Set(jobs.map(j => j.industry)).size}</h3>
            <p>Industries</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="summary-content">
            <h3>{new Set(jobs.map(j => j.company)).size}</h3>
            <p>Companies</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="jobs-filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <button className="search-button" onClick={() => {}}>
            Search
          </button>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">
              <i className="fas fa-filter"></i> Industry:
            </label>
            <select
              className="industry-select"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              <option value="All">All Industries</option>
              {industries.map(industry => (
                <option key={industry.id} value={industry.name}>
                  {industry.name} ({industryStats[industry.name] || 0})
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedIndustry !== 'All') && (
            <button className="clear-filters-button" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear Filters
            </button>
          )}
        </div>

        {/* Industry Quick Filters */}
        <div className="industry-quick-filters">
          <span className="quick-filter-label">Quick Filters:</span>
          <button
            className={`quick-filter ${selectedIndustry === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedIndustry('All')}
          >
            All
          </button>
          {industries.slice(0, 6).map(industry => (
            industryStats[industry.name] > 0 && (
              <button
                key={industry.id}
                className={`quick-filter ${selectedIndustry === industry.name ? 'active' : ''}`}
                onClick={() => setSelectedIndustry(industry.name)}
              >
                {industry.name} <span className="filter-count">{industryStats[industry.name]}</span>
              </button>
            )
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || selectedIndustry !== 'All') && (
        <div className="active-filters">
          <span className="filters-label">Active Filters:</span>
          {searchTerm && (
            <span className="filter-tag">
              Search: "{searchTerm}" <button onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>
            </span>
          )}
          {selectedIndustry !== 'All' && (
            <span className="filter-tag">
              Industry: {selectedIndustry} <button onClick={() => setSelectedIndustry('All')}><i className="fas fa-times"></i></button>
            </span>
          )}
          <span className="filtered-count">{filteredJobs.length} of {jobs.length} jobs</span>
        </div>
      )}

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="no-jobs-found">
          <div className="no-jobs-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3>No jobs found matching your criteria</h3>
          <p>Try adjusting your search terms or select a different industry</p>
          <button onClick={clearFilters} className="clear-all-button">
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="available-jobs-grid">
            {getCurrentPageJobs().map(job => (
              <div key={job.id} className="available-job-card">
                <div className="available-job-card-header">
                  <div className="job-title-section">
                    <h3 title={job.title}>{job.title}</h3>
                    <span className={`job-status-badge ${job.work_type?.toLowerCase()}`}>
                      <i className={getWorkTypeIcon(job.work_type)}></i>
                      {getWorkTypeLabel(job.work_type)}
                    </span>
                  </div>
                  <div className="company-name">
                    <i className="fas fa-building"></i>
                    <span>{job.company}</span>
                  </div>
                </div>

                <div className="available-job-card-body">
                  <div className="job-details-grid">
                    <div className="detail-item" title="Location">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{job.location}</span>
                    </div>
                    <div className="detail-item" title="Salary">
                      <i className="fas fa-money-bill-wave"></i>
                      <span>{job.salary}</span>
                    </div>
                    <div className="detail-item" title="Job Type">
                      <i className="fas fa-clock"></i>
                      <span>{job.employment_type?.replace('_', ' ') || 'Full Time'}</span>
                    </div>
                    <div className="detail-item" title="Posted Date">
                      <i className="fas fa-calendar"></i>
                      <span>{job.postedDate}</span>
                    </div>
                    {/* Application Deadline */}
                    {job.closes_at && (
                      <div className="detail-item" title="Application Deadline">
                        <i className="fas fa-hourglass-end"></i>
                        <span>
                          Closes: {new Date(job.closes_at).toLocaleDateString()}
                          {isJobExpired(job) && <span className="expired-badge"> (Expired)</span>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="job-description-section">
                    <h4>Description</h4>
                    <p title={job.description}>
                      {job.description.length > 150 
                        ? `${job.description.substring(0, 150)}...` 
                        : job.description}
                    </p>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="job-skills-section">
                      <h4>Required Skills</h4>
                      <div className="skills-list">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="skill-badge" title={skill}>
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="skill-badge more" title={`${job.skills.length - 5} more skills`}>
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="job-meta-footer">
                    <div className="industry-tag" title="Industry">
                      <i className="fas fa-tag"></i>
                      <span>{job.industry}</span>
                    </div>
                    {job.applications_count > 0 && (
                      <div className="applications-count" title="Total Applicants">
                        <i className="fas fa-users"></i>
                        <span>{job.applications_count} applicant{job.applications_count !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="available-job-card-footer">
                  <button 
                    className={`action-btn save-btn ${savedJobIds.has(job.id) ? 'saved' : ''}`}
                    onClick={() => savedJobIds.has(job.id) ? handleUnsaveJob(job.id) : handleSaveJob(job.id)}
                    disabled={savingJobs.has(job.id)}
                    title={savedJobIds.has(job.id) ? "Remove from saved" : "Save for later"}
                  >
                    <i className={`fas fa-${savingJobs.has(job.id) ? 'spinner fa-spin' : 'bookmark'}`}></i>
                    {savingJobs.has(job.id) ? 'Saving...' : (savedJobIds.has(job.id) ? 'Saved' : 'Save')}
                  </button>
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(job)}
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                  <button 
                    className="action-btn apply-btn"
                    onClick={() => onJobApply(job.id)}
                    disabled={!hasCVs || isJobExpired(job)}
                    title={
                      !hasCVs ? "Upload a CV first to apply" : 
                      isJobExpired(job) ? "This job has expired" :
                      "Apply for this job"
                    }
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
                  
                  return pageNum <= totalPages && (
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

      {/* Footer Tips */}
      <div className="jobs-footer-tips">
        <h4><i className="fas fa-lightbulb"></i> Job Search Tips</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <i className="fas fa-search"></i>
            <h5>Use Keywords</h5>
            <p>Search using specific skills or job titles for better results</p>
          </div>
          <div className="tip-item">
            <i className="fas fa-filter"></i>
            <h5>Filter Wisely</h5>
            <p>Use industry filters to narrow down to your preferred field</p>
          </div>
          <div className="tip-item">
            <i className="fas fa-bookmark"></i>
            <h5>Save Jobs</h5>
            <p>Save interesting jobs to apply later or track your applications</p>
          </div>
        </div>
      </div>
      
      {/* Job Detail Modal */}
      {showModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Company:</strong> {selectedJob.company}</p>
              <p><strong>Location:</strong> {selectedJob.location}</p>
              <p><strong>Industry:</strong> {selectedJob.industry}</p>
              <p><strong>Salary:</strong> {selectedJob.salary}</p>
              <p><strong>Work Type:</strong> {selectedJob.work_type}</p>
              <p><strong>Posted:</strong> {selectedJob.postedDate}</p>
              {selectedJob.closes_at && (
                <p><strong>Deadline:</strong> {new Date(selectedJob.closes_at).toLocaleString()}</p>
              )}
              
              <h4>Description</h4>
              <p>{selectedJob.description}</p>
              
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <>
                  <h4>Required Skills</h4>
                  <div className="skills-list">
                    {selectedJob.skills.map((skill, index) => (
                      <span key={index} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn save"
                onClick={() => {
                  if (savedJobIds.has(selectedJob.id)) {
                    handleUnsaveJob(selectedJob.id)
                  } else {
                    handleSaveJob(selectedJob.id)
                  }
                }}
              >
                <i className={`fas fa-${savedJobIds.has(selectedJob.id) ? 'bookmark' : 'bookmark'}`}></i>
                {savedJobIds.has(selectedJob.id) ? 'Saved' : 'Save'}
              </button>
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Close</button>
              <button 
                className="modal-btn apply" 
                onClick={() => {
                  onJobApply(selectedJob.id)
                  setShowModal(false)
                }}
                disabled={!hasCVs || (selectedJob.closes_at && new Date(selectedJob.closes_at) < new Date())}
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvailableJobs