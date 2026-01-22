// src/components/CVUpload.jsx
import React, { useState } from 'react'
import '../App.css'

const CVUpload = ({ onUpload }) => {
  const [cvText, setCvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        setCvText(event.target.result)
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cvText.trim()) {
      alert('Please upload a CV or enter text')
      return
    }

    setIsUploading(true)
    
    // Simulate API call
    setTimeout(() => {
      const cvData = {
        id: Date.now(),
        content: cvText,
        fileName: fileName || 'manual_input.txt',
        uploadDate: new Date().toLocaleString(),
        skills: extractSkillsFromText(cvText)
      }
      
      onUpload(cvData)
      setIsUploading(false)
      setCvText('')
      setFileName('')
      alert('CV uploaded successfully! You can now match it with jobs.')
    }, 1000)
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
            {extractSkillsFromText(cvText).map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
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