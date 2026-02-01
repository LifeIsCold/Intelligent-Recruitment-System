// src/components/AvailableJobs.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/api'
import '../App.css'

const AvailableJobs = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Categories list
  const categories = ['All', 'Healthcare', 'Industries', 'IT', 'Finance', 'Human Resource']

  useEffect(() => {
    // Fetch real jobs from backend
    api.getJobs().then(res => {
      const payload = res.data || res
      const jobsFromApi = Array.isArray(payload) ? payload : (payload.data || [])
      const mapped = jobsFromApi.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company?.name || 'Unknown',
        location: j.work_type ? (j.work_type.charAt(0).toUpperCase() + j.work_type.slice(1)) : 'Remote',
        category: j.industry?.name || 'General',
        description: j.description || '',
        skills: j.required_skills || [],
        salary: j.salary || 'Negotiable',
        postedDate: j.created_at ? new Date(j.created_at).toLocaleDateString() : '',
        experience: j.experience || 'Not specified',
        type: j.work_time === 'full_time' ? 'Full-time' : 'Part-time'
      }))
      setJobs(mapped)
      setFilteredJobs(mapped)
    }).catch(() => {
      // fallback to empty list
      setJobs([])
      setFilteredJobs([])
    })
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

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(job => job.category === selectedCategory)
    }

    setFilteredJobs(result)
  }

  useEffect(() => {
    handleSearch()
  }, [searchTerm, selectedCategory])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getCategoryStats = () => {
    const stats = {}
    categories.forEach(cat => {
      if (cat !== 'All') {
        stats[cat] = jobs.filter(job => job.category === cat).length
      }
    })
    return stats
  }

  const categoryStats = getCategoryStats()

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
            onKeyPress={handleKeyPress}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
          <button className="clear-button" onClick={clearFilters}>
            <i className="fas fa-times"></i> Clear
          </button>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <div className="filter-label">
            <i className="fas fa-filter"></i> Filter by Category:
          </div>
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category} {category !== 'All' && `(${categoryStats[category] || 0})`}
              </option>
            ))}
          </select>
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
          <span>All Skills Tracked</span>
        </div>
        {selectedCategory !== 'All' && (
          <div className="stat-badge category-badge">
            <i className="fas fa-folder"></i>
            <span>Category: {selectedCategory}</span>
          </div>
        )}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="no-jobs">
          <i className="fas fa-search"></i>
          <h3>No jobs found matching your criteria</h3>
          <p>Try adjusting your search terms or select a different category</p>
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
                  <span className="job-category-badge">{job.category}</span>
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