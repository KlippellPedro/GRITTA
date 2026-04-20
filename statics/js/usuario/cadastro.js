const API_AUTH_URL = "http://127.0.0.1:5005/api/auth";

document.addEventListener('DOMContentLoaded', () => {
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const cadastroForm = document.getElementById('cadastroForm');
    const cadastroMessage = document.getElementById('cadastro-message');

    // Função para aplicar máscara de CPF
    function maskCPF(value) {
        value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
        value = value.replace(/(\d{3})(\d)/, '$1.$2'); // Adiciona o primeiro ponto
        value = value.replace(/(\d{3})(\d)/, '$1.$2'); // Adiciona o segundo ponto
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Adiciona o hífen
        return value;
    }

    // Função para aplicar máscara de Telefone (celular com 9 dígitos)
    function maskTelefone(value) {
        value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Adiciona parênteses e espaço
        value = value.replace(/(\d)(\d{4})$/, '$1-$2'); // Adiciona o hífen
        return value;
    }

    // Aplica a máscara ao digitar no campo CPF
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            e.target.value = maskCPF(e.target.value);
        });
    }

    // Aplica a máscara ao digitar no campo Telefone
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            e.target.value = maskTelefone(e.target.value);
        });
    }

    // Exemplo de como você pode lidar com o envio do formulário
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão do formulário

            cadastroMessage.textContent = ''; // Limpa mensagens anteriores
            cadastroMessage.className = 'message-area'; // Reseta a classe

            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const cpf = cpfInput ? cpfInput.value : '';
            const telefone = telefoneInput ? telefoneInput.value : '';
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                cadastroMessage.textContent = 'As senhas não coincidem.';
                cadastroMessage.classList.add('error');
                return;
            }

            try {
                const response = await fetch(`${API_AUTH_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome, email, senha: password, cpf, telefone })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    cadastroMessage.textContent = data.message + ' Redirecionando para o login...';
                    cadastroMessage.classList.add('success');
                    setTimeout(() => {
                        window.location.href = 'login.html'; // Redirecionar para a página de login
                    }, 2000);
                } else {
                    cadastroMessage.textContent = data.message || 'Erro ao registrar usuário.';
                    cadastroMessage.classList.add('error');
                }
            } catch (error) {
                console.error("Erro na requisição de cadastro:", error);
                cadastroMessage.textContent = 'Não foi possível conectar ao servidor de autenticação.';
                cadastroMessage.classList.add('error');
            }
        });
    }
});