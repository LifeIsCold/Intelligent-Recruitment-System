import React, { useEffect, useState } from 'react';
import axios from '../services/api';
import './RecruiterJobs.css'
const RecruiterJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/recruiter/jobs');
                // Handle different response formats
                const jobsData = response.data.data || response.data;
                setJobs(Array.isArray(jobsData) ? jobsData : []);
            } catch (error) {
                console.error('Error fetching recruiter jobs:', error);
                alert('Failed to fetch jobs.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return <div>Loading jobs...</div>;
    }

    return (
        <div>
            <h1>My Posted Jobs</h1>
            {jobs.length === 0 ? (
                <p>No jobs posted yet.</p>
            ) : (
                jobs.map((job) => (
                    <div key={job.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h2>{job.title}</h2>
                        <p>{job.description}</p>
                        <p><strong>Status:</strong> {job.status}</p>
                        <p><strong>Work Type:</strong> {job.work_type}</p>
                        <p><strong>Salary:</strong> {job.salary || 'Not specified'}</p>
                        
                        <h3>Applicants:</h3>
                        {(job.applications && job.applications.length > 0) ? (
                            <ul>
                                {job.applications.map((application) => (
                                    <li key={application.id}>
                                        <strong>Applicant:</strong> {application.user?.name || 'Unknown'} - 
                                        <strong> Match Score:</strong> {application.match_score || 0}%
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No applicants yet.</p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default RecruiterJobs;