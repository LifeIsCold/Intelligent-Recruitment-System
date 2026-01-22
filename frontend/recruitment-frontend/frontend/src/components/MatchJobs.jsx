// src/components/MatchJobs.jsx
import React, { useState, useEffect } from 'react'
import '../App.css'

const MatchJobs = ({ uploadedCVs, selectedJob }) => {
  const [cvSelection, setCvSelection] = useState('')
  const [jobSelection, setJobSelection] = useState('')
  const [matchResult, setMatchResult] = useState(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchHistory, setMatchHistory] = useState([])

  // Mock jobs data
  const mockJobs = [
    {
      id: 1,
      title: "Frontend Developer",
      company: "TechCorp Inc.",
      skills: ["React", "JavaScript", "HTML/CSS", "Redux", "TypeScript"]
    },
    {
      id: 2,
      title: "Backend Engineer",
      company: "DataSystems Ltd",
      skills: ["Node.js", "Python", "PostgreSQL", "Docker", "AWS"]
    },
    {
      id: 3,
      title: "Full Stack Developer",
      company: "StartUpXYZ",
      skills: ["React", "Node.js", "MongoDB", "Express", "TypeScript"]
    }
  ]

  useEffect(() => {
    if (selectedJob) {
      setJobSelection(selectedJob.id.toString())
    }
  }, [selectedJob])

  const handleMatch = () => {
    if (!cvSelection || !jobSelection) {
      alert('Please select both a CV and a Job')
      return
    }

    setIsMatching(true)

    // Simulate API call
    setTimeout(() => {
      const selectedCV = uploadedCVs.find(cv => cv.id.toString() === cvSelection)
      const selectedJob = mockJobs.find(job => job.id.toString() === jobSelection)

      if (!selectedCV || !selectedJob) {
        alert('Invalid selection')
        setIsMatching(false)
        return
      }

      // Calculate match score
      const cvSkills = selectedCV.skills || []
      const jobSkills = selectedJob.skills || []
      
      const matchedSkills = cvSkills.filter(skill => 
        jobSkills.some(js => js.toLowerCase().includes(skill.toLowerCase()) ||
                           skill.toLowerCase().includes(js.toLowerCase()))
      )
      
      const missingSkills = jobSkills.filter(skill => 
        !cvSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()) ||
                            skill.toLowerCase().includes(cs.toLowerCase()))
      )
      
      const matchScore = Math.round((matchedSkills.length / jobSkills.length) * 100)
      
      const result = {
        cv: selectedCV,
        job: selectedJob,
        score: matchScore,
        matchedSkills,
        missingSkills,
        timestamp: new Date().toLocaleString(),
        recommendation: getRecommendation(matchScore)
      }

      setMatchResult(result)
      
      // Add to history
      setMatchHistory(prev => [result, ...prev.slice(0, 4)])
      setIsMatching(false)
    }, 1500)
  }

  const getRecommendation = (score) => {
    if (score >= 80) return "Excellent match! Strongly recommended to apply."
    if (score >= 60) return "Good match. Consider applying with emphasis on your matching skills."
    if (score >= 40) return "Moderate match. You might need to acquire some missing skills."
    return "Poor match. Consider applying to more relevant positions or upskilling."
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981"
    if (score >= 60) return "#3b82f6"
    if (score >= 40) return "#f59e0b"
    return "#ef4444"
  }

  const resetMatch = () => {
    setMatchResult(null)
    setCvSelection('')
    setJobSelection('')
  }

  return (
    <div className="match-jobs-container">
      <div className="match-controls">
        <div className="match-card">
          <div className="card-header">
            <h2><i className="fas fa-chart-line"></i> Job-CV Matching</h2>
            <p>Match your uploaded CVs with available jobs to find the best fit</p>
          </div>

          <div className="selection-form">
            <div className="form-group">
              <label htmlFor="cvSelect">
                <i className="fas fa-file-alt"></i> Select Your CV
              </label>
              <select
                id="cvSelect"
                value={cvSelection}
                onChange={(e) => setCvSelection(e.target.value)}
                disabled={uploadedCVs.length === 0}
              >
                <option value="">{uploadedCVs.length === 0 ? 'No CVs uploaded yet' : 'Select a CV...'}</option>
                {uploadedCVs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.fileName || `CV ${cv.id}`} - {cv.skills?.length || 0} skills
                  </option>
                ))}
              </select>
              {uploadedCVs.length === 0 && (
                <p className="hint">Upload a CV first from the Upload CV tab</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="jobSelect">
                <i className="fas fa-briefcase"></i> Select Job to Match
              </label>
              <select
                id="jobSelect"
                value={jobSelection}
                onChange={(e) => setJobSelection(e.target.value)}
              >
                <option value="">Select a job...</option>
                {mockJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} at {job.company}
                  </option>
                ))}
              </select>
              <p className="hint">Or select a job from Available Jobs tab</p>
            </div>

            <button
              className={`match-button ${isMatching ? 'loading' : ''}`}
              onClick={handleMatch}
              disabled={isMatching || !cvSelection || !jobSelection || uploadedCVs.length === 0}
            >
              {isMatching ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Matching...
                </>
              ) : (
                <>
                  <i className="fas fa-chart-line"></i> Calculate Match Score
                </>
              )}
            </button>
          </div>
        </div>

        {matchResult && (
          <div className="result-card">
            <div className="result-header">
              <h2>Match Result</h2>
              <button className="reset-button" onClick={resetMatch}>
                <i className="fas fa-redo"></i> New Match
              </button>
            </div>

            <div className="score-display">
              <div 
                className="score-circle"
                style={{ 
                  background: `conic-gradient(${getScoreColor(matchResult.score)} ${matchResult.score * 3.6}deg, #e5e7eb 0deg)` 
                }}
              >
                <div className="score-inner">
                  <span className="score-value">{matchResult.score}%</span>
                  <span className="score-label">Match</span>
                </div>
              </div>
              <div className="score-details">
                <h3>{matchResult.job.title} at {matchResult.job.company}</h3>
                <p className="recommendation">{matchResult.recommendation}</p>
                <div className="match-time">
                  <i className="fas fa-clock"></i> Matched on {matchResult.timestamp}
                </div>
              </div>
            </div>

            <div className="skills-analysis">
              <div className="skills-section">
                <h4><i className="fas fa-check-circle" style={{color: "#10b981"}}></i> Matched Skills ({matchResult.matchedSkills.length})</h4>
                <div className="skills-tags">
                  {matchResult.matchedSkills.map((skill, index) => (
                    <span key={index} className="skill-tag matched">{skill}</span>
                  ))}
                  {matchResult.matchedSkills.length === 0 && (
                    <p className="no-skills">No skills matched</p>
                  )}
                </div>
              </div>

              <div className="skills-section">
                <h4><i className="fas fa-times-circle" style={{color: "#ef4444"}}></i> Missing Skills ({matchResult.missingSkills.length})</h4>
                <div className="skills-tags">
                  {matchResult.missingSkills.map((skill, index) => (
                    <span key={index} className="skill-tag missing">{skill}</span>
                  ))}
                  {matchResult.missingSkills.length === 0 && (
                    <p className="no-skills">All required skills are matched!</p>
                  )}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="action-btn apply-btn">
                <i className="fas fa-paper-plane"></i> Apply for this Job
              </button>
              <button className="action-btn save-btn">
                <i className="far fa-save"></i> Save Result
              </button>
              <button className="action-btn share-btn">
                <i className="fas fa-share-alt"></i> Share
              </button>
            </div>
          </div>
        )}
      </div>

      {matchHistory.length > 0 && (
        <div className="match-history">
          <h3><i className="fas fa-history"></i> Recent Matches</h3>
          <div className="history-list">
            {matchHistory.map((match, index) => (
              <div key={index} className="history-item">
                <div className="history-job">
                  <strong>{match.job.title}</strong>
                  <span>{match.job.company}</span>
                </div>
                <div className="history-score" style={{color: getScoreColor(match.score)}}>
                  {match.score}%
                </div>
                <div className="history-time">
                  {match.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="matching-tips">
        <h3><i className="fas fa-lightbulb"></i> Tips for Better Matching</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <i className="fas fa-file-alt"></i>
            <h4>Detailed CV</h4>
            <p>Include all your skills, experience, and certifications in your CV for accurate matching.</p>
          </div>
          <div className="tip-card">
            <i className="fas fa-cogs"></i>
            <h4>Skill Alignment</h4>
            <p>Focus on jobs that match at least 60% of your skills for better chances.</p>
          </div>
          <div className="tip-card">
            <i className="fas fa-sync-alt"></i>
            <h4>Regular Updates</h4>
            <p>Update your CV regularly with new skills and experiences.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchJobs