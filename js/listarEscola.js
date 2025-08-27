class SchoolsManager {
            constructor() {
                this.apiBaseUrl = 'http://localhost:8080';
                this.init();
            }

            init() {
                this.attachEventListeners();
                this.loadSchools();
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

            async loadSchools() {
                try {
                    console.log('[v0] Loading schools...');
                    this.showLoadingState();

                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/escolas`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('[v0] Response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`Erro ao carregar escolas: ${response.status}`);
                    }

                    const responseText = await response.text();
                    console.log('[v0] Response text:', responseText);

                    let schools;
                    try {
                        schools = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('[v0] JSON parse error:', parseError);
                        throw new Error('Resposta inválida do servidor');
                    }

                    console.log('[v0] Schools loaded:', schools);
                    this.displaySchools(schools);

                } catch (error) {
                    console.error('[v0] Error loading schools:', error);
                    this.showErrorState(error.message);
                }
            }

            displaySchools(schools) {
                this.hideAllStates();

                if (!schools || schools.length === 0) {
                    this.showEmptyState();
                    return;
                }

                const schoolsGrid = document.getElementById('schoolsGrid');
                schoolsGrid.innerHTML = '';

                schools.forEach(school => {
                    const schoolCard = this.createSchoolCard(school);
                    schoolsGrid.appendChild(schoolCard);
                });

                schoolsGrid.classList.remove('hidden');
            }

            createSchoolCard(school) {
                const card = document.createElement('div');
                card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

                const typeColor = school.tipoEscola === 'PUBLICA' ? 'bg-blue-600' : 'bg-green-600';
                const typeText = school.tipoEscola === 'PUBLICA' ? 'Pública' : 'Privada';

                card.innerHTML = `
                    <button class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors delete-btn" data-school-id="${school.id}" data-school-name="${school.nome}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>

                    <div class="flex justify-between items-start mb-4 pr-10">
                        <h3 class="text-xl font-semibold text-white">${school.nome}</h3>
                        <span class="${typeColor} text-white px-2 py-1 rounded-full text-xs font-medium">
                            ${typeText}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center text-gray-300">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span>${school.endereco}</span>
                        </div>
                        
                        <div class="flex items-center text-gray-300">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            <span>${school.telefone}</span>
                        </div>
                        
                        <div class="flex items-center text-gray-300">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <span>CNPJ: ${school.cnpj}</span>
                        </div>
                        
                        <div class="flex items-center text-gray-300">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                            <span>ID: ${school.id}</span>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex space-x-3">
                        <button class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                            Ver Detalhes
                        </button>
                        <button class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                            Editar
                        </button>
                    </div>
                `;

                const deleteBtn = card.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteSchool(school.id, school.nome);
                });

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
                document.getElementById('schoolsGrid').classList.add('hidden');
                document.getElementById('emptyState').classList.add('hidden');
            }

            async deleteSchool(schoolId, schoolName) {
                const confirmed = confirm(`Tem certeza que deseja excluir a escola "${schoolName}"?`);
                if (!confirmed) return;

                try {
                    console.log('[v0] Deleting school with ID:', schoolId);

                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado');
                    }

                    const response = await fetch(`${this.apiBaseUrl}/escolas/${schoolId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('[v0] Delete response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`Erro ao excluir escola: ${response.status}`);
                    }

                    alert(`Escola "${schoolName}" excluída`);
                    this.loadSchools();

                } catch (error) {
                    console.error('[v0] Error deleting school:', error);
                    alert(`Erro ao excluir escola: ${error.message}`);
                }
            }
        }

        // Initialize the schools manager when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new SchoolsManager();
        });