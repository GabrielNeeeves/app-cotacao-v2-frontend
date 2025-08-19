// Main application initialization
document.addEventListener("DOMContentLoaded", () => {
  // Create navigation manager instance
  const navigationManager = new window.NavigationManager()

  const currentPage = window.location.pathname.split("/").pop()

  if (currentPage === "create-list.html") {
    // Initialize create list manager for material list creation page
    window.createListManager = new window.CreateListManager()
    window.createListManager.initialize()
  } else if (currentPage === "search.html") {
    // Initialize search manager for search functionality
    if (window.SchoolSuppliesSearch) {
      window.searchManager = new window.SchoolSuppliesSearch()
    }
  } else {
    // Create UI manager instance with proper dependencies only for login page
    const uiManager = new window.UIManager(window.authService, navigationManager)
    // Initialize form for login page
    uiManager.initializeForm()
  }

  // Always initialize navigation
  navigationManager.initialize(window.authService)
})
