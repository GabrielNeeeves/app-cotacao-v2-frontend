class SchoolSuppliesSearch {
  constructor() {
    this.apiBaseUrl = "http://localhost:8080"
    this.initializeElements()
    this.attachEventListeners()
    this.checkAuthentication()
  }

  initializeElements() {
    this.searchInput = document.getElementById("schoolSearch")
    this.searchBtn = document.getElementById("searchBtn")
    this.loadingState = document.getElementById("loadingState")
    this.errorMessage = document.getElementById("errorMessage")
    this.errorText = document.getElementById("errorText")
    this.resultsSection = document.getElementById("resultsSection")
    this.resultsGrid = document.getElementById("resultsGrid")
    this.noResults = document.getElementById("noResults")
  }

  attachEventListeners() {
    this.searchBtn.addEventListener("click", () => this.performSearch())
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch()
      }
    })
  }

  checkAuthentication() {
    const token = localStorage.getItem("bearerToken")
    if (!token) {
      this.showError("You must be logged in to search. Please login first.")
      this.searchBtn.disabled = true
      this.searchInput.disabled = true
    }
  }

  async performSearch() {
    const schoolName = this.searchInput.value.trim()

    if (!schoolName) {
      this.showError("Please enter a school name to search.")
      return
    }

    const token = localStorage.getItem("bearerToken")
    if (!token) {
      this.showError("Authentication token not found. Please login again.")
      return
    }

    console.log("Token from localStorage:", token)
    console.log("Token length:", token.length)
    console.log("Authorization header will be:", `Bearer ${token}`)

    this.showLoading(true)
    this.hideError()
    this.hideResults()

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/listas_padrao/por_escola?escolaNome=${encodeURIComponent(schoolName)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log("Response status:", response.status)
      console.log("Response headers:", [...response.headers.entries()])

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.")
        } else if (response.status === 404) {
          throw new Error("No school supply lists found for this school.")
        } else {
          throw new Error(`Search failed: ${response.status}`)
        }
      }

      const data = await response.json()
      this.displayResults(data)
    } catch (error) {
      console.error("Search error:", error)
      this.showError(error.message || "An error occurred while searching. Please try again.")
    } finally {
      this.showLoading(false)
    }
  }

  displayResults(data) {
    if (!data || data.length === 0) {
      this.showNoResults()
      return
    }

    this.resultsGrid.innerHTML = ""

    data.forEach((item) => {
      const resultCard = this.createResultCard(item)
      this.resultsGrid.appendChild(resultCard)
    })

    this.showResults()
  }

  createResultCard(item) {
    const card = document.createElement("div")
    card.className =
      "bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-colors duration-200"

    // Parse material JSON if it's a string
    let materialInfo = ""
    try {
      if (typeof item.material === "string") {
        const parsedMaterial = JSON.parse(item.material)
        materialInfo = parsedMaterial.nome || "Unknown Material"
      } else if (item.material && item.material.nome) {
        materialInfo = item.material.nome
      } else {
        materialInfo = "Unknown Material"
      }
    } catch (e) {
      materialInfo = "Unknown Material"
    }

    card.innerHTML = `
            <div class="mb-4">
                <h4 class="text-lg font-semibold text-white mb-2">${item.escolaNome || "Unknown School"}</h4>
                <div class="space-y-1 text-sm text-gray-300">
                    <p><span class="text-purple-400">Year:</span> ${item.anoLetivo || "N/A"}</p>
                    <p><span class="text-purple-400">Grade:</span> ${item.serie || "N/A"}</p>
                    <p><span class="text-purple-400">Material:</span> ${materialInfo}</p>
                    <p><span class="text-purple-400">List ID:</span> ${item.listaId || "N/A"}</p>
                </div>
            </div>
            <button class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                View Details
            </button>
        `

    return card
  }

  showLoading(show) {
    this.loadingState.classList.toggle("hidden", !show)
    this.searchBtn.disabled = show
    this.searchBtn.textContent = show ? "Searching..." : "Search"
  }

  showError(message) {
    this.errorText.textContent = message
    this.errorMessage.classList.remove("hidden")
  }

  hideError() {
    this.errorMessage.classList.add("hidden")
  }

  showResults() {
    this.resultsSection.classList.remove("hidden")
    this.noResults.classList.add("hidden")
  }

  hideResults() {
    this.resultsSection.classList.add("hidden")
    this.noResults.classList.add("hidden")
  }

  showNoResults() {
    this.noResults.classList.remove("hidden")
    this.resultsSection.classList.add("hidden")
  }
}

// Initialize the search functionality when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SchoolSuppliesSearch()
})
