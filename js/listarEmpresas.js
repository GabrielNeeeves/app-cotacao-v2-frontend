const RoleAuth = {
        ROLES: {
            CLIENTE: 'ROLE_CLIENTE',
            FUNCIONARIO: 'ROLE_FUNCIONARIO',
            ADMINISTRADOR: 'ROLE_ADMINISTRADOR'
        },
        
        ROLE_HIERARCHY: {
            'ROLE_CLIENTE': 1,
            'ROLE_FUNCIONARIO': 2,
            'ROLE_ADMINISTRADOR': 3
        },

        getUserRole() {
            return localStorage.getItem('userRole');
        },

        hasRole(requiredRole) {
            const userRole = this.getUserRole();
            if (!userRole) return false;
            
            const userLevel = this.ROLE_HIERARCHY[userRole] || 0;
            const requiredLevel = this.ROLE_HIERARCHY[requiredRole] || 0;
            
            return userLevel >= requiredLevel;
        },

        checkPageAccess(requiredRole) {
            if (!this.hasRole(requiredRole)) {
                alert('Você não tem permissão para acessar esta página.');
                window.location.href = '../index/index.html';
                return false;
            }
            return true;
        }
    };

    class CompaniesManager {
        constructor() {
            this.apiBaseUrl = 'http://localhost:8080';
            this.currentEditingCompany = null;
            this.init();
        }

        init() {
            RoleAuth.checkPageAccess(RoleAuth.ROLES.CLIENTE);
            
            this.attachEventListeners();
            this.loadCompanies();
            
            this.applyRoleBasedUI();
        }

        applyRoleBasedUI() {
            // Hide "Criar Empresa" link if not ADMINISTRADOR
            if (!RoleAuth.hasRole(RoleAuth.ROLES.ADMINISTRADOR)) {
                const cadastrarLink = document.querySelector('a[href="cadastrar-empresa.html"]');
                if (cadastrarLink) {
                    cadastrarLink.style.display = 'none';
                }
            }
        }

        attachEventListeners() {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('bearerToken');
                    window.location.href = 'login.html';
                });
            }

            const closeModal = document.getElementById('closeModal');
            const cancelEdit = document.getElementById('cancelEdit');
            const editForm = document.getElementById('editCompanyForm');

            closeModal.addEventListener('click', () => this.closeEditModal());
            cancelEdit.addEventListener('click', () => this.closeEditModal());
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));

            // Close modal when clicking outside
            document.getElementById('editModal').addEventListener('click', (e) => {
                if (e.target.id === 'editModal') {
                    this.closeEditModal();
                }
            });
        }

        async loadCompanies() {
            try {
                console.log('[v0] Loading companies...');
                this.showLoadingState();

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/empresas`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('[v0] Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`Erro ao carregar empresas: ${response.status}`);
                }

                const responseText = await response.text();
                console.log('[v0] Response text:', responseText);

                let companies;
                try {
                    companies = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('[v0] JSON parse error:', parseError);
                    throw new Error('Resposta inválida do servidor');
                }

                console.log('[v0] Companies loaded:', companies);
                this.displayCompanies(companies);

            } catch (error) {
                console.error('[v0] Error loading companies:', error);
                this.showErrorState(error.message);
            }
        }

        displayCompanies(companies) {
            this.hideAllStates();

            if (!companies || companies.length === 0) {
                this.showEmptyState();
                return;
            }

            const companiesGrid = document.getElementById('companiesGrid');
            companiesGrid.innerHTML = '';

            companies.forEach(company => {
                const companyCard = this.createCompanyCard(company);
                companiesGrid.appendChild(companyCard);
            });

            companiesGrid.classList.remove('hidden');
        }

        createCompanyCard(company) {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

            const deleteButton = RoleAuth.hasRole(RoleAuth.ROLES.ADMINISTRADOR) ? `
                <button class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors delete-btn" data-company-id="${company.id}" data-company-name="${company.nome}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            ` : '';

            const editButton = RoleAuth.hasRole(RoleAuth.ROLES.ADMINISTRADOR) ? `
                <button class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors edit-btn">
                    Editar
                </button>
            ` : '';

            card.innerHTML = `
                ${deleteButton}

                <div class="flex justify-between items-start mb-4 ${deleteButton ? 'pr-10' : ''}">
                    <h3 class="text-xl font-semibold text-white">${company.nome}</h3>
                </div>
                
                <div class="space-y-2 text-sm">
                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span>${company.endereco}</span>
                    </div>
                    
                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>CNPJ: ${company.cnpj}</span>
                    </div>

                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>

                        <span>Telefone: 
                            ${company.telefone? company.telefone : ''}
                        </span>
                    </div>
                    
                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        <span>ID: ${company.id}</span>
                    </div>
                </div>
                
                <div class="mt-6 flex space-x-3">
                    <button class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                        Ver Detalhes
                    </button>
                    ${editButton}
                </div>
            `;

            if (RoleAuth.hasRole(RoleAuth.ROLES.ADMINISTRADOR)) {
                const deleteBtn = card.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteCompany(company.id, company.nome);
                    });
                }

                const editBtn = card.querySelector('.edit-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openEditModal(company);
                    });
                }
            }

            return card;
        }

        showLoadingState() {
            this.hideAllStates();
            document.getElementById('loadingState').classList.remove('hidden');
        }

        showErrorState(message) {
            this.hideAllStates();
            const errorState = document.getElementById('errorState');
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = message;
            errorState.classList.remove('hidden');
        }

        showEmptyState() {
            this.hideAllStates();
            document.getElementById('emptyState').classList.remove('hidden');
        }

        hideAllStates() {
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('errorState').classList.add('hidden');
            document.getElementById('companiesGrid').classList.add('hidden');
            document.getElementById('emptyState').classList.add('hidden');
        }

        async deleteCompany(companyId, companyName) {
            const confirmed = confirm(`Tem certeza que deseja excluir a empresa "${companyName}"?`);
            if (!confirmed) return;

            try {
                console.log('[v0] Deleting company with ID:', companyId);

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/empresas/${companyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('[v0] Delete response status:', response.status);

                if (!response.ok) {
                    throw new Error(`Erro ao excluir empresa: ${response.status}`);
                }

                alert(`Empresa "${companyName}" excluída com sucesso!`);
                this.loadCompanies();

            } catch (error) {
                console.error('[v0] Error deleting company:', error);
                alert(`Erro ao excluir empresa: ${error.message}`);
            }
        }

        openEditModal(company) {
            this.currentEditingCompany = company;
            
            // Pre-populate form fields
            document.getElementById('editNome').value = company.nome;
            document.getElementById('editEndereco').value = company.endereco;
            document.getElementById('editCnpj').value = company.cnpj;
            document.getElementById('editTelefone').value = company.telefone || '';

            document.getElementById('editModal').classList.remove('hidden');
        }

        closeEditModal() {
            document.getElementById('editModal').classList.add('hidden');
            this.currentEditingCompany = null;
            document.getElementById('editCompanyForm').reset();
        }

        async handleEditSubmit(e) {
            e.preventDefault();
            
            if (!this.currentEditingCompany) return;

            const formData = new FormData(e.target);
            const companyData = {
                nome: formData.get('nome'),
                endereco: formData.get('endereco'),
                cnpj: formData.get('cnpj'),
                telefone: formData.get('telefone')
            };

            try {
                const saveBtn = document.getElementById('saveEdit');
                saveBtn.disabled = true;
                saveBtn.textContent = 'Salvando...';

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/empresas/${this.currentEditingCompany.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(companyData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Erro ao atualizar empresa: ${response.status} - ${errorText}`);
                }

                alert('Empresa atualizada com sucesso!');
                this.closeEditModal();
                this.loadCompanies();

            } catch (error) {
                console.error('[v0] Error updating company:', error);
                alert(`Erro ao atualizar empresa: ${error.message}`);
            } finally {
                const saveBtn = document.getElementById('saveEdit');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salvar';
            }
        }
    }

    // Initialize the companies manager when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        new CompaniesManager();
    });