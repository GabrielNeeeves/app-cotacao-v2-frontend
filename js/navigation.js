// Navigation and routing logic
class NavigationManager {
  constructor() {
    this.dashboardUrl = "../../pages/index/index.html"
  }

  // Redirect to dashboard
  redirectToDashboard() {
    window.location.href = this.dashboardUrl
  }

  // Check if user is already logged in and redirect if needed
  checkAuthenticationStatus(authService) {
    if (authService.isAuthenticated()) {
      this.redirectToDashboard()
    }
  }

  // Initialize navigation
  initialize(authService) {
    // Check authentication status on page load only for login page
    if (window.location.pathname.includes("../pages/index/index.html") || window.location.pathname.endsWith("/")) {
      this.checkAuthenticationStatus(authService)
    }
  }
}

window.NavigationManager = NavigationManager
