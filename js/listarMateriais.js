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
            },

            hideElementsForRole(selector, requiredRole) {
                if (!this.hasRole(requiredRole)) {
                    document.querySelectorAll(selector).forEach(el => {
                        el.style.display = 'none';
                    });
                }
            }
        };

        class MaterialsManager {
            constructor() {
                this.apiBaseUrl = 'http://localhost:8080';
                this.init();
            }

            init() {
                RoleAuth.checkPageAccess(RoleAuth.ROLES.CLIENTE);
                
                this.attachEventListeners();
                this.loadMaterials();
                
                this.applyRoleBasedUI();
            }

            attachEventListeners() {
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        localStorage.removeItem('bearerToken');
                        window.location.href = 'login.html';
                    });
                }
            }

            async loadMaterials() {
                try {
                    console.log('[v0] Loading materials...');
                    this.showLoadingState();

                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/materiais`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('[v0] Response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`Erro ao carregar materiais: ${response.status}`);
                    }

                    const responseText = await response.text();
                    console.log('[v0] Response text:', responseText);

                    let materials;
                    try {
                        materials = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('[v0] JSON parse error:', parseError);
                        throw new Error('Resposta inválida do servidor');
                    }

                    console.log('[v0] Materials loaded:', materials);
                    this.displayMaterials(materials);

                } catch (error) {
                    console.error('[v0] Error loading materials:', error);
                    this.showErrorState(error.message);
                }
            }

            displayMaterials(materials) {
                this.hideAllStates();

                if (!materials || materials.length === 0) {
                    this.showEmptyState();
                    return;
                }

                const materialsGrid = document.getElementById('materialsGrid');
                materialsGrid.innerHTML = '';

                materials.forEach(material => {
                    const materialCard = this.createMaterialCard(material);
                    materialsGrid.appendChild(materialCard);
                });

                materialsGrid.classList.remove('hidden');
            }

            createMaterialCard(material) {
                const card = document.createElement('div');
                card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

                const deleteButton = RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO) ? `
                    <button class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors" onclick="materialsManager.deleteMaterial(${material.id})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                ` : '';

                const editButton = RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO) ? `
                    <button class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors" onclick="materialsManager.openUpdateModal(${material.id}, '${material.nome.replace(/'/g, "\\'")}', '${(material.descricao || '').replace(/'/g, "\\'")}', '${material.categoria}')">
                        Editar
                    </button>
                ` : '';

                card.innerHTML = `
                    ${deleteButton}
                    
                    <div class="mb-4 ${deleteButton ? 'pr-12' : ''}">
                        <h3 class="text-xl font-semibold text-white mb-2">${material.nome}</h3>
                        <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            ${material.categoria}
                        </span>
                    </div>
                    
                    <div class="space-y-3 text-sm mb-6">
                        <div class="flex items-start text-gray-300">
                            <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <span class="leading-relaxed">${material.descricao || 'Sem descrição'}</span>
                        </div>
                        
                        <div class="flex items-center text-gray-300">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                            <span>ID: ${material.id}</span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                            Ver Detalhes
                        </button>
                        ${editButton}
                    </div>
                    
                    <!-- Added inventory button for all users -->
                    <button class="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2" onclick="materialsManager.addToInventory('${material.nome.replace(/'/g, "\\'")}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Adicionar ao Inventário</span>
                    </button>
                `;

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
                document.getElementById('materialsGrid').classList.add('hidden');
                document.getElementById('emptyState').classList.add('hidden');
            }

            async deleteMaterial(materialId) {
                if (!confirm('Tem certeza que deseja excluir este material?')) {
                    return;
                }

                try {
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/materiais/${materialId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao excluir material: ${response.status}`);
                    }

                    // Reload materials after successful deletion
                    this.loadMaterials();
                    
                } catch (error) {
                    console.error('[v0] Error deleting material:', error);
                    alert(`Erro ao excluir material: ${error.message}`);
                }
            }

            openUpdateModal(materialId, nome, descricao, categoria) {
                // Create modal if it doesn't exist
                if (!document.getElementById('updateModal')) {
                    this.createUpdateModal();
                }

                // Populate form with current values
                document.getElementById('updateMaterialId').value = materialId;
                document.getElementById('updateNome').value = nome;
                document.getElementById('updateDescricao').value = descricao;
                document.getElementById('updateCategoria').value = categoria;

                // Show modal
                document.getElementById('updateModal').classList.remove('hidden');
            }

            createUpdateModal() {
                const modal = document.createElement('div');
                modal.id = 'updateModal';
                modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                
                modal.innerHTML = `
                    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 class="text-xl font-semibold text-white mb-4">Editar Material</h3>
                        
                        <form id="updateMaterialForm" class="space-y-4">
                            <input type="hidden" id="updateMaterialId">
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Nome do Material</label>
                                <input type="text" id="updateNome" required
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                                <textarea id="updateDescricao" rows="3"
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                                <select id="updateCategoria" required
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="">Selecione uma categoria</option>
                                    <option value="Papelaria">Papelaria</option>
                                    <option value="Material Escolar">Material Escolar</option>
                                    <option value="Livros">Livros</option>
                                    <option value="Uniformes">Uniformes</option>
                                    <option value="Eletrônicos">Eletrônicos</option>
                                    <option value="Esportes">Esportes</option>
                                    <option value="Arte">Arte</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="materialsManager.closeUpdateModal()" 
                                    class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                                    Atualizar
                                </button>
                            </div>
                        </form>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Add form submit handler
                document.getElementById('updateMaterialForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateMaterial();
                });
            }

            closeUpdateModal() {
                document.getElementById('updateModal').classList.add('hidden');
            }

            async updateMaterial() {
                try {
                    const materialId = document.getElementById('updateMaterialId').value;
                    const nome = document.getElementById('updateNome').value;
                    const descricao = document.getElementById('updateDescricao').value;
                    const categoria = document.getElementById('updateCategoria').value;

                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/materiais/${materialId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nome,
                            descricao,
                            categoria
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao atualizar material: ${response.status}`);
                    }

                    this.closeUpdateModal();
                    this.loadMaterials();
                    
                } catch (error) {
                    console.error('Error updating material:', error);
                    alert(`Erro ao atualizar material: ${error.message}`);
                }
            }

            async addToInventory(materialName) {
                const quantity = prompt(`Quantos "${materialName}" você deseja adicionar ao inventário?`, '1');
                
                if (quantity === null) {
                    return; // User cancelled
                }

                const quantityInt = parseInt(quantity);
                if (isNaN(quantityInt) || quantityInt <= 0) {
                    alert('Por favor, insira uma quantidade válida.');
                    return;
                }

                try {
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        alert('Você precisa estar logado para adicionar itens ao inventário.');
                        return;
                    }

                    const response = await fetch(`${this.apiBaseUrl}/inventario`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            item_nome: materialName,
                            quantidade: quantityInt
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Erro ao adicionar ao inventário (${response.status}): ${errorText}`);
                    }

                    alert(`✓ ${quantityInt} unidade(s) de "${materialName}" adicionado(s) ao seu inventário!`);
                    
                } catch (error) {
                    console.error('Error adding to inventory:', error);
                    alert(`Erro ao adicionar ao inventário: ${error.message}`);
                }
            }

            applyRoleBasedUI() {
                // Hide "Cadastrar Material" link if not FUNCIONARIO
                if (!RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO)) {
                    const cadastrarLink = document.querySelector('a[href="cadastrar-material.html"]');
                    if (cadastrarLink) {
                        cadastrarLink.style.display = 'none';
                    }
                }
            }
        }

        // Initialize the materials manager when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.materialsManager = new MaterialsManager();
        });