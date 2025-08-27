class CreateListManager {
  constructor() {
    this.materials = []
    this.materialCount = 0
    this.initializeElements()
  }

  initializeElements() {
    this.elements = {
      form: document.getElementById("createListForm"),
      employeeId: document.getElementById("funcionarioId"),
      schoolId: document.getElementById("escolaId"),
      academicYear: document.getElementById("anoLetivo"),
      gradeClass: document.getElementById("serie"),
      materialsContainer: document.getElementById("materialsContainer"),
      addMaterialBtn: document.getElementById("addMaterialBtn"),
      cancelBtn: document.getElementById("cancelBtn"),
      submitBtn: document.getElementById("submitBtn"),
      errorMessage: document.getElementById("errorMessage"),
      successMessage: document.getElementById("successMessage"),
    }
  }

  checkAccess() {
    const token = localStorage.getItem("bearerToken")
    if (!token) {
      console.log("[v0] No token found, user needs to login")
      this.showError("Faça o login para acessar esta página")
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

  addMaterial() {
    this.materialCount++
    const materialDiv = document.createElement("div")
    materialDiv.className = "bg-gray-700 p-4 rounded-lg"
    materialDiv.id = `material-${this.materialCount}`

    materialDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-medium text-white">Material ${this.materialCount}</h3>
                <button type="button" class="text-red-400 hover:text-red-300 text-sm" onclick="window.createListManager.removeMaterial(${this.materialCount})">
                    Remove
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Material Name</label>
                    <input type="text" name="materialName" required 
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                    <input type="number" name="quantity" required min="1"
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Observations</label>
                    <input type="text" name="observations"
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
            </div>
        `

    this.elements.materialsContainer.appendChild(materialDiv)
  }

  removeMaterial(materialId) {
    const materialDiv = document.getElementById(`material-${materialId}`)
    if (materialDiv) {
      materialDiv.remove()
    }
  }

  async handleSubmit(e) {
    e.preventDefault()

    try {
      this.showLoading(true)
      this.clearMessages()

      const formData = this.collectFormData()
      console.log("[v0] Submitting form data:", formData)

      const response = await fetch("http://localhost:8080/listas_padrao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearerToken")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        this.showSuccess("Lista de materiais criada")
        this.resetForm()
      } else {
        const errorText = await response.text()
        console.log("[v0] API Error:", response.status, errorText)
        this.showError(`Falha ao criar lista: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("[v0] Submit error:", error)
      this.showError("Erro de rede. Por favor, tente novamente.")
    } finally {
      this.showLoading(false)
    }
  }

  collectFormData() {
    const materials = []
    const materialDivs = this.elements.materialsContainer.querySelectorAll('[id^="material-"]')

    materialDivs.forEach((div) => {
      const name = div.querySelector('input[name="materialName"]').value.trim()
      const quantity = Number.parseInt(div.querySelector('input[name="quantity"]').value)
      const observations = div.querySelector('input[name="observations"]').value.trim()

      if (name && quantity) {
        materials.push({
          nome: name,
          quantidade: quantity,
          observacoes: observations || null,
        })
      }
    })

    return {
      funcionario_id: Number.parseInt(this.elements.employeeId.value),
      escola_id: Number.parseInt(this.elements.schoolId.value),
      ano_letivo: Number.parseInt(this.elements.academicYear.value),
      serie: this.elements.gradeClass.value.trim(),
      materiais: materials,
    }
  }

  showError(message) {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message
      this.elements.errorMessage.classList.remove("hidden")
    }
  }

  showSuccess(message) {
    if (this.elements.successMessage) {
      this.elements.successMessage.textContent = message
      this.elements.successMessage.classList.remove("hidden")
    }
  }

  clearMessages() {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.classList.add("hidden")
    }
    if (this.elements.successMessage) {
      this.elements.successMessage.classList.add("hidden")
    }
  }

  showLoading(loading) {
    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = loading
      this.elements.submitBtn.textContent = loading ? "Creating..." : "Create List"
    }
  }

  resetForm() {
    if (this.elements.form) {
      this.elements.form.reset()
    }
    this.elements.materialsContainer.innerHTML = ""
    this.materialCount = 0
    this.addMaterial()
  }

  cancel() {
    if (confirm("Você tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas.")) {
      window.location.href = "../index/index.html"
    }
  }
}

// Make CreateListManager available globally
window.CreateListManager = CreateListManager
