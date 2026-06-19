import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const API = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
})

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
    response => {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
      return response;
    },
    error => {
      console.error('❌ API Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message,
        role: localStorage.getItem('authRole'),
        hasToken: !!localStorage.getItem('authToken')
      });
      
      // Don't auto-redirect for 403 errors - let the component handle it
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url || ''
        if (!requestUrl.includes('/stats')) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('authRole')
          localStorage.removeItem('authUserName')
          localStorage.removeItem('authUserEmail')
          window.location.href = '/jobseeker-login'
        }
      }
      
      return Promise.reject(error)
    }
  )

const api = {
  // ========== AUTH APIs ==========
  login: async (credentials) => {
    const res = await API.post('/login', credentials)
    return res.data
  },

  register: async (payload) => {
    const res = await API.post('/register', payload)
    return res.data
  },

  logout: async () => {
    const res = await API.post('/logout')
    return res.data
  },

  getProfile: async () => {
    try {
      const res = await API.get('/user/profile')
      if (res.data && res.data.success) {
        return res.data
      } else if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
      return { success: true, data: res.data }
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  updateProfile: async (payload) => {
    const res = await API.patch('/user/profile', payload)
    return res.data
  },

  changePassword: async (passwordData) => {
    try {
      const res = await API.post('/user/change-password', passwordData);
      return res.data;
    } catch (error) {
      console.error('Password change API error:', error.response?.data);
      throw error;
    }
  },

  // ========== NOTIFICATION APIS ==========
  getNotifications: async () => {
    const res = await API.get('/notifications');
    return res.data;
  },

  markNotificationAsRead: async (id) => {
    const res = await API.post(`/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsAsRead: async () => {
    const res = await API.post('/notifications/read-all');
    return res.data;
  },

  getUnreadNotificationCount: async () => {
    const res = await API.get('/notifications/unread-count');
    return res.data;
  },

  // ========== CV APIs ==========
  uploadCV: async (formData) => {
    try {
      const res = await API.post('/cvs', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (error) {
      console.error('CV upload API error:', error.response?.data);
      throw error;
    }
  },

  getCVs: async () => {
    const res = await API.get('/cvs')
    return res.data
  },

  setDefaultCV: async (cvId) => {
    const res = await API.put(`/cvs/${cvId}/default`)
    return res.data
  },

  deleteCV: async (cvId) => {
    const res = await API.delete(`/cvs/${cvId}`)
    return res.data
  },

  downloadCV: async (cvId) => {
    try {
      const response = await API.get(`/cvs/${cvId}/download`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error downloading CV:', error)
      throw error
    }
  },

  downloadCVTemplate: async () => {
    try {
      const response = await API.get('/cv-template', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'cv_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      return { success: true }
    } catch (error) {
      console.error('Error downloading template:', error)
      throw error
    }
  },

  // ========== JOB APPLICATION APIs ==========
  applyForJob: async (jobId, cvId) => {
    const res = await API.post(`/jobs/${jobId}/apply`, { cv_id: cvId })
    return res.data
  },
  deleteApplication: async (applicationId) => {
    const res = await API.delete(`/applications/${applicationId}/delete`);
    return res.data;
  },
  getMyApplications: async () => {
    const res = await API.get('/applications/my')
    return res.data
  },

  getApplicationDetails: async (applicationId) => {
    const res = await API.get(`/applications/${applicationId}`)
    return res.data
  },

  // ========== JOB APIs (For Job Seekers) ==========
  getJobs: async () => {
    const res = await API.get('/jobs')
    return res.data
  },

  getJobDetails: async (jobId) => {
    const res = await API.get(`/jobs/${jobId}`)
    return res.data
  },

  // ========== JOB APIs (For Recruiters) ==========
  getRecruiterJobs: async () => {
    try {
      const res = await API.get('/recruiter/jobs')
      if (res.data && res.data.success) {
        return res.data
      } else {
        return { 
          success: true, 
          data: res.data || [],
          company: res.data?.company 
        }
      }
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error)
      throw error
    }
  },

  createJob: async (jobData) => {
    const dataToSend = {
      ...jobData,
      required_skills: Array.isArray(jobData.required_skills) 
        ? jobData.required_skills
        : []
    }
    const res = await API.post('/jobs', dataToSend)
    return res.data
  },

  updateJob: async (jobId, jobData) => {
    const dataToSend = {
      ...jobData,
      required_skills: Array.isArray(jobData.required_skills) 
        ? jobData.required_skills
        : []
    }
    const res = await API.put(`/jobs/${jobId}`, dataToSend)
    return res.data
  },

  updateJobStatus: async (jobId, status) => {
    const res = await API.put(`/jobs/${jobId}/status`, { status })
    return res.data
  },

  deleteJob: async (jobId) => {
    const res = await API.delete(`/jobs/${jobId}`)
    return res.data
  },

  // ========== APPLICATION MANAGEMENT APIs (For Recruiters) ==========
  getJobApplications: async (jobId) => {
    const res = await API.get(`/jobs/${jobId}/applications`)
    return res.data
  },

  getApplicationStats: async (jobId) => {
    const res = await API.get(`/applications/${jobId}/stats`)
    return res.data
  },

  // ========== OFFER ACCEPT/DECLINE APIs ==========
  acceptOffer: async (applicationId) => {
    const res = await API.post(`/applications/${applicationId}/accept-offer`);
    return res.data;
  },

  declineOffer: async (applicationId) => {
    const res = await API.post(`/applications/${applicationId}/decline-offer`);
    return res.data;
  },

  // ========== UPDATED APPLICATION STATUS API (Handles both simple and complex updates) ==========
  updateApplicationStatus: async (applicationId, data) => {
    let payload = {};
    
    if (typeof data === 'string') {
      // Simple status update
      payload = { status: data };
    } else if (data && typeof data === 'object') {
      // Complex object with status and other fields
      payload = data;
    }
    
    console.log('📤 Updating application status:', { applicationId, payload });
    const res = await API.put(`/applications/${applicationId}/status`, payload);
    return res.data;
  },

  // ========== INDUSTRY APIs ==========
  getIndustries: async () => {
    const res = await API.get('/industries')
    return res.data
  },

  // ========== SKILLS APIs ==========
  getSkills: async () => {
    const res = await API.get('/skills')
    return res.data
  },

  createSkill: async (skillData) => {
    const res = await API.post('/skills', skillData)
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

  // ========== TEST API ==========
  testConnection: async () => {
    try {
      const res = await API.get('/test')
      return res.data
    } catch (error) {
      console.error('Test connection failed:', error)
      throw error
    }
  },

  // ========== SITE STATS API ==========
  getSiteStats: async () => {
    try {
      const res = await API.get('/stats')
      return res.data
    } catch (error) {
      console.error('Error fetching site stats:', error)
      return {
        total_users: 0,
        total_companies: 0,
        total_jobs: 0,
        total_applications: 0
      }
    }
  },

  // ========== CV SCORING APIs ==========
  scoreCV: async (cvId, jobId, applicationId = null) => {
    try {
      const payload = { 
        job_id: jobId 
      };
      
      if (applicationId) {
        payload.application_id = applicationId;
      }
      
      const res = await API.post(`/cvs/${cvId}/score`, payload);
      return res.data;
    } catch (error) {
      console.error('Error scoring CV:', error);
      throw error;
    }
  },

  getCVScoreHistory: async (cvId) => {
    try {
      const res = await API.get(`/cvs/${cvId}/score-history`);
      return res.data;
    } catch (error) {
      console.error('Error fetching score history:', error);
      throw error;
    }
  },

  getScoreDetails: async (scoreId) => {
    try {
      const res = await API.get(`/scores/${scoreId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching score details:', error);
      throw error;
    }
  },

  // ========== PROFILE PICTURE APIs ==========
  uploadProfilePicture: async (formData) => {
    const res = await API.post('/user/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  removeProfilePicture: async () => {
    const res = await API.delete('/user/profile-picture');
    return res.data;
  },

  // ========== SCORING WEIGHTS APIs ==========
  getGlobalWeights: async () => {
    const res = await API.get('/scoring-weights/global');
    return res.data;
  },

  updateGlobalWeights: async (weights) => {
    const res = await API.put('/scoring-weights/global', weights);
    return res.data;
  },

  getCompanyWeights: async (companyId) => {
    const res = await API.get(`/companies/${companyId}/scoring-weights`);
    return res.data;
  },

  updateCompanyWeights: async (companyId, weights) => {
    const res = await API.put(`/companies/${companyId}/scoring-weights`, weights);
    return res.data;
  },

  getJobWeights: async (jobId) => {
    const res = await API.get(`/jobs/${jobId}/scoring-weights`);
    return res.data;
  },

  updateJobWeights: async (jobId, weights) => {
    const res = await API.put(`/jobs/${jobId}/scoring-weights`, weights);
    return res.data;
  },

  // Update scoreCV to accept custom weights
  scoreCV: async (cvId, jobId, applicationId = null, customWeights = null) => {
    try {
      const payload = { 
        job_id: jobId 
      };
      
      if (applicationId) {
        payload.application_id = applicationId;
      }
      
      if (customWeights) {
        payload.weights = customWeights;
      }
      
      const res = await API.post(`/cvs/${cvId}/score`, payload);
      return res.data;
    } catch (error) {
      console.error('Error scoring CV:', error);
      throw error;
    }
  },

  // ========== SAVED JOBS APIs ==========
  getSavedJobs: async () => {
    const res = await API.get('/saved-jobs');
    return res.data;
  },

  saveJob: async (jobId) => {
    const res = await API.post(`/jobs/${jobId}/save`);
    return res.data;
  },

  unsaveJob: async (jobId) => {
    const res = await API.delete(`/jobs/${jobId}/unsave`);
    return res.data;
  },

  checkJobSaved: async (jobId) => {
    const res = await API.get(`/jobs/${jobId}/saved-status`);
    return res.data;
  },
}

export default api