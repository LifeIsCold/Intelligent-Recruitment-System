// src/components/ErrorDisplay.jsx
// Reusable component for displaying detailed error messages

import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ 
  error, 
  onClose,
  showDetails = true,
  title = 'Error Occurred'
}) => {
  if (!error) return null;

  const isDetailedError = error.status !== undefined;
  const message = error.message || 'An unknown error occurred';
  const details = error.details || [];
  const status = error.status;

  return (
    <div className="error-display-container">
      <div className="error-display-card">
        {/* Header with close button */}
        <div className="error-display-header">
          <div className="error-display-title-section">
            <span className="error-icon">⚠️</span>
            <h3 className="error-display-title">{title}</h3>
            {status && <span className="error-status-code">Error {status}</span>}
          </div>
          {onClose && (
            <button 
              className="error-close-btn" 
              onClick={onClose}
              aria-label="Close error message"
            >
              ✕
            </button>
          )}
        </div>

        {/* Main error message */}
        <div className="error-display-message">
          {message}
        </div>

        {/* Detailed error information */}
        {showDetails && details.length > 0 && (
          <div className="error-display-details">
            <p className="error-details-label">Details:</p>
            <ul className="error-details-list">
              {details.map((detail, index) => (
                <li key={index} className="error-detail-item">
                  {typeof detail === 'string' ? (
                    <span>{detail}</span>
                  ) : (
                    <span>
                      <strong>{detail.field}:</strong> {detail.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Debug information (in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="error-display-debug">
            <summary>Debug Information (Dev Only)</summary>
            <div className="debug-content">
              <p><strong>Status:</strong> {status || 'N/A'}</p>
              <p><strong>Timestamp:</strong> {error.timestamp}</p>
              <pre className="debug-raw-error">
                {JSON.stringify(error.rawError?.response?.data || error.rawError, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {/* Troubleshooting suggestions */}
        <div className="error-display-suggestions">
          <p className="suggestions-label">💡 Troubleshooting Tips:</p>
          <ul className="suggestions-list">
            {status === 422 && (
              <li>Check that all required fields are filled correctly</li>
            )}
            {status === 401 && (
              <li>Your session may have expired. Please log in again.</li>
            )}
            {status === 500 && (
              <li>Server error occurred. Please contact support or try again later.</li>
            )}
            {!status && (
              <>
                <li>Make sure the backend server is running (php artisan serve)</li>
                <li>Check your internet connection</li>
                <li>Open browser console (F12) for more details</li>
              </>
            )}
            <li>Review the details above for specific field errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
