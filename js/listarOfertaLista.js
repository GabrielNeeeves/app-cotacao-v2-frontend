class OfferListsManager {
        constructor() {
            this.apiBaseUrl = 'http://localhost:8080';
            this.init();
        }

        init() {
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
                console.log('[v0] Loading offer lists...');
                this.showLoadingState();

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                // Load user inventory first
                const inventory = await this.loadUserInventory();

                const response = await fetch(`${this.apiBaseUrl}/oferta_lista`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('[v0] Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`Erro ao carregar listas de ofertas: ${response.status}`);
                }

                const responseText = await response.text();
                console.log('[v0] Response text:', responseText);

                let offerLists;
                try {
                    offerLists = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('[v0] JSON parse error:', parseError);
                    throw new Error('Resposta inválida do servidor');
                }

                console.log('[v0] Offer lists loaded:', offerLists);
                // Pass inventory to display method
                this.displayOfferLists(offerLists, inventory);

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
            card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

            const totalPrice = offerList.ofertas.reduce((sum, offer) => sum + offer.preco, 0);

            // Calculate how many items are in inventory
            const itemsInInventory = offerList.ofertas.filter(offer => 
                inventory.some(item => 
                    item.item_nome.toLowerCase() === offer.materialNome.toLowerCase()
                )
            ).length;

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
                            <button onclick="window.offerListsManager.deleteOfferList(${offerList.id})" 
                                    class="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors" 
                                    title="Excluir lista">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
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
                
                <div class="space-y-3 mb-6">
                    <div class="flex items-center text-green-400 font-semibold text-lg">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
                        <span>Total: R$ ${totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <div class="space-y-2">
                        <h4 class="text-sm font-medium text-gray-300 mb-2">Materiais inclusos:</h4>
                        ${offerList.ofertas.map(offer => {
                            // Check if this specific offer is in inventory
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
                                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
                            `; // <<<====== SYNTAX ERROR WAS HERE: Missing closing backtick
                        }).join('')}
                    </div>
                    
                    <div class="flex items-center text-gray-300 text-sm">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        <span>ID da Lista: ${offerList.id}</span>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                        Ver Detalhes
                    </button>
                    <button class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                        Editar
                    </button>
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

                    const totalPrice = offerList.ofertas.reduce((sum, offer) => sum + offer.preco, 0);

                    const response = await fetch(`${this.apiBaseUrl}/pagamentos/criar_preferencia`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
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
                        window.location.href = `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.preferenceId}`;
                    } else {
                        throw new Error('ID de preferência não encontrado na resposta');
                    }

                } catch (error) {
                    console.error('Error creating payment preference:', error);
                    alert(`Erro ao processar pagamento: ${error.message}`);
                }
            }

}

// Move this outside the class definition
document.addEventListener('DOMContentLoaded', () => {
    window.offerListsManager = new OfferListsManager();
});
