document.addEventListener('DOMContentLoaded', () => {
    const params   = new URLSearchParams(window.location.search);
    const dropId   = params.get('drop');
    const backRaw  = params.get('back');

    // Sem drop_id na URL → vai pra home
    if (!dropId) {
        window.location.replace('../../templates/index.html');
        return;
    }

    // Se já está desbloqueado nesta sessão, redireciona direto
    if (sessionStorage.getItem(`gritta_unlock_${dropId}`)) {
        _redirecionar(backRaw, dropId);
        return;
    }

    const form      = document.getElementById('lock-form');
    const input     = document.getElementById('lock-senha');
    const erroEl    = document.getElementById('lock-erro');
    const submitBtn = document.getElementById('lock-submit');
    const toggleBtn = document.getElementById('lock-toggle');
    const inputRow  = document.getElementById('lock-input-row');
    const successEl = document.getElementById('lock-success');

    // Toggle mostrar/ocultar senha
    toggleBtn.addEventListener('click', () => {
        const hidden = input.type === 'password';
        input.type   = hidden ? 'text' : 'password';
        toggleBtn.textContent = hidden ? 'OCULTAR' : 'VER';
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const senha = input.value.trim();
        if (!senha) return;

        submitBtn.disabled    = true;
        submitBtn.textContent = '...';
        erroEl.textContent    = '';
        erroEl.classList.remove('visible');

        try {
            const res  = await fetch(
                `${CONFIG.API_CATALOG_URL.replace('/products', '')}/drops/${encodeURIComponent(dropId)}/acesso`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senha }),
                }
            );
            const data = await res.json();

            if (data.ok) {
                sessionStorage.setItem(`gritta_unlock_${dropId}`, '1');
                successEl.classList.add('show');
                successEl.removeAttribute('aria-hidden');
                setTimeout(() => _redirecionar(backRaw, dropId), 700);
            } else {
                _mostrarErro(data.erro || 'SENHA INCORRETA.', inputRow, erroEl);
                submitBtn.disabled    = false;
                submitBtn.textContent = 'DESBLOQUEAR →';
                input.value = '';
                input.focus();
            }
        } catch (err) {
            _mostrarErro('ERRO DE CONEXÃO. TENTE NOVAMENTE.', inputRow, erroEl);
            submitBtn.disabled    = false;
            submitBtn.textContent = 'DESBLOQUEAR →';
        }
    });

    input.focus();
});

function _mostrarErro(msg, row, erroEl) {
    erroEl.textContent = msg;
    erroEl.classList.add('visible');
    row.classList.remove('shake');
    void row.offsetWidth; // reflow para reiniciar animação
    row.classList.add('shake');
    row.addEventListener('animationend', () => row.classList.remove('shake'), { once: true });
}

function _redirecionar(backRaw, dropId) {
    if (backRaw) {
        try {
            const back = decodeURIComponent(backRaw);
            // Só redireciona para caminhos locais (sem domínio externo)
            if (!back.startsWith('http') || back.startsWith(location.origin)) {
                window.location.href = back;
                return;
            }
        } catch (e) {}
    }
    // Fallback: vai para a página do drop
    window.location.href = `drop.html?drop=Cole%C3%A7%C3%A3o+de+Inverno&nome=Winter+is+Coming`;
}
