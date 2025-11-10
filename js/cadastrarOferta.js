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

        window.addEventListener('load', function() {
            const bearerToken = localStorage.getItem('bearerToken');
            if (!bearerToken) {
                window.location.href = 'login.html';
                return;
            }
            
            if (!RoleAuth.hasRole(RoleAuth.ROLES.FUNCIONARIO)) {
                alert('Você não tem permissão para acessar esta página.');
                window.location.href = '../index/index.html';
                return;
            }

            // Check if empresaId exists in localStorage
            const empresaId = localStorage.getItem('empresaId');
            if (!empresaId) {
                alert('EmpresaId não encontrado. Você precisa estar associado a uma empresa para cadastrar ofertas.');
                window.location.href = '../index/index.html';
                return;
            }
        });

        document.getElementById('ofertaForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent;
            
            // Get form data
            const formData = new FormData(this);
            const ofertaData = {
                funcionarioId: parseInt(formData.get('funcionarioId')),
                materialId: parseInt(formData.get('materialId')),
                preco: parseFloat(formData.get('preco')),
                prazoEntrega: parseInt(formData.get('prazoEntrega')),
                quantidadeMinima: parseInt(formData.get('quantidadeMinima')),
                observacoes: formData.get('observacoes')?.trim() || ""
            };

            // Validate required fields
            if (!ofertaData.funcionarioId || !ofertaData.materialId || !ofertaData.preco || !ofertaData.prazoEntrega || !ofertaData.quantidadeMinima) {
                showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }

            // Validate numeric values
            if (ofertaData.preco <= 0) {
                showMessage('O preço deve ser maior que zero.', 'error');
                return;
            }

            if (ofertaData.prazoEntrega <= 0) {
                showMessage('O prazo de entrega deve ser maior que zero.', 'error');
                return;
            }

            if (ofertaData.quantidadeMinima <= 0) {
                showMessage('A quantidade mínima deve ser maior que zero.', 'error');
                return;
            }

            try {
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Cadastrando...';

                // Get bearer token from localStorage
                const bearerToken = localStorage.getItem('bearerToken');
                if (!bearerToken) {
                    showMessage('Token de autenticação não encontrado. Faça login novamente.', 'error');
                    window.location.href = 'login.html';
                    return;
                }

                // Make POST request
                const response = await fetch('http://localhost:8080/ofertas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${bearerToken}`
                    },
                    body: JSON.stringify(ofertaData)
                });

                const responseText = await response.text();
                
                if (response.ok) {
                    showMessage('Oferta cadastrada com sucesso!', 'success');
                    // Reset form
                    document.getElementById('ofertaForm').reset();
                    
                    // Redirect after success
                    setTimeout(() => {
                        window.location.href = '../index/index.html';
                    }, 2000);
                } else {
                    let errorMessage = 'Erro ao cadastrar oferta.';
                    
                    try {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch (e) {
                        if (response.status === 401) {
                            errorMessage = 'Não autorizado. Faça login novamente.';
                            setTimeout(() => {
                                window.location.href = 'login.html';
                            }, 2000);
                        } else if (response.status === 400) {
                            errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
                        } else if (response.status === 404) {
                            errorMessage = 'Funcionário ou material não encontrado. Verifique os IDs informados.';
                        } else if (response.status === 409) {
                            errorMessage = 'Já existe uma oferta para este funcionário e material.';
                        }
                    }
                    
                    showMessage(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        function showMessage(message, type) {
            const messageContainer = document.getElementById('messageContainer');
            const messageDiv = document.createElement('div');
            
            const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
            messageDiv.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-4 max-w-md`;
            messageDiv.textContent = message;
            
            messageContainer.appendChild(messageDiv);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }

        function cancelForm() {
            if (confirm('Tem certeza que deseja cancelar? Os dados não salvos serão perdidos.')) {
                window.location.href = '../index/index.html';
            }
        }

        function logout() {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('bearerToken');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
            }
        }