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
            window.location.href = 'index.html';
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
        this.createDetailsModal();
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

            const offerLists = await response.json();
            
            console.log('[v0] Offer lists loaded:', offerLists);
            this.offerLists = offerLists;
            this.displayOfferLists(offerLists, this.inventory);

        } catch (error) {
            console.error('[v0] Error loading offer lists:', error);
            this.showErrorState(error.message);
        }
    }

    async loadUserInventory() {
        try {
            const bearerToken = localStorage.getItem('bearerToken');
            if (!bearerToken) return [];

            const response = await fetch(`${this.apiBaseUrl}/inventario`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return [];
            return await response.json() || [];
        } catch (error) {
            console.warn('Error loading inventory:', error);
            return [];
        }
    }

    displayOfferLists(offerLists, inventory = []) {
        this.hideAllStates();

        if (!offerLists || offerLists.length === 0) {
            this.showEmptyState();
            return;
        }

        const offerListsGrid = document.getElementById('offerListsGrid');
        offerListsGrid.innerHTML = '';

        offerLists.forEach(offerList => {
            const offerListCard = this.createOfferListCard(offerList, inventory);
            offerListsGrid.appendChild(offerListCard);
        });

        offerListsGrid.classList.remove('hidden');
    }

    createOfferListCard(offerList, inventory = []) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative flex flex-col';

        const totalPrice = offerList.ofertas.reduce((sum, offer) => sum + offer.preco, 0);

        const itemsInInventory = offerList.ofertas.filter(offer =>
            inventory.some(item =>
                item.item_nome.toLowerCase() === offer.materialNome.toLowerCase()
            )
        ).length;

        const deleteButton = RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO) ? `
            <button onclick="window.offerListsManager.deleteOfferList(${offerList.id})" 
                    class="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors" 
                    title="Excluir lista">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        ` : '';

        const materialsToShow = offerList.ofertas.slice(0, 4);
        const remainingCount = offerList.ofertas.length - 4;

        card.innerHTML = `
            <div class="mb-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-semibold text-white">Lista #${offerList.id}</h3>
                    <div class="flex items-center space-x-2">
                        <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            ${offerList.ofertas.length} itens
                        </span>
                        ${itemsInInventory > 0 ? `
                            <span class="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                ${itemsInInventory} na posse
                            </span>
                        ` : ''}
                        ${deleteButton}
                    </div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto mb-4 custom-scrollbar">
                <div class="flex items-center text-green-400 font-semibold text-lg mb-3">
                    <span>Total: R$ ${totalPrice.toFixed(2)}</span>
                </div>
                
                <div class="space-y-2">
                    <h4 class="text-sm font-medium text-gray-300 mb-2">Resumo dos itens:</h4>
                    ${materialsToShow.map(offer => {
                        // Verifica se tem o item
                        const hasItem = inventory.some(i => i.item_nome.toLowerCase() === offer.materialNome.toLowerCase());
                        
                        // APLICAÇÃO DA COR VERDE NO NOME (text-green-400) SE TIVER O ITEM
                        return `
                        <div class="flex justify-between items-center text-sm bg-gray-700 p-2 rounded">
                            <span class="${hasItem ? 'text-green-400 font-medium' : 'text-gray-200'} truncate pr-2">
                                ${offer.materialNome}
                            </span>
                            ${hasItem ? 
                                `<span class="text-green-400 text-xs whitespace-nowrap">R$ ${offer.preco.toFixed(2)}</span>` : 
                                `<span class="text-gray-400 text-xs whitespace-nowrap">R$ ${offer.preco.toFixed(2)}</span>`
                            }
                        </div>
                        `;
                    }).join('')}
                    
                    ${remainingCount > 0 ? `
                        <div class="text-center text-gray-500 text-sm italic pt-1">
                            + ${remainingCount} outros itens...
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="flex space-x-3 mt-auto pt-4 border-t border-gray-700">
                <button class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    onclick="window.offerListsManager.openDetailsModal(${offerList.id})">
                    Ver Detalhes
                </button>
                
                <button class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    onclick="window.offerListsManager.createPaymentPreference(${offerList.id}, 'Lista de Ofertas #${offerList.id}', ${totalPrice})">
                    Pagar Lista
                </button>
            </div>
        `;

        return card;
    }

    createDetailsModal() {
        if (document.getElementById('listDetailsModal')) return;

        const modal = document.createElement('div');
        modal.id = 'listDetailsModal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
                <div class="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h3 id="modalListTitle" class="text-xl font-semibold text-white">Detalhes da Lista</h3>
                    <button onclick="window.offerListsManager.closeDetailsModal()" class="text-gray-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div id="modalItemsList" class="space-y-3">
                        </div>
                </div>

                <div class="p-6 border-t border-gray-700 bg-gray-900 rounded-b-lg">
                    <div class="flex justify-between items-center text-lg font-bold">
                        <span class="text-gray-300">Total da Lista:</span>
                        <span id="modalListTotal" class="text-green-400">R$ 0.00</span>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="window.offerListsManager.closeDetailsModal()" class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-md text-sm font-medium transition-colors">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    openDetailsModal(listId) {
        const list = this.offerLists.find(l => l.id === listId);
        if (!list) return;

        const modalList = document.getElementById('modalItemsList');
        const modalTitle = document.getElementById('modalListTitle');
        const modalTotal = document.getElementById('modalListTotal');
        
        modalTitle.textContent = `Detalhes da Lista #${list.id}`;
        
        const totalPrice = list.ofertas.reduce((sum, item) => sum + item.preco, 0);
        modalTotal.textContent = `R$ ${totalPrice.toFixed(2)}`;

        // Gera o HTML para TODOS os itens da lista
        modalList.innerHTML = list.ofertas.map(offer => {
            const isOwned = this.inventory.some(i => i.item_nome.toLowerCase() === offer.materialNome.toLowerCase());
            
            return `
                <div class="flex justify-between items-center p-3 rounded-md ${isOwned ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-700 border border-gray-600'}">
                    <div class="flex-1">
                        <p class="${isOwned ? 'text-green-400' : 'text-white'} font-medium">${offer.materialNome}</p>
                        <p class="text-xs text-gray-400">ID Oferta: ${offer.id}</p>
                    </div>
                    <div class="text-right">
                        ${isOwned 
                            ? `<span class="inline-flex items-center text-green-400 font-semibold text-sm">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                ${offer.preco.toFixed(2)}
                               </span>`
                            : `<span class="text-yellow-400 font-semibold">R$ ${offer.preco.toFixed(2)}</span>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('listDetailsModal').classList.remove('hidden');
    }

    closeDetailsModal() {
        document.getElementById('listDetailsModal').classList.add('hidden');
    }

    async createPaymentPreference(listId, title, price) {
        try {
            const bearerToken = localStorage.getItem('bearerToken');
            if (!bearerToken) throw new Error('Token não encontrado');

            const response = await fetch(`${this.apiBaseUrl}/pagamentos/criar_preferencia`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo: title,
                    quantidade: 1,
                    preco: price
                })
            });

            if (!response.ok) throw new Error(`Erro API: ${response.status}`);
            
            const result = await response.json();
            if (result.preferenceId) {
                window.location.href = `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.preferenceId}`;
            }
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    async deleteOfferList(listId) {
        if (!confirm('Excluir lista?')) return;
        
        try {
             const bearerToken = localStorage.getItem('bearerToken');
             const response = await fetch(`${this.apiBaseUrl}/oferta_lista/${listId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${bearerToken}` }
            });

            if (response.ok) this.loadOfferLists();
            else alert('Erro ao excluir');
        } catch (e) {
            alert('Erro ao excluir');
        }
    }

    showLoadingState() { this.hideAllStates(); document.getElementById('loadingState')?.classList.remove('hidden'); }
    showErrorState(msg) { 
        this.hideAllStates(); 
        document.getElementById('errorMessage').textContent = msg;
        document.getElementById('errorState')?.classList.remove('hidden'); 
    }
    showEmptyState() { this.hideAllStates(); document.getElementById('emptyState')?.classList.remove('hidden'); }
    hideAllStates() {
        ['loadingState', 'errorState', 'offerListsGrid', 'emptyState'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.offerListsManager = new OfferListsManager();
});