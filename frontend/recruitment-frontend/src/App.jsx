// src/App.jsx - COMPLETE FIXED VERSION
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from "./components/Landing"
import JobSeekerDashboard from "./components/JobSeekerDashboard"
import AuthLayout from "./components/AuthLayout"
import JobPostingLogin from "./components/JobPostingLogin"
import JobPostingDashboard from "./components/JobPostingDashboard"
import JobSeekerLogin from './components/JobSeekerLogin'
import './App.css'
import EditProfile from './components/EditProfile'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/jobseeker" element={<JobSeekerDashboard />} />
          <Route path="/jobposting-login" element={<JobPostingLogin />} />
          <Route path="/jobposting-dashboard" element={<JobPostingDashboard />} />
          <Route path="/jobseeker-login" element={<JobSeekerLogin />} />
          <Route path="/jobseeker-dashboard" element={<AuthLayout><JobSeekerDashboard /></AuthLayout>} />
          <Route path="/jobposting-dashboard" element={<AuthLayout><JobPostingDashboard /></AuthLayout>} />
          <Route path="/edit-profile" element={<AuthLayout><EditProfile /></AuthLayout>} />

        </Routes>
      </div>
    </Router>
  )
}

export default App