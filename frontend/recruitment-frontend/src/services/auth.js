// src/services/auth.js
// Centralized logout helper to clear client auth state and redirect to landing
export function logout(navigate) {
  try {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    localStorage.removeItem('authUserName')
    localStorage.removeItem('authUserEmail')
    // keep postedJobs if you want, but remove to avoid stale private data
    localStorage.removeItem('postedJobs')
  } catch (e) {
    // ignore storage errors
  }

  if (typeof navigate === 'function') navigate('/')
}

export default { logout }
