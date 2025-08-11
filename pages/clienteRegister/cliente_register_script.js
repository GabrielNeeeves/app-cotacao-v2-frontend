const form = document.getElementById("registerForm");
    const responseMessage = document.getElementById("responseMessage");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        nome: form.nome.value.trim(),
        email: form.email.value.trim(),
        senha: form.senha.value,
        alunoId: form.alunoId.value ? Number(form.alunoId.value) : null,
      };

      try {
        const response = await fetch("http://localhost:8080/auth/register/cliente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          responseMessage.textContent = "Cliente registrado com sucesso!";
          responseMessage.className = "mt-4 text-center text-green-500";
          form.reset();
        } else {
          responseMessage.textContent = "Erro ao registrar cliente. Email já cadastrado?";
          responseMessage.className = "mt-4 text-center text-red-500";
        }
      } catch (err) {
        responseMessage.textContent = "Erro na conexão com o servidor.";
        responseMessage.className = "mt-4 text-center text-red-500";
      }
    });