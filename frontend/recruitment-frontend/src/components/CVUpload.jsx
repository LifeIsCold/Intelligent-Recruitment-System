// src/components/CVUpload.jsx
import React, { useState, useRef } from 'react'
import api from '../services/api'
import '../App.css'

const CVUpload = ({ onUpload }) => {
  const [cvText, setCvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileObj, setFileObj] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      setFileObj(file)
      // Try to read text preview for short files
      const reader = new FileReader()
      reader.onload = (event) => {
        setCvText(event.target.result)
      }
      // only read text for txt or small docx/pdf previews
      if (file.type === 'text/plain') reader.readAsText(file)
      else reader.readAsText(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cvText.trim() && !fileObj) {
      alert('Please upload a CV or enter text')
      return
    }

    setIsUploading(true)

    try {
      const form = new FormData()
      if (fileObj) {
        form.append('cv', fileObj)
      } else {
        form.append('text_content', cvText)
      }

      const res = await api.uploadCV(form)

      const cvData = {
        id: res.id || Date.now(),
        content: res.text_content || cvText,
        fileName: res.original_filename || fileName || 'manual_input.txt',
        uploadDate: new Date().toLocaleString(),
        skills: res.extracted_skills || []
      }

      onUpload(cvData)
      setIsUploading(false)
      setCvText('')
      setFileName('')
      setFileObj(null)
      if (fileInputRef.current) fileInputRef.current.value = null
      alert('CV uploaded successfully! You can now match it with jobs.')
    } catch (err) {
      console.error('Upload failed', err)
      alert('Upload failed. See console for details.')
      setIsUploading(false)
    }
  }

  const extractSkillsFromText = (text) => {
    const skills = ['React', 'JavaScript', 'Python', 'Node.js', 'HTML', 'CSS', 
                   'SQL', 'AWS', 'Docker', 'Machine Learning', 'Laravel', 'PHP']
    const foundSkills = skills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    )
    return foundSkills.length > 0 ? foundSkills : ['General Skills']
  }

  return (
    <div className="cv-upload-container">
      <div className="upload-card">
        <div className="card-header">
          <h2><i className="fas fa-cloud-upload-alt"></i> Upload Your CV</h2>
          <p>Upload your CV to get matched with relevant job opportunities</p>
        </div>
        
        <div className="upload-options">
          <div className="upload-option">
            <div className="upload-box" onClick={() => document.getElementById('fileInput').click()}>
              <i className="fas fa-file-upload"></i>
              <h3>Upload File</h3>
              <p>Supported: .txt, .pdf, .docx</p>
              <input 
                type="file" 
                id="fileInput" 
                ref={fileInputRef}
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            {fileName && (
              <div className="file-info">
                <i className="fas fa-file"></i>
                <span>{fileName}</span>
              </div>
            )}
          </div>
          
          <div className="or-divider">
            <span>OR</span>
          </div>
          
          <div className="upload-option">
            <div className="upload-box">
              <i className="fas fa-keyboard"></i>
              <h3>Paste CV Content</h3>
              <p>Copy and paste your CV content directly</p>
            </div>
          </div>
        </div>
        
        <div className="cv-textarea-container">
          <label htmlFor="cvText">
            <i className="fas fa-edit"></i> CV Content
          </label>
          <textarea
            id="cvText"
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Paste your CV content here or upload a file..."
            rows="10"
          />
          <div className="textarea-info">
            <span>{cvText.length} characters</span>
            <span>Minimum 100 characters recommended</span>
          </div>
        </div>
        
        <div className="extracted-skills">
          <h4><i className="fas fa-cogs"></i> Skills Detected:</h4>
          <div className="skills-tags">
            {(fileObj || cvText) ? (
              (extractSkillsFromText(cvText).map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              )))
            ) : (
              <span className="skill-tag">No content yet</span>
            )}
          </div>
        </div>
        
        <button 
          className={`upload-button ${isUploading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isUploading || !cvText.trim()}
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-upload"></i> Upload CV
            </>
          )}
        </button>
        
        <div className="upload-tips">
          <h4><i className="fas fa-lightbulb"></i> Tips for better matching:</h4>
          <ul>
            <li>Include all your technical skills and certifications</li>
            <li>Mention years of experience for each skill</li>
            <li>Include project descriptions and achievements</li>
            <li>Add education background and relevant courses</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CVUpload