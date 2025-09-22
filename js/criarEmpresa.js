class EmpresaManager {
            constructor() {
                this.apiBaseUrl = 'http://localhost:8080';
                this.initializeEventListeners();
                this.setupCNPJMask();
            }

            initializeEventListeners() {
                const form = document.getElementById('empresaForm');
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            setupCNPJMask() {
                const cnpjInput = document.getElementById('cnpj');
                cnpjInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    e.target.value = value;
                });
            }

            async handleSubmit(e) {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const empresaData = {
                    nome: formData.get('nome').trim(),
                    endereco: formData.get('endereco').trim(),
                    cnpj: formData.get('cnpj').replace(/\D/g, '') // Remove formatting for API
                };

                // Validate CNPJ length
                if (empresaData.cnpj.length !== 14) {
                    this.showError('CNPJ deve ter 14 dígitos');
                    return;
                }

                // Format CNPJ back for display
                empresaData.cnpj = this.formatCNPJ(empresaData.cnpj);

                await this.createEmpresa(empresaData);
            }

            formatCNPJ(cnpj) {
                return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
            }

            async createEmpresa(empresaData) {
                const loadingMessage = document.getElementById('loadingMessage');
                const errorMessage = document.getElementById('errorMessage');
                const successMessage = document.getElementById('successMessage');
                const submitBtn = document.getElementById('submitBtn');

                try {
                    // Show loading state
                    loadingMessage.classList.remove('hidden');
                    errorMessage.classList.add('hidden');
                    successMessage.classList.add('hidden');
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Criando...';

                    // Get bearer token from localStorage
                    const bearerToken = localStorage.getItem('bearerToken');
                    if (!bearerToken) {
                        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
                    }

                    console.log('[v0] Sending empresa data:', empresaData);

                    const response = await fetch(`${this.apiBaseUrl}/empresas`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${bearerToken}`
                        },
                        body: JSON.stringify(empresaData)
                    });

                    console.log('[v0] Response status:', response.status);

                    const responseText = await response.text();
                    console.log('[v0] Response text:', responseText);

                    if (response.ok) {
                        // Success
                        successMessage.textContent = 'Empresa criada com sucesso!';
                        successMessage.classList.remove('hidden');
                        
                        // Reset form
                        document.getElementById('empresaForm').reset();
                        
                        // Redirect after 2 seconds
                        setTimeout(() => {
                            window.location.href = '../pages/indexindex.html';
                        }, 2000);
                    } else {
                        // Try to parse error response
                        let errorMsg = 'Erro ao criar empresa. Você pode não ter permissão para esta ação.';
                        try {
                            const errorData = JSON.parse(responseText);
                            errorMsg = errorData.message || errorData.error || errorMsg;
                        } catch (e) {
                            errorMsg = responseText || errorMsg;
                        }
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    console.error('[v0] Error creating empresa:', error);
                    this.showError(error.message);
                } finally {
                    // Hide loading state
                    loadingMessage.classList.add('hidden');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Criar Empresa';
                }
            }

            showError(message) {
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = message;
                errorMessage.classList.remove('hidden');
                
                // Hide error after 5 seconds
                setTimeout(() => {
                    errorMessage.classList.add('hidden');
                }, 5000);
            }
        }

        // Global functions
        function logout() {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('bearerToken');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
            }
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            new EmpresaManager();
        });