// Toggle between login and registration forms
document.getElementById('createAccountButton').addEventListener('click', function() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.querySelector('h2').textContent = 'Criar Nova Conta';
    document.querySelector('p').textContent = 'Registrar-se como cliente';
});

document.getElementById('backToLoginButton').addEventListener('click', function() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.querySelector('h2').textContent = 'Entrar com sua conta';
    document.querySelector('p').textContent = 'Fazer login';
});

// Handle registration form submission
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        senha: formData.get('senha'),
        alunoId: null
    };

    const submitButton = document.getElementById('registerSubmitButton');
    const originalText = submitButton.textContent;
    
    try {
        submitButton.textContent = 'Registrando...';
        submitButton.disabled = true;

        const response = await fetch('http://localhost:8080/auth/register/cliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });

        if (response.ok) {
            alert('Conta criada com sucesso! Faça login com suas credenciais.');
            document.getElementById('backToLoginButton').click();
            document.getElementById('registerForm').reset();
        } else {
            const errorData = await response.text();
            alert('Erro ao criar conta: ' + errorData);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Erro de conexão. Tente novamente.');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});