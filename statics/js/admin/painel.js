/**
 * GR!TTA — Painel Admin (Estado da Loja / Drops)
 * Gate por tipo=admin (UX); a segurança real está no backend (admin_required).
 */
let current  = null;   // id ativo no servidor
let selected = null;   // id selecionado na UI
let drops    = [];     // [{id, nome}]

document.addEventListener('DOMContentLoaded', init);

/* Decodifica o payload do JWT (base64url + UTF-8) */
function decodeJWT (token) {
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch (e) { return null; }
}

async function init () {
    const token = localStorage.getItem('auth_token');
    const user  = token ? decodeJWT(token) : null;

    if (!user || user.tipo !== 'admin') {
        document.getElementById('denied').style.display = '';
        if (user) {
            document.getElementById('denied-msg').textContent =
                `Você está logado como "${user.tipo || 'cliente'}". Esta área é só para administradores.`;
        }
        return;
    }

    document.getElementById('denied').style.display = 'none';
    document.getElementById('painel').style.display = '';
    document.getElementById('btn-save').addEventListener('click', save);
    await load(token);
}

async function load (token) {
    const headers = { Authorization: 'Bearer ' + token };
    try {
        const [stateRes, dropsRes] = await Promise.all([
            fetch(CONFIG.API_STOREFRONT_URL),
            fetch(CONFIG.API_STOREFRONT_URL + '/drops', { headers })
        ]);

        if (dropsRes.status === 401 || dropsRes.status === 403) {
            return msg('Sua sessão de admin expirou. Faça login de novo.', 'err');
        }

        const state = await stateRes.json();
        drops    = await dropsRes.json();
        current  = state.ativo;
        selected = current;

        renderStatus(state.modo, current);
        renderOptions();
    } catch (e) {
        msg('Não consegui falar com o Catalog Service (porta 5003). Ele está rodando?', 'err');
    }
}

function nomeDe (id) {
    const d = drops.find(x => x.id === id);
    return d ? d.nome : id;
}

function renderStatus (modo, ativo) {
    document.getElementById('status').innerHTML =
        `Estado atual: <b>${modo === 'normal' ? 'Loja Normal' : nomeDe(ativo)}</b>`;
}

function renderOptions () {
    const box = document.getElementById('options');
    box.innerHTML = drops.map(d => {
        const isNormal = d.id === 'normal';
        const sel   = d.id === selected ? ' sel' : '';
        const badge = d.id === current ? '<span class="badge">Ativo</span>' : '';
        const tag   = isNormal ? 'Sem personalização de drop' : 'Drop personalizado';
        return `
        <div class="opt${sel}" data-id="${d.id}">
          <span class="dot"></span>
          <span class="info">
            <span class="nome">${d.nome}</span>
            <span class="tag" style="display:block">${tag}</span>
          </span>
          ${badge}
        </div>`;
    }).join('');

    box.querySelectorAll('.opt').forEach(el => {
        el.addEventListener('click', () => {
            selected = el.dataset.id;
            renderOptions();
            document.getElementById('btn-save').disabled = (selected === current);
            msg('', '');
        });
    });
    document.getElementById('btn-save').disabled = (selected === current);
}

async function save () {
    const token = localStorage.getItem('auth_token');
    const btn   = document.getElementById('btn-save');
    btn.disabled = true;
    msg('Salvando…', '');

    try {
        const res = await fetch(CONFIG.API_STOREFRONT_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ ativo: selected })
        });
        const data = await res.json();

        if (res.ok) {
            current = data.ativo;
            renderStatus(data.modo, data.ativo);
            renderOptions();
            msg(`Aplicado! A loja agora está em "${data.modo === 'normal' ? 'Loja Normal' : nomeDe(data.ativo)}". Recarregue a loja pra ver.`, 'ok');
        } else {
            msg(data.error || 'Erro ao salvar.', 'err');
            btn.disabled = false;
        }
    } catch (e) {
        msg('Erro de conexão ao salvar.', 'err');
        btn.disabled = false;
    }
}

function msg (text, kind) {
    const el = document.getElementById('msg');
    el.textContent = text;
    el.className = 'msg' + (kind ? ' ' + kind : '');
}
