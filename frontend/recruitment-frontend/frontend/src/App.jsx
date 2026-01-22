// src/App.jsx
import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import JobSeekerDashboard from './components/JobSeekerDashboard'
import LoginPage from './components/LoginPage'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [userType, setUserType] = useState('')

  const handleOptionClick = (option) => {
    if (option === 'jobSeeker') {
      setActiveView('jobSeeker')
    } else if (option === 'jobPosting' || option === 'admin') {
      setUserType(option)
      setActiveView('login')
    }
  }

  const handleLoginSuccess = () => {
    setActiveView(userType)
  }

  const handleBackToDashboard = () => {
    setActiveView('dashboard')
  }

  return (
    <div className="app-container">
      {activeView === 'dashboard' && (
        <Dashboard onOptionClick={handleOptionClick} />
      )}
      {activeView === 'jobSeeker' && (
        <JobSeekerDashboard onBack={handleBackToDashboard} />
      )}
      {activeView === 'login' && (
        <LoginPage 
          userType={userType} 
          onLogin={handleLoginSuccess}
          onBack={handleBackToDashboard}
        />
      )}
      {(activeView === 'jobPosting' || activeView === 'admin') && (
        <div className="coming-soon">
          <h2>{userType === 'jobPosting' ? 'Job Posting' : 'Admin'} Dashboard</h2>
          <p>This section is under development</p>
          <button onClick={handleBackToDashboard}>Back to Main Dashboard</button>
        </div>
      )}
    </div>
  )
}

export default App