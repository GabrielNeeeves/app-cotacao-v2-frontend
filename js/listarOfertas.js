class OffersManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080';
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadOffers();
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

    async loadOffers() {
        try {
            console.log('[v0] Loading offers...');
            this.showLoadingState();

            const bearerToken = localStorage.getItem('bearerToken');
            if (!bearerToken) {
                throw new Error('Token de autenticação não encontrado');
            }

            // Load user inventory first
            const inventory = await this.loadUserInventory();

            const response = await fetch(`${this.apiBaseUrl}/ofertas`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[v0] Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Erro ao carregar ofertas: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('[v0] Response text:', responseText);

            let offers;
            try {
                offers = JSON.parse(responseText);
            } catch (parseError) {
                console.error('[v0] JSON parse error:', parseError);
                throw new Error('Resposta inválida do servidor');
            }

            console.log('[v0] Offers loaded:', offers);
            // Pass inventory to display method
            this.displayOffers(offers, inventory);

        } catch (error) {
            console.error('[v0] Error loading offers:', error);
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
    displayOffers(offers, inventory = []) {
        this.hideAllStates();

        if (!offers || offers.length === 0) {
            this.showEmptyState();
            return;
        }

        const offersGrid = document.getElementById('offersGrid');
        offersGrid.innerHTML = '';

        offers.forEach(offer => {
            // Pass inventory to card creation
            const offerCard = this.createOfferCard(offer, inventory);
            offersGrid.appendChild(offerCard);
        });

        offersGrid.classList.remove('hidden');
    }

    // Updated to accept inventory parameter and show inventory status
    createOfferCard(offer, inventory = []) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

        const companyOrSchool = offer.funcionario.empresa || offer.funcionario.escola;
        const companyType = offer.funcionario.empresa ? 'Empresa' : 'Escola';
        const companyBadgeColor = offer.funcionario.empresa ? 'bg-blue-600' : 'bg-green-600';

        // Check if material is in user inventory
        const isInInventory = inventory.some(item => 
            item.item_nome.toLowerCase() === offer.material.nome.toLowerCase()
        );
        const inventoryItem = inventory.find(item => 
            item.item_nome.toLowerCase() === offer.material.nome.toLowerCase()
        );

        card.innerHTML = `
            <button class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors" onclick="offersManager.deleteOffer(${offer.id})">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
            
            <div class="mb-4">
                <div class="flex justify-between items-start mb-2 pr-12">
                    <h3 class="text-xl font-semibold text-white">${offer.material.nome}</h3>
                    <span class="${companyBadgeColor} text-white px-2 py-1 rounded-full text-xs font-medium">
                        ${companyType}
                    </span>
                </div>
                <div class="flex items-center space-x-2 mb-2">
                    <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ${offer.material.categoria}
                    </span>
                    <!-- Added inventory status badge -->
                    ${isInInventory ? `
                        <span class="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            No inventário (${inventoryItem.quantidade})
                        </span>
                    ` : `
                        <span class="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Não possui
                        </span>
                    `}
                </div>
            </div>
            
            <div class="space-y-3 text-sm mb-6">
                <!-- Material Description -->
                <div class="flex items-start text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span class="leading-relaxed">${offer.material.descricao || 'Sem descrição'}</span>
                </div>

                <!-- Material Producer -->
                <div class="flex items-start text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    <span class="leading-relaxed">${offer.material.fabricante || 'Fabricante não informado'}</span>
                </div>
                
                <!-- Company/School Info -->
                <div class="flex items-center text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span>${companyOrSchool.nome}</span>
                </div>
                
                <!-- Price -->
                <div class="flex items-center text-green-400 font-semibold">
                    <span>R$ ${offer.preco.toFixed(2)}</span>
                </div>
                
                <!-- Delivery Time -->
                <div class="flex items-center text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Entrega: ${offer.prazoEntrega} dias</span>
                </div>
                
                <!-- Minimum Quantity -->
                <div class="flex items-center text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    <span>Mín: ${offer.quantidadeMinima} unidades</span>
                </div>
                
                ${offer.observacoes ? `
                <!-- Observations -->
                <div class="flex items-start text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="leading-relaxed">${offer.observacoes}</span>
                </div>
                ` : ''}
                
                <!-- Offer ID -->
                <div class="flex items-center text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    <span>ID: ${offer.id}</span>
                </div>
            </div>
            
            <div class="flex space-x-3">
                <button class="bg-purple-700 hover:bg-purple-800 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors" onclick="offersManager.openUpdateModal(${offer.id}, '${offer.material.nome}', ${offer.preco}, ${offer.prazoEntrega}, ${offer.quantidadeMinima}, '${(offer.observacoes || '').replace(/'/g, "\\'")}')">
                    Editar
                </button>
                <!-- Added payment button -->
                <button class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors" onclick="offersManager.createPaymentPreference(${offer.id}, '${offer.material.nome.replace(/'/g, "\\'")}', ${offer.preco})">
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
        document.getElementById('offersGrid').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    async deleteOffer(offerId) {
        if (!confirm('Tem certeza que deseja excluir esta oferta?')) {
            return;
        }

        try {
            const bearerToken = localStorage.getItem('bearerToken');
            if (!bearerToken) {
                throw new Error('Token de autenticação não encontrado');
            }

            const response = await fetch(`${this.apiBaseUrl}/ofertas/${offerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao excluir oferta: ${response.status}`);
            }

            this.loadOffers();
            
        } catch (error) {
            console.error('[v0] Error deleting offer:', error);
            alert(`Erro ao excluir oferta: ${error.message}`);
        }
    }

    openUpdateModal(offerId, materialNome, preco, prazoEntrega, quantidadeMinima, observacoes) {
        if (!document.getElementById('updateModal')) {
            this.createUpdateModal();
        }

        document.getElementById('updateOfferId').value = offerId;
        document.getElementById('updatePreco').value = preco;
        document.getElementById('updatePrazoEntrega').value = prazoEntrega;
        document.getElementById('updateQuantidadeMinima').value = quantidadeMinima;
        document.getElementById('updateObservacoes').value = observacoes;
        document.getElementById('modalMaterialName').textContent = materialNome;

        document.getElementById('updateModal').classList.remove('hidden');
    }

    createUpdateModal() {
        const modal = document.createElement('div');
        modal.id = 'updateModal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-xl font-semibold text-white mb-4">Editar Oferta</h3>
                <p class="text-gray-400 mb-4">Material: <span id="modalMaterialName" class="text-white font-medium"></span></p>
                
                <form id="updateOfferForm" class="space-y-4">
                    <input type="hidden" id="updateOfferId">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                        <input type="number" id="updatePreco" step="0.01" min="0" required
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Prazo de Entrega (dias)</label>
                        <input type="number" id="updatePrazoEntrega" min="1" required
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Quantidade Mínima</label>
                        <input type="number" id="updateQuantidadeMinima" min="1" required
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                        <textarea id="updateObservacoes" rows="3"
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="button" onclick="offersManager.closeUpdateModal()" 
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
        
        document.getElementById('updateOfferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateOffer();
        });
    }

    closeUpdateModal() {
        document.getElementById('updateModal').classList.add('hidden');
    }

    async updateOffer() {
        try {
            const offerId = document.getElementById('updateOfferId').value;
            const preco = parseFloat(document.getElementById('updatePreco').value);
            const prazoEntrega = parseInt(document.getElementById('updatePrazoEntrega').value);
            const quantidadeMinima = parseInt(document.getElementById('updateQuantidadeMinima').value);
            const observacoes = document.getElementById('updateObservacoes').value;

            const bearerToken = localStorage.getItem('bearerToken');
            if (!bearerToken) {
                throw new Error('Token de autenticação não encontrado');
            }

            const response = await fetch(`${this.apiBaseUrl}/ofertas/${offerId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    preco,
                    prazoEntrega,
                    quantidadeMinima,
                    observacoes
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar oferta: ${response.status}`);
            }

            this.closeUpdateModal();
            this.loadOffers();
            
        } catch (error) {
            console.error('[v0] Error updating offer:', error);
            alert(`Erro ao atualizar oferta: ${error.message}`);
        }
    }

    async createPaymentPreference(offerId, materialNome, preco) {
                try {
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/pagamentos/criar_preferencia`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            titulo: materialNome,
                            quantidade: 1,
                            preco: preco
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao criar preferência de pagamento: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log('[v0] Payment preference created:', result);
                    
                    if (result.preferenceId) {
                        //const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.preferenceId}`;
                        const checkoutUrl = `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.preferenceId}`;

                        window.location.href = checkoutUrl;
                    } else {
                        throw new Error('Preference ID não encontrado na resposta');
                    }
                    
                } catch (error) {
                    console.error('[v0] Error creating payment preference:', error);
                    alert(`Erro ao criar preferência de pagamento: ${error.message}`);
                }
            }
        }

    document.addEventListener('DOMContentLoaded', () => {
    window.offersManager = new OffersManager();
    });