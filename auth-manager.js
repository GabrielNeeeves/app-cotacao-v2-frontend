// Authentication Manager - Handles token storage and API authentication
class AuthManager {
  constructor() {
    this.tokenKey = "auth_token"
    this.userKey = "user_data"
    this.baseURL = "http://localhost:8080"
  }

  // Store token and user data in localStorage
  setToken(token, userData = null) {
    localStorage.setItem(this.tokenKey, token)
    if (userData) {
      localStorage.setItem(this.userKey, JSON.stringify(userData))
    }
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  // Get user data from localStorage
  getUserData() {
    const userData = localStorage.getItem(this.userKey)
    return userData ? JSON.parse(userData) : null
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken()
    if (!token) return false

    // Check if token is expired (if your token has expiration)
    try {
      const payload = this.decodeJWT(token)
      if (payload.exp && payload.exp < Date.now() / 1000) {
        this.logout()
        return false
      }
      return true
    } catch (error) {
      // If token is malformed, consider user not authenticated
      return false
    }
  }

  // Decode JWT token (basic implementation)
  decodeJWT(token) {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error decoding JWT:", error)
      return {}
    }
  }

  // Get user role from token
  getUserRole() {
    const token = this.getToken()
    if (!token) return null

    try {
      const payload = this.decodeJWT(token)
      return payload.role || payload.user_role || null
    } catch (error) {
      console.error("Error getting user role:", error)
      return null
    }
  }

  // Check if user has specific role
  hasRole(requiredRole) {
    const userRole = this.getUserRole()
    return userRole === requiredRole
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const userRole = this.getUserRole()
    return roles.includes(userRole)
  }

  // Logout user
  logout() {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
    // Redirect to login page
    window.location.href = "/login.html"
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = this.getToken()

    if (!token) {
      throw new Error("No authentication token found")
    }

    // Default headers
    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    // Merge with provided headers
    const headers = {
      ...defaultHeaders,
      ...(options.headers || {}),
    }

    // Make the request
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle token expiration
    if (response.status === 401) {
      console.warn("Token expired or invalid, logging out...")
      this.logout()
      throw new Error("Authentication failed")
    }

    return response
  }

  // GET request with authentication
  async get(endpoint) {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "GET",
    })
  }

  // POST request with authentication
  async post(endpoint, data) {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // PUT request with authentication
  async put(endpoint, data) {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // DELETE request with authentication
  async delete(endpoint) {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "DELETE",
    })
  }

  // Initialize auth check on page load
  init() {
    // Check if user is authenticated when page loads
    if (this.isAuthenticated()) {
      console.log("User is authenticated")
      const userData = this.getUserData()
      const userRole = this.getUserRole()
      console.log("User data:", userData)
      console.log("User role:", userRole)
    } else {
      console.log("User is not authenticated")
    }
  }
}

// Create global instance
const authManager = new AuthManager()

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  authManager.init()
})
