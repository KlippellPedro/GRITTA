/**
 * GR!TTA — Login com Google (Google Identity Services).
 * O front recebe um ID token do Google e manda pro nosso /google,
 * que VERIFICA o token no servidor (nunca confiamos no front) e emite o JWT da loja.
 * Requer CONFIG.GOOGLE_CLIENT_ID preenchido (config.js).
 */
let _googleRendered = false;

function handleGoogleLogin (response) {
    fetch(`${CONFIG.API_AUTH_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
    })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
            if (ok && d.access_token) {
                localStorage.setItem('auth_token', d.access_token);
                localStorage.setItem('refresh_token', d.refresh_token);
                localStorage.setItem('user_id', d.user_id);
                if (typeof showToast === 'function') showToast('ENTROU COM GOOGLE ✦', 'success');
                setTimeout(() => { window.location.href = '../index.html'; }, 800);
            } else if (typeof showToast === 'function') {
                showToast((d.message || 'Erro no login com Google.').toUpperCase(), 'error');
            }
        })
        .catch(() => { if (typeof showToast === 'function') showToast('FALHA NA CONEXÃO COM O SERVIDOR.', 'error'); });
}
window.handleGoogleLogin = handleGoogleLogin;

function initGoogle () {
    if (_googleRendered) return;
    const slot = document.getElementById('google-btn');
    if (!slot) return;
    const cid = (window.CONFIG && CONFIG.GOOGLE_CLIENT_ID) || '';
    if (!cid) {
        _googleRendered = true;
        slot.innerHTML = '<p class="g-hint">Login com Google: defina o GOOGLE_CLIENT_ID em config.js</p>';
        return;
    }
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) return; // GIS ainda não carregou
    _googleRendered = true;
    google.accounts.id.initialize({ client_id: cid, callback: handleGoogleLogin });
    google.accounts.id.renderButton(slot, {
        theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left'
    });
}

// Tenta renderizar assim que o GIS estiver pronto (polling curto)
function tentarRenderGoogle (n) {
    initGoogle();
    if (!_googleRendered && n > 0) setTimeout(() => tentarRenderGoogle(n - 1), 200);
}
document.addEventListener('DOMContentLoaded', () => tentarRenderGoogle(15));
