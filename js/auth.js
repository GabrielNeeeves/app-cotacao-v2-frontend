// Authentication related functions
class AuthService {
  constructor() {
    this.apiUrl = "http://localhost:8080/auth/login"
  }

  decodeJWT(token) {
    try {
      console.log("[v0] Attempting to decode JWT token")
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      const decoded = JSON.parse(jsonPayload)
      console.log("[v0] JWT decoded successfully:", decoded)
      return decoded
    } catch (error) {
      console.error("[v0] Error decoding JWT:", error)
      return null
    }
  }

  getUserRoles() {
    const token = this.getToken()
    console.log("[v0] Getting user roles, token exists:", !!token)
    if (!token) return []

    const decoded = this.decodeJWT(token)
    if (!decoded) return []

    const authorities = decoded.authorities || decoded.roles || decoded.auth || []
    console.log("[v0] Extracted authorities from JWT:", authorities)
    return authorities
  }

  hasRole(roleName) {
    const roles = this.getUserRoles()
    const hasRole = roles.includes(roleName)
    console.log("[v0] Checking for role:", roleName, "User roles:", roles, "Has role:", hasRole)
    return hasRole
  }

  isFuncionario() {
    const result = this.hasRole("ROLE_FUNCIONARIO")
    console.log("[v0] isFuncionario check result:", result)
    return result
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
    const roles = this.getUserRoles()
    return roles.length > 0 ? roles[0] : null // Return first role or null
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
