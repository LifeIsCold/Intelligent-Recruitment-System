// src/services/api.js
// API service for frontend development using axios

import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api'

const API = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add token to all requests
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for better error handling
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error.message)
    return Promise.reject(error)
  }
)

const api = {
  // Auth APIs
  login: async (credentials) => {
    try {
      const res = await API.post('/login', credentials)
      return res.data
    } catch (err) {
      console.error('Login error:', err)
      throw err
    }
  },

  register: async (payload) => {
    try {
      const res = await API.post('/register', payload)
      return res.data
    } catch (err) {
      console.error('Register error:', err)
      throw err
    }
  },

  // CV APIs
  uploadCV: async (formData) => {
    try {
      const res = await API.post('/user/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      console.error('uploadCV error:', err);
      throw err;
    }
  },

  getCVs: async () => {
    const res = await API.get('/user/cvs');
    return res.data;
  },

  // Industry APIs
  getIndustries: async () => {
    const res = await API.get('/industries')
    return res.data
  },

  getSiteStats: async () => {
    const res = await API.get('/site-stats')
    return res.data
  },

  getProfile: async () => {
    const res = await API.get('/user/profile')
    return res.data
  },

  // Skills APIs
  getSkills: async () => {
    const res = await API.get('/skills')
    return res.data
  },

  addSkillsToUser: async (skills) => {
    const res = await API.post('/user/skills', { skills })
    return res.data
  },

  getUserSkills: async () => {
    const res = await API.get('/user/skills')
    return res.data
  },

  // Job APIs
  createJob: async (jobData) => {
    const dataToSend = {
      ...jobData,
      required_skills: Array.isArray(jobData.required_skills) 
        ? jobData.required_skills
        : []
    };
    
    const res = await API.post('/jobs', dataToSend)
    return res.data
  },
  getJobs: async () => {
    const res = await API.get('/jobs')
    return res.data
  },

  getRecruiterJobs: async () => {
    const res = await API.get('/recruiter/jobs')
    return res.data
  },
  deleteJob: async (jobId) => {
    const res = await API.delete(`/jobs/${jobId}`)
    return res.data
  },
  // Match API (kept mock for now)
  matchJob: async (cvId, jobId) => {
    // If backend has a matching endpoint, replace this with a real request.
    return new Promise(resolve => setTimeout(() => {
      resolve({
        score: 85,
        matched_skills: ["React", "JavaScript"],
        missing_skills: ["TypeScript"],
        recommendation: "Good match! Consider applying."
      })
    }, 1500))
  }
  ,
  // Update authenticated user's profile
  updateProfile: async (payload) => {
    const res = await API.patch('/user/profile', payload)
    return res.data
  }
}

export default api