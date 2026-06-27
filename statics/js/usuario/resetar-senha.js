document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetForm');
    if (!resetForm) return;

    const emailInput = document.getElementById('email');
    const codigoInput = document.getElementById('codigo');

    // Pré-preenche o e-mail vindo da página anterior (sessionStorage) ou da URL
    const params = new URLSearchParams(window.location.search);
    const emailSalvo = sessionStorage.getItem('reset_email') || params.get('email') || '';
    if (emailSalvo) emailInput.value = emailSalvo;

    // Código aceita só dígitos (máx 6)
    codigoInput.addEventListener('input', () => {
        codigoInput.value = codigoInput.value.replace(/\D/g, '').slice(0, 6);
    });

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const codigo = codigoInput.value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!email) { showToast("INFORME SEU E-MAIL.", "error"); return; }
        if (codigo.length !== 6) { showToast("DIGITE O CÓDIGO DE 6 DÍGITOS.", "error"); return; }
        if (password !== confirmPassword) { showToast("AS SENHAS NÃO CONFEREM.", "error"); return; }
        if (password.length < 6) { showToast("A SENHA DEVE TER NO MÍNIMO 6 CARACTERES.", "error"); return; }

        try {
            const response = await fetch(`${CONFIG.API_AUTH_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo, senha: password })
            });
            const data = await response.json();

            if (response.ok) {
                sessionStorage.removeItem('reset_email');
                showToast("SENHA ATUALIZADA! REDIRECIONANDO PRO LOGIN...", "success");
                setTimeout(() => window.location.href = 'login.html', 2200);
            } else {
                showToast((data.message || "ERRO AO REDEFINIR SENHA.").toUpperCase(), "error");
            }
        } catch (error) {
            showToast("FALHA NA CONEXÃO COM O SERVIDOR.", "error");
        }
    });
});
