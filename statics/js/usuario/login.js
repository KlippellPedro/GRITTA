const API_AUTH_URL = "http://127.0.0.1:5005/api/auth";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value;
            const senha = passwordInput.value;

            loginMessage.textContent = ''; // Limpa mensagens anteriores
            loginMessage.className = 'message-area'; // Reseta a classe

            try {
                const response = await fetch(`${API_AUTH_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                // Verifica se a resposta é JSON antes de converter
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new TypeError("O servidor não retornou JSON! Verifique o console do Flask.");
                }

                const data = await response.json();

                if (response.ok && data.success) {
                    loginMessage.textContent = data.message;
                    loginMessage.classList.add('success');
                    localStorage.setItem('user_id', data.user_id);
                    localStorage.setItem('auth_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 1500);
                } else {
                    loginMessage.textContent = data.error || data.message || 'Erro ao fazer login.';
                    loginMessage.classList.add('error');
                }
            } catch (error) {
                console.error("Erro detalhado:", error);
                loginMessage.textContent = 'Erro de conexão ou erro interno no servidor.';
                loginMessage.classList.add('error');
            }
        });
    }
});