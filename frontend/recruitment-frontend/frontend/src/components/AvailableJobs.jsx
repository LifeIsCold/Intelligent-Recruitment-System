// src/components/AvailableJobs.jsx
import React, { useState, useEffect } from 'react'
import '../App.css'

const AvailableJobs = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Mock data - in real app, fetch from API
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
        type: "Full-time"
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
        type: "Full-time"
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
        type: "Full-time"
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
        type: "Full-time"
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
        type: "Full-time"
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
        type: "Full-time"
      },
      {
        id: 7,
        title: "Mobile App Developer",
        company: "AppWorks",
        location: "Austin, TX",
        description: "Develop cross-platform mobile applications using React Native for our consumer products.",
        skills: ["React Native", "JavaScript", "iOS", "Android", "Redux", "Firebase"],
        salary: "$85,000 - $105,000",
        postedDate: "2023-10-30",
        experience: "3+ years",
        type: "Full-time"
      },
      {
        id: 8,
        title: "Python Developer",
        company: "CodeCrafters",
        location: "Remote",
        description: "Build backend services and data processing pipelines using Python and Django.",
        skills: ["Python", "Django", "Flask", "PostgreSQL", "REST APIs", "Celery"],
        salary: "$75,000 - $100,000",
        postedDate: "2023-11-01",
        experience: "2+ years",
        type: "Contract"
      }
    ]

    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
  }, [])

  const allSkills = Array.from(
    new Set(jobs.flatMap(job => job.skills))
  ).sort()

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleSearch = () => {
    let result = jobs

    if (searchTerm) {
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSkills.length > 0) {
      result = result.filter(job =>
        selectedSkills.every(skill => job.skills.includes(skill))
      )
    }

    setFilteredJobs(result)
  }

  useEffect(() => {
    handleSearch()
  }, [selectedSkills, searchTerm])

  const clearFilters = () => {
    setSelectedSkills([])
    setSearchTerm('')
  }

  return (
    <div className="available-jobs-container">
      <div className="jobs-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search jobs by title, company, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="skills-filter">
          <h4><i className="fas fa-filter"></i> Filter by Skills:</h4>
          <div className="skills-tags-filter">
            {allSkills.map(skill => (
              <button
                key={skill}
                className={`skill-filter-tag ${selectedSkills.includes(skill) ? 'active' : ''}`}
                onClick={() => handleSkillToggle(skill)}
              >
                {skill} {selectedSkills.includes(skill) ? '✓' : '+'}
              </button>
            ))}
          </div>
          {selectedSkills.length > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="jobs-stats">
        <div className="stat-badge">
          <i className="fas fa-briefcase"></i>
          <span>{filteredJobs.length} Jobs Found</span>
        </div>
        <div className="stat-badge">
          <i className="fas fa-map-marker-alt"></i>
          <span>{new Set(filteredJobs.map(j => j.location)).size} Locations</span>
        </div>
        <div className="stat-badge">
          <i className="fas fa-tags"></i>
          <span>{allSkills.length} Skills Tracked</span>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="no-jobs">
          <i className="fas fa-search"></i>
          <h3>No jobs found matching your criteria</h3>
          <p>Try adjusting your filters or search terms</p>
          <button onClick={clearFilters}>Clear All Filters</button>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div className="job-title-section">
                  <h3>{job.title}</h3>
                  <span className="job-type">{job.type}</span>
                </div>
                <div className="company-info">
                  <i className="fas fa-building"></i>
                  <span>{job.company}</span>
                </div>
              </div>

              <div className="job-card-body">
                <div className="job-meta">
                  <div className="meta-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{job.location}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-money-bill-wave"></i>
                    <span>{job.salary}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-clock"></i>
                    <span>Posted: {job.postedDate}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-user-graduate"></i>
                    <span>{job.experience}</span>
                  </div>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-skills">
                  <h4><i className="fas fa-cogs"></i> Required Skills:</h4>
                  <div className="skills-tags">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="job-card-footer">
                <button 
                  className="apply-button"
                  onClick={() => onJobSelect(job)}
                >
                  <i className="fas fa-chart-line"></i> Match with CV
                </button>
                <button className="save-button">
                  <i className="far fa-bookmark"></i> Save
                </button>
                <button className="details-button">
                  <i className="fas fa-info-circle"></i> Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button className="page-btn" disabled>
          <i className="fas fa-chevron-left"></i> Previous
        </button>
        <span className="page-info">Page 1 of {Math.ceil(filteredJobs.length / 6)}</span>
        <button className="page-btn">
          Next <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  )
}

export default AvailableJobs