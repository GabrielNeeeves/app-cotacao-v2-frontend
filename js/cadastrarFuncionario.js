document.querySelectorAll('input[name="vinculo"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const empresaField = document.getElementById('empresaField');
                const escolaField = document.getElementById('escolaField');
                const empresaInput = document.getElementById('empresaId');
                const escolaInput = document.getElementById('escolaId');

                if (this.value === 'empresa') {
                    empresaField.classList.remove('hidden');
                    escolaField.classList.add('hidden');
                    empresaInput.required = true;
                    escolaInput.required = false;
                    escolaInput.value = '';
                } else {
                    empresaField.classList.add('hidden');
                    escolaField.classList.remove('hidden');
                    escolaInput.required = true;
                    empresaInput.required = false;
                    empresaInput.value = '';
                }
            });
        });

        // Handle form submission
        document.getElementById('funcionarioForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');

            // Hide previous messages
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');

            // Show loading state
            submitBtn.disabled = true;
            submitText.textContent = 'Registrando...';
            loadingSpinner.classList.remove('hidden');

            try {
                // Get form data
                const formData = new FormData(this);
                const vinculo = formData.get('vinculo');
                
                const funcionarioData = {
                    nome: formData.get('nome'),
                    email: formData.get('email'),
                    senha: formData.get('senha'),
                    salario: parseFloat(formData.get('salario')),
                    empresaId: vinculo === 'empresa' ? parseInt(formData.get('empresaId')) : null,
                    escolaId: vinculo === 'escola' ? parseInt(formData.get('escolaId')) : null
                };

                console.log('[v0] Sending funcionario data:', funcionarioData);

                // Make POST request
                const response = await fetch('http://localhost:8080/auth/register/funcionario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(funcionarioData)
                });

                const responseText = await response.text();
                console.log('[v0] Response status:', response.status);
                console.log('[v0] Response text:', responseText);

                if (response.ok) {
                    // Success
                    successMessage.textContent = 'Funcionário registrado com sucesso!';
                    successMessage.classList.remove('hidden');
                    
                    // Reset form
                    this.reset();
                    
                    // Reset radio buttons to default
                    document.querySelector('input[name="vinculo"][value="empresa"]').checked = true;
                    document.getElementById('empresaField').classList.remove('hidden');
                    document.getElementById('escolaField').classList.add('hidden');
                    document.getElementById('empresaId').required = true;
                    document.getElementById('escolaId').required = false;
                    
                    // Redirect after 2 seconds
                    setTimeout(() => {
                        window.location.href = '../pages/index/index.html';
                    }, 2000);
                } else {
                    // Error
                    let errorText = 'Erro ao registrar funcionário.';
                    
                    try {
                        const errorData = JSON.parse(responseText);
                        errorText = errorData.message || errorData.error || errorText;
                    } catch (e) {
                        if (responseText) {
                            errorText = responseText;
                        }
                    }
                    
                    errorMessage.textContent = errorText;
                    errorMessage.classList.remove('hidden');
                }
            } catch (error) {
                console.error('[v0] Network error:', error);
                errorMessage.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
                errorMessage.classList.remove('hidden');
            } finally {
                // Reset loading state
                submitBtn.disabled = false;
                submitText.textContent = 'Registrar';
                loadingSpinner.classList.add('hidden');
            }
        });