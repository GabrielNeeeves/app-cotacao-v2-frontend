function formatCNPJ(value) {
            return value
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .substring(0, 18);
        }

        function formatPhone(value) {
            return value
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .substring(0, 15);
        }

        document.getElementById('cnpj').addEventListener('input', function(e) {
            e.target.value = formatCNPJ(e.target.value);
        });

        document.getElementById('telefone').addEventListener('input', function(e) {
            e.target.value = formatPhone(e.target.value);
        });

        document.getElementById('escolaForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn.querySelector('.btn-text');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            
            // Hide previous messages
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            // Show loading state
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'flex';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(e.target);
                const escolaData = {
                    nome: formData.get('nome'),
                    endereco: formData.get('endereco'),
                    tipoEscola: formData.get('tipoEscola'),
                    cnpj: formData.get('cnpj'),
                    telefone: formData.get('telefone')
                };

                console.log('Sending escola data:', escolaData);

                const response = await fetch('http://localhost:8080/escolas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('bearerToken')}`
                    },
                    body: JSON.stringify(escolaData)
                });

                console.log('Response status:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    
                    successMessage.textContent = 'Escola cadastrada com sucesso!';
                    successMessage.style.display = 'block';
                    
                    // Reset form after success
                    setTimeout(() => {
                        e.target.reset();
                        successMessage.style.display = 'none';
                    }, 3000);
                } else {
                    const errorData = await response.text();
                    console.error('[v0] Error creating escola:', errorData);

                    errorMessage.textContent = `Você não possui a permissão necessária: ${response.status}`;
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro de conexão:', error);
                errorMessage.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
                errorMessage.style.display = 'block';
            } finally {
                // Reset button state
                btnText.style.display = 'inline';
                loadingSpinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        });

        function cancelForm() {
            if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
                window.location.href = 'index.html';
            }
        }

        function logout() {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('bearerToken');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
            }
        }

        function validateForm() {
            const nome = document.getElementById('nome').value.trim();
            const endereco = document.getElementById('endereco').value.trim();
            const tipoEscola = document.getElementById('tipoEscola').value;
            const cnpj = document.getElementById('cnpj').value.trim();
            const telefone = document.getElementById('telefone').value.trim();

            if (!nome || !endereco || !tipoEscola || !cnpj || !telefone) {
                return false;
            }

            // Basic CNPJ validation (14 digits)
            const cnpjNumbers = cnpj.replace(/\D/g, '');
            if (cnpjNumbers.length !== 14) {
                return false;
            }

            // Basic phone validation (10 or 11 digits)
            const phoneNumbers = telefone.replace(/\D/g, '');
            if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
                return false;
            }

            return true;
        }

        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', function() {
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.disabled = !validateForm();
            });
        });