const errorPopup = document.getElementById("errorPopup")
const popupContent = document.getElementById("popupContent")

// Declare authManager variable
const authManager = {
  setToken: (token, user) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
  },
  getUserRole: () => {
    const user = JSON.parse(localStorage.getItem("user"))
    return user ? user.role : null
  },
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const response = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, senha: password }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log("Login bem-sucedido. Token recebido:", data.token)

      // Store token and user data in localStorage
      authManager.setToken(data.token, data.user || data)

      // Get user role for routing
      const userRole = authManager.getUserRole()
      console.log("User role:", userRole)

      // Redirect based on user role
      redirectBasedOnRole(userRole)
    } else {
      console.error("Falha no login:", response.statusText)
      showErrorPopup()
    }
  } catch (error) {
    console.error("Erro na requisição:", error)
    showErrorPopup()
  }
})

// Function to redirect based on user role
function redirectBasedOnRole(role) {
  switch (role) {
    case "ADMINISTRADOR":
      window.location.href = "../index/index.html"
      break
    case "FUNCIONARIO":
      window.location.href = "../index/index.html"
      break
    case "CLIENTE":
      window.location.href = "../index/index.html"
      break
    default:
      window.location.href = "../index/index.html"
  }
}

// Function to show error popup
function showErrorPopup() {
  errorPopup.classList.remove("opacity-0", "pointer-events-none")
  errorPopup.classList.add("opacity-100")
  popupContent.classList.remove("scale-95")
  popupContent.classList.add("scale-100")
}

// Close popup event
document.getElementById("closePopup").addEventListener("click", () => {
  popupContent.classList.remove("scale-100")
  popupContent.classList.add("scale-95")
  errorPopup.classList.remove("opacity-100")
  errorPopup.classList.add("opacity-0")

  setTimeout(() => {
    errorPopup.classList.add("pointer-events-none")
  }, 300)
})
