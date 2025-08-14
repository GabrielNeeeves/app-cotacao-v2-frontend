// Main application initialization
document.addEventListener("DOMContentLoaded", () => {
  // Create navigation manager instance
  const navigationManager = new window.NavigationManager()

  // Create UI manager instance with proper dependencies
  const uiManager = new window.UIManager(window.authService, navigationManager)

  // Initialize all managers
  uiManager.initializeForm()
  navigationManager.initialize(window.authService)
})
