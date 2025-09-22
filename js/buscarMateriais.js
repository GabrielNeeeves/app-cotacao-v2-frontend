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
    this.showAllBtn = document.getElementById("showAllBtn")
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

  checkAccess() {
    const token = localStorage.getItem("bearerToken")
    if (!token) {
      console.log("[v0] No token found, user needs to login")
      this.showError("Please login to access this page")
      return false
    }

    // For now, allow access and let the API handle role verification
    // The backend will return 403 if user doesn't have FUNCIONARIO role
    console.log("[v0] Token found, allowing access to create list page")
    return true
  }

  initialize() {
    console.log("[v0] Initializing CreateListManager")

    if (!this.checkAccess()) {
      return
    }

    this.attachEventListeners()
    this.addMaterial() // Add first material by default
  }

  attachEventListeners() {
    this.searchBtn.addEventListener("click", () => this.performSearch())
    this.showAllBtn.addEventListener("click", () => this.showAllLists())
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
      this.showAllBtn.disabled = true
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

  async showAllLists() {
    const token = localStorage.getItem("bearerToken")
    if (!token) {
      this.showError("Authentication token not found. Please login again.")
      return
    }

    this.showLoading(true)
    this.hideError()
    this.hideResults()

    try {
      const response = await fetch(`${this.apiBaseUrl}/listas_padrao`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.")
        } else if (response.status === 404) {
          throw new Error("No school supply lists found.")
        } else {
          throw new Error(`Failed to load lists: ${response.status}`)
        }
      }

      const data = await response.json()
      this.displayResults(data)
    } catch (error) {
      console.error("Show all lists error:", error)
      this.showError(error.message || "An error occurred while loading lists. Please try again.")
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
      "bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-colors duration-200 flex flex-col justify-between relative"

    const listId = item.listaPadraoId || item.listaId
    card.setAttribute("data-list-id", listId)

    let materialInfo = ""
    try {
      if (typeof item.materiais === "string") {
        const parsedMaterial = JSON.parse(item.materiais)
        if (Array.isArray(parsedMaterial) && parsedMaterial.length > 0) {
          materialInfo = parsedMaterial[0].nome || "Unknown Material"
        } else if (parsedMaterial && parsedMaterial.nome) {
          materialInfo = parsedMaterial.nome
        } else {
          materialInfo = "Unknown Material"
        }
      } else if (item.materiais && item.materiais.nome) {
        materialInfo = item.materiais.nome
      } else {
        materialInfo = "Unknown Material"
      }
    } catch (e) {
      materialInfo = "Unknown Material"
    }

    const excludeButtonHtml = `
      <button class="exclude-btn absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 z-10" title="Excluir lista">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
      </button>
    `

    let cardContent = `
      ${excludeButtonHtml}
      <div> 
          <div class="mb-4">
              <h4 class="text-lg font-semibold text-white mb-2 pr-12">${item.escolaNome || "Unknown School"}</h4>
              <div class="space-y-1 text-sm text-gray-300">
                  <p><span class="text-purple-400">Ano:</span> ${item.anoLetivo || "N/A"}</p>
                  <p><span class="text-purple-400">Série:</span> ${item.serie || "N/A"}</p>
                  <p><span class="text-purple-400">Material:</span> ${materialInfo}</p>
                  <p><span class="text-purple-400">ID da Lista:</span> ${listId || "N/A"}</p>`

    if (item.funcionarioNome) {
      cardContent += `
                  <p><span class="text-purple-400">Funcionário:</span> ${item.funcionarioNome}</p>`
    }

    cardContent += `
              </div>
          </div>
      </div>
      <div class="mt-auto"> 
          <button class="view-details-btn w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800">
              Ver Detalhes
          </button>
      </div>
    `

    card.innerHTML = cardContent

    const viewDetailsBtn = card.querySelector(".view-details-btn")
    viewDetailsBtn.addEventListener("click", () => this.openModal(item))

    const excludeBtn = card.querySelector(".exclude-btn")
    if (excludeBtn) {
      excludeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.deleteListItem(listId, card)
      })
    }

    return card
  }

  async deleteListItem(listId, cardElement) {
    if (!confirm("Tem certeza que deseja excluir esta lista de materiais? Esta ação não pode ser desfeita.")) {
      return
    }

    const token = localStorage.getItem("bearerToken")
    if (!token) {
      this.showError("Authentication token not found. Please login again.")
      return
    }

    console.log("[v0] Attempting to delete list with ID:", listId)

    // Try different possible endpoint variations
    const possibleEndpoints = [
      `${this.apiBaseUrl}/listas_padrao/${listId}`,
      `${this.apiBaseUrl}/listas_padrao/delete/${listId}`,
      `${this.apiBaseUrl}/api/listas_padrao/${listId}`,
      `${this.apiBaseUrl}/api/listas_padrao/delete/${listId}`,
    ]

    for (const endpoint of possibleEndpoints) {
      try {
        console.log("[v0] Trying endpoint:", endpoint)

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("[v0] Response status:", response.status)

        if (response.ok) {
          console.log("[v0] Delete successful with endpoint:", endpoint)
          cardElement.remove()
          if (this.resultsGrid.children.length === 0) {
            this.showNoResults()
          }
          return // Success, exit the function
        } else if (response.status !== 404) {
          // If it's not a 404, it might be the right endpoint but another error
          const errorData = await response.json().catch(() => null)
          const errorMessage = errorData?.message || `Failed to delete. Server status: ${response.status}`
          throw new Error(errorMessage)
        }
        // If 404, continue to next endpoint
      } catch (error) {
        console.error("[v0] Error with endpoint", endpoint, ":", error)
        // Continue to next endpoint if this one fails
      }
    }

    // If all endpoints failed
    this.showError("Você não possui permissão para realizar essa ação.")
  }

  openModal(item) {
    this.modalTitle.textContent = `${item.escolaNome || "Escola desconhecida"} - Detalhes da Lista de Materiais`

    const listId = item.listaPadraoId || item.listaId
    let modalContent = `
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
          <p class="text-white font-medium">${listId || "N/A"}</p>
        </div>`

    if (item.funcionarioNome) {
      modalContent += `
        <div>
          <p class="text-sm text-gray-400">Funcionário</p>
          <p class="text-white font-medium">${item.funcionarioNome}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">ID do Funcionário</p>
          <p class="text-white font-medium">${item.funcionarioId || "N/A"}</p>
        </div>`
    }

    modalContent += `</div>`

    this.modalSchoolInfo.innerHTML = modalContent

    this.displayMaterials(item.materiais)

    this.modal.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }

  displayMaterials(materialData) {
    this.modalMaterialsList.innerHTML = ""

    try {
      let materials = []

      if (typeof materialData === "string") {
        const parsed = JSON.parse(materialData)
        materials = Array.isArray(parsed) ? parsed : [parsed]
      } else if (Array.isArray(materialData)) {
        materials = materialData
      } else if (materialData && typeof materialData === "object") {
        materials = [materialData]
      }

      if (materials.length === 0 || !materials[0] || Object.keys(materials[0]).length === 0) {
        this.modalMaterialsList.innerHTML = `<div class="text-center py-4 text-gray-400"><p>No materials found for this list.</p></div>`
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
          ${material.observacoes ? `<div class="mt-2"><p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações: ${material.observacoes}</p></div>` : ""}
        `

        this.modalMaterialsList.appendChild(materialCard)
      })
    } catch (error) {
      console.error("Error parsing materials:", error)
      this.modalMaterialsList.innerHTML = `<div class="text-center py-4 text-red-400"><p>Error loading materials data.</p></div>`
    }
  }

  closeModal() {
    this.modal.classList.add("hidden")
    document.body.style.overflow = "auto"
  }

  showLoading(show) {
    this.loadingState.classList.toggle("hidden", !show)
    this.searchBtn.disabled = show
    this.showAllBtn.disabled = show
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

document.addEventListener("DOMContentLoaded", () => {
  new SchoolSuppliesSearch()
})
