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

        class OfferListsManager {
            constructor() {
                this.apiBaseUrl = 'http://localhost:8080';
                this.offerLists = [];
                this.inventory = [];
                this.init();
            }

            init() {
                RoleAuth.checkPageAccess(RoleAuth.ROLES.CLIENTE);
                
                this.attachEventListeners();
                this.loadOfferLists();
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

            async loadOfferLists() {
                try {
                    this.showLoadingState();

                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    // Load user inventory first
                    this.inventory = await this.loadUserInventory();

                    const response = await fetch(`${this.apiBaseUrl}/oferta_lista`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao carregar listas de ofertas: ${response.status}`);
                    }

                    const responseText = await response.text();

                    let offerLists;
                    try {
                        offerLists = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('[v0] JSON parse error:', parseError);
                        throw new Error('Resposta inválida do servidor');
                    }

                    console.log('[v0] Offer lists loaded:', offerLists);
                    this.offerLists = offerLists;
                    // Pass inventory to display method
                    this.displayOfferLists(offerLists, this.inventory);

                } catch (error) {
                    console.error('[v0] Error loading offer lists:', error);
                    this.showErrorState(error.message);
                }
            }

            // Added method to load user inventory
            async loadUserInventory() {
                try {
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        return [];
                    }

                    const response = await fetch(`${this.apiBaseUrl}/inventario`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        console.warn('Could not load inventory:', response.status);
                        return [];
                    }

                    const inventory = await response.json();
                    return inventory || [];
                } catch (error) {
                    console.warn('Error loading inventory:', error);
                    return [];
                }
            }

            // Updated to accept inventory parameter
            displayOfferLists(offerLists, inventory = []) {
                this.hideAllStates();

                if (!offerLists || offerLists.length === 0) {
                    this.showEmptyState();
                    return;
                }

                const offerListsGrid = document.getElementById('offerListsGrid');
                offerListsGrid.innerHTML = '';

                offerLists.forEach(offerList => {
                    // Pass inventory to card creation
                    const offerListCard = this.createOfferListCard(offerList, inventory);
                    offerListsGrid.appendChild(offerListCard);
                });

                offerListsGrid.classList.remove('hidden');
            }

            // Updated to accept inventory parameter and show inventory status
            createOfferListCard(offerList, inventory = []) {
                const card = document.createElement('div');
                card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative flex flex-col h-[600px]';

                const totalPrice = offerList.ofertas.reduce((sum, offer) => sum + offer.preco, 0);

                // Calculate how many items are in inventory
                const itemsInInventory = offerList.ofertas.filter(offer => 
                    inventory.some(item => 
                        item.item_nome.toLowerCase() === offer.materialNome.toLowerCase()
                    )
                ).length;

                let companyName = 'Empresa não informada';
                let companyType = 'Empresa';
                let companyBadgeColor = 'bg-blue-600';
                
                if (offerList.funcionario) {
                    if (offerList.funcionario.empresa) {
                        companyName = offerList.funcionario.empresa.nome;
                        companyType = 'Empresa';
                        companyBadgeColor = 'bg-blue-600';
                    } else if (offerList.funcionario.escola) {
                        companyName = offerList.funcionario.escola.nome;
                        companyType = 'Escola';
                        companyBadgeColor = 'bg-green-600';
                    }
                }

                const deleteButton = RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO) ? `
                    <button onclick="window.offerListsManager.deleteOfferList(${offerList.id})" 
                            class="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors" 
                            title="Excluir lista">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                ` : '';

                const editButton = RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO) ? `
                    <button class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                        Editar
                    </button>
                ` : '';

                const materialsToShow = offerList.ofertas.slice(0, 4);
                const hasMoreMaterials = offerList.ofertas.length > 4;
                const hiddenMaterials = offerList.ofertas.slice(4);

                card.innerHTML = `
                    <div class="mb-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-semibold text-white">Lista de Ofertas #${offerList.id}</h3>
                            <div class="flex items-center space-x-2">
                                <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    ${offerList.ofertas.length} ${offerList.ofertas.length === 1 ? 'item' : 'itens'}
                                </span>
                                ${itemsInInventory > 0 ? `
                                    <span class="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                        ${itemsInInventory} no inventário
                                    </span>
                                ` : `
                                    <span class="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                        0 no inventário
                                    </span>
                                `}
                                ${deleteButton}
                            </div>
                        </div>
                        
                        <!-- Added company/school name display -->
                        <div class="flex items-center space-x-2 mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                            <span class="text-gray-300 text-sm">${companyName}</span>
                            <span class="${companyBadgeColor} text-white px-2 py-1 rounded-full text-xs font-medium">
                                ${companyType}
                            </span>
                        </div>
                        
                        ${itemsInInventory > 0 ? `
                            <p class="text-green-400 text-sm mb-2">
                                Você possui ${itemsInInventory} de ${offerList.ofertas.length} itens desta lista no seu inventário
                            </p>
                        ` : `
                            <p class="text-gray-400 text-sm mb-2">
                                Você não possui nenhum item desta lista no seu inventário
                            </p>
                        `}
                    </div>
                    
                    <div class="flex-1 overflow-y-auto mb-4">
                        <div class="space-y-3">
                            <div class="flex items-center text-green-400 font-semibold text-lg">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                                <span>Total: R$ ${totalPrice.toFixed(2)}</span>
                            </div>
                            
                            <div class="space-y-2">
                                <h4 class="text-sm font-medium text-gray-300 mb-2">Materiais inclusos:</h4>
                                ${materialsToShow.map(offer => {
                                    const isInInventory = inventory.some(item => 
                                        item.item_nome.toLowerCase() === offer.materialNome.toLowerCase()
                                    );
                                    const inventoryItem = inventory.find(item => 
                                        item.item_nome.toLowerCase() === offer.materialNome.toLowerCase()
                                    );
                                    
                                    return `
                                    <div class="bg-gray-700 rounded-md p-3 text-sm ${isInInventory ? 'border-l-4 border-green-500' : ''}">
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="font-medium ${isInInventory ? 'text-green-400' : 'text-white'}">
                                                ${offer.materialNome}
                                                ${isInInventory ? `
                                                    <span class="text-xs text-green-300 ml-2">
                                                        (${inventoryItem.quantidade} no inventário)
                                                    </span>
                                                ` : ''}
                                            </span>
                                            <span class="text-green-400 font-semibold">R$ ${offer.preco.toFixed(2)}</span>
                                        </div>
                                        <div class="flex items-center text-gray-300 text-xs space-x-4">

                                            <span class="flex items-center">
                                                ${offer.observacoes ? `
                                                <p class="text-xs text-gray-400 mt-1">
                                                    <span class="font-medium">Observações:</span> ${offer.observacoes}
                                                </p>
                                            ` : ''}
                                            </span>

                                            <span class="flex items-center">
                                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                ${offer.prazoEntrega} dias
                                            </span>
                                            <span class="flex items-center">
                                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                                                </svg>
                                                ID: ${offer.id}
                                            </span>
                                        </div>
                                        ${offer.observacoes ? `
                                            <div class="mt-2 text-xs text-gray-400">
                                                <span class="font-medium">Obs:</span> ${offer.observacoes}
                                            </div>
                                        ` : ''}
                                    </div>
                                `}).join('')}
                                
                                ${hasMoreMaterials ? `
                                    <div class="text-center">
                                        <button onclick="window.offerListsManager.openDetailsModal(${offerList.id})" 
                                                class="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                                            + ${hiddenMaterials.length} materiais restantes (clique para ver todos)
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="flex items-center text-gray-300 text-sm">
                                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                                </svg>
                                <span>ID da Lista: ${offerList.id}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="window.offerListsManager.openDetailsModal(${offerList.id})" 
                                class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                            Ver Detalhes
                        </button>
                        ${editButton}
                        <button onclick="window.offerListsManager.createPaymentPreference(${JSON.stringify(offerList).replace(/"/g, '&quot;')})" 
                                class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                            Pagar
                        </button>
                    </div>
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
                document.getElementById('offerListsGrid').classList.add('hidden');
                document.getElementById('emptyState').classList.add('hidden');
            }

            async deleteOfferList(id) {
                if (!confirm('Tem certeza que deseja excluir esta lista de ofertas? Esta ação não pode ser desfeita.')) {
                    return;
                }

                try {
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/oferta_lista/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao excluir lista de ofertas: ${response.status}`);
                    }

                    // Reload the offer lists after successful deletion
                    this.loadOfferLists();
                    
                    // Show success message
                    this.showSuccessMessage('Lista de ofertas excluída com sucesso!');

                } catch (error) {
                    console.error('Error deleting offer list:', error);
                    alert(`Erro ao excluir lista de ofertas: ${error.message}`);
                }
            }

            showSuccessMessage(message) {
                // Create temporary success message
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
                successDiv.textContent = message;
                document.body.appendChild(successDiv);

                // Remove after 3 seconds
                setTimeout(() => {
                    document.body.removeChild(successDiv);
                }, 3000);
            }

            async createPaymentPreference(offerList) {
                try {
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const clienteId = localStorage.getItem('userId');
                    if (!clienteId) {
                        throw new Error('ID do usuário não encontrado');
                    }

                    const totalPrice = offerList.ofertas.reduce((sum, offer) => sum + offer.preco, 0);

                    const response = await fetch(`${this.apiBaseUrl}/pagamentos/criar_preferencia`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            clienteId: parseInt(clienteId),
                            titulo: `Lista de Ofertas #${offerList.id}`,
                            quantidade: 1,
                            preco: totalPrice
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao criar preferência de pagamento: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.preferenceId) {
                        // Redirect to MercadoPago checkout
                        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.preferenceId}`;
                    } else {
                        throw new Error('ID de preferência não encontrado na resposta');
                    }

                } catch (error) {
                    console.error('Error creating payment preference:', error);
                    alert(`Erro ao processar pagamento: ${error.message}`);
                }
            }

            openDetailsModal(listId) {
                const offerList = this.offerLists.find(list => list.id === listId);
                if (!offerList) {
                    console.error('[v0] Offer list not found:', listId);
                    return;
                }

                const modal = document.getElementById('detailsModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalTotal = document.getElementById('modalTotal');
                const modalMaterialsList = document.getElementById('modalMaterialsList');

                if (!modal || !modalTitle || !modalTotal || !modalMaterialsList) {
                    console.error('[v0] Modal elements not found in DOM');
                    return;
                }

                let companyName = 'Não informado';
                if (offerList.funcionarioId) {
                    if (offerList.funcionarioId.empresa) {
                        companyName = offerList.funcionarioId.empresa.nome;
                    } else if (offerList.funcionarioId.escola) {
                        companyName = offerList.funcionarioId.escola.nome;
                    }
                }

                modalTitle.textContent = `Detalhes da Lista #${listId} - ${companyName}`;

                const totalPrice = offerList.ofertas.reduce((sum, item) => sum + item.preco, 0);
                modalTotal.innerHTML = `
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                    <span>Total: R$ ${totalPrice.toFixed(2)}</span>
                `;

                // Generate HTML for ALL items in the list
                modalMaterialsList.innerHTML = offerList.ofertas.map(offer => {
                    const isOwned = this.inventory.some(i => i.item_nome.toLowerCase() === offer.materialNome.toLowerCase());
                    const inventoryItem = this.inventory.find(i => i.item_nome.toLowerCase() === offer.materialNome.toLowerCase());
                    
                    return `
                        <div class="flex justify-between items-center p-3 rounded-md ${isOwned ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-700 border border-gray-600'}">
                            <div class="flex-1">
                                <p class="${isOwned ? 'text-green-400' : 'text-white'} font-medium">
                                    ${offer.materialNome}
                                    ${isOwned && inventoryItem ? `
                                        <span class="text-xs text-green-300 ml-2">
                                            (${inventoryItem.quantidade} no inventário)
                                        </span>
                                    ` : ''}
                                </p>
                                <div class="flex items-center text-xs text-gray-400 space-x-3 mt-1">
                                    <span class="flex items-center">
                                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        ${offer.prazoEntrega} dias
                                    </span>
                                    <span>ID: ${offer.id}</span>
                                </div>
                                ${offer.observacoes ? `
                                    <p class="text-xs text-gray-400 mt-1">
                                        <span class="font-medium">Observações:</span> ${offer.observacoes}
                                    </p>
                                ` : ''}
                            </div>
                            <div class="text-right">
                                ${isOwned 
                                    ? `<span class="inline-flex items-center text-green-400 font-semibold text-sm">
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                        </svg>
                                        R$ ${offer.preco.toFixed(2)}
                                       </span>`
                                    : `<span class="text-yellow-400 font-semibold">R$ ${offer.preco.toFixed(2)}</span>`
                                }
                            </div>
                        </div>
                    `;
                }).join('');

                modal.classList.remove('hidden');
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            window.offerListsManager = new OfferListsManager();
        });