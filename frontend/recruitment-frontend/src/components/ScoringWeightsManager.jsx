// src/components/ScoringWeightsManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ScoringWeightsManager.css';

const ScoringWeightsManager = ({ entityType, entityId, onWeightsUpdate, onClose }) => {
  const [weights, setWeights] = useState({
    required_skills_weight: 75,
    preferred_skills_weight: 0,
    experience_weight: 20,
    education_weight: 5,
    similarity_threshold: 0.6
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activePreset, setActivePreset] = useState('balanced');

  const presets = {
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
  };

  useEffect(() => {
    fetchWeights();
  }, [entityType, entityId]);

  const fetchWeights = async () => {
    setLoading(true);
    try {
      let response;
      if (entityType === 'global') {
        response = await api.getGlobalWeights();
      } else if (entityType === 'company') {
        response = await api.getCompanyWeights(entityId);
      } else if (entityType === 'job') {
        response = await api.getJobWeights(entityId);
      }
      
      if (response.success && response.data) {
        setWeights(response.data);
        // Check which preset matches
        checkActivePreset(response.data);
      }
    } catch (error) {
      console.error('Error fetching weights:', error);
      alert('Failed to load scoring weights');
    } finally {
      setLoading(false);
    }
  };

  const checkActivePreset = (currentWeights) => {
    for (const [presetName, presetValues] of Object.entries(presets)) {
      let matches = true;
      for (const [key, val] of Object.entries(presetValues)) {
        if (currentWeights[key] !== val) {
          matches = false;
          break;
        }
      }
      if (matches) {
        setActivePreset(presetName);
        return;
      }
    }
    setActivePreset('custom');
  };

  const handleWeightChange = (key, value) => {
    const numValue = parseFloat(value) || 0;
    const newWeights = { ...weights, [key]: numValue };
    setWeights(newWeights);
    checkActivePreset(newWeights);
  };

  const applyPreset = (presetName) => {
    const preset = presets[presetName];
    if (preset) {
      setWeights(preset);
      setActivePreset(presetName);
    }
  };

  const validateWeights = () => {
    const total = weights.required_skills_weight + 
                  weights.preferred_skills_weight + 
                  weights.experience_weight + 
                  weights.education_weight;
    
    if (total !== 100) {
      alert(`Total weight must equal 100%. Current total: ${total}%`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateWeights()) return;
    
    setSaving(true);
    try {
      let response;
      if (entityType === 'global') {
        response = await api.updateGlobalWeights(weights);
      } else if (entityType === 'company') {
        response = await api.updateCompanyWeights(entityId, weights);
      } else if (entityType === 'job') {
        response = await api.updateJobWeights(entityId, weights);
      }
      
      if (response.success) {
        alert('Scoring weights saved successfully!');
        if (onWeightsUpdate) onWeightsUpdate(weights);
        if (onClose) onClose();
      } else {
        alert('Failed to save weights');
      }
    } catch (error) {
      console.error('Error saving weights:', error);
      alert(error.response?.data?.message || 'Error saving weights');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to balanced preset?')) {
      applyPreset('balanced');
    }
  };

  if (loading) {
    return (
      <div className="weights-loading">
        <div className="spinner"></div>
        <p>Loading scoring configuration...</p>
      </div>
    );
  }

  const total = weights.required_skills_weight + weights.preferred_skills_weight + 
                weights.experience_weight + weights.education_weight;

  return (
    <div className="scoring-weights-manager">
      <div className="weights-header">
        <h3>
          <i className="fas fa-sliders-h"></i>
          Scoring Configuration
          {entityType === 'job' && <span className="badge">Job Level</span>}
          {entityType === 'company' && <span className="badge">Company Level</span>}
          {entityType === 'global' && <span className="badge">Global Level</span>}
        </h3>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <p className="weights-description">
        Adjust how CVs are scored against job requirements. Total must equal 100%.
      </p>

      <div className="presets-section">
        <label>Quick Presets</label>
        <div className="preset-buttons">
          <button 
            className={`preset-btn ${activePreset === 'balanced' ? 'active' : ''}`}
            onClick={() => applyPreset('balanced')}
          >
            <i className="fas fa-balance-scale"></i> Balanced
          </button>
          <button 
            className={`preset-btn ${activePreset === 'skills_focused' ? 'active' : ''}`}
            onClick={() => applyPreset('skills_focused')}
          >
            <i className="fas fa-code"></i> Skills Focused
          </button>
          <button 
            className={`preset-btn ${activePreset === 'experience_focused' ? 'active' : ''}`}
            onClick={() => applyPreset('experience_focused')}
          >
            <i className="fas fa-briefcase"></i> Experience Focused
          </button>
          <button 
            className={`preset-btn ${activePreset === 'education_focused' ? 'active' : ''}`}
            onClick={() => applyPreset('education_focused')}
          >
            <i className="fas fa-graduation-cap"></i> Education Focused
          </button>
          <button 
            className={`preset-btn ${activePreset === 'entry_level' ? 'active' : ''}`}
            onClick={() => applyPreset('entry_level')}
          >
            <i className="fas fa-seedling"></i> Entry Level
          </button>
        </div>
      </div>

      <div className="weights-form">
        <div className="weight-slider">
          <label>
            <i className="fas fa-tools"></i> Required Skills Weight
            <span className="weight-value">{weights.required_skills_weight}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={weights.required_skills_weight}
            onChange={(e) => handleWeightChange('required_skills_weight', e.target.value)}
          />
          <small>Higher value = more importance on matching required skills</small>
        </div>

        <div className="weight-slider">
          <label>
            <i className="fas fa-star"></i> Preferred Skills Weight
            <span className="weight-value">{weights.preferred_skills_weight}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={weights.preferred_skills_weight}
            onChange={(e) => handleWeightChange('preferred_skills_weight', e.target.value)}
          />
          <small>Bonus points for preferred/nice-to-have skills</small>
        </div>

        <div className="weight-slider">
          <label>
            <i className="fas fa-briefcase"></i> Experience Weight
            <span className="weight-value">{weights.experience_weight}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={weights.experience_weight}
            onChange={(e) => handleWeightChange('experience_weight', e.target.value)}
          />
          <small>How many years of relevant experience</small>
        </div>

        <div className="weight-slider">
          <label>
            <i className="fas fa-graduation-cap"></i> Education Weight
            <span className="weight-value">{weights.education_weight}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={weights.education_weight}
            onChange={(e) => handleWeightChange('education_weight', e.target.value)}
          />
          <small>Education level and relevance</small>
        </div>

        <div className="weight-slider">
          <label>
            <i className="fas fa-chart-line"></i> Similarity Threshold
            <span className="weight-value">{(weights.similarity_threshold * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.similarity_threshold}
            onChange={(e) => handleWeightChange('similarity_threshold', parseFloat(e.target.value))}
          />
          <small>Minimum similarity score for skill matching (higher = stricter)</small>
        </div>
      </div>

      <div className="weights-summary">
        <div className="total-weight">
          <strong>Total:</strong> 
          <span className={total === 100 ? 'valid' : 'invalid'}>
            {total}%
          </span>
          {total !== 100 && (
            <span className="warning-msg"> (Must equal 100%)</span>
          )}
        </div>
        <div className="weights-actions">
          <button className="reset-btn" onClick={handleReset}>
            <i className="fas fa-undo"></i> Reset
          </button>
          <button className="save-btn" onClick={handleSave} disabled={saving || total !== 100}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Save Weights
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringWeightsManager;