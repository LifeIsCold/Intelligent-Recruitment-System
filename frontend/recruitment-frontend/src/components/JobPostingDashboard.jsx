// src/components/JobPostingDashboard.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import './JobPostingDashboard.css'

const JobPostingDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('postJob')
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [postedJobs, setPostedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Post Job Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    industry_id: '',
    work_type: 'onsite',
    work_time: 'full_time',
    salary: '',
    required_skills: [],
    benefits: '',
    status: 'open',
    closes_at: '',
    scoring_weights: {
      required_skills_weight: 75,
      preferred_skills_weight: 0,
      experience_weight: 20,
      education_weight: 5,
      similarity_threshold: 0.6
    }
  })
  
  const [industries, setIndustries] = useState([])
  const [skills, setSkills] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  
  // Weight presets
  const [selectedWeightPreset, setSelectedWeightPreset] = useState('balanced')
  const weightPresets = {
    balanced: {
      required_skills_weight: 75,
      preferred_skills_weight: 0,
      experience_weight: 20,
      education_weight: 5,
      similarity_threshold: 0.6
    },
    skills_focused: {
      required_skills_weight: 90,
      preferred_skills_weight: 10,
      experience_weight: 0,
      education_weight: 0,
      similarity_threshold: 0.7
    },
    experience_focused: {
      required_skills_weight: 50,
      preferred_skills_weight: 0,
      experience_weight: 50,
      education_weight: 0,
      similarity_threshold: 0.5
    },
    education_focused: {
      required_skills_weight: 60,
      preferred_skills_weight: 0,
      experience_weight: 20,
      education_weight: 20,
      similarity_threshold: 0.6
    },
    entry_level: {
      required_skills_weight: 60,
      preferred_skills_weight: 0,
      experience_weight: 20,
      education_weight: 20,
      similarity_threshold: 0.5
    }
  }
  
  // Applicants View State
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null)
  const [applications, setApplications] = useState([])
  const [applicationStats, setApplicationStats] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  
  // Edit Job State
  const [editingJob, setEditingJob] = useState(null)

  // Notification Modal States
  const [showShortlistModal, setShowShortlistModal] = useState(false)
  const [showHireModal, setShowHireModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [tempStatus, setTempStatus] = useState('')
  const [selectedApplicationForAction, setSelectedApplicationForAction] = useState(null)
  const [interviewData, setInterviewData] = useState({
    interview_scheduled_at: '',
    interview_location: '',
    interview_notes: ''
  })
  const [hireData, setHireData] = useState({
    start_date: '',
    workplace_address: ''
  })

  // Helper function to check if a value exists
  const hasValue = (value) => {
    return value !== undefined && value !== null && value !== '';
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const role = localStorage.getItem('authRole')
    
    console.log('🔐 Recruiter Dashboard auth check - Role:', role)
    
    if (!token || role !== 'recruiter') {
      console.log('⚠️ Unauthorized access to recruiter dashboard')
      
      if (token && ['seeker', 'job_seeker'].includes(role)) {
        navigate('/jobseeker-dashboard', { replace: true })
        return
      }
      
      navigate('/jobposting-login', { replace: true })
      return
    }
    
    fetchUserData()
  }, [navigate])

  useEffect(() => {
    fetchUserData()
    fetchIndustries()
    fetchSkills()
  }, [])

  useEffect(() => {
    if (activeTab === 'postedJobs') {
      fetchPostedJobs()
    }
  }, [activeTab])

  const fetchUserData = async () => {
    try {
      const response = await api.getProfile()
      console.log('Profile API Response:', response)
      
      if (response && response.success && response.data) {
        setUser(response.data.user || response.data)
        setCompany(response.data.company || null)
      } else {
        console.warn('Unexpected response format:', response)
        setUser({ 
          name: 'Recruiter', 
          email: 'user@example.com',
          role: 'recruiter'
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser({ 
        name: 'Recruiter', 
        email: 'user@example.com',
        role: 'recruiter'
      })
    }
  }

  const fetchIndustries = async () => {
    try {
      const response = await api.getIndustries()
      setIndustries(response.data || [])
    } catch (error) {
      console.error('Error fetching industries:', error)
      setIndustries([])
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await api.getSkills()
      setSkills(response.data || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
      setSkills([])
    }
  }

  const fetchPostedJobs = async () => {
    try {
      setLoading(true)
      const response = await api.getRecruiterJobs()
      
      let jobsData = []
      if (response && response.success && Array.isArray(response.data)) {
        jobsData = response.data
      } else if (Array.isArray(response)) {
        jobsData = response
      } else if (response && response.data && Array.isArray(response.data)) {
        jobsData = response.data
      }
      
      setPostedJobs(jobsData)
      
      if (response.company) {
        setCompany(response.company)
      }
    } catch (error) {
      console.error('Error fetching posted jobs:', error)
      alert('Failed to load your posted jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleJobFormChange = (e) => {
    const { name, value } = e.target
    setJobForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillsChange = (skill) => {
    setJobForm(prev => {
      const skills = prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill]
      return { ...prev, required_skills: skills }
    })
  }

  const handleAddNewSkill = async (skillName) => {
    try {
      const existingSkill = skills.find(s => 
        s.name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (existingSkill) {
        handleSkillsChange(existingSkill.name);
        return true;
      } else {
        const response = await api.createSkill({ 
          name: skillName,
          description: `Skill added by recruiter`
        });
        
        if (response.success || response.data) {
          const newSkill = response.data || response;
          setSkills(prevSkills => [...prevSkills, newSkill]);
          handleSkillsChange(newSkill.name);
          return true;
        }
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      
      if (error.response?.status === 422) {
        const existingSkill = skills.find(s => 
          s.name.toLowerCase() === skillName.toLowerCase()
        );
        
        if (existingSkill) {
          handleSkillsChange(existingSkill.name);
          return true;
        } else {
          alert(`"${skillName}" already exists in the database`);
        }
      } else {
        alert('Failed to add new skill. Please try again.');
      }
      return false;
    }
  }

  const handleWeightChange = (key, value) => {
    const numValue = parseInt(value) || 0
    setJobForm(prev => ({
      ...prev,
      scoring_weights: {
        ...prev.scoring_weights,
        [key]: numValue
      }
    }))
  }

  const applyWeightPreset = (presetName) => {
    const preset = weightPresets[presetName]
    if (preset) {
      setJobForm(prev => ({
        ...prev,
        scoring_weights: preset
      }))
      setSelectedWeightPreset(presetName)
    }
  }

  const handleJobSubmit = async (e) => {
    e.preventDefault()
    console.log('📤 Submitting job form:', JSON.stringify(jobForm, null, 2))
    
    // Validate weights total
    const total = jobForm.scoring_weights.required_skills_weight + 
                  jobForm.scoring_weights.preferred_skills_weight + 
                  jobForm.scoring_weights.experience_weight + 
                  jobForm.scoring_weights.education_weight
    
    if (total !== 100) {
      alert(`Scoring weights total must equal 100%. Current total: ${total}%`)
      return
    }
    
    try {
      if (editingJob) {
        await api.updateJob(editingJob.id, jobForm)
        alert('Job updated successfully!')
        setEditingJob(null)
      } else {
        await api.createJob(jobForm)
        alert('Job posted successfully!')
      }
      
      setJobForm({
        title: '',
        description: '',
        industry_id: '',
        work_type: 'onsite',
        work_time: 'full_time',
        salary: 'Negotiable',
        required_skills: [],
        benefits: '',
        status: 'open',
        closes_at: '',
        scoring_weights: {
          required_skills_weight: 75,
          preferred_skills_weight: 0,
          experience_weight: 20,
          education_weight: 5,
          similarity_threshold: 0.6
        }
      })
      setSelectedWeightPreset('balanced')
      setActiveTab('postedJobs')
      fetchPostedJobs()
    } catch (error) {
      console.error('Error posting/updating job:', error)
      
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
        let errorMessage = 'Please fix the following errors:\n\n'
        Object.keys(validationErrors).forEach(field => {
          errorMessage += `• ${field}: ${validationErrors[field].join(', ')}\n`
        })
        alert(errorMessage)
      } else {
        alert(error.response?.data?.message || 'Failed to save job')
      }
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return
    
    try {
      await api.deleteJob(jobId)
      fetchPostedJobs()
      alert('Job deleted successfully')
    } catch (error) {
      console.error('Error deleting job:', error)
      alert(error.response?.data?.message || 'Failed to delete job')
    }
  }

  const handleUpdateJobStatus = async (jobId, status) => {
    try {
      await api.updateJobStatus(jobId, status)
      fetchPostedJobs()
      alert(`Job ${status === 'open' ? 'opened' : 'closed'} successfully`)
    } catch (error) {
      console.error('Error updating job status:', error)
      alert('Failed to update job status')
    }
  }

  const handleViewApplicants = async (job) => {
    console.log('👥 Viewing applicants for job:', job.id, job.title)
    
    setSelectedJobForApplicants(job)
    setActiveTab('applicants')
    setApplications([])
    setApplicationStats(null)
    
    try {
      const appsRes = await api.getJobApplications(job.id)
      console.log('Applications API response:', appsRes)
      
      let applicationsData = []
      
      if (appsRes.success) {
        if (appsRes.data && appsRes.data.applications) {
          applicationsData = appsRes.data.applications
        } else if (Array.isArray(appsRes.data)) {
          applicationsData = appsRes.data
        } else if (appsRes.data && Array.isArray(appsRes.data.data)) {
          applicationsData = appsRes.data.data
        } else if (appsRes.applications) {
          applicationsData = appsRes.applications
        }
      } else {
        throw new Error(appsRes.message || 'Failed to fetch applications')
      }
      
      console.log('Parsed applications:', applicationsData)
      setApplications(applicationsData)
      
      const stats = {
        total_applicants: applicationsData.length,
        pending: applicationsData.filter(app => (app.status || 'pending') === 'pending').length,
        reviewed: applicationsData.filter(app => app.status === 'reviewed').length,
        shortlisted: applicationsData.filter(app => app.status === 'shortlisted').length,
        rejected: applicationsData.filter(app => app.status === 'rejected').length,
        hired: applicationsData.filter(app => app.status === 'hired').length,
        offer_extended: applicationsData.filter(app => app.status === 'offer_extended').length,
        declined: applicationsData.filter(app => app.status === 'declined').length,
        average_match_score: applicationsData.length > 0 
          ? applicationsData.reduce((sum, app) => sum + (app.match_score || 0), 0) / applicationsData.length
          : 0
      }
      
      console.log('Calculated stats:', stats)
      setApplicationStats(stats)
      
    } catch (error) {
      console.error('Error in handleViewApplicants:', error)
      alert(
        error.response?.data?.message || 
        error.message || 
        'Failed to load applicants. Please try again.'
      )
      setActiveTab('postedJobs')
    }
  }

  const handleViewApplicationDetails = async (applicationId) => {
    try {
      const response = await api.getApplicationDetails(applicationId);
      console.log('Application details response:', response);
      
      if (response.success && response.data) {
        setSelectedApplication(response.data);
      } else {
        alert('Failed to load application details: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      alert('Failed to load application details: ' + (error.response?.data?.message || error.message));
    }
  }

  const handleUpdateApplicationStatus = async (application, newStatus) => {
    console.log('Updating specific application:', {
      applicationId: application.id,
      jobId: application.job_id,
      currentStatus: application.status,
      newStatus: newStatus
    });

    if (!application.id) {
      console.error('No application ID provided');
      alert('Error: No application ID found');
      return;
    }

    if (newStatus === 'shortlisted') {
      setSelectedApplicationForAction(application);
      setShowShortlistModal(true);
    } else if (newStatus === 'hired') {
      setSelectedApplicationForAction(application);
      setShowHireModal(true);
    } else {
      try {
        await api.updateApplicationStatus(application.id, { status: newStatus });
        const response = await api.getJobApplications(selectedJobForApplicants.id);
        setApplications(response.data?.applications || []);
        alert('Application status updated');
      } catch (error) {
        console.error('Error updating application:', error);
        alert('Failed to update application status');
      }
    }
  };
  
  const handleShortlistSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: 'shortlisted',
        interview_scheduled_at: interviewData.interview_scheduled_at,
        interview_location: interviewData.interview_location,
        interview_notes: interviewData.interview_notes || ''
      };
      
      console.log('📤 Shortlisting with payload:', payload);
      
      await api.updateApplicationStatus(selectedApplicationForAction.id, payload);
      setShowShortlistModal(false);
      setInterviewData({ interview_scheduled_at: '', interview_location: '', interview_notes: '' });
      const response = await api.getJobApplications(selectedJobForApplicants.id);
      setApplications(response.data?.applications || []);
      setSelectedApplication(null);
      alert('Applicant shortlisted and notification sent');
    } catch (error) {
      console.error('Error shortlisting:', error);
      alert(error.response?.data?.message || 'Failed to shortlist applicant');
    }
  };
  
  const handleHireSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: 'hired',
        start_date: hireData.start_date,
        workplace_address: hireData.workplace_address
      };
      
      console.log('📤 Sending offer with payload:', payload);
      
      await api.updateApplicationStatus(selectedApplicationForAction.id, payload);
      setShowHireModal(false);
      setHireData({ start_date: '', workplace_address: '' });
      const response = await api.getJobApplications(selectedJobForApplicants.id);
      setApplications(response.data?.applications || []);
      setSelectedApplication(null);
      alert('Offer sent to candidate');
    } catch (error) {
      console.error('Error sending offer:', error);
      alert(error.response?.data?.message || 'Failed to send offer');
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job)
    setJobForm({
      title: job.title,
      description: job.description,
      industry_id: job.industry_id || '',
      work_type: job.work_type,
      work_time: job.work_time,
      salary: job.salary || '',
      required_skills: job.required_skills || [],
      benefits: job.benefits || '',
      status: job.status || 'open',
      closes_at: job.closes_at ? job.closes_at.slice(0, 16) : '',
      scoring_weights: job.scoring_weights || {
        required_skills_weight: 75,
        preferred_skills_weight: 0,
        experience_weight: 20,
        education_weight: 5,
        similarity_threshold: 0.6
      }
    })
    setActiveTab('postJob')
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    localStorage.removeItem('userData')
    navigate('/')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      open: '#4caf50',
      closed: '#f44336',
      pending: '#ff9800',
      reviewed: '#2196f3',
      shortlisted: '#9c27b0',
      rejected: '#f44336',
      hired: '#009688',
      offer_extended: '#f59e0b',
      declined: '#ef4444'
    }
    return colors[status] || '#666'
  }

  const totalApplicants = postedJobs.reduce((total, job) => total + (job.applications_count || 0), 0)

  if (!user) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
  }

  return (
    <div className="jobposting-dashboard">
      {/* Header */}
      <header className="jobposting-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
          
          <div className="user-info">
            <NotificationBell />
            
            <div className="company-avatar">
              {company?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="company-details">
              <h3>{company?.name || 'Your Company'}</h3>
              <p>Recruiter Dashboard</p>
            </div>
            <button className="edit-profile-btn" onClick={() => navigate('/edit-profile')}>
              <i className="fas fa-user-edit"></i> Edit Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <div className="header-main">
          <h1>
            <i className="fas fa-briefcase"></i> Job Management Portal
          </h1>
          <p>Post jobs, track applicants, and manage your hiring process</p>
        </div>
      </header>

      {/* Main container with two columns */}
      <div className="jobposting-main-container">
        {/* Left column – tabs and content */}
        <div className="tabs-container">
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'postJob' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('postJob')
                setEditingJob(null)
                setJobForm({
                  title: '',
                  description: '',
                  industry_id: '',
                  work_type: 'onsite',
                  work_time: 'full_time',
                  salary: '',
                  required_skills: [],
                  benefits: '',
                  status: 'open',
                  closes_at: '',
                  scoring_weights: {
                    required_skills_weight: 75,
                    preferred_skills_weight: 0,
                    experience_weight: 20,
                    education_weight: 5,
                    similarity_threshold: 0.6
                  }
                })
                setSelectedWeightPreset('balanced')
              }}
            >
              <i className="fas fa-plus-circle"></i> {editingJob ? 'Edit Job' : 'Post New Job'}
            </button>
            <button 
              className={`tab ${activeTab === 'postedJobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('postedJobs')}
            >
              <i className="fas fa-list-alt"></i> Posted Jobs
              {postedJobs.length > 0 && (
                <span className="tab-badge">{postedJobs.length}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'applicants' ? 'active' : ''}`}
              onClick={() => {
                if (!selectedJobForApplicants) {
                  alert('Please select a job from Posted Jobs tab first')
                  setActiveTab('postedJobs')
                }
              }}
              disabled={!selectedJobForApplicants}
            >
              <i className="fas fa-users"></i> Applicants
              {selectedJobForApplicants && (
                <span className="tab-badge">{applications.length}</span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="tab-content">
            {/* Post Job Form */}
            {activeTab === 'postJob' && (
              <div className="post-job-container">
                <div className="form-card">
                  <form onSubmit={handleJobSubmit}>
                    <div className="form-grid">
                      {/* Job Title */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-heading"></i> Job Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={jobForm.title}
                          onChange={handleJobFormChange}
                          placeholder="e.g., Senior Frontend Developer"
                          required
                        />
                      </div>

                      {/* Job Description */}
                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-file-alt"></i> Job Description *
                        </label>
                        <textarea
                          name="description"
                          value={jobForm.description}
                          onChange={handleJobFormChange}
                          placeholder="Describe the role, responsibilities, and requirements..."
                          rows="6"
                          required
                        />
                        <div className="textarea-info">
                          <span>Be specific about requirements</span>
                          <span>{jobForm.description.length}/2000 characters</span>
                        </div>
                      </div>

                      {/* Industry */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-industry"></i> Industry *
                        </label>
                        <select
                          name="industry_id"
                          value={jobForm.industry_id}
                          onChange={handleJobFormChange}
                          required
                        >
                          <option value="">Select Industry</option>
                          {industries.map(industry => (
                            <option key={industry.id} value={industry.id}>
                              {industry.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Work Type */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-location-arrow"></i> Work Location
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="work_type"
                              value="onsite"
                              checked={jobForm.work_type === 'onsite'}
                              onChange={handleJobFormChange}
                            />
                            <span>On Site</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="work_type"
                              value="remote"
                              checked={jobForm.work_type === 'remote'}
                              onChange={handleJobFormChange}
                            />
                            <span>Remote</span>
                          </label>
                        </div>
                      </div>

                      {/* Work Time */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-clock"></i> Work Schedule
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="work_time"
                              value="full_time"
                              checked={jobForm.work_time === 'full_time'}
                              onChange={handleJobFormChange}
                            />
                            <span>Full Time</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="work_time"
                              value="part_time"
                              checked={jobForm.work_time === 'part_time'}
                              onChange={handleJobFormChange}
                            />
                            <span>Part Time</span>
                          </label>
                        </div>
                      </div>

                      {/* Salary */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-money-bill-wave"></i> Salary Range
                        </label>
                        <input
                          type="text"
                          name="salary"
                          value={jobForm.salary}
                          onChange={handleJobFormChange}
                          placeholder="Negotiable"
                        />
                      </div>

                      {/* Required Skills */}
                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-tools"></i> Required Skills *
                        </label>
                        <div className="skills-selector">
                          <div className="selected-skills">
                            {jobForm.required_skills.map(skill => (
                              <span key={skill} className="skill-tag">
                                {skill}
                                <button 
                                  type="button"
                                  className="remove-skill"
                                  onClick={() => handleSkillsChange(skill)}
                                  title="Remove skill"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {jobForm.required_skills.length === 0 && (
                              <span className="no-skills-message">No skills added yet</span>
                            )}
                          </div>

                          <div className="skill-input-area">
                            <div className="skill-search-container">
                              <input
                                type="text"
                                className="skill-search-input"
                                placeholder="Search or add skills (e.g., JavaScript, Python)"
                                id="skillSearchInput"
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const input = e.target;
                                    const newSkillName = input.value.trim();
                                    
                                    if (!newSkillName) return;
                                    
                                    if (jobForm.required_skills.includes(newSkillName)) {
                                      alert(`"${newSkillName}" is already added`);
                                      input.value = '';
                                      return;
                                    }
                                    
                                    await handleAddNewSkill(newSkillName);
                                    input.value = '';
                                  }
                                }}
                                onBlur={async (e) => {
                                  const input = e.target;
                                  const newSkillName = input.value.trim();
                                  
                                  if (newSkillName && !jobForm.required_skills.includes(newSkillName)) {
                                    await handleAddNewSkill(newSkillName);
                                    input.value = '';
                                  }
                                }}
                              />
                              
                              <button
                                type="button"
                                className="quick-add-btn"
                                onClick={async () => {
                                  const input = document.getElementById('skillSearchInput');
                                  const newSkillName = input.value.trim();
                                  
                                  if (!newSkillName) {
                                    alert('Please enter a skill name');
                                    return;
                                  }
                                  
                                  if (jobForm.required_skills.includes(newSkillName)) {
                                    alert(`"${newSkillName}" is already added`);
                                    input.value = '';
                                    return;
                                  }
                                  
                                  await handleAddNewSkill(newSkillName);
                                  input.value = '';
                                }}
                              >
                                <i className="fas fa-plus"></i> Add
                              </button>
                            </div>

                            {skills.length > 0 && (
                              <div className="suggested-skills">
                                <div className="suggested-skills-header">
                                  <span className="suggested-title">
                                    <i className="fas fa-lightbulb"></i> Suggested Skills
                                  </span>
                                  <button 
                                    type="button"
                                    className="clear-search-btn"
                                    onClick={() => {
                                      const input = document.getElementById('skillSearchInput');
                                      input.value = '';
                                      input.focus();
                                    }}
                                  >
                                    Clear
                                  </button>
                                </div>
                                <div className="suggested-skills-list">
                                  {skills
                                    .filter(skill => !jobForm.required_skills.includes(skill.name))
                                    .slice(0, 10)
                                    .map(skill => (
                                      <button
                                        key={skill.id}
                                        type="button"
                                        className="suggested-skill-btn"
                                        onClick={async () => {
                                          if (!jobForm.required_skills.includes(skill.name)) {
                                            await handleAddNewSkill(skill.name);
                                          }
                                        }}
                                      >
                                        {skill.name}
                                        <i className="fas fa-plus plus-icon"></i>
                                      </button>
                                    ))}
                                  {skills.filter(s => !jobForm.required_skills.includes(s.name)).length === 0 && (
                                    <span className="no-suggestions">All skills are added</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="form-group full-width">
                        <label>
                          <i className="fas fa-gift"></i> Benefits & Perks
                        </label>
                        <textarea
                          name="benefits"
                          value={jobForm.benefits}
                          onChange={handleJobFormChange}
                          placeholder="List benefits like health insurance, flexible hours, etc."
                          rows="4"
                        />
                      </div>

                      {/* Job Status */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-toggle-on"></i> Job Status
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="status"
                              value="open"
                              checked={jobForm.status === 'open'}
                              onChange={handleJobFormChange}
                            />
                            <span>Open (Accepting Applications)</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="status"
                              value="closed"
                              checked={jobForm.status === 'closed'}
                              onChange={handleJobFormChange}
                            />
                            <span>Closed (Not Accepting Applications)</span>
                          </label>
                        </div>
                      </div>

                      {/* Application Deadline */}
                      <div className="form-group">
                        <label>
                          <i className="fas fa-clock"></i> Application Deadline (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          name="closes_at"
                          value={jobForm.closes_at}
                          onChange={handleJobFormChange}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <small className="form-text text-muted">
                          If set, job will automatically close on this date/time.
                        </small>
                      </div>

                      {/* Scoring Weights Configuration - Required */}
                      <div className="form-group full-width">
                        <label className="required-field">
                          <i className="fas fa-sliders-h"></i> Scoring Configuration
                        </label>
                        
                        {/* Preset Buttons */}
                        <div className="weights-presets">
                          <button 
                            type="button"
                            className={`preset-btn ${selectedWeightPreset === 'balanced' ? 'active' : ''}`}
                            onClick={() => applyWeightPreset('balanced')}
                          >
                            <i className="fas fa-balance-scale"></i> Balanced
                          </button>
                          <button 
                            type="button"
                            className={`preset-btn ${selectedWeightPreset === 'skills_focused' ? 'active' : ''}`}
                            onClick={() => applyWeightPreset('skills_focused')}
                          >
                            <i className="fas fa-code"></i> Skills Focused
                          </button>
                          <button 
                            type="button"
                            className={`preset-btn ${selectedWeightPreset === 'experience_focused' ? 'active' : ''}`}
                            onClick={() => applyWeightPreset('experience_focused')}
                          >
                            <i className="fas fa-briefcase"></i> Experience Focused
                          </button>
                          <button 
                            type="button"
                            className={`preset-btn ${selectedWeightPreset === 'education_focused' ? 'active' : ''}`}
                            onClick={() => applyWeightPreset('education_focused')}
                          >
                            <i className="fas fa-graduation-cap"></i> Education Focused
                          </button>
                          <button 
                            type="button"
                            className={`preset-btn ${selectedWeightPreset === 'entry_level' ? 'active' : ''}`}
                            onClick={() => applyWeightPreset('entry_level')}
                          >
                            <i className="fas fa-seedling"></i> Entry Level
                          </button>
                        </div>
                        
                        <div className="weights-config">
                          <div className="weight-slider">
                            <label>
                              Required Skills Weight
                              <span className="weight-value">{jobForm.scoring_weights.required_skills_weight}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={jobForm.scoring_weights.required_skills_weight}
                              onChange={(e) => handleWeightChange('required_skills_weight', e.target.value)}
                            />
                            <small>Importance of matching required skills</small>
                          </div>

                          <div className="weight-slider">
                            <label>
                              Preferred Skills Weight
                              <span className="weight-value">{jobForm.scoring_weights.preferred_skills_weight}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={jobForm.scoring_weights.preferred_skills_weight}
                              onChange={(e) => handleWeightChange('preferred_skills_weight', e.target.value)}
                            />
                            <small>Bonus for nice-to-have skills</small>
                          </div>

                          <div className="weight-slider">
                            <label>
                              Experience Weight
                              <span className="weight-value">{jobForm.scoring_weights.experience_weight}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={jobForm.scoring_weights.experience_weight}
                              onChange={(e) => handleWeightChange('experience_weight', e.target.value)}
                            />
                            <small>How many years of relevant experience</small>
                          </div>

                          <div className="weight-slider">
                            <label>
                              Education Weight
                              <span className="weight-value">{jobForm.scoring_weights.education_weight}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={jobForm.scoring_weights.education_weight}
                              onChange={(e) => handleWeightChange('education_weight', e.target.value)}
                            />
                            <small>Education level importance</small>
                          </div>

                          <div className="weight-slider">
                            <label>
                              Similarity Threshold
                              <span className="weight-value">{(jobForm.scoring_weights.similarity_threshold * 100).toFixed(0)}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={jobForm.scoring_weights.similarity_threshold}
                              onChange={(e) => handleWeightChange('similarity_threshold', parseFloat(e.target.value))}
                            />
                            <small>Minimum similarity for skill matching (higher = stricter)</small>
                          </div>
                          
                          <div className="weights-total">
                            <strong>Total Weight:</strong> 
                            <span className={jobForm.scoring_weights.required_skills_weight + 
                                            jobForm.scoring_weights.preferred_skills_weight + 
                                            jobForm.scoring_weights.experience_weight + 
                                            jobForm.scoring_weights.education_weight === 100 ? 'valid' : 'invalid'}>
                              {jobForm.scoring_weights.required_skills_weight + 
                               jobForm.scoring_weights.preferred_skills_weight + 
                               jobForm.scoring_weights.experience_weight + 
                               jobForm.scoring_weights.education_weight}%
                            </span>
                            {jobForm.scoring_weights.required_skills_weight + 
                             jobForm.scoring_weights.preferred_skills_weight + 
                             jobForm.scoring_weights.experience_weight + 
                             jobForm.scoring_weights.education_weight !== 100 && (
                              <span className="warning"> (Must equal 100%)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="preview-btn"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <i className="fas fa-eye"></i> Preview
                      </button>
                      <button type="submit" className="submit-btn">
                        <i className="fas fa-paper-plane"></i>
                        {editingJob ? 'Update Job' : 'Post Job'}
                      </button>
                    </div>
                  </form>

                  {/* Job Preview */}
                  {showPreview && (
                    <div className="job-preview">
                      <h3>Job Preview</h3>
                      <div className="preview-card">
                        <h4>{jobForm.title || 'Job Title'}</h4>
                        <p><strong>Status:</strong> 
                          <span style={{ 
                            color: jobForm.status === 'open' ? 'green' : 'red',
                            fontWeight: 'bold',
                            marginLeft: '5px'
                          }}>
                            {jobForm.status === 'open' ? '✓ OPEN' : '✗ CLOSED'}
                          </span>
                        </p>
                        <p><strong>Work Type:</strong> {jobForm.work_type}</p>
                        <p><strong>Schedule:</strong> {jobForm.work_time}</p>
                        <p><strong>Salary:</strong> {jobForm.salary || 'Not specified'}</p>
                        {jobForm.closes_at && (
                          <p><strong>Deadline:</strong> {new Date(jobForm.closes_at).toLocaleString()}</p>
                        )}
                        <p><strong>Description:</strong></p>
                        <p>{jobForm.description || 'No description provided'}</p>
                        {jobForm.required_skills.length > 0 && (
                          <>
                            <p><strong>Required Skills:</strong></p>
                            <div className="preview-skills">
                              {jobForm.required_skills.map(skill => (
                                <span key={skill} className="preview-skill">{skill}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Posted Jobs Tab */}
            {activeTab === 'postedJobs' && (
              <div className="posted-jobs-container">
                <div className="jobs-header">
                  <div>
                    <h2>
                      <i className="fas fa-briefcase"></i> Your Posted Jobs
                    </h2>
                    <p className="company-subtitle">
                      Managing jobs for: <strong>{company?.name || 'Your Company'}</strong>
                    </p>
                  </div>
                  <div className="jobs-stats">
                    <div className="stat-badge">
                      <i className="fas fa-file-alt"></i>
                      <span>{postedJobs.length} Jobs</span>
                    </div>
                    <div className="stat-badge">
                      <i className="fas fa-users"></i>
                      <span>{totalApplicants} Total Applicants</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-jobs">
                    <div className="spinner"></div>
                    <p>Loading your jobs...</p>
                  </div>
                ) : postedJobs.length === 0 ? (
                  <div className="no-jobs">
                    <i className="fas fa-file-alt"></i>
                    <h3>No Jobs Posted Yet</h3>
                    <p>Get started by posting your first job opening</p>
                    <button 
                      className="primary-btn"
                      onClick={() => setActiveTab('postJob')}
                    >
                      <i className="fas fa-plus"></i> Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="jobs-grid">
                    {postedJobs.map(job => (
                      <div key={job.id} className="posted-job-card">
                        <div className="job-card-header">
                          <div className="job-title-section">
                            <h3 title={job.title}>{job.title}</h3>
                            <span 
                              className={`job-status ${job.status}`}
                              style={{ 
                                background: job.status === 'open' ? '#28a745' : '#dc3545' 
                              }}
                            >
                              {job.status === 'open' ? '✓ OPEN' : '✗ CLOSED'}
                            </span>
                          </div>
                          <div className="job-meta-info">
                            <span className="posted-date" title="Posted Date">
                              <i className="fas fa-calendar"></i> {formatDate(job.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="job-card-body">
                          <div className="job-details">
                            <div className="detail-row" title="Industry">
                              <i className="fas fa-industry"></i>
                              <span>{job.industry_name}</span>
                            </div>
                            <div className="detail-row" title="Work Type">
                              <i className="fas fa-location-arrow"></i>
                              <span>{job.work_type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="detail-row" title="Schedule">
                              <i className="fas fa-clock"></i>
                              <span>{job.work_time.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="detail-row" title="Salary">
                              <i className="fas fa-money-bill-wave"></i>
                              <span>{job.salary || 'Negotiable'}</span>
                            </div>
                            {job.closes_at && (
                              <div className="detail-row" title="Application Deadline">
                                <i className="fas fa-hourglass-end"></i>
                                <span>Closes: {new Date(job.closes_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="job-description">
                            <h4>Description</h4>
                            <p title={job.description}>
                              {job.description.length > 150 
                                ? `${job.description.substring(0, 150)}...` 
                                : job.description}
                            </p>
                          </div>

                          {job.required_skills && job.required_skills.length > 0 && (
                            <div className="job-skills">
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

                          <div className="applicants-summary">
                            <div className="applicant-count" title="Total Applicants">
                              <i className="fas fa-users"></i>
                              <span>{job.applications_count || 0} Applicants</span>
                            </div>
                            {job.applications && job.applications.length > 0 && (
                              <div className="match-score" title="Average Match Score">
                                <i className="fas fa-chart-line"></i>
                                <span>Avg. Match: {((job.applications.reduce((sum, app) => sum + (app.match_score || 0), 0) / job.applications.length) || 0).toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="job-card-footer">
                          <button 
                            className="action-btn view-btn"
                            onClick={() => handleViewApplicants(job)}
                            disabled={job.applications_count === 0}
                            title={job.applications_count === 0 ? "No applicants yet" : `View ${job.applications_count} applicants`}
                          >
                            <i className="fas fa-users"></i> View Applicants
                            {job.applications_count > 0 && ` (${job.applications_count})`}
                          </button>
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEditJob(job)}
                            title="Edit Job"
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button 
                            className="action-btn status-btn"
                            onClick={() => handleUpdateJobStatus(
                              job.id, 
                              job.status === 'open' ? 'closed' : 'open'
                            )}
                            title={job.status === 'open' ? 'Close this job' : 'Reopen this job'}
                          >
                            <i className="fas fa-toggle-on"></i>
                            {job.status === 'open' ? 'Close Job' : 'Open Job'}
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteJob(job.id)}
                            title="Delete Job"
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Applicants Tab */}
            {activeTab === 'applicants' && selectedJobForApplicants && (
              <div className="applicants-container">
                <div className="applicants-header">
                  <div>
                    <button 
                      className="back-to-jobs"
                      onClick={() => {
                        setSelectedJobForApplicants(null)
                        setApplications([])
                        setActiveTab('postedJobs')
                      }}
                    >
                      <i className="fas fa-arrow-left"></i> Back to Jobs
                    </button>
                    <h2>
                      <i className="fas fa-users"></i> Applicants for: {selectedJobForApplicants.title}
                    </h2>
                    <p className="job-info">
                      {selectedJobForApplicants.company_name} • 
                      Posted: {formatDate(selectedJobForApplicants.created_at)} • 
                      Status: <span style={{ 
                        color: getStatusColor(selectedJobForApplicants.status),
                        fontWeight: 'bold'
                      }}>
                        {selectedJobForApplicants.status === 'open' ? '✓ OPEN' : '✗ CLOSED'}
                      </span>
                    </p>
                  </div>
                  
                  {applicationStats && (
                    <div className="applicants-stats">
                      <div className="stat-card">
                        <div className="stat-value">{applicationStats.total_applicants || 0}</div>
                        <div className="stat-label">Total</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{applicationStats.pending || 0}</div>
                        <div className="stat-label">Pending</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{applicationStats.shortlisted || 0}</div>
                        <div className="stat-label">Shortlisted</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{applicationStats.offer_extended || 0}</div>
                        <div className="stat-label">Offers Sent</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {applicationStats.average_match_score?.toFixed(1) || '0'}%
                        </div>
                        <div className="stat-label">Avg. Match</div>
                      </div>
                    </div>
                  )}
                </div>

                {applications.length === 0 ? (
                  <div className="no-applicants">
                    <i className="fas fa-user-slash"></i>
                    <h3>No Applicants Yet</h3>
                    <p>No one has applied for this position yet.</p>
                    {selectedJobForApplicants?.status === 'closed' && (
                      <p className="job-closed-note">
                        <i className="fas fa-info-circle"></i> This job is closed and not accepting new applications.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="applicants-list">
                    {applications.map((application) => {
                      const applicant = application.user || application
                      const matchScore = application.match_score || 0
                      const status = application.status || 'pending'
                      const appliedAt = application.applied_at || application.created_at
                      const applicantName = applicant.name || 'Anonymous Applicant'
                      const applicantEmail = applicant.email || 'No email provided'
                      
                      return (
                        <div key={application.id} className="applicant-card">
                          <div className="applicant-header">
                            <div className="applicant-info">
                              <div className="applicant-avatar">
                                {applicantName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4>{applicantName}</h4>
                                <p>{applicantEmail}</p>
                                <small>
                                  Applied: {appliedAt ? new Date(appliedAt).toLocaleDateString() : 'N/A'}
                                </small>
                              </div>
                            </div>
                            <div className="applicant-meta">
                              <div 
                                className="match-score"
                                style={{
                                  backgroundColor: matchScore >= 80 ? '#28a745' : 
                                                matchScore >= 60 ? '#ffc107' : '#dc3545'
                                }}
                              >
                                {matchScore}% Match
                              </div>
                              <div className="application-status-badge-container">
                                <div 
                                  className="application-status-badge"
                                  style={{
                                    backgroundColor: 
                                      status === 'offer_extended' ? '#f59e0b' :
                                      status === 'declined' ? '#ef4444' :
                                      status === 'hired' ? '#10b981' :
                                      getStatusColor(status)
                                  }}
                                >
                                  {status === 'offer_extended' ? 'Offer Pending' :
                                   status === 'declined' ? 'Declined' :
                                   status === 'hired' ? 'Hired' :
                                   status.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="applicant-actions">
                            <button 
                              className="btn-view-details"
                              onClick={() => handleViewApplicationDetails(application.id)}
                            >
                              <i className="fas fa-eye"></i> View CV & Details
                            </button>
                            
                            <select 
                              className="status-select"
                              value={status}
                              onChange={(e) => handleUpdateApplicationStatus(application, e.target.value)}
                              style={{ borderColor: getStatusColor(status) }}
                              disabled={status === 'hired' || status === 'declined'}
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Send Offer</option>
                            </select>

                            <button 
                              className="btn-notes"
                              onClick={() => {
                                const notes = prompt('Add notes for this applicant:', application.notes || '')
                                if (notes !== null) {
                                  handleUpdateApplicationStatus(application, status, notes)
                                }
                              }}
                            >
                              <i className="fas fa-sticky-note"></i> Notes
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column – company sidebar */}
        <div className="company-sidebar">
          {/* Company Profile Card */}
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3><i className="fas fa-building"></i> Company Profile</h3>
            </div>
            <div className="company-profile-summary">
              <div className="profile-avatar-large">
                {company?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <h4>{company?.name || 'Your Company'}</h4>
              <p className="company-email">{user?.email || 'company@example.com'}</p>
              {company?.website && (
                <p className="company-website">
                  <i className="fas fa-globe"></i> {company.website}
                </p>
              )}
            </div>

            <div className="sidebar-stats">
              <div className="stat-item">
                <div className="stat-value">{postedJobs.length}</div>
                <div className="stat-label">Posted Jobs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{totalApplicants}</div>
                <div className="stat-label">Applicants</div>
              </div>
            </div>

            <div className="sidebar-actions">
              <button 
                className="sidebar-btn primary"
                onClick={() => setActiveTab('postJob')}
              >
                <i className="fas fa-plus"></i> Post New Job
              </button>
              <button 
                className="sidebar-btn secondary"
                onClick={() => setActiveTab('postedJobs')}
              >
                <i className="fas fa-list"></i> View All Jobs
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
                <span>Write clear job descriptions to attract better candidates</span>
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                <span>Review applicants promptly – top talent gets snatched fast</span>
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                <span>Keep your company profile updated</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="jobposting-footer">
        <p>
          <i className="fas fa-info-circle"></i> Need help? Contact support@example.com
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} Intelligent Recruitment Platform
        </p>
      </footer>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-user-circle"></i> 
                Application Details: {selectedApplication.application.user?.name || 'Applicant'}
              </h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedApplication(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="applicant-profile">
                <div className="profile-section">
                  <h4><i className="fas fa-user"></i> Personal Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Name:</strong> {selectedApplication.application.user?.name || 'N/A'}
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong> {selectedApplication.application.user?.email || 'N/A'}
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong> {selectedApplication.application.user?.phone || 'Not provided'}
                    </div>
                    <div className="info-item">
                      <strong>Applied On:</strong> {formatDate(selectedApplication.application.applied_at || selectedApplication.application.created_at)}
                    </div>
                    <div className="info-item">
                      <strong>Match Score:</strong> 
                      <span className="score-badge" style={{
                        backgroundColor: selectedApplication.application.match_score >= 80 ? '#28a745' : 
                                       selectedApplication.application.match_score >= 60 ? '#ffc107' : '#dc3545'
                      }}>
                        {selectedApplication.application.match_score || 0}%
                      </span>
                    </div>
                    <div className="info-item">
                      <strong>Status:</strong>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(selectedApplication.application.status) }}
                      >
                        {selectedApplication.application.status === 'offer_extended' ? 'Offer Pending' : 
                         selectedApplication.application.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApplication.application?.cv?.structured_data && (
                  <>
                    <div className="profile-section">
                      <h4><i className="fas fa-briefcase"></i> Professional Information</h4>
                      <div className="info-grid">
                        {hasValue(selectedApplication.application.cv.structured_data.professional_title) && (
                          <div className="info-item">
                            <strong>Professional Title:</strong> 
                            {selectedApplication.application.cv.structured_data.professional_title}
                          </div>
                        )}
                        {hasValue(selectedApplication.application.cv.structured_data.experience_years) && (
                          <div className="info-item">
                            <strong>Years of Experience:</strong> 
                            {selectedApplication.application.cv.structured_data.experience_years} years
                          </div>
                        )}
                        {hasValue(selectedApplication.application.cv.structured_data.education_level) && (
                          <div className="info-item">
                            <strong>Education Level:</strong> 
                            {selectedApplication.application.cv.structured_data.education_level}
                          </div>
                        )}
                      </div>
                    </div>

                    {hasValue(selectedApplication.application.cv.structured_data.summary) && (
                      <div className="profile-section">
                        <h4><i className="fas fa-align-left"></i> Professional Summary</h4>
                        <div className="summary-text">
                          {selectedApplication.application.cv.structured_data.summary}
                        </div>
                      </div>
                    )}

                    {selectedApplication.application.cv.structured_data.skills && 
                     selectedApplication.application.cv.structured_data.skills.length > 0 && (
                      <div className="profile-section">
                        <h4><i className="fas fa-code"></i> Skills</h4>
                        <div className="skills-grid">
                          {selectedApplication.application.cv.structured_data.skills.map((skill, index) => (
                            <div key={index} className="skill-badge">
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="profile-section">
                  <h4><i className="fas fa-sticky-note"></i> Notes</h4>
                  <textarea 
                    className="notes-textarea"
                    defaultValue={selectedApplication.application.notes || ''}
                    placeholder="Add your notes about this applicant..."
                    rows="4"
                    onChange={(e) => {
                      setSelectedApplication(prev => ({
                        ...prev,
                        application: {
                          ...prev.application,
                          notes: e.target.value
                        }
                      }))
                    }}
                  />
                  <button 
                    className="save-notes-btn"
                    onClick={async () => {
                      try {
                        await api.updateApplicationStatus(
                          selectedApplication.application.id,
                          { status: selectedApplication.application.status, notes: selectedApplication.application.notes }
                        )
                        alert('Notes saved successfully')
                      } catch (error) {
                        console.error('Error saving notes:', error)
                        alert('Failed to save notes')
                      }
                    }}
                  >
                    <i className="fas fa-save"></i> Save Notes
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </button>
              <button 
                className="update-btn"
                onClick={() => {
                  setTempStatus(selectedApplication.application.status || 'pending');
                  setShowStatusModal(true);
                }}
                disabled={selectedApplication.application.status === 'hired' || selectedApplication.application.status === 'declined'}
              >
                <i className="fas fa-sync-alt"></i> Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Selection Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Application Status</h3>
              <button className="close-modal" onClick={() => setShowStatusModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select New Status</label>
                <select 
                  className="form-control"
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Send Offer</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  if (tempStatus === 'shortlisted') {
                    setSelectedApplicationForAction(selectedApplication.application);
                    setShowStatusModal(false);
                    setShowShortlistModal(true);
                  } else if (tempStatus === 'hired') {
                    setSelectedApplicationForAction(selectedApplication.application);
                    setShowStatusModal(false);
                    setShowHireModal(true);
                  } else {
                    handleUpdateApplicationStatus(selectedApplication.application, tempStatus);
                    setShowStatusModal(false);
                    setSelectedApplication(null);
                  }
                }}
              >
                Update Status
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortlist Modal */}
      {showShortlistModal && (
        <div className="modal-overlay" onClick={() => setShowShortlistModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Interview</h3>
              <button className="close-modal" onClick={() => setShowShortlistModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleShortlistSubmit}>
                <div className="form-group">
                  <label>Interview Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={interviewData.interview_scheduled_at}
                    onChange={e => setInterviewData({...interviewData, interview_scheduled_at: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Location (Zoom link, office address, etc.)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={interviewData.interview_location}
                    onChange={e => setInterviewData({...interviewData, interview_location: e.target.value})}
                    placeholder="e.g., Zoom meeting ID or office address"
                  />
                </div>
                <div className="form-group">
                  <label>Additional Notes (optional)</label>
                  <textarea
                    className="form-control"
                    value={interviewData.interview_notes}
                    onChange={e => setInterviewData({...interviewData, interview_notes: e.target.value})}
                    rows="3"
                    placeholder="Any special instructions for the candidate..."
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    <i className="fas fa-paper-plane"></i> Send Invitation
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowShortlistModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hire Modal */}
      {showHireModal && (
        <div className="modal-overlay" onClick={() => setShowHireModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Job Offer</h3>
              <button className="close-modal" onClick={() => setShowHireModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleHireSubmit}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={hireData.start_date}
                    onChange={e => setHireData({...hireData, start_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Workplace Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={hireData.workplace_address}
                    onChange={e => setHireData({...hireData, workplace_address: e.target.value})}
                    placeholder="Office address or remote location"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    <i className="fas fa-paper-plane"></i> Send Offer
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowHireModal(false)}>
                    Cancel
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

export default JobPostingDashboard