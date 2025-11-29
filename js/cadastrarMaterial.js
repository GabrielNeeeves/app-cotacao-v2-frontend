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
        
        // Check if user has FUNCIONARIO role (POST /materiais requires FUNCIONARIO)
        RoleAuth.checkPageAccess(RoleAuth.ROLES.FUNCIONARIO);
    });

    document.getElementById('materialForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        
        // Get form data
        const formData = new FormData(this);
        const materialData = {
            nome: formData.get('nome').trim(),
            descricao: formData.get('descricao').trim(),
            categoria: formData.get('categoria'),
            fabricante: formData.get('fabricante').trim(),
        };

        // Validate required fields
        if (!materialData.nome  || !materialData.categoria || !materialData.fabricante) {
            showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
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
            const response = await fetch('http://localhost:8080/materiais', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`
                },
                body: JSON.stringify(materialData)
            });

            const responseText = await response.text();
            
            if (response.ok) {
                showMessage('Material cadastrado com sucesso!', 'success');
                // Reset form
                document.getElementById('materialForm').reset();
            
            } else {
                let errorMessage = 'Erro ao cadastrar material.';
                
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    if (response.status === 401) {
                        errorMessage = 'Não autorizado. Faça login novamente.';
                    } else if (response.status === 400) {
                        errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
                    } else if (response.status === 409) {
                        errorMessage = 'Material já existe com este nome.';
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
            window.location.href = '../pages/index/index.html';
        }
    }

    function logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            localStorage.removeItem('bearerToken');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        }
    }