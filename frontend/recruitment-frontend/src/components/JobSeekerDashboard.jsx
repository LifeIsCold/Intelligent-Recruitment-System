// src/components/JobSeekerDashboard.jsx
import React, { useState } from 'react'
import CVUpload from './CVUpload'
import AvailableJobs from './AvailableJobs'
import MatchJobs from './MatchJobs'
import './JobSeeker.css';
import { useNavigate } from 'react-router-dom'



const JobSeekerDashboard = ({ onBack }) => {
  const navigate = useNavigate()
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

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    navigate('/')
  }

  return (
    <div className="jobseeker-container">
      <div className="dashboard-topbar">
        <div className="topbar-left">
          <i className="fas fa-brain logo-icon small"></i>
          <h2>Job Seeker Dashboard</h2>
        </div>
        <div className="topbar-actions">
          <button className="edit-profile-button" onClick={() => navigate('/edit-profile')}><i className="fas fa-user-edit"></i> Edit Profile</button>
          <button className="logout-button" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </div>

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
    </div>
  )
}

export default JobSeekerDashboard
