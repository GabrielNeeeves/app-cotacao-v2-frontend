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
    this.modal = document.getElementById("detailsModal")
    this.modalTitle = document.getElementById("modalTitle")
    this.modalSchoolInfo = document.getElementById("modalSchoolInfo")
    this.modalMaterialsList = document.getElementById("modalMaterialsList")
    this.closeModalBtn = document.getElementById("closeModal")
  }

  attachEventListeners() {
    this.searchBtn.addEventListener("click", () => this.performSearch())
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch()
      }
    })

    this.closeModalBtn.addEventListener("click", () => this.closeModal())
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
    })

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.modal.classList.contains("hidden")) {
        this.closeModal()
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
      if (typeof item.materiais === "string") {
        const parsedMaterial = JSON.parse(item.materiais)
        if (Array.isArray(parsedMaterial) && parsedMaterial.length > 0) {
          materialInfo = parsedMaterial[0].nome || "Unknown Material"
        } else {
          materialInfo = parsedMaterial.nome || "Unknown Material"
        }
      } else if (item.materiais && item.materiais.nome) {
        materialInfo = item.materiais.nome
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
                    <p><span class="text-purple-400">Ano:</span> ${item.anoLetivo || "N/A"}</p>
                    <p><span class="text-purple-400">Série:</span> ${item.serie || "N/A"}</p>
                    <p><span class="text-purple-400">Material:</span> ${materialInfo}</p>
                    <p><span class="text-purple-400">ID da Lista:</span> ${item.listaId || "N/A"}</p>
                </div>
            </div>
            <button class="view-details-btn w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                Ver Detalhes
            </button>
        `

    const viewDetailsBtn = card.querySelector(".view-details-btn")
    viewDetailsBtn.addEventListener("click", () => this.openModal(item))

    return card
  }

  openModal(item) {
    this.modalTitle.textContent = `${item.escolaNome || "Escola desconhecida"} - Detalhes da Lista de Materiais`

    // Populate school info
    this.modalSchoolInfo.innerHTML = `
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-400">Nome da Escola</p>
          <p class="text-white font-medium">${item.escolaNome || "N/A"}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">Ano Letivo</p>
          <p class="text-white font-medium">${item.anoLetivo || "N/A"}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">Série</p>
          <p class="text-white font-medium">${item.serie || "N/A"}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">ID da Lista</p>
          <p class="text-white font-medium">${item.listaId || "N/A"}</p>
        </div>
      </div>
    `

    // Parse and display materials
    this.displayMaterials(item.materiais)

    // Show modal
    this.modal.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }

  displayMaterials(materialData) {
    console.log("Raw material data:", materialData)
    console.log("Material data type:", typeof materialData)

    this.modalMaterialsList.innerHTML = ""

    try {
      let materials = []

      if (typeof materialData === "string") {
        console.log("Parsing string material data:", materialData)
        const parsed = JSON.parse(materialData)
        console.log("Parsed material:", parsed)
        materials = Array.isArray(parsed) ? parsed : [parsed]
      } else if (Array.isArray(materialData)) {
        console.log("Material data is array:", materialData)
        materials = materialData
      } else if (materialData && typeof materialData === "object") {
        console.log("Material data is object:", materialData)
        materials = [materialData]
      }

      console.log("Final materials array:", materials)

      if (materials.length === 0 || !materials[0] || Object.keys(materials[0]).length === 0) {
        this.modalMaterialsList.innerHTML = `
          <div class="text-center py-4 text-gray-400">
            <p>No materials found for this list.</p>
          </div>
        `
        return
      }

      materials.forEach((material, index) => {
        const materialCard = document.createElement("div")
        materialCard.className = "bg-gray-700 rounded-lg p-4 border border-gray-600"

        materialCard.innerHTML = `
          <div class="flex justify-between items-start mb-3">
            <h5 class="font-medium text-white text-lg">${material.nome || `Material ${index + 1}`}</h5>
            ${material.quantidade ? `<span class="text-sm bg-purple-600 text-white px-3 py-1 rounded-full font-medium">Quantidade: ${material.quantidade}</span>` : ""}
          </div>
          ${
            material.observacoes
              ? `
            <div class="mt-2">
              <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações: ${material.observacoes}</p>
            </div>
          `
              : ""
          }
          ${
            material.quantidade
              ? `
            <div class="mt-2">
              <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Quantidade: ${material.quantidade}</p>
            </div>
          `
              : ""
          }
        `

        this.modalMaterialsList.appendChild(materialCard)
      })
    } catch (error) {
      console.error("Error parsing materials:", error)
      this.modalMaterialsList.innerHTML = `
        <div class="text-center py-4 text-red-400">
          <p>Error loading materials data.</p>
        </div>
      `
    }
  }

  closeModal() {
    this.modal.classList.add("hidden")
    document.body.style.overflow = "auto"
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
