// GR!TTA — Nova senha (passo final do fluxo: usa o e-mail + código já verificados)
document.addEventListener('DOMContentLoaded', () => {
    const API = (window.CONFIG && CONFIG.API_AUTH_URL) || 'http://127.0.0.1:5005/api/auth';
    const resetForm = document.getElementById('resetForm');
    if (!resetForm) return;

    const email = sessionStorage.getItem('reset_email') || '';
    const codigo = sessionStorage.getItem('reset_codigo') || '';
    const msgEl = document.getElementById('reset-message');
    const emailAlvo = document.getElementById('email-alvo');

    // Sem código verificado na sessão → volta pro início do fluxo.
    if (!email || !codigo) {
        window.location.replace('recuperar-senha.html');
        return;
    }
    if (emailAlvo) emailAlvo.textContent = email;

    // Mostrar/ocultar senha (olhinho)
    document.querySelectorAll('.toggle-password').forEach((t) => {
        t.addEventListener('click', () => {
            const input = t.parentElement.querySelector('input');
            if (input) input.type = input.type === 'password' ? 'text' : 'password';
        });
    });

    function msg(txt, tipo) {
        msgEl.textContent = txt || '';
        msgEl.className = 'message-area' + (tipo ? ' ' + tipo : '');
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirm-password').value;
        msg('', '');

        if (password.length < 6) { msg('A senha deve ter no mínimo 6 caracteres.', 'error'); return; }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) { msg('A senha deve conter letras e números.', 'error'); return; }
        if (password !== confirm) { msg('As senhas não conferem.', 'error'); return; }

        const btn = resetForm.querySelector('button');
        const txtOriginal = btn.textContent;
        btn.disabled = true; btn.textContent = 'REDEFININDO…';

        try {
            const r = await fetch(`${API}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo, senha: password })
            });
            const data = await r.json();

            if (r.ok) {
                sessionStorage.removeItem('reset_email');
                sessionStorage.removeItem('reset_codigo');
                msg('Senha atualizada! Redirecionando pro login…', 'success');
                if (typeof showToast === 'function') showToast('SENHA ATUALIZADA!', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } else {
                // Código pode ter expirado/estourado tentativas entre a verificação e agora.
                msg(data.message || 'Erro ao redefinir senha.', 'error');
                btn.disabled = false; btn.textContent = txtOriginal;
            }
        } catch (err) {
            msg('Falha na conexão com o servidor.', 'error');
            btn.disabled = false; btn.textContent = txtOriginal;
        }
    });
});
