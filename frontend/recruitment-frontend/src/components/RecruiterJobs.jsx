import React, { useEffect, useState } from 'react';
import axios from '../services/api';

const RecruiterJobs = () => {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get('/recruiter/jobs');
                setJobs(response.data.data);
            } catch (error) {
                console.error('Error fetching recruiter jobs:', error);
                alert('Failed to fetch jobs.');
            }
        };

        fetchJobs();
    }, []);

    return (
        <div>
            <h1>My Posted Jobs</h1>
            {jobs.length === 0 ? (
                <p>No jobs posted yet.</p>
            ) : (
                jobs.map((job) => (
                    <div key={job.id}>
                        <h2>{job.title}</h2>
                        <p>{job.description}</p>
                        <h3>Applicants:</h3>
                        {(!job.applications || job.applications.length === 0) ? (
                            <p>No applicants yet.</p>
                        ) : (
                            <ul>
                                {job.applications.map((application) => (
                                    <li key={application.id}>
                                        CV ID: {application.cv ? application.cv.id : 'N/A'}, Match Score: {application.match_score}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default RecruiterJobs;