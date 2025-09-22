class InventoryManager {
        constructor() {
            this.apiBaseUrl = 'http://localhost:8080';
            this.init();
        }

        init() {
            this.attachEventListeners();
            this.loadInventory();
        }

        attachEventListeners() {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('bearerToken');
                    window.location.href = 'login.html';
                });
            }

            // Add form submit handler for update modal
            document.getElementById('updateInventoryForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateInventoryItem();
            });
        }

        async loadInventory() {
            try {
                this.showLoadingState();

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/inventario`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erro ao carregar inventário: ${response.status}`);
                }

                const inventory = await response.json();
                this.displayInventory(inventory);

            } catch (error) {
                console.error('Error loading inventory:', error);
                this.showErrorState(error.message);
            }
        }

        displayInventory(inventory) {
            this.hideAllStates();

            if (!inventory || inventory.length === 0) {
                this.showEmptyState();
                return;
            }

            const inventoryGrid = document.getElementById('inventoryGrid');
            inventoryGrid.innerHTML = '';

            inventory.forEach(item => {
                const itemCard = this.createInventoryCard(item);
                inventoryGrid.appendChild(itemCard);
            });

            inventoryGrid.classList.remove('hidden');
        }

        createInventoryCard(item) {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

            card.innerHTML = `
                <!-- Added delete button in top-right corner -->
                <button class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors" onclick="inventoryManager.deleteInventoryItem(${item.inventario_id})">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
                
                <div class="mb-4 pr-12">
                    <h3 class="text-xl font-semibold text-white mb-2">${item.item_nome}</h3>
                    <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Qtd: ${item.quantidade}
                    </span>
                </div>
                
                <div class="space-y-3 text-sm mb-6">
                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        <span>ID: ${item.inventario_id}</span>
                    </div>
                    
                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        <span>Usuário ID: ${item.usuarioId}</span>
                    </div>
                </div>
                
                <!-- Added edit button -->
                <div class="flex space-x-3">
                    <button class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors" onclick="inventoryManager.openUpdateModal(${item.inventario_id}, '${item.item_nome.replace(/'/g, "\\'")}', ${item.quantidade})">
                        Editar
                    </button>
                </div>
            `;

            return card;
        }

        async deleteInventoryItem(inventoryId) {
            if (!confirm('Tem certeza que deseja excluir este item do inventário?')) {
                return;
            }

            try {
                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/inventario/${inventoryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erro ao excluir item: ${response.status}`);
                }

                // Reload inventory after successful deletion
                this.loadInventory();
                
            } catch (error) {
                console.error('Error deleting inventory item:', error);
                alert(`Erro ao excluir item: ${error.message}`);
            }
        }

        openUpdateModal(inventoryId, itemNome, quantidade) {
            // Populate form with current values
            document.getElementById('updateInventoryId').value = inventoryId;
            document.getElementById('updateItemNome').value = itemNome;
            document.getElementById('updateQuantidade').value = quantidade;

            // Show modal
            document.getElementById('updateModal').classList.remove('hidden');
        }

        closeUpdateModal() {
            document.getElementById('updateModal').classList.add('hidden');
        }

        async updateInventoryItem() {
            try {
                const inventoryId = document.getElementById('updateInventoryId').value;
                const itemNome = document.getElementById('updateItemNome').value;
                const quantidade = parseInt(document.getElementById('updateQuantidade').value);

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/inventario/${inventoryId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        item_nome: itemNome,
                        quantidade: quantidade
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erro ao atualizar item: ${response.status}`);
                }

                this.closeUpdateModal();
                this.loadInventory();
                
            } catch (error) {
                console.error('Error updating inventory item:', error);
                alert(`Erro ao atualizar item: ${error.message}`);
            }
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
            document.getElementById('inventoryGrid').classList.add('hidden');
            document.getElementById('emptyState').classList.add('hidden');
        }
    }

    // Initialize the inventory manager when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        window.inventoryManager = new InventoryManager();
    });