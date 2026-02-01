import React, { useState } from 'react';
import api from '../services/api';

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSkillsChange = (e) => {
        setFormData({ ...formData, required_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.createJob(formData);
            alert('Job posted successfully!');
        } catch (error) {
            console.error('Error posting job:', error);
            alert('Failed to post job.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '1rem'}}>
                <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: '#222', margin: 0}}>Create Job Posting</h2>
            </div>
            <div>
                <label>Title:</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div>
                <label>Company ID:</label>
                <input type="text" name="company_id" value={formData.company_id} onChange={handleChange} required />
            </div>
            <div>
                <label>Industry ID:</label>
                <input type="text" name="industry_id" value={formData.industry_id} onChange={handleChange} required />
            </div>
            <div>
                <label>Work Type:</label>
                <select name="work_type" value={formData.work_type} onChange={handleChange}>
                    <option value="remote">Remote</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                </select>
            </div>
            <div>
                <label>Work Time:</label>
                <select name="work_time" value={formData.work_time} onChange={handleChange}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                </select>
            </div>
            <div>
                <label>Salary:</label>
                <input type="text" name="salary" value={formData.salary} onChange={handleChange} />
            </div>
            <div>
                <label>Benefits (optional):</label>
                <input type="text" name="benefits" value={formData.benefits} onChange={handleChange} placeholder="e.g. Health insurance, Remote stipend" />
            </div>
            <div>
                <label>Required Skills (comma-separated):</label>
                <input
                    type="text"
                    name="required_skills"
                    value={formData.required_skills.join(', ')}
                    onChange={handleSkillsChange}
                />
            </div>
            <button type="submit">Post Job</button>
        </form>
    );
};

export default JobPostingForm;