class MaterialsManager {
        constructor() {
            this.apiBaseUrl = 'http://localhost:8080';
            this.init();
        }

        init() {
            this.loadMaterials();
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

            card.innerHTML = `
                <div class="mb-4">
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
    }

    // Initialize the materials manager when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        new MaterialsManager();
    });