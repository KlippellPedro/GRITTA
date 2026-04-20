const API_AUTH_URL = "http://127.0.0.1:5005/api/auth";

document.addEventListener('DOMContentLoaded', () => {
    const recoverForm = document.getElementById('recoverForm');
    const emailInput = document.getElementById('email');
    const recoverMessage = document.getElementById('recover-message');

    if (recoverForm) {
        recoverForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value;

            recoverMessage.textContent = '';
            recoverMessage.className = 'message-area';

            try {
                const response = await fetch(`${API_AUTH_URL}/forgot-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                // Mesmo se o e-mail não existir, o backend retorna 200 por segurança (evitar enumeração)
                if (response.ok) {
                    recoverMessage.textContent = data.message;
                    recoverMessage.classList.add('success');
                    recoverForm.querySelector('button').disabled = true;
                    recoverForm.querySelector('button').style.opacity = '0.5';
                } else {
                    recoverMessage.textContent = data.message || 'Erro ao processar solicitação.';
                    recoverMessage.classList.add('error');
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                recoverMessage.textContent = 'Não foi possível conectar ao servidor.';
                recoverMessage.classList.add('error');
            }
        });
    }
});