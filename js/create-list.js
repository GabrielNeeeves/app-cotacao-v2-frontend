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
            // Novo elemento para importação
            importInput: document.getElementById("importFile") 
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
            window.location.href = "../login/login.html";
            return false;
        }

        if (userRole !== "ROLE_FUNCIONARIO" && userRole !== "ROLE_ADMINISTRADOR") {
            alert("Acesso negado. Apenas funcionários e administradores podem criar listas padrão.");
            window.location.href = "../index/index.html";
            return false;
        }

        if (userRole !== "ROLE_ADMINISTRADOR" && (!escolaId || !funcionarioId)) {
            alert("Acesso negado. Você precisa estar vinculado a uma escola.");
            window.location.href = "../index/index.html";
            return false;
        }

        return true;
    }

    initialize() {
        if (!this.checkAccess()) {
            return;
        }
        // Set current year as default if empty
        if (!this.elements.academicYear.value) {
            const currentYear = new Date().getFullYear();
            this.elements.academicYear.value = currentYear;
        }
        
        this.attachEventListeners();
        
        // Only add a default empty material if the container is empty
        if (this.elements.materialsContainer.children.length === 0) {
            this.addMaterial(); 
        }
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
        // Listener para o arquivo Excel
        if (this.elements.importInput) {
            this.elements.importInput.addEventListener("change", (e) => this.handleFileUpload(e));
        }
    }

    // --- NOVA FUNÇÃO: Lida com o upload do arquivo ---
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            // Lê o arquivo usando SheetJS
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Converte para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert("A planilha parece estar vazia.");
                return;
            }

            this.populateFormFromExcel(jsonData);
            
            // Limpa o input para permitir re-upload se necessário
            event.target.value = ''; 

        } catch (error) {
            console.error("Erro ao ler planilha:", error);
            alert("Erro ao processar o arquivo. Verifique se o formato está correto.");
        }
    }

    // --- NOVA FUNÇÃO: Preenche o formulário com os dados ---
    populateFormFromExcel(data) {
        // Limpa materiais existentes para evitar duplicação
        this.elements.materialsContainer.innerHTML = '';
        this.materialCount = 0;

        // Pega a primeira linha para definir Ano e Série (assumindo que são iguais para toda a lista)
        const firstRow = data[0];
        if (firstRow) {
            // Trata ANO_LETIVO (ex: 2026.0 vira 2026)
            if (firstRow['ANO_LETIVO']) {
                this.elements.academicYear.value = Math.floor(firstRow['ANO_LETIVO']);
            }
            // Trata SERIE
            if (firstRow['SERIE']) {
                this.elements.gradeClass.value = firstRow['SERIE'];
            }
        }

        // Itera sobre as linhas para criar os materiais
        data.forEach(row => {
            // Cria um novo bloco de material visualmente
            this.addMaterial();

            // Pega o ID do material que acabamos de criar (é o materialCount atual)
            const currentId = this.materialCount;
            const materialDiv = document.getElementById(`material-${currentId}`);

            if (materialDiv) {
                const nameInput = materialDiv.querySelector('input[name="materialName"]');
                const qtyInput = materialDiv.querySelector('input[name="quantity"]');
                const obsInput = materialDiv.querySelector('input[name="observations"]');

                // Preenche os campos mapeando as colunas do CSV/Excel
                if (row['MATERIAIS']) nameInput.value = row['MATERIAIS'];
                
                // Garante que quantidade seja número e remove casas decimais desnecessárias (.0)
                if (row['QUANTIDADE']) qtyInput.value = Math.floor(row['QUANTIDADE']);
                
                // Observações (verifica se existe e se não é apenas um traço "-")
                if (row['OBSERVACOES'] && row['OBSERVACOES'] !== '-') {
                    obsInput.value = row['OBSERVACOES'];
                }
            }
        });

        alert(`${data.length} itens importados com sucesso!`);
    }

    addMaterial() {
        this.materialCount++;
        const materialDiv = document.createElement("div");
        materialDiv.className = "bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4"; // Adicionado mb-4 para espaçamento
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
            
            // Validação básica
            if (formData.materiais.length === 0) {
                this.showError("Adicione pelo menos um material à lista.");
                return;
            }

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
                // Opcional: Limpar formulário ou redirecionar
                setTimeout(() => window.location.reload(), 2000);
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
            window.location.href = "../index/index.html";
        }
    }
}

// Initialize on page load
const createListManager = new CreateListManager();
window.createListManager = createListManager;

document.addEventListener('DOMContentLoaded', () => {
    createListManager.initialize();
});