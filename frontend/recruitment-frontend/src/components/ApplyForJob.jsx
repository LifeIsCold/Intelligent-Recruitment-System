import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ApplyForJob.css';

const ApplyForJob = ({ jobId, initialCVs = [], onSuccess, onCancel, onCVsUpdated }) => {
  const [cvs, setCvs] = useState([]);
  const [selectedCv, setSelectedCv] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [defaultCvId, setDefaultCvId] = useState(null);
  const [isFetchingCVs, setIsFetchingCVs] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [existingApplicationStatus, setExistingApplicationStatus] = useState(null);
  const navigate = useNavigate();

  // Fetch CVs independently when component mounts
  const fetchCVs = useCallback(async () => {
    try {
      console.log('🔄 ApplyForJob: Fetching CVs...');
      setIsFetchingCVs(true);
      const response = await api.getCVs();
      
      console.log('📄 ApplyForJob: CVs response:', response);
      
      if (response.success) {
        const fetchedCVs = response.data || [];
        console.log('✅ ApplyForJob: CVs fetched:', fetchedCVs.length);
        
        setCvs(fetchedCVs);
        
        // Set default CV
        const defaultCv = fetchedCVs.find(cv => cv.is_default);
        if (defaultCv) {
          setDefaultCvId(defaultCv.id);
          setSelectedCv(defaultCv.id.toString());
          console.log('🎯 Default CV set:', defaultCv.id);
        } else if (fetchedCVs.length > 0) {
          setSelectedCv(fetchedCVs[0].id.toString());
          console.log('🎯 First CV set as default:', fetchedCVs[0].id);
        }
        
        // If no CVs, show message
        if (fetchedCVs.length === 0) {
          setMessage({ 
            text: 'No CVs found. Please upload a CV first.', 
            type: 'warning' 
          });
        }
      } else {
        setMessage({ 
          text: 'Failed to load your CVs', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('❌ Error fetching CVs in ApplyForJob:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to load your CVs', 
        type: 'error' 
      });
    } finally {
      setIsFetchingCVs(false);
    }
  }, []);

  // Check if already applied to this job
  const checkExistingApplication = useCallback(async () => {
    try {
      const response = await api.getMyApplications();
      if (response.success) {
        const existingApp = response.data.find(app => app.job_id === parseInt(jobId));
        if (existingApp) {
          setAlreadyApplied(true);
          setExistingApplicationStatus(existingApp.status);
          setMessage({ 
            text: `You have already applied for this job. Application status: ${existingApp.status}`, 
            type: 'warning' 
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing applications:', error);
    }
  }, [jobId]);

  // Initial fetch on mount
  useEffect(() => {
    console.log('🚀 ApplyForJob mounted for job:', jobId);
    console.log('📋 Initial CVs from props:', initialCVs?.length || 0);
    
    // Always fetch fresh CVs when modal opens
    fetchCVs();
    checkExistingApplication();
  }, [jobId, fetchCVs, checkExistingApplication]);

  // Also listen to prop updates if parent provides updated CVs
  useEffect(() => {
    if (initialCVs && initialCVs.length > 0) {
      console.log('📡 Received updated CVs from parent:', initialCVs.length);
      setCvs(initialCVs);
    }
  }, [initialCVs]);

  const handleApply = async () => {
    // First, check if we have a token
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('authRole');
    
    console.log('🔐 Applying for job - Check:', {
      hasToken: !!token,
      role: role,
      jobId: jobId,
      cvId: selectedCv,
      availableCVs: cvs?.length || 0
    });

    if (!token) {
      setMessage({
        text: 'You are not logged in. Please log in first.',
        type: 'error'
      });
      setTimeout(() => {
        navigate('/jobseeker-login');
      }, 2000);
      return;
    }

    if (role !== 'job_seeker' && role !== 'seeker') {
      setMessage({
        text: `You are logged in as ${role || 'unknown role'}. Only job seekers can apply for jobs.`,
        type: 'error'
      });
      setTimeout(() => {
        navigate('/jobseeker-login');
      }, 3000);
      return;
    }

    // Check if already applied (double-check before submitting)
    if (alreadyApplied) {
      setMessage({
        text: 'You have already applied for this job. Please check "My Applications" tab.',
        type: 'warning'
      });
      return;
    }

    // Check if we have CVs
    if (!cvs || cvs.length === 0) {
      setMessage({ 
        text: 'No CVs available. Please upload a CV first.', 
        type: 'error' 
      });
      return;
    }

    if (!selectedCv) {
      setMessage({ 
        text: 'Please select a CV to apply with', 
        type: 'error' 
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      console.log('📤 Sending application:', {
        jobId: jobId,
        cvId: selectedCv,
        cvsAvailable: cvs.length
      });
      
      const response = await api.applyForJob(jobId, selectedCv);
      
      console.log('✅ Application response:', response);
      
      if (response.success) {
        setMessage({ 
          text: 'Application submitted successfully!', 
          type: 'success' 
        });
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setMessage({ 
          text: response.message || 'Failed to apply', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('❌ Error applying for job - Full error:', error);
      console.error('❌ Error response data:', error.response?.data);
      
      // Get the actual error message from backend
      const backendMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message;
      
      if (error.response?.status === 403) {
        if (backendMessage.includes('job seeker') || backendMessage.includes('role')) {
          setMessage({ 
            text: `Access denied: ${backendMessage}. Please log in as a job seeker.`, 
            type: 'error' 
          });
          setTimeout(() => {
            localStorage.clear();
            navigate('/jobseeker-login');
          }, 3000);
        } else {
          setMessage({ 
            text: `Access denied: ${backendMessage}`, 
            type: 'error' 
          });
        }
      } 
      else if (error.response?.status === 401) {
        setMessage({ 
          text: 'Your session has expired. Please log in again.', 
          type: 'error' 
        });
        setTimeout(() => {
          localStorage.clear();
          navigate('/jobseeker-login');
        }, 2000);
      }
      else if (error.response?.status === 400) {
        if (backendMessage.includes('already applied')) {
          setAlreadyApplied(true);
          // Try to extract status from response if available
          const appStatus = error.response?.data?.data?.status || 'pending';
          setExistingApplicationStatus(appStatus);
          setMessage({ 
            text: `You have already applied for this job. Application status: ${appStatus}`, 
            type: 'warning' 
          });
          
          // Optionally close the modal after showing the message
          setTimeout(() => {
            if (onCancel) onCancel();
          }, 3000);
        } else if (backendMessage.includes('no longer accepting')) {
          setMessage({ 
            text: 'This job is no longer accepting applications', 
            type: 'warning' 
          });
          setTimeout(() => {
            if (onCancel) onCancel();
          }, 2000);
        } else {
          setMessage({ 
            text: `Application error: ${backendMessage}`, 
            type: 'error' 
          });
        }
      }
      else {
        setMessage({ 
          text: `Error: ${backendMessage || 'Failed to apply for job. Please try again.'}`, 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCVs = async () => {
    console.log('🔄 Manual CV refresh requested');
    await fetchCVs();
    if (onCVsUpdated) {
      onCVsUpdated(); // Also notify parent
    }
  };

  const handleUploadNewCV = () => {
    if (onCancel) {
      onCancel(); // Close the modal first
    }
    // You can add logic here to switch to upload CV tab
    setMessage({
      text: 'Modal closed. Please switch to "Upload CV" tab to add a new CV.',
      type: 'info'
    });
  };

  const handleGoToMyApplications = () => {
    if (onCancel) {
      onCancel();
    }
    // Navigate to my applications tab (this will need to be handled by parent)
  };

  if (isFetchingCVs) {
    return (
      <div className="apply-job-modal loading">
        <div className="spinner"></div>
        <p>Loading your CVs...</p>
      </div>
    );
  }

  return (
    <div className="apply-job-modal">
      <div className="modal-header">
        <h3><i className="fas fa-paper-plane"></i> Apply for Job</h3>
        {onCancel && (
          <button className="close-btn" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div className="modal-body">
        {alreadyApplied ? (
          <div className="already-applied-message">
            <i className="fas fa-check-circle"></i>
            <h4>You've Already Applied</h4>
            <p>You have already submitted an application for this job.</p>
            <p className="application-status">
              Current Status: <span className={`status-badge ${existingApplicationStatus}`}>
                {existingApplicationStatus || 'pending'}
              </span>
            </p>
            <div className="already-applied-actions">
              <button 
                className="view-applications-btn"
                onClick={handleGoToMyApplications}
              >
                <i className="fas fa-list"></i> View My Applications
              </button>
              <button 
                className="close-btn"
                onClick={onCancel}
              >
                <i className="fas fa-times"></i> Close
              </button>
            </div>
          </div>
        ) : (
          <div className="cv-selection">
            <label className="selection-label">
              <i className="fas fa-file-alt"></i> Select CV to use:
            </label>
            
            {cvs.length === 0 ? (
              <div className="no-cvs-message">
                <i className="fas fa-exclamation-triangle"></i>
                <p>No CVs found. Please upload a CV first.</p>
                <div className="upload-options">
                  <button 
                    className="upload-cv-btn"
                    onClick={handleRefreshCVs}
                  >
                    <i className="fas fa-redo"></i> Refresh CV List
                  </button>
                  <button 
                    className="upload-cv-btn secondary"
                    onClick={handleUploadNewCV}
                  >
                    <i className="fas fa-upload"></i> Go to Upload CV
                  </button>
                </div>
              </div>
            ) : (
              <>
                <select 
                  value={selectedCv} 
                  onChange={(e) => setSelectedCv(e.target.value)}
                  disabled={loading}
                  className="cv-select"
                >
                  {cvs.map(cv => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name || cv.title || 'Untitled CV'} 
                      {cv.is_default && ' (Default)'}
                      {cv.file_name && ` - ${cv.file_name.split('_').pop()}`}
                    </option>
                  ))}
                </select>
                
                <div className="cv-info">
                  {selectedCv && cvs.find(cv => cv.id.toString() === selectedCv) && (
                    <div className="selected-cv-details">
                      <p>
                        <strong>Selected CV:</strong> {cvs.find(cv => cv.id.toString() === selectedCv)?.name || cvs.find(cv => cv.id.toString() === selectedCv)?.title || 'Untitled CV'}
                      </p>
                      {cvs.find(cv => cv.id.toString() === selectedCv)?.extracted_skills && (
                        <p className="skills-preview">
                          <strong>Skills detected:</strong> {
                            cvs.find(cv => cv.id.toString() === selectedCv)
                              ?.extracted_skills?.slice(0, 3).join(', ')
                          }
                          {cvs.find(cv => cv.id.toString() === selectedCv)
                            ?.extracted_skills?.length > 3 && '...'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        
        {message.text && (
          <div className={`message ${message.type}`}>
            <i className={`fas fa-${
              message.type === 'success' ? 'check-circle' : 
              message.type === 'error' ? 'exclamation-circle' : 
              message.type === 'warning' ? 'exclamation-triangle' : 'info-circle'
            }`}></i>
            {message.text}
          </div>
        )}
      </div>

      {!alreadyApplied && (
        <div className="modal-footer">
          <div className="apply-actions">
            {onCancel && (
              <button 
                className="cancel-btn" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}
            
            <button 
              className={`apply-btn ${loading ? 'loading' : ''}`} 
              onClick={handleApply}
              disabled={loading || cvs.length === 0 || !selectedCv}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Applying...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Application
                </>
              )}
            </button>
          </div>
          
          <div className="apply-tips">
            <p><i className="fas fa-info-circle"></i> Tip: Your CV will be analyzed for skill matching</p>
            <p><i className="fas fa-sync-alt"></i> Uploaded a new CV? <button 
              className="refresh-link" 
              onClick={handleRefreshCVs}
            >Refresh list</button></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyForJob;