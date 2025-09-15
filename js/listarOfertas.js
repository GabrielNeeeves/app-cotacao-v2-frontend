class OffersManager {
        constructor() {
            this.apiBaseUrl = 'http://localhost:8080';
            this.init();
        }

        init() {
            this.loadOffers();
        }

        async loadOffers() {
            try {
                console.log('[v0] Loading offers...');
                this.showLoadingState();

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

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
                this.displayOffers(offers);

            } catch (error) {
                console.error('[v0] Error loading offers:', error);
                this.showErrorState(error.message);
            }
        }

        displayOffers(offers) {
            this.hideAllStates();

            if (!offers || offers.length === 0) {
                this.showEmptyState();
                return;
            }

            const offersGrid = document.getElementById('offersGrid');
            offersGrid.innerHTML = '';

            offers.forEach(offer => {
                const offerCard = this.createOfferCard(offer);
                offersGrid.appendChild(offerCard);
            });

            offersGrid.classList.remove('hidden');
        }

        createOfferCard(offer) {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

            const companyOrSchool = offer.funcionario.empresa || offer.funcionario.escola;
            const companyType = offer.funcionario.empresa ? 'Empresa' : 'Escola';
            const companyBadgeColor = offer.funcionario.empresa ? 'bg-blue-600' : 'bg-green-600';

            card.innerHTML = `
                <div class="mb-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-semibold text-white">${offer.material.nome}</h3>
                        <span class="${companyBadgeColor} text-white px-2 py-1 rounded-full text-xs font-medium">
                            ${companyType}
                        </span>
                    </div>
                    <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ${offer.material.categoria}
                    </span>
                </div>
                
                <div class="space-y-3 text-sm mb-6">
                    <!-- Material Description -->
                    <div class="flex items-start text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span class="leading-relaxed">${offer.material.descricao || 'Sem descrição'}</span>
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
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
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
    }

    // Initialize the offers manager when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        new OffersManager();
    });