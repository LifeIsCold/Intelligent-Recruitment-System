// In CVUpload.jsx
import React, { useState } from 'react';
import api from '../services/api';
import './CVUpload.css';

const CVUpload = ({ onUpload }) => {
  const [cvContent, setCvContent] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [title, setTitle] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      await api.downloadCVTemplate();
      setSuccess('Template downloaded successfully!');
    } catch (err) {
      setError('Failed to download template. Please try again.');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear any previous content when file is selected
      setCvContent('');
      
      // Validate file type more accurately
      const validExtensions = ['.xlsx', '.xls'];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        setError('Please upload only Excel files (.xlsx, .xls)');
        setCvFile(null);
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setCvFile(null);
        e.target.value = ''; // Clear the input
        return;
      }
      
      setCvFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!title.trim()) {
      setError('Please enter a title for your CV');
      return;
    }
    
    if (!cvFile && !cvContent.trim()) {
      setError('Please either upload an Excel file or paste your CV content');
      return;
    }
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('is_default', isDefault ? '1' : '0');
      
      // ONLY send one of: file OR content, not both
      if (cvFile) {
        formData.append('cv_file', cvFile);
        // Don't send cv_content when uploading file
      } else if (cvContent.trim()) {
        formData.append('cv_content', cvContent);
      }
      
      console.log('📤 Uploading CV:', {
        title,
        isDefault,
        hasFile: !!cvFile,
        hasContent: !!cvContent
      });
      
      const response = await api.uploadCV(formData);
      
      if (response.success) {
        setSuccess('CV uploaded successfully!');
        
        // Clear form
        setCvContent('');
        setCvFile(null);
        setTitle('');
        setIsDefault(false);
        
        // Clear file input
        const fileInput = document.getElementById('cv-file');
        if (fileInput) fileInput.value = '';
        
        // IMPORTANT: Call onUpload with the response data
        if (onUpload) {
          console.log('📢 Calling onUpload callback with new CV data');
          // Pass the new CV data to parent
          onUpload(response.data);
        }
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error('Upload error details:', err.response?.data);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-upload-container">
      <div className="upload-header">
        <h2><i className="fas fa-upload"></i> Upload Your CV</h2>
        <p>Upload an Excel file or paste your CV content</p>
      </div>

      {/* Template Download Section */}
      <div className="template-section">
        <div className="template-card">
          <div className="template-icon">
            <i className="fas fa-file-excel"></i>
          </div>
          <div className="template-info">
            <h3>Excel Template</h3>
            <p>Download our Excel template to format your CV data properly</p>
            <button 
              className="download-template-btn"
              onClick={handleDownloadTemplate}
              disabled={loading}
            >
              <i className="fas fa-download"></i>
              {loading ? 'Downloading...' : 'Download Template'}
            </button>
            <small className="template-note">
              Fill in the template and upload it for automatic processing
            </small>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <form className="upload-form" onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="form-group">
          <label htmlFor="title">
            <i className="fas fa-heading"></i> CV Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 'Senior Developer CV - 2024'"
            required
          />
        </div>

        {/* File Upload Section */}
        <div className="form-section">
          <h3><i className="fas fa-file-excel"></i> Option 1: Upload Excel File</h3>
          <div className="file-upload-area">
            <input
              type="file"
              id="cv-file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="cv-file" className="file-upload-label">
              <div className="upload-icon">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <div className="upload-text">
                <p className="upload-title">Click to upload Excel file</p>
                <p className="upload-subtitle">.xlsx or .xls files only (max 5MB)</p>
              </div>
            </label>
            {cvFile && (
              <div className="file-preview">
                <i className="fas fa-file-excel"></i>
                <span>{cvFile.name}</span>
                <button 
                  type="button" 
                  className="remove-file"
                  onClick={() => setCvFile(null)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* OR Divider */}
        <div className="or-divider">
          <span>OR</span>
        </div>

        {/* Text Content Section */}
        <div className="form-section">
          <h3><i className="fas fa-paste"></i> Option 2: Paste CV Content</h3>
          <div className="textarea-group">
            <textarea
              value={cvContent}
              onChange={(e) => {
                setCvContent(e.target.value);
                // Clear file if user starts typing
                if (e.target.value.trim()) {
                  setCvFile(null);
                  // Also clear the file input visually
                  const fileInput = document.getElementById('cv-file');
                  if (fileInput) fileInput.value = '';
                }
              }}
              placeholder="Paste your CV content here...
            Example:
            • Senior Software Engineer with 5+ years experience
            • Skills: JavaScript, React, Node.js, Python
            • Education: MSc Computer Science, Stanford University
            • Experience: Lead developer at TechCorp (2020-present)"
              rows={8}
            />
            <div className="textarea-info">
              <span>Max 50,000 characters</span>
              <span>{cvContent.length}/50000</span>
            </div>
          </div>
        </div>

        {/* Default CV Toggle */}
        <div className="toggle-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Set as default CV
          </label>
          <small className="toggle-help">
            Your default CV will be used for job applications
          </small>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}
        {success && (
          <div className="alert success">
            <i className="fas fa-check-circle"></i>
            {success}
            <button 
              className="refresh-indicator"
              onClick={() => {
                if (onUpload) {
                  // Trigger a refresh in parent
                  onUpload(null);
                }
              }}
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading || (!cvFile && !cvContent.trim())}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-upload"></i>
              Upload CV
            </>
          )}
        </button>
      </form>

      {/* Help Section */}
      <div className="help-section">
        <h4><i className="fas fa-question-circle"></i> Need Help?</h4>
        <ul className="help-list">
          <li><i className="fas fa-check"></i> Use the Excel template for best results</li>
          <li><i className="fas fa-check"></i> Include all relevant skills and experience</li>
          <li><i className="fas fa-check"></i> Keep your CV updated for better job matches</li>
          <li><i className="fas fa-check"></i> You can upload multiple CVs</li>
        </ul>
      </div>
    </div>
  );
};

export default CVUpload;