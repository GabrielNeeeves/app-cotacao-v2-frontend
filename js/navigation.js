// Navigation and routing logic
class NavigationManager {
  constructor() {
    this.dashboardUrl = "../index/index.html"
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
    // Check authentication status on page load
    this.checkAuthenticationStatus(authService)
  }
}

window.NavigationManager = NavigationManager
