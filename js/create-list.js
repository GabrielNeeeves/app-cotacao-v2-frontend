class CreateListManager {
          constructor() {
              this.materials = [];
              this.materialCount = 0;
              this.initializeElements();
          }

          initializeElements() {
              this.elements = {
                  form: document.getElementById("createListForm"),
                  employeeId: localStorage.getItem('funcionarioId'),
                  schoolId: localStorage.getItem("escolaId"),
                  academicYear: document.getElementById("anoLetivo"),
                  gradeClass: document.getElementById("serie"),
                  materialsContainer: document.getElementById("materialsContainer"),
                  addMaterialBtn: document.getElementById("addMaterialBtn"),
                  cancelBtn: document.getElementById("cancelBtn"),
                  submitBtn: document.getElementById("submitBtn"),
                  errorMessage: document.getElementById("errorMessage"),
                  successMessage: document.getElementById("successMessage"),
              };
          }

          checkAccess() {
              const token = localStorage.getItem("bearerToken");
              const userRole = localStorage.getItem("userRole");
              const empresaId = localStorage.getItem("empresaId");
              const escolaId = localStorage.getItem("escolaId");
              const funcionarioId = localStorage.getItem("funcionarioId");

              if (!token) {
                  alert("Por favor, faça login para acessar esta página.");
                  window.location.href = "login.html";
                  return false;
              }

              if (userRole !== "ROLE_FUNCIONARIO") {
                  alert("Acesso negado. Apenas funcionários podem criar listas padrão.");
                  window.location.href = "index.html";
                  return false;
              }

              if (!escolaId || !funcionarioId) {
                  alert("Acesso negado. Você precisa estar vinculado a uma escola.");
                  window.location.href = "index.html";
                  return false;
              }

              return true;
          }

          initialize() {
              if (!this.checkAccess()) {
                  return;
              }

              // Set current year as default
              const currentYear = new Date().getFullYear();
              this.elements.academicYear.value = currentYear;

              this.attachEventListeners();
              this.addMaterial(); // Add first material by default
          }

          attachEventListeners() {
              if (this.elements.addMaterialBtn) {
                  this.elements.addMaterialBtn.addEventListener("click", () => this.addMaterial());
              }

              if (this.elements.cancelBtn) {
                  this.elements.cancelBtn.addEventListener("click", () => this.cancel());
              }

              if (this.elements.form) {
                  this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
              }
          }

          addMaterial() {
              this.materialCount++;
              const materialDiv = document.createElement("div");
              materialDiv.className = "bg-gray-800 p-4 rounded-lg border border-gray-700";
              materialDiv.id = `material-${this.materialCount}`;

              materialDiv.innerHTML = `
                  <div class="flex justify-between items-center mb-3">
                      <h3 class="text-lg font-medium text-white">Material ${this.materialCount}</h3>
                      <button type="button" class="text-red-400 hover:text-red-300 text-sm" onclick="window.createListManager.removeMaterial(${this.materialCount})">
                          Remover
                      </button>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-300 mb-2">Nome do material</label>
                          <input type="text" name="materialName" required 
                                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                          <input type="number" name="quantity" required min="1"
                                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                          <input type="text" name="observations"
                                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      </div>
                  </div>
              `;

              this.elements.materialsContainer.appendChild(materialDiv);
          }

          removeMaterial(materialId) {
              const materialDiv = document.getElementById(`material-${materialId}`);
              if (materialDiv) {
                  materialDiv.remove();
              }
          }

          async handleSubmit(e) {
              e.preventDefault();

              try {
                  this.showLoading(true);
                  this.clearMessages();

                  const formData = this.collectFormData();

                  const response = await fetch("http://localhost:8080/listas_padrao", {
                      method: "POST",
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("bearerToken")}`,
                      },
                      body: JSON.stringify(formData),
                  });

                  if (response.ok) {
                      this.showSuccess("Lista de materiais criada com sucesso!");
                  } else {
                      const errorText = await response.text();
                      this.showError(`Falha ao criar lista: ${response.status} - ${errorText || response.statusText}`);
                  }
              } catch (error) {
                  console.error("Submit error:", error);
                  this.showError("Erro de rede. Por favor, tente novamente.");
              } finally {
                  this.showLoading(false);
              }
          }

          collectFormData() {
              const materials = [];
              const materialDivs = this.elements.materialsContainer.querySelectorAll('[id^="material-"]');

              materialDivs.forEach((div) => {
                  const name = div.querySelector('input[name="materialName"]').value.trim();
                  const quantity = parseInt(div.querySelector('input[name="quantity"]').value);
                  const observations = div.querySelector('input[name="observations"]').value.trim();

                  if (name && quantity) {
                      materials.push({
                          nome: name,
                          quantidade: quantity,
                          observacoes: observations || null,
                      });
                  }
              });

              return {
                  funcionario_id: parseInt(this.elements.employeeId),
                  escola_id: parseInt(this.elements.schoolId),
                  ano_letivo: parseInt(this.elements.academicYear.value),
                  serie: this.elements.gradeClass.value.trim(),
                  materiais: materials,
              };
          }

          showError(message) {
              if (this.elements.errorMessage) {
                  this.elements.errorMessage.textContent = message;
                  this.elements.errorMessage.classList.remove("hidden");
              }
          }

          showSuccess(message) {
              if (this.elements.successMessage) {
                  this.elements.successMessage.textContent = message;
                  this.elements.successMessage.classList.remove("hidden");
              }
          }

          clearMessages() {
              if (this.elements.errorMessage) {
                  this.elements.errorMessage.classList.add("hidden");
              }
              if (this.elements.successMessage) {
                  this.elements.successMessage.classList.add("hidden");
              }
          }

          showLoading(loading) {
              if (this.elements.submitBtn) {
                  this.elements.submitBtn.disabled = loading;
                  this.elements.submitBtn.textContent = loading ? "Criando..." : "Criar Lista";
              }
          }

          cancel() {
              if (confirm("Você tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas.")) {
                  window.location.href = "index.html";
              }
          }
      }

      // Initialize on page load
      const createListManager = new CreateListManager();
      window.createListManager = createListManager;
      
      document.addEventListener('DOMContentLoaded', () => {
          createListManager.initialize();
      });