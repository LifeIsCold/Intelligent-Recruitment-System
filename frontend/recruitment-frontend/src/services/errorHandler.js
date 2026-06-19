// src/services/errorHandler.js
// Utility for handling and formatting API errors

export const ErrorHandler = {
  /**
   * Parse error response from API
   * @param {Error} error - The error object from axios
   * @returns {Object} - Formatted error object with details
   */
  parseError: (error) => {
    console.log('=== ERROR HANDLER DEBUG ===');
    console.log('Error object:', error);

    const errorObject = {
      status: null,
      message: 'An unknown error occurred',
      details: [],
      rawError: error,
      timestamp: new Date().toISOString()
    };

    if (error.response) {
      // Server responded with error status
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);

      errorObject.status = error.response.status;

      const data = error.response.data;

      if (typeof data === 'object') {
        // Check for custom error message
        if (data.message) {
          errorObject.message = data.message;
        }

        // Check for validation errors
        if (data.errors && typeof data.errors === 'object') {
          if (Array.isArray(data.errors)) {
            errorObject.details = data.errors;
          } else {
            // Object of field errors
            errorObject.details = Object.entries(data.errors).map(
              ([field, messages]) => ({
                field,
                message: Array.isArray(messages) ? messages.join(', ') : messages
              })
            );
          }
        }
      } else if (typeof data === 'string') {
        errorObject.message = data;
      }
    } else if (error.request) {
      // Request made but no response received
      console.log('No response received:', error.request);
      errorObject.message = 'No response from server. Please check if the backend is running.';
      errorObject.details = [
        'Backend may be down',
        'Network connection issue',
        'CORS error'
      ];
    } else {
      // Error in request setup
      console.log('Error message:', error.message);
      errorObject.message = error.message || 'Error setting up the request';
    }

    console.log('Parsed error:', errorObject);
    console.log('=== END ERROR DEBUG ===');
    return errorObject;
  },

  /**
   * Format error for display in UI
   * @param {Object} errorObject - Parsed error object
   * @returns {string} - Formatted error message
   */
  formatForDisplay: (errorObject) => {
    let message = errorObject.message;

    if (errorObject.details && errorObject.details.length > 0) {
      const detailsText = errorObject.details
        .map(detail => {
          if (typeof detail === 'string') {
            return `• ${detail}`;
          }
          return `• ${detail.field}: ${detail.message}`;
        })
        .join('\n');

      message += `\n\nDetails:\n${detailsText}`;
    }

    return message;
  },

  /**
   * Log full error details for debugging
   * @param {Object} errorObject - Parsed error object
   * @param {string} context - Context where error occurred
   */
  logDetails: (errorObject, context = '') => {
    console.group(`❌ Error in ${context}`);
    console.error('Status Code:', errorObject.status);
    console.error('Message:', errorObject.message);
    console.error('Details:', errorObject.details);
    console.error('Timestamp:', errorObject.timestamp);
    console.error('Raw Error:', errorObject.rawError);
    console.groupEnd();
  }
};

export default ErrorHandler;
