// src/components/JobSeekerDashboard.jsx
import React, { useState } from 'react'
import CVUpload from './CVUpload'
import AvailableJobs from './AvailableJobs'
import MatchJobs from './MatchJobs'
import '../App.css'

const JobSeekerDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('uploadCV')
  const [uploadedCVs, setUploadedCVs] = useState([])
  const [selectedJobForMatching, setSelectedJobForMatching] = useState(null)

  const handleCVUpload = (cvData) => {
    setUploadedCVs([...uploadedCVs, cvData])
    alert('CV uploaded successfully! You can now match jobs.')
  }

  const handleJobSelectForMatching = (job) => {
    setSelectedJobForMatching(job)
    setActiveTab('matchJob')
  }

  return (
    <div className="jobseeker-container">
      <header className="jobseeker-header">
        <div className="header-content">
          <button className="back-button" onClick={onBack}>
            <i className="fas fa-arrow-left"></i> Back to Main
          </button>
          <div className="logo">
            <i className="fas fa-brain logo-icon"></i>
            <h1>Intelligent Recruitment Platform</h1>
          </div>
          <p className="tagline">Job Seeker Dashboard</p>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'uploadCV' ? 'active' : ''}`}
            onClick={() => setActiveTab('uploadCV')}
          >
            <i className="fas fa-upload"></i> Upload CV
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
          >
            <i className="fas fa-chart-line"></i> Match Job
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'uploadCV' && (
            <CVUpload onUpload={handleCVUpload} />
          )}
          
          {activeTab === 'availableJobs' && (
            <AvailableJobs 
              onJobSelect={handleJobSelectForMatching}
            />
          )}
          
          {activeTab === 'matchJob' && (
            <MatchJobs 
              uploadedCVs={uploadedCVs}
              selectedJob={selectedJobForMatching}
            />
          )}
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <i className="fas fa-file-upload"></i>
          <div className="stat-content">
            <h3>{uploadedCVs.length}</h3>
            <p>CVs Uploaded</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-briefcase"></i>
          <div className="stat-content">
            <h3>24</h3>
            <p>Available Jobs</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-percentage"></i>
          <div className="stat-content">
            <h3>85%</h3>
            <p>Average Match Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobSeekerDashboard