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

  storeToken(token) {
    localStorage.setItem("bearerToken", token)
  }

  storeUserRole(role) {
    localStorage.setItem("userRole", role)
  }

  storeClienteId(id) {
    localStorage.setItem("clienteId", id)
  }

  storeFuncionarioId(id) {
    localStorage.setItem("funcionarioId", id)
  }

  storeAdminId(id) {
    localStorage.setItem("adminId", id)
  }

  storeEmpresaId(id) {
    localStorage.setItem("empresaId", id)
  }

  storeEscolaId(id) {
    localStorage.setItem("escolaId", id)
  }

  storeEmpresa(nome) {
    localStorage.setItem("empresa", nome)
  }

  storeEscola(nome) {
    localStorage.setItem("escola", nome)
  }


  getToken() {
    return localStorage.getItem("bearerToken")
  }

  getUserRole() {
    const roles = this.getUserRoles()
    return roles.length > 0 ? roles[0] : null
  }

  getClienteId() {
    return localStorage.getItem("clienteId")
  }

  getFuncionarioId() {
    return localStorage.getItem("funcionarioId")
  }

  getAdminId() {
    return localStorage.getItem("adminId")
  }

  getEmpresaId() {
    return localStorage.getItem("empresaId")
  }

  getEscolaId() {
    return localStorage.getItem("escolaId")
  }

  getEmpresa() {
    return localStorage.getItem("empresa")
  }

  getEscola() {
    return localStorage.getItem("escola")
  }

  isAuthenticated() {
    return !!this.getToken()
  }

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
        const text = await response.text()
        data = { message: text || "Unknown error occurred" }
      }

      if (response.ok) {
        if (data.token) this.storeToken(data.token)
        if (data.role) this.storeUserRole(data.role)

        if (data.clienteId) this.storeClienteId(data.clienteId)
        if (data.funcionarioId) this.storeFuncionarioId(data.funcionarioId)
        if (data.adminId) this.storeAdminId(data.adminId)

        if (data.empresaId) this.storeEmpresaId(data.empresaId)
        if (data.escolaId) this.storeEscolaId(data.escolaId)

          if (data.empresa) this.storeEmpresa(data.empresa)
        if (data.escola) this.storeEscola(data.escola)

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

  logout() {
    localStorage.removeItem("bearerToken")
    localStorage.removeItem("userRole")
    localStorage.removeItem("clienteId")
    localStorage.removeItem("funcionarioId")
    localStorage.removeItem("adminId")
    localStorage.removeItem("empresaId")
    localStorage.removeItem("escolaId")
    localStorage.removeItem("empresa")
    localStorage.removeItem("escola")
  }
}

window.AuthService = AuthService

const authService = new AuthService()
window.authService = authService
