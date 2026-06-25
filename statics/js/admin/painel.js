/**
 * GR!TTA — Painel Admin (Estado da Loja + CRUD de Peças)
 * Gate por tipo=admin (UX); a segurança real está no backend (admin_required).
 * Todas as chamadas de escrita levam o JWT no header Authorization.
 */
const API = CONFIG.API_CATALOG_URL.replace(/\/products$/, '');   // http://127.0.0.1:5003
const ASSETS = '../../statics/';                                  // painel está em templates/admin/

let current = null, selected = null, drops = [];

document.addEventListener('DOMContentLoaded', init);

/* ── JWT ── */
function decodeJWT (token) {
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(atob(b64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(json);
    } catch (e) { return null; }
}
function token () { return localStorage.getItem('auth_token'); }
function authHeaders (extra) { return Object.assign({ Authorization: 'Bearer ' + token() }, extra || {}); }
function money (v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

/* ── Boot + gate ── */
async function init () {
    const user = token() ? decodeJWT(token()) : null;
    if (!user || user.tipo !== 'admin') {
        document.getElementById('denied').style.display = '';
        if (user) document.getElementById('denied-msg').textContent =
            `Você está logado como "${user.tipo || 'cliente'}". Esta área é só para administradores.`;
        return;
    }
    document.getElementById('painel').style.display = '';
    setupTabs();
    document.getElementById('btn-save').addEventListener('click', salvarEstado);
    document.getElementById('btn-nova-peca').addEventListener('click', () => abrirForm(null));
    setupForm();
    await Promise.all([carregarEstado(), carregarPecas()]);
}

function setupTabs () {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tabpane').forEach(p => p.hidden = true);
            document.getElementById('tab-' + tab.dataset.tab).hidden = false;
        });
    });
}

/* ══════════════════════════════════════
   ABA 1 — ESTADO DA LOJA
══════════════════════════════════════ */
async function carregarEstado () {
    try {
        const [stateRes, dropsRes] = await Promise.all([
            fetch(CONFIG.API_STOREFRONT_URL),
            fetch(CONFIG.API_STOREFRONT_URL + '/drops', { headers: authHeaders() })
        ]);
        if (dropsRes.status === 401 || dropsRes.status === 403)
            return msg('msg', 'Sua sessão de admin expirou. Faça login de novo.', 'err');
        const state = await stateRes.json();
        drops = await dropsRes.json();
        current = state.ativo; selected = current;
        renderStatus(state.modo, current);
        renderOptions();
    } catch (e) {
        msg('msg', 'Não consegui falar com o Catalog Service (porta 5003). Ele está rodando?', 'err');
    }
}
function nomeDrop (id) { const d = drops.find(x => x.id === id); return d ? d.nome : id; }
function renderStatus (modo, ativo) {
    document.getElementById('status').innerHTML =
        `Estado atual: <b>${modo === 'normal' ? 'Loja Normal' : nomeDrop(ativo)}</b>`;
}
function renderOptions () {
    const box = document.getElementById('options');
    box.innerHTML = drops.map(d => {
        const sel = d.id === selected ? ' sel' : '';
        const badge = d.id === current ? '<span class="badge">Ativo</span>' : '';
        const tag = d.id === 'normal' ? 'Sem personalização de drop' : 'Drop personalizado';
        return `<div class="opt${sel}" data-id="${d.id}"><span class="dot"></span>
          <span class="info"><span class="nome">${d.nome}</span><span class="tag" style="display:block">${tag}</span></span>${badge}</div>`;
    }).join('');
    box.querySelectorAll('.opt').forEach(el => el.addEventListener('click', () => {
        selected = el.dataset.id; renderOptions();
        document.getElementById('btn-save').disabled = (selected === current);
        msg('msg', '', '');
    }));
    document.getElementById('btn-save').disabled = (selected === current);
}
async function salvarEstado () {
    const btn = document.getElementById('btn-save');
    btn.disabled = true; msg('msg', 'Salvando…', '');
    try {
        const res = await fetch(CONFIG.API_STOREFRONT_URL, {
            method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ ativo: selected })
        });
        const data = await res.json();
        if (res.ok) {
            current = data.ativo; renderStatus(data.modo, data.ativo); renderOptions();
            msg('msg', `Aplicado! A loja agora está em "${data.modo === 'normal' ? 'Loja Normal' : nomeDrop(data.ativo)}". Recarregue a loja pra ver.`, 'ok');
        } else { msg('msg', data.error || 'Erro ao salvar.', 'err'); btn.disabled = false; }
    } catch (e) { msg('msg', 'Erro de conexão ao salvar.', 'err'); btn.disabled = false; }
}

/* ══════════════════════════════════════
   ABA 2 — PEÇAS (CRUD)
══════════════════════════════════════ */
async function carregarPecas () {
    const cont = document.getElementById('pecas-lista');
    try {
        const res = await fetch(`${API}/admin/produtos`, { headers: authHeaders() });
        if (res.status === 401 || res.status === 403)
            return cont.innerHTML = '<p class="loading">Sessão de admin expirada. Faça login de novo.</p>';
        const lista = await res.json();
        if (!Array.isArray(lista) || !lista.length)
            return cont.innerHTML = '<p class="loading">Nenhuma peça cadastrada ainda.</p>';

        cont.innerHTML = `
          <table class="pecas"><thead><tr>
            <th></th><th>Nome</th><th class="hide-sm">Tipo</th><th>Preço</th><th class="hide-sm">Estoque</th><th>Status</th><th></th>
          </tr></thead><tbody>${lista.map(p => `
            <tr>
              <td><img src="${p.imagem ? ASSETS + p.imagem : ASSETS + 'img/placeholder.png'}" alt="" onerror="this.style.opacity=.2"/></td>
              <td>${escapeHtml(p.nome)}${p.is_special ? ' <span class="pill special">Destaque</span>' : ''}</td>
              <td class="hide-sm" style="text-transform:capitalize;color:var(--muted)">${p.tipo}</td>
              <td>${money(p.preco_base)}</td>
              <td class="hide-sm">${p.total_estoque}</td>
              <td><span class="pill ${p.ativo ? 'on' : 'off'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td><div class="row-actions">
                <button class="mini" data-edit="${p.id}">Editar</button>
                <button class="mini del" data-del="${p.id}" data-nome="${escapeHtml(p.nome)}">Desativar</button>
              </div></td>
            </tr>`).join('')}</tbody></table>`;

        cont.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => abrirForm(b.dataset.edit)));
        cont.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => desativarPeca(b.dataset.del, b.dataset.nome)));
    } catch (e) {
        cont.innerHTML = '<p class="loading">Erro ao carregar (o Catalog Service está rodando?).</p>';
    }
}

/* ── Form (modal) ── */
function setupForm () {
    document.getElementById('cancel-peca').addEventListener('click', fecharForm);
    document.getElementById('peca-modal').addEventListener('click', e => { if (e.target.id === 'peca-modal') fecharForm(); });
    document.getElementById('add-var').addEventListener('click', () => addVarRow());
    document.getElementById('peca-form').addEventListener('submit', salvarPeca);

    // Upload por slot de imagem
    document.querySelectorAll('.imgslot').forEach(slot => {
        const drop = slot.querySelector('.drop');
        const input = slot.querySelector('input[type=file]');
        drop.addEventListener('click', () => input.click());
        input.addEventListener('change', () => { if (input.files[0]) enviarImagem(slot, input.files[0]); });
    });
}

async function enviarImagem (slot, file) {
    const drop = slot.querySelector('.drop');
    drop.innerHTML = '<span>Enviando…</span>';
    const fd = new FormData(); fd.append('file', file);
    try {
        const res = await fetch(`${API}/admin/upload`, { method: 'POST', headers: authHeaders(), body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no upload');
        slot.dataset.caminho = data.caminho;
        drop.innerHTML = `<img src="${ASSETS + data.caminho}" alt="" />`;
        slot.classList.add('up');
    } catch (e) {
        slot.dataset.caminho = '';
        drop.innerHTML = `<span style="color:var(--danger)">${e.message}</span>`;
        slot.classList.remove('up');
    }
}

function setSlot (slot, caminho) {
    const drop = slot.querySelector('.drop');
    const label = slot.dataset.slot === '0' ? '+ Foto principal' : '+ 2ª foto (hover)';
    if (caminho) {
        slot.dataset.caminho = caminho;
        drop.innerHTML = `<img src="${ASSETS + caminho}" alt="" onerror="this.parentNode.innerHTML='<span>${label}</span>'" />`;
        slot.classList.add('up');
    } else {
        slot.dataset.caminho = '';
        drop.innerHTML = `<span>${label}</span>`;
        slot.classList.remove('up');
    }
    // recoloca o input (foi removido ao trocar o innerHTML)
    if (!slot.querySelector('input[type=file]')) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*'; input.hidden = true;
        drop.appendChild(input);
        drop.onclick = () => input.click();
        input.addEventListener('change', () => { if (input.files[0]) enviarImagem(slot, input.files[0]); });
    }
}

function addVarRow (tamanho, estoque, id) {
    const row = document.createElement('div');
    row.className = 'varrow';
    if (id) row.dataset.vid = id;
    row.innerHTML = `
      <input type="text" class="v-tam" placeholder="Tam (P, M, 40…)" value="${tamanho ? escapeAttr(tamanho) : ''}" maxlength="10" />
      <input type="number" class="v-est" placeholder="Estoque" min="0" value="${estoque != null ? estoque : ''}" />
      <button type="button" class="rm" title="Remover">×</button>`;
    row.querySelector('.rm').addEventListener('click', () => row.remove());
    document.getElementById('vars').appendChild(row);
}

async function abrirForm (id) {
    const form = document.getElementById('peca-form');
    form.reset();
    document.getElementById('vars').innerHTML = '';
    document.querySelectorAll('.imgslot').forEach(s => setSlot(s, ''));
    msg('form-msg', '', '');
    document.getElementById('f-id').value = id || '';
    document.getElementById('wrap-ativo').hidden = !id;

    if (!id) {
        document.getElementById('peca-modal-title').textContent = 'Nova peça';
        ['P', 'M', 'G', 'GG'].forEach(t => addVarRow(t, 0));
    } else {
        document.getElementById('peca-modal-title').textContent = 'Editar peça';
        try {
            const res = await fetch(`${API}/admin/produtos/${id}`, { headers: authHeaders() });
            const p = await res.json();
            if (!res.ok) throw new Error(p.error || 'Erro');
            document.getElementById('f-nome').value = p.nome || '';
            document.getElementById('f-desc').value = p.descricao || '';
            document.getElementById('f-preco').value = p.preco_base || '';
            document.getElementById('f-tipo').value = p.tipo || 'camisa';
            document.getElementById('f-drop').value = p.drop_nome || '';
            document.getElementById('f-special').checked = !!p.is_special;
            document.getElementById('f-ativo').checked = !!p.ativo;
            (p.imagens || []).forEach(img => {
                const slot = document.querySelector(`.imgslot[data-slot="${img.ordem_exibicao}"]`);
                if (slot) setSlot(slot, img.caminho_imagem);
            });
            if (p.variacoes && p.variacoes.length) p.variacoes.forEach(v => addVarRow(v.tamanho, v.estoque, v.id));
            else addVarRow('', 0);
        } catch (e) { msg('form-msg', 'Erro ao carregar a peça.', 'err'); }
    }
    document.getElementById('peca-modal').classList.add('open');
}
function fecharForm () { document.getElementById('peca-modal').classList.remove('open'); }

function coletarPayload () {
    const imagens = [];
    document.querySelectorAll('.imgslot').forEach(s => { if (s.dataset.caminho) imagens.push(s.dataset.caminho); });
    const variacoes = [];
    document.querySelectorAll('#vars .varrow').forEach(row => {
        const tam = row.querySelector('.v-tam').value.trim();
        if (!tam) return;
        const v = { tamanho: tam, estoque: parseInt(row.querySelector('.v-est').value || 0, 10) };
        if (row.dataset.vid) v.id = parseInt(row.dataset.vid, 10);
        variacoes.push(v);
    });
    return {
        nome: document.getElementById('f-nome').value.trim(),
        descricao: document.getElementById('f-desc').value.trim(),
        preco_base: parseFloat(document.getElementById('f-preco').value),
        tipo: document.getElementById('f-tipo').value,
        is_special: document.getElementById('f-special').checked,
        ativo: document.getElementById('f-ativo').checked ? 1 : 0,
        drop_nome: document.getElementById('f-drop').value.trim() || null,
        imagens, variacoes
    };
}

async function salvarPeca (e) {
    e.preventDefault();
    const id = document.getElementById('f-id').value;
    const btn = document.getElementById('submit-peca');
    btn.disabled = true; msg('form-msg', 'Salvando…', '');
    const payload = coletarPayload();
    try {
        const res = await fetch(`${API}/admin/produtos${id ? '/' + id : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            fecharForm();
            await carregarPecas();
            msg('pecas-msg', id ? 'Peça atualizada ✦' : 'Peça cadastrada ✦', 'ok');
            setTimeout(() => msg('pecas-msg', '', ''), 3000);
        } else { msg('form-msg', data.error || 'Erro ao salvar.', 'err'); btn.disabled = false; }
    } catch (err) { msg('form-msg', 'Erro de conexão ao salvar.', 'err'); btn.disabled = false; }
    finally { btn.disabled = false; }
}

async function desativarPeca (id, nome) {
    if (!confirm(`Desativar "${nome}"? Ela some da loja mas continua no banco (dá pra reativar editando).`)) return;
    try {
        const res = await fetch(`${API}/admin/produtos/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (res.ok) { await carregarPecas(); msg('pecas-msg', 'Peça desativada.', 'ok'); setTimeout(() => msg('pecas-msg', '', ''), 3000); }
        else { const d = await res.json(); msg('pecas-msg', d.error || 'Erro ao desativar.', 'err'); }
    } catch (e) { msg('pecas-msg', 'Erro de conexão.', 'err'); }
}

/* ── utils ── */
function msg (elId, text, kind) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text;
    el.className = 'msg' + (kind ? ' ' + kind : '');
}
function escapeHtml (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttr (s) { return escapeHtml(s); }
