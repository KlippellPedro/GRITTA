// GR!TTA — Recuperação de senha (fluxo profissional em 2 passos: e-mail → código)
document.addEventListener('DOMContentLoaded', () => {
    const API = (window.CONFIG && CONFIG.API_AUTH_URL) || 'http://127.0.0.1:5005/api/auth';

    const paneEmail = document.getElementById('pane-email');
    const paneCodigo = document.getElementById('pane-codigo');
    const steps = document.querySelectorAll('.reset-step');

    const emailForm = document.getElementById('emailForm');
    const codigoForm = document.getElementById('codigoForm');
    const emailInput = document.getElementById('email');
    const codigoInput = document.getElementById('codigo');
    const emailAlvo = document.getElementById('email-alvo');
    const emailMsg = document.getElementById('email-message');
    const codigoMsg = document.getElementById('codigo-message');

    let emailAtual = '';

    function setStep(n) {
        steps.forEach((s, i) => {
            s.classList.toggle('ativo', i === n - 1);
            s.classList.toggle('feito', i < n - 1);
        });
    }
    function msg(el, txt, tipo) {
        el.textContent = txt || '';
        el.className = 'message-area' + (tipo ? ' ' + tipo : '');
    }
    function carregando(btn, on, txtCarregando) {
        if (on) {
            btn.disabled = true;
            btn.dataset.txt = btn.textContent;
            btn.textContent = txtCarregando;
        } else {
            btn.disabled = false;
            if (btn.dataset.txt) btn.textContent = btn.dataset.txt;
        }
    }

    // ── PASSO 1: enviar código ──
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) { msg(emailMsg, 'Informe seu e-mail.', 'error'); return; }
        msg(emailMsg, '', '');
        const btn = emailForm.querySelector('button');
        carregando(btn, true, 'ENVIANDO…');
        try {
            // O backend sempre responde 200 (anti-enumeração) — seguimos pro código.
            await fetch(`${API}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            emailAtual = email;
            emailAlvo.textContent = email;
            paneEmail.classList.add('oculto');
            paneCodigo.classList.remove('oculto');
            setStep(2);
            codigoInput.focus();
        } catch (err) {
            msg(emailMsg, 'Não foi possível conectar ao servidor.', 'error');
        } finally {
            carregando(btn, false);
        }
    });

    // código aceita só dígitos (máx 6)
    codigoInput.addEventListener('input', () => {
        codigoInput.value = codigoInput.value.replace(/\D/g, '').slice(0, 6);
    });

    // ── PASSO 2: verificar código ──
    codigoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = codigoInput.value.trim();
        if (codigo.length !== 6) { msg(codigoMsg, 'Digite o código de 6 dígitos.', 'error'); return; }
        msg(codigoMsg, '', '');
        const btn = codigoForm.querySelector('button');
        carregando(btn, true, 'VERIFICANDO…');
        try {
            const r = await fetch(`${API}/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailAtual, codigo })
            });
            const data = await r.json();
            if (r.ok) {
                // Guarda pro passo final e vai pra tela da nova senha.
                sessionStorage.setItem('reset_email', emailAtual);
                sessionStorage.setItem('reset_codigo', codigo);
                msg(codigoMsg, 'Código verificado! Redirecionando…', 'success');
                setStep(3);
                setTimeout(() => { window.location.href = 'resetar-senha.html'; }, 800);
            } else {
                msg(codigoMsg, data.message || 'Código incorreto.', 'error');
                carregando(btn, false);
            }
        } catch (err) {
            msg(codigoMsg, 'Não foi possível conectar ao servidor.', 'error');
            carregando(btn, false);
        }
    });

    // ── Reenviar código ──
    const linkReenviar = document.getElementById('reenviar');
    if (linkReenviar) linkReenviar.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!emailAtual) return;
        msg(codigoMsg, 'Reenviando…', '');
        try {
            await fetch(`${API}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailAtual })
            });
            msg(codigoMsg, 'Novo código enviado! Confira seu e-mail.', 'success');
            codigoInput.value = '';
            codigoInput.focus();
        } catch (err) {
            msg(codigoMsg, 'Não foi possível reenviar agora.', 'error');
        }
    });

    // ── Trocar e-mail (volta ao passo 1) ──
    const linkVoltar = document.getElementById('voltar-email');
    if (linkVoltar) linkVoltar.addEventListener('click', (e) => {
        e.preventDefault();
        paneCodigo.classList.add('oculto');
        paneEmail.classList.remove('oculto');
        msg(codigoMsg, '', '');
        setStep(1);
        emailInput.focus();
    });
});
