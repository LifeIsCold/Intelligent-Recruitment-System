// src/components/Dashboard.jsx - Final Clean Version
import React, { useState, useEffect } from 'react'
import '../App.css'

const Dashboard = ({ onOptionClick }) => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Mock data
    const mockJobs = [
      {
        id: 1,
        title: "Frontend Developer",
        company: "TechCorp Inc.",
        location: "Remote",
        description: "We're looking for an experienced frontend developer with React expertise to join our growing team.",
        skills: ["React", "JavaScript", "HTML/CSS", "Redux", "TypeScript"],
        salary: "$80,000 - $100,000",
        postedDate: "2023-10-15",
        experience: "3+ years",
        type: "Full-time",
        logoColor: "#667eea"
      },
      {
        id: 2,
        title: "Backend Engineer",
        company: "DataSystems Ltd",
        location: "New York, NY",
        description: "Join our backend team to build scalable microservices and APIs for enterprise applications.",
        skills: ["Node.js", "Python", "PostgreSQL", "Docker", "AWS", "Redis"],
        salary: "$90,000 - $120,000",
        postedDate: "2023-10-18",
        experience: "5+ years",
        type: "Full-time",
        logoColor: "#f093fb"
      },
      {
        id: 3,
        title: "Full Stack Developer",
        company: "StartUpXYZ",
        location: "San Francisco, CA",
        description: "Early-stage startup looking for a versatile full-stack developer to work on our core product.",
        skills: ["React", "Node.js", "MongoDB", "Express", "TypeScript", "GraphQL"],
        salary: "$85,000 - $110,000",
        postedDate: "2023-10-20",
        experience: "2+ years",
        type: "Full-time",
        logoColor: "#4facfe"
      },
      {
        id: 4,
        title: "UX/UI Designer",
        company: "CreativeMinds",
        location: "Chicago, IL",
        description: "Design beautiful and intuitive user interfaces for our products across web and mobile platforms.",
        skills: ["Figma", "Adobe XD", "UI/UX Design", "Prototyping", "User Research", "Wireframing"],
        salary: "$70,000 - $95,000",
        postedDate: "2023-10-22",
        experience: "4+ years",
        type: "Full-time",
        logoColor: "#f093fb"
      },
      {
        id: 5,
        title: "Data Scientist",
        company: "AnalyticsPro",
        location: "Boston, MA",
        description: "Work with large datasets to extract insights and build predictive models for business decisions.",
        skills: ["Python", "Machine Learning", "SQL", "Pandas", "TensorFlow", "R", "Statistics"],
        salary: "$100,000 - $130,000",
        postedDate: "2023-10-25",
        experience: "3+ years",
        type: "Full-time",
        logoColor: "#667eea"
      },
      {
        id: 6,
        title: "DevOps Engineer",
        company: "CloudTech Solutions",
        location: "Remote",
        description: "Manage and optimize our cloud infrastructure and CI/CD pipelines for maximum efficiency.",
        skills: ["AWS", "Kubernetes", "Docker", "Terraform", "Linux", "CI/CD", "Jenkins"],
        salary: "$95,000 - $125,000",
        postedDate: "2023-10-28",
        experience: "4+ years",
        type: "Full-time",
        logoColor: "#4facfe"
      }
    ]

    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
  }, [])

  const handleSearch = () => {
    let result = jobs

    if (searchTerm) {
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredJobs(result)
  }

  useEffect(() => {
    handleSearch()
  }, [searchTerm])

  const clearFilters = () => {
    setSearchTerm('')
  }

  return (
    <div className="main-dashboard">
      <header className="main-header">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-brain logo-icon"></i>
            <div className="logo-text">
              <h1>Intelligent Recruitment Platform</h1>
              <p className="tagline">AI-powered job matching and recruitment</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <i className="fas fa-briefcase"></i>
              <span>{jobs.length} Jobs</span>
            </div>
            <div className="stat-item">
              <i className="fas fa-building"></i>
              <span>{new Set(jobs.map(j => j.company)).size} Companies</span>
            </div>
            <div className="stat-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{new Set(jobs.map(j => j.location)).size} Locations</span>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <div className="jobs-section">
          <div className="section-header">
            <h2><i className="fas fa-briefcase"></i> Available Jobs</h2>
            <div className="header-actions">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-btn" onClick={handleSearch}>
                  Search
                </button>
              </div>
              {searchTerm && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <i className="fas fa-times"></i> Clear
                </button>
              )}
            </div>
          </div>

          <div className="jobs-count">
            <span className="count-badge">
              <i className="fas fa-briefcase"></i>
              {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
            </span>
            {searchTerm && (
              <span className="search-term">
                Searching for: "{searchTerm}"
              </span>
            )}
          </div>

          <div className="jobs-grid">
            {filteredJobs.length === 0 ? (
              <div className="no-jobs">
                <i className="fas fa-search"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search terms</p>
                <button onClick={clearFilters}>Clear Search</button>
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="job-card-main">
                  <div className="job-card-header-main" style={{ background: job.logoColor }}>
                    <div className="company-logo">
                      <span>{job.company.charAt(0)}</span>
                    </div>
                    <div className="job-title-section-main">
                      <h3>{job.title}</h3>
                      <div className="company-info-main">
                        <i className="fas fa-building"></i>
                        <span>{job.company}</span>
                      </div>
                    </div>
                  </div>

                  <div className="job-card-body-main">
                    <div className="job-meta-main">
                      <div className="meta-item-main">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{job.location}</span>
                      </div>
                      <div className="meta-item-main">
                        <i className="fas fa-money-bill-wave"></i>
                        <span>{job.salary}</span>
                      </div>
                      <div className="meta-item-main">
                        <i className="fas fa-clock"></i>
                        <span>{job.experience}</span>
                      </div>
                    </div>

                    <p className="job-description-main">{job.description}</p>

                    <div className="job-skills-main">
                      <h4><i className="fas fa-cogs"></i> Required Skills:</h4>
                      <div className="skills-tags-main">
                        {job.skills.slice(0, 4).map((skill, index) => (
                          <span key={index} className="skill-tag-main">{skill}</span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="skill-tag-more">+{job.skills.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="job-card-footer-main">
                    <button className="apply-btn-main">
                      <i className="fas fa-paper-plane"></i> Apply Now
                    </button>
                    <button className="save-btn-main">
                      <i className="far fa-bookmark"></i> Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-options">
          <div className="sidebar-header">
            <h3><i className="fas fa-user-circle"></i> User Options</h3>
            <p>Select your role to continue</p>
          </div>

          <div className="options-list">
            <div className="option-item" onClick={() => onOptionClick('jobSeeker')}>
              <div className="option-icon-main jobseeker-icon">
                <i className="fas fa-user-tie"></i>
              </div>
              <div className="option-content">
                <h4>Job Seeker</h4>
                <p>Upload CV, find jobs, get matched</p>
              </div>
              <div className="option-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>

            <div className="option-item" onClick={() => onOptionClick('jobPosting')}>
              <div className="option-icon-main employer-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <div className="option-content">
                <h4>Job Posting</h4>
                <p>Post jobs, manage applications</p>
              </div>
              <div className="option-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>

            <div className="option-item" onClick={() => onOptionClick('admin')}>
              <div className="option-icon-main admin-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <div className="option-content">
                <h4>Admin</h4>
                <p>Manage platform, view analytics</p>
              </div>
              <div className="option-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>

          <div className="sidebar-stats">
            <h4><i className="fas fa-chart-line"></i> Platform Stats</h4>
            <div className="stats-grid">
              <div className="stat-box">
                <i className="fas fa-users"></i>
                <div className="stat-box-content">
                  <h5>2,500+</h5>
                  <p>Job Seekers</p>
                </div>
              </div>
              <div className="stat-box">
                <i className="fas fa-building"></i>
                <div className="stat-box-content">
                  <h5>350+</h5>
                  <p>Companies</p>
                </div>
              </div>
              <div className="stat-box">
                <i className="fas fa-handshake"></i>
                <div className="stat-box-content">
                  <h5>85%</h5>
                  <p>Match Rate</p>
                </div>
              </div>
              <div className="stat-box">
                <i className="fas fa-rocket"></i>
                <div className="stat-box-content">
                  <h5>30 days</h5>
                  <p>Avg. Hiring Time</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-info">
            <h4><i className="fas fa-info-circle"></i> How it works:</h4>
            <ol>
              <li><strong>Job Seekers</strong> - Upload CV and find matching jobs</li>
              <li><strong>Employers</strong> - Post jobs and find qualified candidates</li>
              <li><strong>Admins</strong> - Manage the platform and monitor activity</li>
            </ol>
          </div>
        </div>
      </div>

      
      
    </div>
  )
}

export default Dashboard