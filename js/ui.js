// UI manipulation and form handling
class UIManager {
  constructor(authService, navigationManager) {
    this.elements = {
      form: document.getElementById("loginForm"),
      email: document.getElementById("email"),
      password: document.getElementById("password"),
      submitButton: document.getElementById("submitButton"),
      errorMessage: document.getElementById("errorMessage"),
      loadingMessage: document.getElementById("loadingMessage"),
      errorText: document.getElementById("errorText"),
    }
    this.authService = authService
    this.navigationManager = navigationManager
  }

  // Show loading state
  showLoading() {
    this.elements.errorMessage.classList.add("hidden")
    this.elements.loadingMessage.classList.remove("hidden")
    this.elements.submitButton.disabled = true
    this.elements.submitButton.textContent = "Signing in..."
  }

  // Hide loading state
  hideLoading() {
    this.elements.loadingMessage.classList.add("hidden")
    this.elements.submitButton.disabled = false
    this.elements.submitButton.textContent = "Sign In"
  }

  // Show error message
  showError(message) {
    this.elements.errorText.textContent = message
    this.elements.errorMessage.classList.remove("hidden")
  }

  // Hide error message
  hideError() {
    this.elements.errorMessage.classList.add("hidden")
  }

  // Get form data
  getFormData() {
    return {
      email: this.elements.email.value,
      password: this.elements.password.value,
    }
  }

  // Reset form
  resetForm() {
    this.elements.form.reset()
  }

  // Initialize form event listeners
  initializeForm() {
    this.elements.form.addEventListener("submit", async (e) => {
      e.preventDefault()
      await this.handleLogin()
    })
  }

  // Handle login form submission
  async handleLogin() {
    const { email, password } = this.getFormData()

    this.hideError()
    this.showLoading()

    try {
      const result = await this.authService.login(email, password)

      if (result.success) {
        // Redirect to dashboard
        this.navigationManager.redirectToDashboard()
      } else {
        this.showError(result.error)
      }
    } catch (error) {
      console.error("Login error:", error)
      this.showError("Network error. Please check your connection and try again.")
    } finally {
      this.hideLoading()
    }
  }
}

window.UIManager = UIManager
