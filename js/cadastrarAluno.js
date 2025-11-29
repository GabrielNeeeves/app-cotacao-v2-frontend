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

    async function loadEscolas() {
        const escolaSelect = document.getElementById('escolaId');
        
        try {
            const bearerToken = localStorage.getItem('bearerToken');
            const response = await fetch('http://localhost:8080/escolas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar escolas');
            }

            const escolas = await response.json();
            
            escolaSelect.innerHTML = '<option value="">Selecione a escola</option>';
            
            escolas.forEach(escola => {
                const option = document.createElement('option');
                option.value = escola.id;
                option.textContent = escola.nome;
                escolaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('[v0] Error loading escolas:', error);
            escolaSelect.innerHTML = '<option value="">Erro ao carregar escolas</option>';
            
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Erro ao carregar lista de escolas. Tente recarregar a página.';
            errorMessage.classList.remove('hidden');
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        RoleAuth.checkPageAccess(RoleAuth.ROLES.CLIENTE);
        
        const currentYear = new Date().getFullYear();
        document.getElementById('anoLetivo').value = currentYear;
        
        loadEscolas();
        
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Tem certeza que deseja sair?')) {
                    localStorage.removeItem('bearerToken');
                    localStorage.removeItem('userRole');
                    window.location.href = 'login.html';
                }
            });
        }
    });

    document.getElementById('alunoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        
        btnText.style.display = 'none';
        loadingSpinner.classList.remove('hidden');
        loadingSpinner.classList.add('flex');
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(e.target);
            const clienteId = localStorage.getItem('clienteId');
            
            const alunoData = {
                clienteId: clienteId ? parseInt(clienteId) : null,
                escolaId: parseInt(formData.get('escolaId')),
                nome: formData.get('nome'),
                serie: formData.get('serie'),
                turno: formData.get('turno'),
                anoLetivo: parseInt(formData.get('anoLetivo')),
                observacoes: formData.get('observacoes') || null
            };

            console.log('[v0] Sending aluno data:', alunoData);

            const bearerToken = localStorage.getItem('bearerToken');
            const response = await fetch('http://localhost:8080/alunos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`
                },
                body: JSON.stringify(alunoData)
            });

            console.log('[v0] Response status:', response.status);

            const responseText = await response.text();
            console.log('[v0] Response text:', responseText);

            if (response.ok) {
                let result;
                try {
                    result = JSON.parse(responseText);
                    console.log('[v0] Aluno created successfully:', result);
                } catch (jsonError) {
                    console.log('[v0] Response is not JSON, treating as success message:', responseText);
                    result = { message: responseText };
                }
                
                successMessage.textContent = 'Aluno cadastrado com sucesso!';
                successMessage.classList.remove('hidden');
                
                setTimeout(() => {
                    e.target.reset();
                    document.getElementById('anoLetivo').value = new Date().getFullYear();
                    successMessage.classList.add('hidden');
                }, 3000);
            } else {
                console.error('[v0] Error creating aluno:', responseText);
                
                let errorMsg = `Erro ao cadastrar aluno (${response.status})`;
                
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg += `: ${errorData.message || errorData.error || responseText}`;
                } catch (jsonError) {
                    errorMsg += `: ${responseText}`;
                }
                
                errorMessage.textContent = errorMsg;
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('[v0] Network error:', error);
            errorMessage.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
            errorMessage.classList.remove('hidden');
        } finally {
            btnText.style.display = 'inline';
            loadingSpinner.classList.add('hidden');
            loadingSpinner.classList.remove('flex');
            submitBtn.disabled = false;
        }
    });

    function cancelForm() {
        if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
            window.location.href = '../index/index.html';
        }
    }

    function validateForm() {
        const nome = document.getElementById('nome').value.trim();
        const escolaId = document.getElementById('escolaId').value;
        const serie = document.getElementById('serie').value.trim();
        const turno = document.getElementById('turno').value;
        const anoLetivo = document.getElementById('anoLetivo').value;

        if (!nome || !escolaId || !serie || !turno || !anoLetivo) {
            return false;
        }

        const year = parseInt(anoLetivo);
        if (year < 2000 || year > 2100) {
            return false;
        }

        return true;
    }

    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', function() {
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = !validateForm();
        });
    });