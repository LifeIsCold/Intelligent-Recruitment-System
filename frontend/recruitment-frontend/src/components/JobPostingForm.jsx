import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './JobPostingForm.css';

const JobPostingForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        company_id: '',
        industry_id: '',
        work_type: 'remote',
        work_time: 'full_time',
        salary: '',
        required_skills: [],
        benefits: '',
    });
    
    const [skills, setSkills] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        fetchSkills();
        fetchIndustries();
    }, []);

    useEffect(() => {
        setCharCount(formData.description.length);
    }, [formData.description]);

    const fetchSkills = async () => {
        try {
            const response = await api.getSkills();
            setSkills(response.data || []);
        } catch (error) {
            console.error('Error fetching skills:', error);
        }
    };

    const fetchIndustries = async () => {
        try {
            const response = await api.getIndustries();
            setIndustries(response.data || []);
        } catch (error) {
            console.error('Error fetching industries:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSkillsChange = (skillName) => {
        setFormData(prev => {
            const skills = prev.required_skills.includes(skillName)
                ? prev.required_skills.filter(s => s !== skillName)
                : [...prev.required_skills, skillName];
            return { ...prev, required_skills: skills };
        });
    };

    const handleAddNewSkill = async (skillName) => {
        try {
            // Check if skill already exists in database
            const existingSkill = skills.find(s => 
                s.name.toLowerCase() === skillName.toLowerCase()
            );
            
            if (existingSkill) {
                // Skill exists, just add it to the form
                handleSkillsChange(existingSkill.name);
                return true;
            } else {
                // Create new skill in database
                const response = await api.createSkill({ 
                    name: skillName,
                    description: `Skill added via job posting form`
                });
                
                if (response.success || response.data) {
                    const newSkill = response.data || response;
                    // Add to local skills list
                    setSkills(prevSkills => [...prevSkills, newSkill]);
                    // Add to form
                    handleSkillsChange(newSkill.name);
                    return true;
                }
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            
            // If skill already exists in database (422 error)
            if (error.response?.status === 422) {
                // Try to find the skill by name and add it
                const existingSkill = skills.find(s => 
                    s.name.toLowerCase() === skillName.toLowerCase()
                );
                
                if (existingSkill) {
                    handleSkillsChange(existingSkill.name);
                    return true;
                } else {
                    alert(`"${skillName}" already exists in the database`);
                }
            } else {
                alert('Failed to add new skill. Please try again.');
            }
            return false;
        }
    };

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const input = e.target;
            const newSkillName = input.value.trim();
            
            if (!newSkillName) return;
            
            // Check if already added
            if (formData.required_skills.includes(newSkillName)) {
                alert(`"${newSkillName}" is already added`);
                input.value = '';
                return;
            }
            
            await handleAddNewSkill(newSkillName);
            input.value = '';
        }
    };

    const handleBlur = async (e) => {
        const input = e.target;
        const newSkillName = input.value.trim();
        
        if (newSkillName && !formData.required_skills.includes(newSkillName)) {
            await handleAddNewSkill(newSkillName);
            input.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Validate required fields
            if (!formData.title || !formData.description || !formData.industry_id) {
                alert('Please fill in all required fields');
                setLoading(false);
                return;
            }
            
            const response = await api.createJob(formData);
            
            if (response.success) {
                alert('Job posted successfully!');
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    company_id: '',
                    industry_id: '',
                    work_type: 'remote',
                    work_time: 'full_time',
                    salary: '',
                    required_skills: [],
                    benefits: '',
                });
                setShowPreview(false);
            } else {
                alert(response.message || 'Failed to post job');
            }
        } catch (error) {
            console.error('Error posting job:', error);
            
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                let errorMessage = 'Please fix the following errors:\n';
                Object.keys(errors).forEach(field => {
                    errorMessage += `\n• ${field}: ${errors[field].join(', ')}`;
                });
                alert(errorMessage);
            } else {
                alert(error.response?.data?.message || 'Failed to post job. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="job-posting-form-container">
            <div className="form-header">
                <h2>
                    <i className="fas fa-briefcase"></i>
                    Create New Job Posting
                </h2>
                <p>Fill in the details below to post a new job opportunity</p>
            </div>

            <div className="form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Job Title */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-heading"></i>
                                Job Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Senior Frontend Developer"
                                required
                                maxLength="100"
                            />
                        </div>

                        {/* Job Description */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-file-alt"></i>
                                Job Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the role, responsibilities, and requirements..."
                                rows="6"
                                required
                                maxLength="2000"
                            />
                            <div className="textarea-info">
                                <span>Minimum 50 characters recommended</span>
                                <span className={charCount > 1800 ? 'warning' : ''}>
                                    {charCount}/2000 characters
                                </span>
                            </div>
                        </div>

                        {/* Company ID */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-building"></i>
                                Company ID *
                            </label>
                            <input
                                type="text"
                                name="company_id"
                                value={formData.company_id}
                                onChange={handleChange}
                                placeholder="Enter your company ID"
                                required
                            />
                        </div>

                        {/* Industry */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-industry"></i>
                                Industry *
                            </label>
                            <select
                                name="industry_id"
                                value={formData.industry_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select an industry</option>
                                {industries.map(industry => (
                                    <option key={industry.id} value={industry.id}>
                                        {industry.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Work Type */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-map-marker-alt"></i>
                                Work Location
                            </label>
                            <div className="radio-group">
                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="work_type"
                                        value="remote"
                                        checked={formData.work_type === 'remote'}
                                        onChange={handleChange}
                                    />
                                    <span>Remote</span>
                                </label>
                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="work_type"
                                        value="onsite"
                                        checked={formData.work_type === 'onsite'}
                                        onChange={handleChange}
                                    />
                                    <span>On-site</span>
                                </label>
                            </div>
                        </div>

                        {/* Work Time */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-clock"></i>
                                Work Schedule
                            </label>
                            <div className="radio-group">
                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="work_time"
                                        value="full_time"
                                        checked={formData.work_time === 'full_time'}
                                        onChange={handleChange}
                                    />
                                    <span>Full Time</span>
                                </label>
                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="work_time"
                                        value="part_time"
                                        checked={formData.work_time === 'part_time'}
                                        onChange={handleChange}
                                    />
                                    <span>Part Time</span>
                                </label>
                            </div>
                        </div>

                        {/* Salary */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-money-bill-wave"></i>
                                Salary Range
                            </label>
                            <input
                                type="text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                placeholder="e.g., $50,000 - $70,000 or Negotiable"
                            />
                        </div>

                        {/* Benefits */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-gift"></i>
                                Benefits & Perks
                            </label>
                            <input
                                type="text"
                                name="benefits"
                                value={formData.benefits}
                                onChange={handleChange}
                                placeholder="e.g., Health insurance, 401k, Remote stipend"
                            />
                        </div>

                        {/* Required Skills */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-tools"></i>
                                Required Skills *
                            </label>
                            <div className="skills-section">
                                {/* Selected Skills Display */}
                                <div className="selected-skills">
                                    {formData.required_skills.map(skill => (
                                        <span key={skill} className="skill-tag">
                                            {skill}
                                            <button 
                                                type="button"
                                                className="remove-skill"
                                                onClick={() => handleSkillsChange(skill)}
                                                title="Remove skill"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {formData.required_skills.length === 0 && (
                                        <span className="no-skills-message">
                                            No skills added yet. Type or select skills below.
                                        </span>
                                    )}
                                </div>

                                {/* Skill Input Area */}
                                <div className="skill-input-area">
                                    <div className="skill-search-container">
                                        <i className="fas fa-search search-icon"></i>
                                        <input
                                            type="text"
                                            className="skill-search-input"
                                            placeholder="Type a skill and press Enter or comma to add"
                                            id="skillSearchInput"
                                            onKeyDown={handleKeyDown}
                                            onBlur={handleBlur}
                                        />
                                        <button
                                            type="button"
                                            className="quick-add-btn"
                                            onClick={async () => {
                                                const input = document.getElementById('skillSearchInput');
                                                const newSkillName = input.value.trim();
                                                
                                                if (!newSkillName) {
                                                    alert('Please enter a skill name');
                                                    return;
                                                }
                                                
                                                if (formData.required_skills.includes(newSkillName)) {
                                                    alert(`"${newSkillName}" is already added`);
                                                    input.value = '';
                                                    return;
                                                }
                                                
                                                await handleAddNewSkill(newSkillName);
                                                input.value = '';
                                            }}
                                            title="Add skill"
                                        >
                                            <i className="fas fa-plus"></i> Add Skill
                                        </button>
                                    </div>

                                    {/* Suggested Skills */}
                                    {skills.length > 0 && (
                                        <div className="suggested-skills">
                                            <div className="suggested-skills-header">
                                                <span className="suggested-title">
                                                    <i className="fas fa-lightbulb"></i>
                                                    Suggested Skills
                                                </span>
                                                <button 
                                                    type="button"
                                                    className="clear-search-btn"
                                                    onClick={() => {
                                                        const input = document.getElementById('skillSearchInput');
                                                        input.value = '';
                                                        input.focus();
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <div className="suggested-skills-list">
                                                {skills
                                                    .filter(skill => !formData.required_skills.includes(skill.name))
                                                    .slice(0, 12)
                                                    .map(skill => (
                                                        <button
                                                            key={skill.id}
                                                            type="button"
                                                            className="suggested-skill-btn"
                                                            onClick={async () => {
                                                                if (!formData.required_skills.includes(skill.name)) {
                                                                    await handleAddNewSkill(skill.name);
                                                                }
                                                            }}
                                                            title={`Click to add ${skill.name}`}
                                                        >
                                                            {skill.name}
                                                            <i className="fas fa-plus plus-icon"></i>
                                                        </button>
                                                    ))}
                                                {skills.filter(s => !formData.required_skills.includes(s.name)).length === 0 && (
                                                    <span className="no-suggestions">
                                                        All skills are added
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="preview-btn"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <i className={`fas fa-${showPreview ? 'eye-slash' : 'eye'}`}></i>
                            {showPreview ? 'Hide Preview' : 'Preview Job'}
                        </button>
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Post Job
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Job Preview */}
                {showPreview && (
                    <div className="job-preview">
                        <h3>
                            <i className="fas fa-eye"></i>
                            Job Preview
                        </h3>
                        <div className="preview-card">
                            <h4>{formData.title || 'Job Title'}</h4>
                            
                            <div className="preview-detail">
                                <strong>Industry:</strong> {
                                    industries.find(i => i.id.toString() === formData.industry_id?.toString())?.name || 
                                    'Not selected'
                                }
                            </div>
                            
                            <div className="preview-detail">
                                <strong>Work Type:</strong> {formData.work_type?.replace('_', ' ').toUpperCase()}
                            </div>
                            
                            <div className="preview-detail">
                                <strong>Schedule:</strong> {formData.work_time?.replace('_', ' ').toUpperCase()}
                            </div>
                            
                            <div className="preview-detail">
                                <strong>Salary:</strong> {formData.salary || 'Not specified'}
                            </div>
                            
                            <div className="preview-detail">
                                <strong>Description:</strong>
                                <p>{formData.description || 'No description provided'}</p>
                            </div>
                            
                            {formData.benefits && (
                                <div className="preview-detail">
                                    <strong>Benefits:</strong> {formData.benefits}
                                </div>
                            )}
                            
                            {formData.required_skills.length > 0 && (
                                <>
                                    <div className="preview-detail">
                                        <strong>Required Skills:</strong>
                                    </div>
                                    <div className="preview-skills">
                                        {formData.required_skills.map(skill => (
                                            <span key={skill} className="preview-skill">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobPostingForm;