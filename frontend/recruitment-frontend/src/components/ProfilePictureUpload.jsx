// src/components/ProfilePictureUpload.jsx
import React, { useState, useRef } from 'react';
import api from '../services/api';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ currentPicture, userName, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPicture);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadPicture(file);
  };

  const uploadPicture = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await api.uploadProfilePicture(formData);
      if (response.success) {
        // Update localStorage with new picture URL
        if (response.data && response.data.profile_picture) {
          localStorage.setItem('userProfilePicture', response.data.profile_picture);
        }
        if (onUpdate) onUpdate(response.data);
        alert('Profile picture updated successfully!');
      } else {
        alert(response.message || 'Failed to upload profile picture');
        setPreview(currentPicture);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(error.response?.data?.message || 'Failed to upload profile picture');
      setPreview(currentPicture);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    
    setUploading(true);
    try {
      const response = await api.removeProfilePicture();
      if (response.success) {
        setPreview(null);
        // 👇 Remove from localStorage
        localStorage.removeItem('userProfilePicture');
        if (onUpdate) onUpdate({ profile_picture: null });
        alert('Profile picture removed successfully!');
      } else {
        alert(response.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      alert(error.response?.data?.message || 'Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="profile-picture-upload">
      <div className="profile-picture-container">
        {preview ? (
          <img 
            src={preview} 
            alt={userName} 
            className="profile-picture-image"
          />
        ) : (
          <div className="profile-picture-placeholder">
            {getInitials(userName)}
          </div>
        )}
        
        <div className="profile-picture-overlay">
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            title="Upload new picture"
          >
            <i className="fas fa-camera"></i>
          </button>
          {preview && (
            <button 
              className="remove-btn"
              onClick={handleRemove}
              disabled={uploading}
              title="Remove picture"
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/jpg,image/gif"
          style={{ display: 'none' }}
        />
      </div>
      
      {uploading && (
        <div className="uploading-indicator">
          <i className="fas fa-spinner fa-spin"></i> Uploading...
        </div>
      )}
      
      <p className="upload-help">
        Click the camera icon to upload a profile picture<br />
        (JPEG, PNG, GIF up to 2MB)
      </p>
    </div>
  );
};

export default ProfilePictureUpload;