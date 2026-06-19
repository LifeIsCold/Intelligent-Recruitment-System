import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './JobApplicants.css';

const JobApplicants = ({ jobId, jobTitle }) => {
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const [applicationsData, statsData] = await Promise.all([
        api.getJobApplications(jobId),
        api.getApplicationStats(jobId)
      ]);
      
      setApplications(applicationsData.applications);
      setJob(applicationsData.job);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      alert('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await api.updateApplicationStatus(applicationId, newStatus);
      fetchApplicants(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const viewApplicationDetails = async (applicationId) => {
    try {
      const response = await api.getApplicationDetails(applicationId);
      console.log('Application details response:', response); // For debugging
      
      // The response structure from ApplicationController@getApplicationDetails
      // returns { success: true, data: { application, user_profile, cv_content } }
      if (response.success && response.data) {
        // Make sure we have the CV data with structured_data
        setSelectedApplication(response.data);
      } else {
        alert('Failed to load application details: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      alert('Failed to load application details: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      reviewed: '#2196f3',
      shortlisted: '#4caf50',
      rejected: '#f44336',
      hired: '#009688'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return <div className="loading">Loading applicants...</div>;
  }

  return (
    <div className="job-applicants-container">
      {/* Header with stats */}
      <div className="applicants-header">
        <h2>Applicants for: {job?.title}</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.total_applicants || 0}</div>
            <div className="stat-label">Total Applicants</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.shortlisted || 0}</div>
            <div className="stat-label">Shortlisted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.average_match_score?.toFixed(1) || '0'}%</div>
            <div className="stat-label">Avg. Match Score</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({applications.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats?.pending || 0})
        </button>
        <button 
          className={`filter-tab ${filter === 'shortlisted' ? 'active' : ''}`}
          onClick={() => setFilter('shortlisted')}
        >
          Shortlisted ({stats?.shortlisted || 0})
        </button>
      </div>

      {/* Applications list */}
      <div className="applications-list">
        {filteredApplications.length === 0 ? (
          <div className="no-applicants">
            <i className="fas fa-users"></i>
            <h3>No applicants found</h3>
            <p>No one has applied for this position yet.</p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div key={application.id} className="applicant-card">
              <div className="applicant-header">
                <div className="applicant-info">
                  <div className="applicant-avatar">
                    {application.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{application.user.name}</h4>
                    <p>{application.user.email}</p>
                  </div>
                </div>
                <div className="match-score">
                  <div className="score-badge">
                    {application.match_score}% Match
                  </div>
                </div>
              </div>

              <div className="applicant-details">
                <div className="detail-row">
                  <i className="fas fa-phone"></i>
                  <span>{application.user.phone || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <i className="fas fa-calendar"></i>
                  <span>Applied: {new Date(application.applied_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="applicant-footer">
                <div className="status-indicator">
                  <span 
                    className="status-dot" 
                    style={{ backgroundColor: getStatusColor(application.status) }}
                  ></span>
                  <span className="status-text">{application.status.toUpperCase()}</span>
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn-view"
                    onClick={() => viewApplicationDetails(application.id)}
                  >
                    <i className="fas fa-eye"></i> View CV
                  </button>
                  <div className="status-dropdown">
                    <select 
                      value={application.status}
                      onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                      style={{ borderColor: getStatusColor(application.status) }}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>Application Details</h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedApplication(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="applicant-profile">
                {/* Applicant Header */}
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedApplication.application?.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2>{selectedApplication.application?.user?.name || 'N/A'}</h2>
                    <p><i className="fas fa-envelope"></i> {selectedApplication.application?.user?.email || 'N/A'}</p>
                    <p><i className="fas fa-phone"></i> {selectedApplication.application?.user?.phone || 'No phone provided'}</p>
                  </div>
                </div>

                {/* Match Score Card */}
                <div className="match-score-card">
                  <div className="match-score-display">
                    <div className="score-circle large">
                      {selectedApplication.application?.match_score || 0}%
                    </div>
                    <div className="score-label">
                      <strong>Overall Match</strong>
                      <span>Score</span>
                    </div>
                  </div>
                </div>

                {/* Structured CV Fields from Excel Parser */}
                {selectedApplication.application?.cv?.structured_data && (
                  <div className="cv-structured-fields">
                    <h3><i className="fas fa-file-alt"></i> CV Details from Excel</h3>
                    
                    {/* Personal Information */}
                    <div className="cv-field-group">
                      <h4><i className="fas fa-user"></i> Personal Information</h4>
                      <div className="field-row">
                        <div className="field-label">Full Name:</div>
                        <div className="field-value">
                          {selectedApplication.application.cv.structured_data.full_name || 'N/A'}
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-label">Professional Title:</div>
                        <div className="field-value">
                          {selectedApplication.application.cv.structured_data.professional_title || 'N/A'}
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-label">Email:</div>
                        <div className="field-value">
                          {selectedApplication.application.cv.structured_data.email || 'N/A'}
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-label">Phone:</div>
                        <div className="field-value">
                          {selectedApplication.application.cv.structured_data.phone || 'N/A'}
                        </div>
                      </div>
                      {selectedApplication.application.cv.structured_data.linkedin_url && (
                        <div className="field-row">
                          <div className="field-label">LinkedIn:</div>
                          <div className="field-value">
                            <a href={selectedApplication.application.cv.structured_data.linkedin_url} target="_blank" rel="noopener noreferrer">
                              {selectedApplication.application.cv.structured_data.linkedin_url}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.github_url && (
                        <div className="field-row">
                          <div className="field-label">GitHub:</div>
                          <div className="field-value">
                            <a href={selectedApplication.application.cv.structured_data.github_url} target="_blank" rel="noopener noreferrer">
                              {selectedApplication.application.cv.structured_data.github_url}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.portfolio_url && (
                        <div className="field-row">
                          <div className="field-label">Portfolio:</div>
                          <div className="field-value">
                            <a href={selectedApplication.application.cv.structured_data.portfolio_url} target="_blank" rel="noopener noreferrer">
                              {selectedApplication.application.cv.structured_data.portfolio_url}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Professional Summary */}
                    {selectedApplication.application.cv.structured_data.summary && (
                      <div className="cv-field-group">
                        <h4><i className="fas fa-align-left"></i> Professional Summary</h4>
                        <div className="summary-text">
                          {selectedApplication.application.cv.structured_data.summary}
                        </div>
                      </div>
                    )}

                    {/* Experience & Education */}
                    <div className="cv-field-group">
                      <h4><i className="fas fa-briefcase"></i> Experience & Education</h4>
                      <div className="field-row">
                        <div className="field-label">Years of Experience:</div>
                        <div className="field-value">
                          {selectedApplication.application.cv.structured_data.experience_years || 0} years
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-label">Education Level:</div>
                        <div className="field-value">
                          {selectedApplication.application.cv.structured_data.education_level || 'N/A'}
                        </div>
                      </div>
                      {selectedApplication.application.cv.structured_data.institution && (
                        <div className="field-row">
                          <div className="field-label">Institution:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.institution}
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.graduation_year && (
                        <div className="field-row">
                          <div className="field-label">Graduation Year:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.graduation_year}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {selectedApplication.application.cv.structured_data.skills && 
                    selectedApplication.application.cv.structured_data.skills.length > 0 && (
                      <div className="cv-field-group">
                        <h4><i className="fas fa-code"></i> Skills</h4>
                        <div className="skills-grid">
                          {selectedApplication.application.cv.structured_data.skills.map((skill, index) => (
                            <div key={index} className="skill-item">
                              <span className="skill-name">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {selectedApplication.application.cv.structured_data.languages && (
                      <div className="cv-field-group">
                        <h4><i className="fas fa-language"></i> Languages</h4>
                        <div className="languages-list">
                          {typeof selectedApplication.application.cv.structured_data.languages === 'string' 
                            ? selectedApplication.application.cv.structured_data.languages.split(',').map((lang, index) => (
                                <span key={index} className="language-item">{lang.trim()}</span>
                              ))
                            : Array.isArray(selectedApplication.application.cv.structured_data.languages) 
                              ? selectedApplication.application.cv.structured_data.languages.map((lang, index) => (
                                  <span key={index} className="language-item">{lang}</span>
                                ))
                              : <span className="language-item">{selectedApplication.application.cv.structured_data.languages}</span>
                          }
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {selectedApplication.application.cv.structured_data.certifications && (
                      <div className="cv-field-group">
                        <h4><i className="fas fa-certificate"></i> Certifications</h4>
                        <div className="certifications-list">
                          {typeof selectedApplication.application.cv.structured_data.certifications === 'string'
                            ? selectedApplication.application.cv.structured_data.certifications.split(',').map((cert, index) => (
                                <div key={index} className="certification-item">{cert.trim()}</div>
                              ))
                            : Array.isArray(selectedApplication.application.cv.structured_data.certifications)
                              ? selectedApplication.application.cv.structured_data.certifications.map((cert, index) => (
                                  <div key={index} className="certification-item">{cert}</div>
                                ))
                              : <div className="certification-item">{selectedApplication.application.cv.structured_data.certifications}</div>
                          }
                        </div>
                      </div>
                    )}

                    {/* Career Preferences */}
                    <div className="cv-field-group">
                      <h4><i className="fas fa-bullseye"></i> Career Preferences</h4>
                      {selectedApplication.application.cv.structured_data.desired_job_title && (
                        <div className="field-row">
                          <div className="field-label">Desired Job Title:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.desired_job_title}
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.desired_industry && (
                        <div className="field-row">
                          <div className="field-label">Desired Industry:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.desired_industry}
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.desired_location && (
                        <div className="field-row">
                          <div className="field-label">Desired Location:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.desired_location}
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.salary_expectation && (
                        <div className="field-row">
                          <div className="field-label">Salary Expectation:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.salary_expectation}
                          </div>
                        </div>
                      )}
                      {selectedApplication.application.cv.structured_data.notice_period && (
                        <div className="field-row">
                          <div className="field-label">Notice Period:</div>
                          <div className="field-value">
                            {selectedApplication.application.cv.structured_data.notice_period}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback to raw CV content if no structured data */}
                {!selectedApplication.application?.cv?.structured_data && selectedApplication.cv_content && (
                  <div className="cv-field-group">
                    <h4><i className="fas fa-file-text"></i> Raw CV Content</h4>
                    <div className="cv-content">
                      {selectedApplication.cv_content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicants;