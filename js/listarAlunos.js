class StudentsManager {
        constructor() {
            this.apiBaseUrl = 'http://localhost:8080';
            this.init();
        }

        init() {
            this.attachEventListeners();
            this.loadStudents();
        }

        attachEventListeners() {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('bearerToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                    window.location.href = 'login.html';
                });
            }

            document.getElementById('updateStudentForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateStudent();
            });
        }

        async loadStudents() {
            try {
                this.showLoadingState();

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const clienteId = localStorage.getItem('clienteId');
                if (!clienteId) {
                    throw new Error('ID do cliente não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/clientes/${clienteId}/alunos`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erro ao carregar alunos: ${response.status}`);
                }

                const students = await response.json();
                this.displayStudents(students);

            } catch (error) {
                console.error('Error loading students:', error);
                this.showErrorState(error.message);
            }
        }

        displayStudents(students) {
            this.hideAllStates();

            if (!students || students.length === 0) {
                this.showEmptyState();
                return;
            }

            const studentsGrid = document.getElementById('studentsGrid');
            studentsGrid.innerHTML = '';

            students.forEach(student => {
                const studentCard = this.createStudentCard(student);
                studentsGrid.appendChild(studentCard);
            });

            studentsGrid.classList.remove('hidden');
        }

        createStudentCard(student) {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative';

            const turnoColors = {
                'MATUTINO': 'bg-yellow-600',
                'VESPERTINO': 'bg-orange-600',
                'NOTURNO': 'bg-blue-600'
            };

            const turnoColor = turnoColors[student.turno] || 'bg-gray-600';

            card.innerHTML = `
                <button class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors" onclick="studentsManager.deleteStudent(${student.id})">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
                
                <div class="mb-4 pr-12">
                    <h3 class="text-xl font-semibold text-white mb-3">${student.nome}</h3>
                    <div class="flex flex-wrap gap-2">
                        <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ${student.serie}
                        </span>
                        <span class="${turnoColor} text-white px-3 py-1 rounded-full text-sm font-medium">
                            ${student.turno}
                        </span>
                    </div>
                </div>
                
                <div class="space-y-3 text-sm mb-6">
                    <div class="flex items-center text-gray-300">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>Ano Letivo: ${student.anoLetivo}</span>
                    </div>
                    
                    ${student.escola ? `
                    <div class="flex items-start text-gray-300">
                        <svg class="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <div>
                            <div class="font-medium text-purple-400">${student.escola.nome}</div>
                            <div class="text-xs text-gray-400 mt-0.5">${student.escola.endereco}</div>
                            <div class="text-xs text-gray-500 mt-0.5">${student.escola.tipoEscola} - ${student.escola.telefone}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${student.observacoes ? `
                    <div class="flex items-start text-gray-300">
                        <svg class="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span class="line-clamp-2">${student.observacoes}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="flex space-x-3">
                    <button class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors" onclick='studentsManager.openUpdateModal(${JSON.stringify(student).replace(/'/g, "\\'")} )'>
                        Editar
                    </button>
                </div>
            `;

            return card;
        }

        async deleteStudent(studentId) {
            if (!confirm('Tem certeza que deseja excluir este aluno?')) {
                return;
            }

            try {
                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/alunos/${studentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erro ao excluir aluno: ${response.status}`);
                }

                this.loadStudents();
                
            } catch (error) {
                console.error('Error deleting student:', error);
                alert(`Erro ao excluir aluno: ${error.message}`);
            }
        }

        openUpdateModal(student) {
            document.getElementById('updateAlunoId').value = student.id;
            document.getElementById('updateNome').value = student.nome;
            document.getElementById('updateSerie').value = student.serie;
            document.getElementById('updateTurno').value = student.turno;
            document.getElementById('updateAnoLetivo').value = student.anoLetivo;
            document.getElementById('updateObservacoes').value = student.observacoes || '';

            document.getElementById('updateModal').classList.remove('hidden');
        }

        closeUpdateModal() {
            document.getElementById('updateModal').classList.add('hidden');
        }

        async updateStudent() {
            try {
                const studentId = document.getElementById('updateAlunoId').value;
                const nome = document.getElementById('updateNome').value;
                const serie = document.getElementById('updateSerie').value;
                const turno = document.getElementById('updateTurno').value;
                const anoLetivo = parseInt(document.getElementById('updateAnoLetivo').value);
                const observacoes = document.getElementById('updateObservacoes').value;

                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    throw new Error('Token de autenticação não encontrado');
                }

                const response = await fetch(`${this.apiBaseUrl}/alunos/${studentId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome,
                        serie,
                        turno,
                        anoLetivo,
                        observacoes
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erro ao atualizar aluno: ${response.status}`);
                }

                this.closeUpdateModal();
                this.loadStudents();
                
            } catch (error) {
                console.error('Error updating student:', error);
                alert(`Erro ao atualizar aluno: ${error.message}`);
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
            document.getElementById('studentsGrid').classList.add('hidden');
            document.getElementById('emptyState').classList.add('hidden');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.studentsManager = new StudentsManager();
    });