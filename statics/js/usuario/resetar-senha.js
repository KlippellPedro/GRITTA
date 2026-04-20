document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetForm');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Se não houver token na URL, avisa o usuário e bloqueia o envio
    if (!token) {
        showToast("TOKEN DE RECUPERAÇÃO INVÁLIDO OU AUSENTE.", "error");
        if (resetForm) {
            resetForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
        }
        return;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            showToast("AS SENHAS NÃO CONFEREM.", "error");
            return;
        }

        if (password.length < 6) {
            showToast("A SENHA DEVE TER NO MÍNIMO 6 CARACTERES.", "error");
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_AUTH_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, senha: password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast("SENHA ATUALIZADA COM SUCESSO! REDIRECIONANDO...", "success");
                setTimeout(() => window.location.href = 'login.html', 2500);
            } else {
                showToast(data.message || "ERRO AO REDEFINIR SENHA.", "error");
            }
        } catch (error) {
            showToast("FALHA NA CONEXÃO COM O SERVIDOR.", "error");
        }
    });
});