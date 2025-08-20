class SchoolSuppliesSearch {
  constructor() {
    this.apiBaseUrl = "http://localhost:8080";
    this.userRole = localStorage.getItem("userRole"); // Get user role on initialization
    this.initializeElements();
    this.attachEventListeners();
    this.checkAuthentication();
  }

  initializeElements() {
    this.searchInput = document.getElementById("schoolSearch");
    this.searchBtn = document.getElementById("searchBtn");
    this.loadingState = document.getElementById("loadingState");
    this.errorMessage = document.getElementById("errorMessage");
    this.errorText = document.getElementById("errorText");
    this.resultsSection = document.getElementById("resultsSection");
    this.resultsGrid = document.getElementById("resultsGrid");
    this.noResults = document.getElementById("noResults");
    this.modal = document.getElementById("detailsModal");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalSchoolInfo = document.getElementById("modalSchoolInfo");
    this.modalMaterialsList = document.getElementById("modalMaterialsList");
    this.closeModalBtn = document.getElementById("closeModal");
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
    if (this.elements.addMaterialBtn) {
      this.elements.addMaterialBtn.addEventListener("click", () => this.addMaterial())
    }

    if (this.elements.cancelBtn) {
      this.elements.cancelBtn.addEventListener("click", () => this.cancel())
    }

    if (this.elements.form) {
      this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e))
    }
  }

  attachEventListeners() {
    this.searchBtn.addEventListener("click", () => this.performSearch());
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch();
      }
    });

    this.closeModalBtn.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.modal.classList.contains("hidden")) {
        this.closeModal();
      }
    });
  }

  checkAuthentication() {
    const token = localStorage.getItem("bearerToken");
    if (!token) {
      this.showError("You must be logged in to search. Please login first.");
      this.searchBtn.disabled = true;
      this.searchInput.disabled = true;
    }
  }

  async performSearch() {
    const schoolName = this.searchInput.value.trim();

    if (!schoolName) {
      this.showError("Please enter a school name to search.");
      return;
    }

    const token = localStorage.getItem("bearerToken");
    if (!token) {
      this.showError("Authentication token not found. Please login again.");
      return;
    }

    this.showLoading(true);
    this.hideError();
    this.hideResults();

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/listas_padrao/por_escola?escolaNome=${encodeURIComponent(schoolName)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 404) {
          throw new Error("No school supply lists found for this school.");
        } else {
          throw new Error(`Search failed: ${response.status}`);
        }
      }

      const data = await response.json();
      this.displayResults(data);
    } catch (error) {
      console.error("Search error:", error);
      this.showError(error.message || "An error occurred while searching. Please try again.");
    } finally {
      this.showLoading(false);
    }
  }

  displayResults(data) {
    if (!data || data.length === 0) {
      this.showNoResults();
      return;
    }

    this.resultsGrid.innerHTML = "";

    data.forEach((item) => {
      const resultCard = this.createResultCard(item);
      this.resultsGrid.appendChild(resultCard);
    });

    this.showResults();
  }

  createResultCard(item) {
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-colors duration-200 flex flex-col justify-between";
    card.setAttribute('data-list-id', item.listaId);


    let materialInfo = "";
    try {
      if (typeof item.materiais === "string") {
        const parsedMaterial = JSON.parse(item.materiais);
        if (Array.isArray(parsedMaterial) && parsedMaterial.length > 0) {
          materialInfo = parsedMaterial[0].nome || "Unknown Material";
        } else if (parsedMaterial && parsedMaterial.nome) {
          materialInfo = parsedMaterial.nome;
        } else {
          materialInfo = "Unknown Material";
        }
      } else if (item.materiais && item.materiais.nome) {
        materialInfo = item.materiais.nome;
      } else {
        materialInfo = "Unknown Material";
      }
    } catch (e) {
      materialInfo = "Unknown Material";
    }

    // Check localStorage directly for the user's role
    const currentUserRole = localStorage.getItem("userRole"); 
    const excludeButtonHtml = currentUserRole === "ROLE_FUNCIONARIO" ? `
      <button class="exclude-btn mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800">
          Excluir
      </button>
    ` : "";

    // Set innerHTML once, using the variables defined above
    card.innerHTML = `
      <div> <div class="mb-4">
              <h4 class="text-lg font-semibold text-white mb-2">${item.escolaNome || "Unknown School"}</h4>
              <div class="space-y-1 text-sm text-gray-300">
                  <p><span class="text-purple-400">Ano:</span> ${item.anoLetivo || "N/A"}</p>
                  <p><span class="text-purple-400">Série:</span> ${item.serie || "N/A"}</p>
                  <p><span class="text-purple-400">Material:</span> ${materialInfo}</p>
                  <p><span class="text-purple-400">ID da Lista:</span> ${item.listaId || "N/A"}</p>
              </div>
          </div>
      </div>
      <div class="mt-auto"> <button class="view-details-btn w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800">
              Ver Detalhes
          </button>
          ${excludeButtonHtml}
      </div>
    `;

    // Attach event listener for the details button
    const viewDetailsBtn = card.querySelector(".view-details-btn");
    viewDetailsBtn.addEventListener("click", () => this.openModal(item));

    // Attach event listener for the exclude button if it exists
    if (currentUserRole === "ROLE_FUNCIONARIO") {
      const excludeBtn = card.querySelector(".exclude-btn");
      excludeBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent modal from opening
        this.deleteListItem(item.listaId, card);
      });
    }

    return card;
  }
  
  async deleteListItem(listId, cardElement) {
    if (!confirm("Are you sure you want to delete this material list? This action cannot be undone.")) {
        return;
    }

    const token = localStorage.getItem("bearerToken");
    if (!token) {
        this.showError("Authentication token not found. Please login again.");
        return;
    }

    try {
        const response = await fetch(`${this.apiBaseUrl}/listas_padrao/${listId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (response.ok) {
            // Remove the card from the UI
            cardElement.remove();
            
            // Check if there are any results left
            if (this.resultsGrid.children.length === 0) {
                this.showNoResults();
            }

        } else {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Failed to delete. Server status: ${response.status}`;
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Delete error:", error);
        this.showError(error.message || "An error occurred while deleting the list.");
    }
  }

  openModal(item) {
    this.modalTitle.textContent = `${item.escolaNome || "Escola desconhecida"} - Detalhes da Lista de Materiais`;

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
    `;

    // Parse and display materials
    this.displayMaterials(item.materiais);

    // Show modal
    this.modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  displayMaterials(materialData) {
    this.modalMaterialsList.innerHTML = "";

    try {
      let materials = [];

      if (typeof materialData === "string") {
        const parsed = JSON.parse(materialData);
        materials = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(materialData)) {
        materials = materialData;
      } else if (materialData && typeof materialData === "object") {
        materials = [materialData];
      }

      if (materials.length === 0 || !materials[0] || Object.keys(materials[0]).length === 0) {
        this.modalMaterialsList.innerHTML = `<div class="text-center py-4 text-gray-400"><p>No materials found for this list.</p></div>`;
        return;
      }

      materials.forEach((material, index) => {
        const materialCard = document.createElement("div");
        materialCard.className = "bg-gray-700 rounded-lg p-4 border border-gray-600";

        materialCard.innerHTML = `
          <div class="flex justify-between items-start mb-3">
            <h5 class="font-medium text-white text-lg">${material.nome || `Material ${index + 1}`}</h5>
            ${material.quantidade ? `<span class="text-sm bg-purple-600 text-white px-3 py-1 rounded-full font-medium">Quantidade: ${material.quantidade}</span>` : ""}
          </div>
          ${material.observacoes ? `<div class="mt-2"><p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações: ${material.observacoes}</p></div>` : ""}
        `;

        this.modalMaterialsList.appendChild(materialCard);
      });
    } catch (error) {
      console.error("Error parsing materials:", error);
      this.modalMaterialsList.innerHTML = `<div class="text-center py-4 text-red-400"><p>Error loading materials data.</p></div>`;
    }
  }

  closeModal() {
    this.modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  showLoading(show) {
    this.loadingState.classList.toggle("hidden", !show);
    this.searchBtn.disabled = show;
    this.searchBtn.textContent = show ? "Searching..." : "Search";
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorMessage.classList.remove("hidden");
  }

  hideError() {
    this.errorMessage.classList.add("hidden");
  }

  showResults() {
    this.resultsSection.classList.remove("hidden");
    this.noResults.classList.add("hidden");
  }

  hideResults() {
    this.resultsSection.classList.add("hidden");
    this.noResults.classList.add("hidden");
  }

  showNoResults() {
    this.noResults.classList.remove("hidden");
    this.resultsSection.classList.add("hidden");
  }
}

// Initialize the search functionality when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SchoolSuppliesSearch();
});