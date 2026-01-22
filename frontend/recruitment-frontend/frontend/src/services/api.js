// src/services/api.js
// Mock API service for frontend development

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  // CV APIs
  uploadCV: async (content) => {
    // Mock implementation
    console.log('Uploading CV:', content);
    return new Promise(resolve => setTimeout(() => {
      resolve({
        id: Date.now(),
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }, 1000));
  },

  getCVs: async () => {
    // Mock implementation
    return new Promise(resolve => setTimeout(() => {
      resolve({
        data: [
          {
            id: 1,
            content: "Sample CV content...",
            created_at: "2023-10-15T10:30:00Z"
          }
        ]
      });
    }, 500));
  },

  // Job APIs
  createJob: async (jobData) => {
    // Mock implementation
    console.log('Creating job:', jobData);
    return new Promise(resolve => setTimeout(() => {
      resolve({
        id: Date.now(),
        ...jobData,
        created_at: new Date().toISOString()
      });
    }, 1000));
  },

  getJobs: async () => {
    // Mock implementation
    return new Promise(resolve => setTimeout(() => {
      resolve({
        data: [
          {
            id: 1,
            title: "Frontend Developer",
            description: "React developer needed",
            skills: ["React", "JavaScript"],
            created_at: "2023-10-15T10:30:00Z"
          }
        ]
      });
    }, 500));
  },

  // Match API
  matchJob: async (cvId, jobId) => {
    // Mock implementation
    console.log('Matching CV:', cvId, 'with Job:', jobId);
    return new Promise(resolve => setTimeout(() => {
      resolve({
        score: 85,
        matched_skills: ["React", "JavaScript"],
        missing_skills: ["TypeScript"],
        recommendation: "Good match! Consider applying."
      });
    }, 1500));
  }
};

export default api;