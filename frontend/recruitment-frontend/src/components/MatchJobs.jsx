import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './MatchJobs.css';

const MatchJobs = ({ uploadedCVs, selectedJob }) => {
  const [cvSelection, setCvSelection] = useState('');
  const [jobSelection, setJobSelection] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBgeAnalysis, setShowBgeAnalysis] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [customWeights, setCustomWeights] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch real jobs from API
  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      setJobSelection(selectedJob.id.toString());
    }
  }, [selectedJob]);

  // Load match history from API when CV is selected
  useEffect(() => {
    if (cvSelection) {
      fetchMatchHistory(cvSelection);
    }
  }, [cvSelection]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching jobs...');
      
      const response = await api.getJobs();
      console.log('Jobs API response:', response);
      
      if (response && response.success) {
        setAvailableJobs(response.data || []);
      } else if (response && response.data) {
        setAvailableJobs(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setAvailableJobs(response);
      } else {
        console.warn('Unexpected jobs response format:', response);
        setAvailableJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please try again later.');
      setAvailableJobs([]);
      setDebugInfo({
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchHistory = async (cvId) => {
    try {
      console.log('Fetching match history for CV:', cvId);
      
      const response = await api.getCVScoreHistory(cvId);
      console.log('Match history response:', response);
      
      if (response && response.success) {
        const history = (response.data || []).map(score => ({
          id: score.id,
          job: {
            id: score.job?.id,
            title: score.job?.title || 'Unknown Job',
            company: score.job?.company_name || score.job?.company || 'Unknown Company'
          },
          score: score.total_score || 0,
          matchedSkills: score.matched_skills || [],
          missingSkills: score.missing_skills || [],
          breakdown: score.breakdown || {},
          bgeAnalysis: score.bge_analysis,
          timestamp: score.scored_at ? new Date(score.scored_at).toLocaleString() : 'Unknown date'
        }));
        setMatchHistory(history);
      } else {
        setMatchHistory([]);
      }
    } catch (error) {
      console.error('Error fetching match history:', error);
      setMatchHistory([]);
    }
  };

  const handleMatch = async () => {
    if (!cvSelection || !jobSelection) {
      alert('Please select both a CV and a Job');
      return;
    }

    setIsMatching(true);
    setError(null);
    setDebugInfo(null);

    try {
      const selectedCV = uploadedCVs.find(cv => cv.id.toString() === cvSelection);
      const selectedJobObj = availableJobs.find(job => job.id.toString() === jobSelection);

      if (!selectedCV || !selectedJobObj) {
        alert('Invalid selection');
        setIsMatching(false);
        return;
      }

      console.log('Matching CV:', selectedCV);
      console.log('Matching Job:', selectedJobObj);

      // Call the scoring API with custom weights if provided
      const response = await api.scoreCV(selectedCV.id, selectedJobObj.id, null, customWeights);
      console.log('Score API response:', response);

      if (response && response.success) {
        const scoreData = response.data;
        
        let skillDetails = [];
        if (scoreData.skill_analysis) {
          const required = (scoreData.skill_analysis.required || []).map(s => ({ ...s, type: 'matched' }));
          const missing = (scoreData.skill_analysis.missing || []).map(s => ({ ...s, type: 'missing' }));
          const preferred = (scoreData.skill_analysis.preferred || []).map(s => ({ ...s, type: 'preferred' }));
          skillDetails = [...required, ...missing, ...preferred].sort((a, b) => b.score - a.score);
        }

        // Filter breakdown to only show numeric values, not nested objects
        const filteredBreakdown = {};
        if (scoreData.breakdown) {
          Object.entries(scoreData.breakdown).forEach(([key, value]) => {
            if (typeof value === 'number') {
              filteredBreakdown[key] = value;
            }
          });
        }

        const result = {
          id: scoreData.score_id,
          cv: selectedCV,
          job: {
            id: selectedJobObj.id,
            title: selectedJobObj.title,
            company: selectedJobObj.company_name || selectedJobObj.company?.name || 'Unknown Company',
            description: selectedJobObj.description,
            required_skills: selectedJobObj.required_skills || []
          },
          score: Math.round(scoreData.total_score || 0),
          matchedSkills: scoreData.matched_required_skills || [],
          missingSkills: scoreData.missing_required_skills || [],
          preferredSkills: scoreData.matched_preferred_skills || [],
          skillDetails: skillDetails,
          breakdown: filteredBreakdown,
          weightsUsed: scoreData.weights_used || null,
          bgeAnalysis: scoreData.bge_analysis || null,
          timestamp: new Date().toLocaleString(),
          recommendation: getRecommendation(scoreData.total_score || 0),
          fallback: scoreData.fallback || false
        };

        setMatchResult(result);
        fetchMatchHistory(selectedCV.id);
      } else {
        throw new Error(response?.message || 'Failed to calculate score');
      }
    } catch (error) {
      console.error('Error matching CV:', error);
      
      let errorMessage = 'Failed to calculate match score. ';
      
      if (error.response) {
        errorMessage += `Server responded with status ${error.response.status}. `;
        if (error.response.data?.message) {
          errorMessage += error.response.data.message;
        }
        setDebugInfo({
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        errorMessage += 'No response from server. Please check if the scoring service is running.';
        setDebugInfo({
          message: 'No response received',
          request: error.request
        });
      } else {
        errorMessage += error.message;
        setDebugInfo({
          message: error.message
        });
      }
      setError(errorMessage);
    } finally {
      setIsMatching(false);
    }
  };

  const getRecommendation = (score) => {
    if (score >= 80) return "Excellent match! Strongly recommended to apply.";
    if (score >= 60) return "Good match. Consider applying with emphasis on your matching skills.";
    if (score >= 40) return "Moderate match. You might need to acquire some missing skills.";
    return "Poor match. Consider applying to more relevant positions or upskilling.";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const resetMatch = () => {
    setMatchResult(null);
    setCvSelection('');
    setJobSelection('');
    setError(null);
    setDebugInfo(null);
    setCustomWeights(null);
  };

  const handleApply = async () => {
    if (!matchResult) return;
    
    try {
      console.log('Applying for job:', matchResult.job.id, 'with CV:', matchResult.cv.id);
      const response = await api.applyForJob(matchResult.job.id, matchResult.cv.id);
      console.log('Apply response:', response);
      
      if (response && response.success) {
        alert('Application submitted successfully!');
      } else {
        alert(response?.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      let errorMessage = 'Failed to submit application. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    }
  };

  const handleSaveResult = async () => {
    alert('Match result saved to your history!');
  };

  const loadPreviousMatch = async (historyItem) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading previous match:', historyItem.id);
      const response = await api.getScoreDetails(historyItem.id);
      console.log('Score details response:', response);
      
      if (response && response.success) {
        const data = response.data;
        
        const filteredBreakdown = {};
        if (data.breakdown) {
          Object.entries(data.breakdown).forEach(([key, value]) => {
            if (typeof value === 'number') {
              filteredBreakdown[key] = value;
            }
          });
        }
        
        setMatchResult({
          id: data.id,
          cv: uploadedCVs.find(cv => cv.id.toString() === cvSelection) || { 
            id: cvSelection,
            title: 'CV ' + cvSelection 
          },
          job: {
            id: data.job?.id,
            title: data.job?.title || 'Unknown Job',
            company: data.job?.company_name || data.job?.company || 'Unknown Company',
            description: data.job?.description,
            required_skills: data.job?.required_skills || []
          },
          score: Math.round(data.total_score || 0),
          matchedSkills: data.matched_skills || [],
          missingSkills: data.missing_skills || [],
          breakdown: filteredBreakdown,
          bgeAnalysis: data.bge_analysis,
          timestamp: data.scored_at ? new Date(data.scored_at).toLocaleString() : 'Unknown date',
          recommendation: getRecommendation(data.total_score || 0)
        });
      }
    } catch (error) {
      console.error('Error loading previous match:', error);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomWeight = (key, value) => {
    const numValue = parseInt(value) || 0;
    setCustomWeights(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const applyWeightPreset = (preset) => {
    const presets = {
      balanced: { required: 75, preferred: 0, experience: 20, education: 5, threshold: 0.6 },
      skills_focused: { required: 90, preferred: 10, experience: 0, education: 0, threshold: 0.7 },
      experience_focused: { required: 50, preferred: 0, experience: 50, education: 0, threshold: 0.5 },
      education_focused: { required: 60, preferred: 0, experience: 20, education: 20, threshold: 0.6 },
      entry_level: { required: 60, preferred: 0, experience: 20, education: 20, threshold: 0.5 }
    };
    setCustomWeights(presets[preset]);
  };

  const totalWeight = (customWeights?.required || 75) + (customWeights?.preferred || 0) + 
                      (customWeights?.experience || 20) + (customWeights?.education || 5);

  return (
    <div className="match-jobs-container">
      <div className="match-controls">
        <div className="match-card">
          <div className="match-card-header">
            <h2><i className="fas fa-chart-line"></i> Job-CV Matching</h2>
            <p>Match your uploaded CVs with available jobs to find the best fit</p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> 
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="debug-info" style={{
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              <strong>Debug Info:</strong>
              <pre style={{ margin: '8px 0 0 0' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

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
                <option value="">
                  {uploadedCVs.length === 0 ? 'No CVs uploaded yet' : 'Select a CV...'}
                </option>
                {uploadedCVs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.title || cv.file_name || `CV ${cv.id}`} 
                    {cv.is_default ? ' (Default)' : ''}
                    {cv.file_type === 'excel' ? ' 📊' : ' 📝'}
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
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading jobs...' : 'Select a job...'}
                </option>
                {availableJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} at {job.company_name || job.company?.name || 'Unknown Company'}
                  </option>
                ))}
              </select>
              {availableJobs.length === 0 && !loading && (
                <p className="hint">No jobs available at the moment</p>
              )}
            </div>

            {/* Custom Weights Configuration - Partitioned Slider */}
            <button
              type="button"
              className="config-weights-btn"
              onClick={() => setShowWeightsConfig(!showWeightsConfig)}
            >
              <i className="fas fa-sliders-h"></i> Customize Scoring Weights (Optional)
            </button>

            {showWeightsConfig && (
              <div className="custom-weights-panel">
                <h4>
                  <i className="fas fa-chart-pie"></i> Adjust Scoring Weights
                </h4>
                <p className="weights-description">
                  Drag the handles to adjust how each category contributes to the total score.
                  Total must equal 100%.
                </p>
                
                {/* Partitioned Slider */}
                <div className="partition-slider-container">
                  <div className="partition-slider">
                    {(() => {
                      const weights = {
                        required: customWeights?.required ?? 75,
                        preferred: customWeights?.preferred ?? 0,
                        experience: customWeights?.experience ?? 20,
                        education: customWeights?.education ?? 5
                      };
                      
                      // Calculate positions (cumulative percentages)
                      let positions = [];
                      let cumulative = 0;
                      const order = ['required', 'preferred', 'experience', 'education'];
                      order.forEach(key => {
                        cumulative += weights[key];
                        positions.push({ key, value: weights[key], position: cumulative });
                      });
                      
                      // Handle drag on a partition boundary
                      const handleDrag = (e, boundaryIndex) => {
                        const container = e.currentTarget.parentElement;
                        const rect = container.getBoundingClientRect();
                        let x = e.clientX - rect.left;
                        x = Math.max(0, Math.min(x, rect.width));
                        const percent = (x / rect.width) * 100;
                        
                        // Calculate new weights distribution
                        let newWeights = { ...weights };
                        
                        if (boundaryIndex === 0) {
                          // Moving required/preferred boundary
                          const oldRequired = newWeights.required;
                          const oldPreferred = newWeights.preferred;
                          newWeights.required = percent;
                          newWeights.preferred = oldRequired + oldPreferred - percent;
                        } else if (boundaryIndex === 1) {
                          // Moving preferred/experience boundary
                          const oldPreferred = newWeights.preferred;
                          const oldExperience = newWeights.experience;
                          const requiredPart = newWeights.required;
                          newWeights.preferred = percent - requiredPart;
                          newWeights.experience = oldPreferred + oldExperience - newWeights.preferred;
                        } else if (boundaryIndex === 2) {
                          // Moving experience/education boundary
                          const oldExperience = newWeights.experience;
                          const oldEducation = newWeights.education;
                          const requiredPreferredSum = newWeights.required + newWeights.preferred;
                          newWeights.experience = percent - requiredPreferredSum;
                          newWeights.education = oldExperience + oldEducation - newWeights.experience;
                        }
                        
                        // Ensure no negative values
                        Object.keys(newWeights).forEach(key => {
                          if (newWeights[key] < 0) newWeights[key] = 0;
                          if (newWeights[key] > 100) newWeights[key] = 100;
                        });
                        
                        setCustomWeights(newWeights);
                      };
                      
                      return (
                        <>
                          <div 
                            className="slider-track"
                            onMouseMove={(e) => {
                              if (e.buttons === 1 && !isDragging) {
                                setIsDragging(true);
                                const container = e.currentTarget;
                                const rect = container.getBoundingClientRect();
                                let x = e.clientX - rect.left;
                                x = Math.max(0, Math.min(x, rect.width));
                                const percent = (x / rect.width) * 100;
                                
                                // Find which boundary is closest
                                const boundaries = positions.map(p => p.position);
                                let closestIndex = 0;
                                let minDiff = Math.abs(percent - boundaries[0]);
                                for (let i = 1; i < boundaries.length - 1; i++) {
                                  const diff = Math.abs(percent - boundaries[i]);
                                  if (diff < minDiff) {
                                    minDiff = diff;
                                    closestIndex = i;
                                  }
                                }
                                
                                if (minDiff < 5) {
                                  handleDrag({ currentTarget: container, clientX: e.clientX }, closestIndex);
                                }
                                setTimeout(() => setIsDragging(false), 100);
                              }
                            }}
                          >
                            {/* Colored segments */}
                            <div 
                              className="segment segment-required" 
                              style={{ width: `${weights.required}%` }}
                            >
                              <span className="segment-label">Required</span>
                            </div>
                            <div 
                              className="segment segment-preferred" 
                              style={{ width: `${weights.preferred}%` }}
                            >
                              <span className="segment-label">Preferred</span>
                            </div>
                            <div 
                              className="segment segment-experience" 
                              style={{ width: `${weights.experience}%` }}
                            >
                              <span className="segment-label">Experience</span>
                            </div>
                            <div 
                              className="segment segment-education" 
                              style={{ width: `${weights.education}%` }}
                            >
                              <span className="segment-label">Education</span>
                            </div>
                            
                            {/* Draggable handles */}
                            {positions.slice(0, -1).map((pos, idx) => (
                              <div
                                key={idx}
                                className="slider-handle"
                                style={{ left: `${pos.position}%` }}
                                draggable="true"
                                onDragStart={(e) => e.preventDefault()}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const onMouseMove = (moveEvent) => {
                                    const container = document.querySelector('.slider-track');
                                    const rect = container.getBoundingClientRect();
                                    let x = moveEvent.clientX - rect.left;
                                    x = Math.max(0, Math.min(x, rect.width));
                                    const percent = (x / rect.width) * 100;
                                    
                                    let newWeights = { ...weights };
                                    
                                    if (idx === 0) {
                                      const oldRequired = newWeights.required;
                                      const oldPreferred = newWeights.preferred;
                                      newWeights.required = percent;
                                      newWeights.preferred = oldRequired + oldPreferred - percent;
                                    } else if (idx === 1) {
                                      const oldPreferred = newWeights.preferred;
                                      const oldExperience = newWeights.experience;
                                      const requiredPart = newWeights.required;
                                      newWeights.preferred = percent - requiredPart;
                                      newWeights.experience = oldPreferred + oldExperience - newWeights.preferred;
                                    } else if (idx === 2) {
                                      const oldExperience = newWeights.experience;
                                      const oldEducation = newWeights.education;
                                      const requiredPreferredSum = newWeights.required + newWeights.preferred;
                                      newWeights.experience = percent - requiredPreferredSum;
                                      newWeights.education = oldExperience + oldEducation - newWeights.experience;
                                    }
                                    
                                    Object.keys(newWeights).forEach(key => {
                                      if (newWeights[key] < 0) newWeights[key] = 0;
                                      if (newWeights[key] > 100) newWeights[key] = 100;
                                    });
                                    
                                    setCustomWeights(newWeights);
                                  };
                                  
                                  const onMouseUp = () => {
                                    document.removeEventListener('mousemove', onMouseMove);
                                    document.removeEventListener('mouseup', onMouseUp);
                                  };
                                  
                                  document.addEventListener('mousemove', onMouseMove);
                                  document.addEventListener('mouseup', onMouseUp);
                                }}
                              >
                                <div className="handle-grip">
                                  <i className="fas fa-grip-vertical"></i>
                                </div>
                                <div className="handle-value">{Math.round(pos.position)}%</div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Value display under slider */}
                          <div className="weight-values-row">
                            <div className="weight-value-item" style={{ color: '#ef4444' }}>
                              <span className="value-label">Required</span>
                              <span className="value-number">{weights.required}%</span>
                            </div>
                            <div className="weight-value-item" style={{ color: '#f59e0b' }}>
                              <span className="value-label">Preferred</span>
                              <span className="value-number">{weights.preferred}%</span>
                            </div>
                            <div className="weight-value-item" style={{ color: '#10b981' }}>
                              <span className="value-label">Experience</span>
                              <span className="value-number">{weights.experience}%</span>
                            </div>
                            <div className="weight-value-item" style={{ color: '#8b5cf6' }}>
                              <span className="value-label">Education</span>
                              <span className="value-number">{weights.education}%</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Preset buttons as alternative */}
                  <div className="preset-divider">
                    <span>or use presets</span>
                  </div>
                  <div className="preset-buttons">
                    <button type="button" onClick={() => applyWeightPreset('balanced')}>
                      <i className="fas fa-balance-scale"></i> Balanced
                    </button>
                    <button type="button" onClick={() => applyWeightPreset('skills_focused')}>
                      <i className="fas fa-code"></i> Skills Focused
                    </button>
                    <button type="button" onClick={() => applyWeightPreset('experience_focused')}>
                      <i className="fas fa-briefcase"></i> Experience Focused
                    </button>
                    <button type="button" onClick={() => applyWeightPreset('education_focused')}>
                      <i className="fas fa-graduation-cap"></i> Education Focused
                    </button>
                    <button type="button" onClick={() => applyWeightPreset('entry_level')}>
                      <i className="fas fa-seedling"></i> Entry Level
                    </button>
                  </div>
                  
                  <div className={`total-weight ${totalWeight === 100 ? 'valid' : 'invalid'}`}>
                    Total: {totalWeight}%
                  </div>
                </div>
              </div>
            )}
            
            <button
              className={`match-button ${isMatching ? 'loading' : ''}`}
              onClick={handleMatch}
              disabled={isMatching || !cvSelection || !jobSelection || uploadedCVs.length === 0 || loading}
            >
              {isMatching ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Calculating Score...
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
                
                {/* Score Breakdown - Only show numeric values */}
                {matchResult.breakdown && Object.keys(matchResult.breakdown).length > 0 && (
                  <div className="score-breakdown">
                    {Object.entries(matchResult.breakdown).map(([key, value]) => {
                      if (typeof value === 'number') {
                        return (
                          <div key={key} className="breakdown-item">
                            <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                            <span>{value}%</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
                
                {/* Show weights used if available */}
                {matchResult.weightsUsed && (
                  <div className="weights-used">
                    <small>Weights: Required: {matchResult.weightsUsed.required}% | 
                           Preferred: {matchResult.weightsUsed.preferred}% | 
                           Exp: {matchResult.weightsUsed.experience}% | 
                           Edu: {matchResult.weightsUsed.education}%</small>
                  </div>
                )}
                
                <div className="match-time">
                  <i className="fas fa-clock"></i> Matched on {matchResult.timestamp}
                </div>
              </div>
            </div>

            <div className="skills-analysis">
              <div className="skills-section">
                <h4>
                  <i className="fas fa-check-circle" style={{color: "#10b981"}}></i> 
                  Matched Skills ({matchResult.matchedSkills.length})
                </h4>
                <div className="skills-tags">
                  {matchResult.matchedSkills.map((skill, index) => (
                    <span key={index} className="skill-tag matched">
                      {skill}
                    </span>
                  ))}
                  {matchResult.matchedSkills.length === 0 && (
                    <p className="no-skills">No skills matched</p>
                  )}
                </div>
              </div>

              <div className="skills-section">
                <h4>
                  <i className="fas fa-times-circle" style={{color: "#ef4444"}}></i> 
                  Missing Skills ({matchResult.missingSkills.length})
                </h4>
                <div className="skills-tags">
                  {matchResult.missingSkills.map((skill, index) => (
                    <span key={index} className="skill-tag missing">
                      {skill}
                    </span>
                  ))}
                  {matchResult.missingSkills.length === 0 && (
                    <p className="no-skills">All required skills are matched!</p>
                  )}
                </div>
              </div>
            </div>

            {matchResult.bgeAnalysis && (
              <div className="bge-analysis">
                <div className="bge-header" onClick={() => setShowBgeAnalysis(!showBgeAnalysis)}>
                  <h4>
                    <i className="fas fa-robot"></i> AI-Powered Analysis
                  </h4>
                  <i className={`fas fa-chevron-${showBgeAnalysis ? 'up' : 'down'}`}></i>
                </div>
                
                {showBgeAnalysis && (
                  <div className="bge-content">
                    {typeof matchResult.bgeAnalysis === 'object' ? (
                      <>
                        {matchResult.bgeAnalysis.relevance_score && (
                          <div className="analysis-item">
                            <strong>Relevance Score:</strong> {matchResult.bgeAnalysis.relevance_score}%
                          </div>
                        )}
                        {matchResult.bgeAnalysis.strengths && (
                          <div className="analysis-item">
                            <strong>Strengths:</strong>
                            <ul>
                              {matchResult.bgeAnalysis.strengths.map((strength, i) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {matchResult.bgeAnalysis.gaps && (
                          <div className="analysis-item">
                            <strong>Areas for Improvement:</strong>
                            <ul>
                              {matchResult.bgeAnalysis.gaps.map((gap, i) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {matchResult.bgeAnalysis.recommendations && (
                          <div className="analysis-item">
                            <strong>Recommendations:</strong>
                            <p>{matchResult.bgeAnalysis.recommendations}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="analysis-item">
                        <p>{String(matchResult.bgeAnalysis)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="action-buttons">
              <button className="action-btn apply-btn" onClick={handleApply}>
                <i className="fas fa-paper-plane"></i> Apply for this Job
              </button>
              <button className="action-btn save-btn" onClick={handleSaveResult}>
                <i className="far fa-save"></i> Save Result
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
              <div 
                key={index} 
                className="history-item"
                onClick={() => loadPreviousMatch(match)}
                style={{ cursor: 'pointer' }}
              >
                <div className="history-job">
                  <strong>{match.job.title}</strong>
                  <span>{match.job.company}</span>
                </div>
                <div className="history-score" style={{color: getScoreColor(match.score)}}>
                  {Math.round(match.score)}%
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
  );
};

export default MatchJobs;