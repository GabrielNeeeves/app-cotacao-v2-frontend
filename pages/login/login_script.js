const errorPopup = document.getElementById('errorPopup');
        const popupContent = document.getElementById('popupContent');

        document.getElementById('loginForm').addEventListener('submit', async function(event) {
            event.preventDefault(); // Impede o envio do formulário padrão

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:8080/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, senha: password })
                });

                if (response.ok) {
                    // Login bem-sucedido
                    const data = await response.json();
                    console.log('Login bem-sucedido. Token recebido:', data.token);
                    // O redirecionamento foi removido para facilitar o debug.
                    // Para reativá-lo, use: window.location.href = '../index/index.html'; 
                } else {
                    // Login falhou (senha incorreta, etc.)
                    console.error('Falha no login:', response.statusText);
                    // Exibe o pop-up de erro
                    errorPopup.classList.remove('opacity-0', 'pointer-events-none');
                    errorPopup.classList.add('opacity-100');
                    popupContent.classList.remove('scale-95');
                    popupContent.classList.add('scale-100');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                // Exibe o pop-up de erro em caso de problemas na requisição (servidor offline, etc.)
                errorPopup.classList.remove('opacity-0', 'pointer-events-none');
                errorPopup.classList.add('opacity-100');
                popupContent.classList.remove('scale-95');
                popupContent.classList.add('scale-100');
            }
        });

        // Evento para fechar o pop-up com animação
        document.getElementById('closePopup').addEventListener('click', function() {
            popupContent.classList.remove('scale-100');
            popupContent.classList.add('scale-95');
            errorPopup.classList.remove('opacity-100');
            errorPopup.classList.add('opacity-0');
            
            // Adiciona um pequeno delay para que a animação de opacidade termine antes de ocultar
            setTimeout(() => {
                errorPopup.classList.add('pointer-events-none');
            }, 300); // O tempo (300ms) deve corresponder à duração da transição CSS
        });