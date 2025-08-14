// Authentication related functions
class AuthService {
  constructor() {
    this.apiUrl = "http://localhost:8080/auth/login"
  }

  // Store token in localStorage
  storeToken(token) {
    localStorage.setItem("bearerToken", token)
  }

  // Store user role in localStorage
  storeUserRole(role) {
    localStorage.setItem("userRole", role)
  }

  // Get stored token
  getToken() {
    return localStorage.getItem("bearerToken")
  }

  // Get stored user role
  getUserRole() {
    return localStorage.getItem("userRole")
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken()
  }

  // Login function
  async login(email, password) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          senha: password,
        }),
      })

      let data = null
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        const text = await response.text()
        if (text.trim()) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error("JSON parse error:", parseError)
            return {
              success: false,
              error: "Invalid response from server. Please try again.",
            }
          }
        } else {
          data = {}
        }
      } else {
        // Handle non-JSON responses
        const text = await response.text()
        data = { message: text || "Unknown error occurred" }
      }

      if (response.ok) {
        // Store the Bearer Token
        if (data.token) {
          this.storeToken(data.token)
        }

        // Store user role if provided
        if (data.role) {
          this.storeUserRole(data.role)
        }

        return { success: true, data }
      } else {
        return {
          success: false,
          error: data.message || `Server error: ${response.status}`,
        }
      }
    } catch (error) {
      console.error("Network error:", error)
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      }
    }
  }

  // Logout function
  logout() {
    localStorage.removeItem("bearerToken")
    localStorage.removeItem("userRole")
  }
}

window.AuthService = AuthService
// Create global auth service instance
const authService = new AuthService()
window.authService = authService
