/**
 * GR!TTA — Painel Admin (Estado da Loja + CRUD de Peças)
 * Gate por tipo=admin (UX); a segurança real está no backend (admin_required).
 * Todas as chamadas de escrita levam o JWT no header Authorization.
 */
const API = CONFIG.API_CATALOG_URL.replace(/\/products$/, '');   // http://127.0.0.1:5003
const ROOT = '../../';                                            // painel está em templates/admin/ → raiz do site

// Normaliza qualquer caminho de imagem pra uma URL válida a partir do painel.
// O seed grava 'statics/img/...' (relativo à raiz) e o upload grava 'img/uploads/...'
// (relativo a statics/). Aqui unificamos os dois sem duplicar 'statics/'.
function imgUrl(path) {
    let p = String(path || '').trim().replace(/^\/+/, '');
    if (!p) return ROOT + 'statics/img/placeholder.png';
    if (!p.startsWith('statics/')) p = 'statics/' + p;
    return ROOT + p;
}

let current = null, selected = null, drops = [];
let filtroStatusPecas = 'ativas';
let excluirTarget = null;

document.addEventListener('DOMContentLoaded', init);

// Sem isso, soltar um arquivo fora de um .drop (ou um drag mal alinhado)
// faz o navegador abrir a imagem e navegar pra fora do painel — parece um refresh.
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

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
    document.getElementById('btn-novo-drop').addEventListener('click', () => abrirDropForm(null));
    document.getElementById('btn-novo-cupom').addEventListener('click', abrirCupomForm);
    setupForm();
    setupDropForm();
    setupCupomForm();
    setupHelp();
    setupFiltroStatus();
    setupExcluirModal();
    await Promise.all([carregarEstado(), carregarPecas(), carregarDrops(), carregarCupons(), carregarCategorias()]);
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
        renderContadores();
    } catch (e) {
        msg('msg', 'Não consegui falar com o Catalog Service (porta 5003). Ele está rodando?', 'err');
    }
}
function nomeDrop (id) { const d = drops.find(x => x.id === id); return d ? d.nome : id; }
function renderStatus (modo, ativo) {
    document.getElementById('status').innerHTML =
        `Estado atual: <b>${modo === 'normal' ? 'Loja Normal' : nomeDrop(ativo)}</b>`;
}
function renderContadores () {
    const real = drops.filter(d => d.id !== 'normal');
    const ativos    = real.filter(d => !d.trancado && !d.arquivado).length;
    const secretos  = real.filter(d => d.trancado  && !d.arquivado).length;
    const arquivados = real.filter(d => d.arquivado).length;
    const el = document.getElementById('drop-counters');
    if (!el) return;
    el.style.display = '';
    document.getElementById('cnt-ativos').textContent    = ativos;
    document.getElementById('cnt-secretos').textContent  = secretos;
    document.getElementById('cnt-arquivados').textContent = arquivados;
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
    document.querySelectorAll('.sfbtn').forEach(b => b.classList.toggle('active', b.dataset.sf === filtroStatusPecas));
    try {
        const res = await fetch(`${API}/admin/produtos?status=${filtroStatusPecas}`, { headers: authHeaders() });
        if (res.status === 401 || res.status === 403)
            return cont.innerHTML = '<p class="loading">Sessão de admin expirada. Faça login de novo.</p>';
        const lista = await res.json();
        if (!Array.isArray(lista) || !lista.length)
            return cont.innerHTML = `<p class="loading">Nenhuma peça ${filtroStatusPecas === 'desativadas' ? 'desativada' : 'cadastrada'} ainda.</p>`;

        cont.innerHTML = `
          <table class="pecas"><thead><tr>
            <th></th><th>Nome</th><th class="hide-sm">Tipo</th><th>Preço</th><th class="hide-sm">Estoque</th><th>Status</th><th></th>
          </tr></thead><tbody>${lista.map(p => `
            <tr>
              <td><img src="${imgUrl(p.imagem)}" alt="" onerror="this.style.opacity=.2"/></td>
              <td>${escapeHtml(p.nome)}${p.is_special ? ' <span class="pill special">Destaque</span>' : ''}</td>
              <td class="hide-sm" style="text-transform:capitalize;color:var(--muted)">${p.tipo}</td>
              <td>${money(p.preco_base)}</td>
              <td class="hide-sm">${p.total_estoque}</td>
              <td><span class="pill ${p.ativo ? 'on' : 'off'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td><div class="row-actions">
                <button class="mini" data-edit="${p.id}">Editar</button>
                ${p.ativo
                  ? `<button class="mini del" data-del="${p.id}" data-nome="${escapeHtml(p.nome)}">Desativar</button>`
                  : `<button class="mini ok" data-reativar="${p.id}" data-nome="${escapeHtml(p.nome)}">Reativar</button>`}
                <button class="mini xdel" data-excluir="${p.id}" data-nome="${escapeHtml(p.nome)}">Excluir</button>
              </div></td>
            </tr>`).join('')}</tbody></table>`;

        cont.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => abrirForm(b.dataset.edit)));
        cont.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => desativarPeca(b.dataset.del, b.dataset.nome)));
        cont.querySelectorAll('[data-reativar]').forEach(b => b.addEventListener('click', () => reativarPeca(b.dataset.reativar, b.dataset.nome)));
        cont.querySelectorAll('[data-excluir]').forEach(b => b.addEventListener('click', () => abrirExcluirModal(b.dataset.excluir, b.dataset.nome)));
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
    document.getElementById('add-img').addEventListener('click', () => {
        const count = document.querySelectorAll('#imgs-container .imgslot').length;
        createImgSlot(count, '');
    });
}

function createImgSlot (order, caminho) {
    const cont = document.getElementById('imgs-container');
    if (!cont) return;
    const slot = document.createElement('div');
    slot.className = 'imgslot';
    slot.dataset.slot = String(order);
    slot.dataset.caminho = '';
    const capLabel = order === 0 ? 'Principal' : order === 1 ? 'Crossfade' : `Extra ${order - 1}`;
    slot.innerHTML = `<div class="drop"></div>
        <div class="cap">${capLabel} <button type="button" class="rm-img" title="Remover">×</button></div>`;
    slot.querySelector('.rm-img').addEventListener('click', () => slot.remove());
    setSlot(slot, caminho || '');
    cont.appendChild(slot);
}

async function enviarImagem (slot, file) {
    const drop = slot.querySelector('.drop');
    drop.innerHTML = '<span>Enviando…</span>';
    const fd = new FormData(); fd.append('file', file);
    try {
        const res = await fetch(`${API}/admin/upload`, { method: 'POST', headers: authHeaders(), body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no upload');
        setSlot(slot, data.caminho);
    } catch (e) {
        setSlot(slot, '');
        const span = drop.querySelector('span');
        if (span) { span.textContent = e.message; span.style.color = 'var(--danger)'; }
    }
}

function setSlot (slot, caminho) {
    const drop = slot.querySelector('.drop');
    const t = slot.dataset.slot;
    const label = t === '0' ? '+ Imagem principal' : t === '1' ? '+ Secundária (crossfade)' : t === 'thumb' ? '+ Thumbnail' : '+ Banner do drop';
    if (caminho) {
        slot.dataset.caminho = caminho;
        drop.innerHTML = `<img src="${imgUrl(caminho)}" alt="" onerror="this.parentNode.innerHTML='<span>${label}</span>'" />`;
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
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('dragover'); };
    drop.ondragleave = () => drop.classList.remove('dragover');
    drop.ondrop = e => {
        e.preventDefault();
        drop.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) enviarImagem(slot, file);
    };
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
    const imgCont = document.getElementById('imgs-container');
    if (imgCont) imgCont.innerHTML = '';
    msg('form-msg', '', '');
    document.getElementById('f-id').value = id || '';
    document.getElementById('wrap-ativo').hidden = !id;

    if (!id) {
        document.getElementById('peca-modal-title').textContent = 'Nova peça';
        ['P', 'M', 'G', 'GG'].forEach(t => addVarRow(t, 0));
        createImgSlot(0, '');
        createImgSlot(1, '');
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
            const imgs = p.imagens || [];
            if (imgs.length > 0) {
                imgs.forEach((img, i) => createImgSlot(i, img.caminho_imagem));
            } else {
                createImgSlot(0, '');
                createImgSlot(1, '');
            }
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
            _produtosCache = null;   // força o seletor de drops a recarregar
            await carregarPecas();
            msg('pecas-msg', id ? 'Peça atualizada ✦' : 'Peça cadastrada ✦', 'ok');
            setTimeout(() => msg('pecas-msg', '', ''), 3000);
        } else { msg('form-msg', data.error || 'Erro ao salvar.', 'err'); btn.disabled = false; }
    } catch (err) { msg('form-msg', 'Erro de conexão ao salvar.', 'err'); btn.disabled = false; }
    finally { btn.disabled = false; }
}

async function desativarPeca (id, nome) {
    if (!confirm(`Desativar "${nome}"? Ela some da loja mas pode ser reativada depois.`)) return;
    try {
        const res = await fetch(`${API}/admin/produtos/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (res.ok) { _produtosCache = null; await carregarPecas(); msg('pecas-msg', 'Peça desativada.', 'ok'); setTimeout(() => msg('pecas-msg', '', ''), 3000); }
        else { const d = await res.json(); msg('pecas-msg', d.error || 'Erro ao desativar.', 'err'); }
    } catch (e) { msg('pecas-msg', 'Erro de conexão.', 'err'); }
}

async function reativarPeca (id, nome) {
    if (!confirm(`Reativar "${nome}"? Ela voltará a aparecer na loja.`)) return;
    try {
        const res = await fetch(`${API}/admin/produtos/${id}/reativar`, { method: 'PUT', headers: authHeaders() });
        if (res.ok) { _produtosCache = null; await carregarPecas(); msg('pecas-msg', 'Peça reativada ✦', 'ok'); setTimeout(() => msg('pecas-msg', '', ''), 3000); }
        else { const d = await res.json(); msg('pecas-msg', d.error || 'Erro ao reativar.', 'err'); }
    } catch (e) { msg('pecas-msg', 'Erro de conexão.', 'err'); }
}

function setupFiltroStatus () {
    document.getElementById('pecas-status-filter').addEventListener('click', async e => {
        const btn = e.target.closest('.sfbtn');
        if (!btn) return;
        filtroStatusPecas = btn.dataset.sf;
        await carregarPecas();
    });
}

function setupExcluirModal () {
    document.getElementById('cancel-excluir').addEventListener('click', () => {
        document.getElementById('excluir-modal').classList.remove('open');
        excluirTarget = null;
    });
    document.getElementById('excluir-modal').addEventListener('click', e => {
        if (e.target.id === 'excluir-modal') {
            document.getElementById('excluir-modal').classList.remove('open');
            excluirTarget = null;
        }
    });
    document.getElementById('confirm-excluir').addEventListener('click', confirmarExcluir);
    document.getElementById('excluir-senha').addEventListener('keydown', e => {
        if (e.key === 'Enter') confirmarExcluir();
    });
}

function abrirExcluirModal (id, nome) {
    excluirTarget = { id, nome };
    document.getElementById('excluir-modal-nome').textContent = `Peça: "${nome}"`;
    document.getElementById('excluir-senha').value = '';
    msg('excluir-msg', '', '');
    document.getElementById('excluir-modal').classList.add('open');
    setTimeout(() => document.getElementById('excluir-senha').focus(), 100);
}

async function confirmarExcluir () {
    if (!excluirTarget) return;
    const senha = document.getElementById('excluir-senha').value;
    if (!senha) return msg('excluir-msg', 'Digite a senha de administrador.', 'err');
    const btn = document.getElementById('confirm-excluir');
    btn.disabled = true;
    msg('excluir-msg', 'Verificando…', '');
    try {
        const res = await fetch(`${API}/admin/produtos/${excluirTarget.id}/excluir`, {
            method: 'DELETE',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ senha })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('excluir-modal').classList.remove('open');
            excluirTarget = null;
            _produtosCache = null;
            await carregarPecas();
            msg('pecas-msg', 'Peça excluída permanentemente.', 'ok');
            setTimeout(() => msg('pecas-msg', '', ''), 4000);
        } else {
            msg('excluir-msg', data.error || 'Erro ao excluir.', 'err');
        }
    } catch (e) {
        msg('excluir-msg', 'Erro de conexão.', 'err');
    } finally {
        btn.disabled = false;
    }
}

/* ══════════════════════════════════════
   ABA 3 — DROPS (construtor)
══════════════════════════════════════ */
let _produtosCache = null;

async function carregarDrops () {
    const cont = document.getElementById('drops-lista');
    try {
        const res = await fetch(CONFIG.API_STOREFRONT_URL + '/drops', { headers: authHeaders() });
        if (res.status === 401 || res.status === 403)
            return cont.innerHTML = '<p class="loading">Sessão de admin expirada.</p>';
        const lista = await res.json();
        cont.innerHTML = (lista || []).map(d => {
            const badge = d.id === 'normal' ? '' :
                d.arquivado ? '<span class="pill off">Arquivado</span>' :
                d.trancado  ? '<span class="pill" style="color:#ffe066;border-color:rgba(255,224,102,.35)">Secreto</span>' :
                              '<span class="pill on">Público</span>';
            return `
              <div class="drop-card-row">
                <div><div class="nm">${escapeHtml(d.nome)}</div><div class="id">${escapeHtml(d.id)}.json</div></div>
                <div style="display:flex;align-items:center;gap:14px">
                  ${badge}
                  <div class="row-actions">
                    <button class="mini" data-edit-drop="${escapeAttr(d.id)}">Editar</button>
                    ${d.id === 'normal' ? '' : `<button class="mini del" data-del-drop="${escapeAttr(d.id)}" data-nome="${escapeAttr(d.nome)}">Excluir</button>`}
                  </div>
                </div>
              </div>`;
        }).join('');
        cont.querySelectorAll('[data-edit-drop]').forEach(b => b.addEventListener('click', () => abrirDropForm(b.dataset.editDrop)));
        cont.querySelectorAll('[data-del-drop]').forEach(b => b.addEventListener('click', () => excluirDrop(b.dataset.delDrop, b.dataset.nome)));
    } catch (e) {
        cont.innerHTML = '<p class="loading">Erro ao carregar drops (Catalog Service rodando?).</p>';
    }
}

function setupDropForm () {
    document.getElementById('cancel-drop').addEventListener('click', () => document.getElementById('drop-modal').classList.remove('open'));
    document.getElementById('drop-modal').addEventListener('click', e => { if (e.target.id === 'drop-modal') document.getElementById('drop-modal').classList.remove('open'); });
    document.getElementById('drop-form').addEventListener('submit', salvarDrop);

    // Status radio → mostra/oculta campo de senha
    document.querySelectorAll('[name="d-status"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const val = document.querySelector('[name="d-status"]:checked')?.value;
            document.getElementById('campo-senha').style.display = val === 'secreto' ? '' : 'none';
        });
    });
}

/* ── Ajuda dos campos (popover do "?") — explica o que cada campo muda na loja ── */
const HELP = {
    id: '<b>ID do arquivo.</b> Vira o arquivo /drops/&lt;id&gt;.json. Use minúsculas e hífens, sem espaço nem acento (ex.: verao-26). Não dá pra mudar depois de criar.',
    nome: '<b>Nome interno.</b> Só aparece pra você aqui no painel, na hora de escolher qual drop ativar. O cliente nunca vê.',
    dropnome: '<b>Etiqueta da coleção.</b> É o que liga as peças a este drop. As peças que você marcar lá embaixo recebem essa etiqueta (ex.: "Coleção Verão").',
    snow: '<b>Efeito de neve.</b> Liga uma animação de neve caindo na loja inteira enquanto este drop estiver ativo.',
    accent: '<b>Cor de destaque.</b> Botões, detalhes e títulos da loja toda passam a usar essa cor quando o drop está ativo.',
    topbar: '<b>Faixa do topo.</b> A tarjinha fina acima do menu (ex.: "VERÃO CHEGANDO — DROP 02"). Vazio = sem faixa.',
    banner: '<b>Imagem do drop.</b> Aparece no hero da home, na seção do drop e na página do drop. Use uma foto vertical de boa qualidade.',
    eyebrow: '<b>Eyebrow.</b> O textinho pequeno acima do título do hero (ex.: "Inverno is Coming").',
    meta: '<b>Meta label.</b> A etiqueta lateral do hero (ex.: "Drop 02 — Verão 26").',
    headline: '<b>Título gigante do hero.</b> Cada linha que você digitar vira uma linha na tela. Escreva {palavra} pra ela sair na cor de destaque.<br>Ex.:<br>O VERÃO<br>NÃO {ESPERA.}',
    hsub: '<b>Subtítulo.</b> O parágrafo curto logo abaixo do título do hero.',
    cta: '<b>Botões do hero.</b> O primário é o botão cheio; o secundário é o de contorno. O texto que você escrever vira o rótulo do botão.',
    shidden: '<b>Esconder a seção.</b> Marque pra tirar da home o bloco de contagem regressiva / chamada deste drop.',
    count: '<b>Contagem regressiva.</b> A home mostra quanto tempo falta até essa data/hora. Vazio = sem contador.',
    stitulo: '<b>Título da seção.</b> Uma linha por linha; escreva {palavra} pra destacar na cor do drop.',
    visual: '<b>Texto do bloco visual.</b> A frase curta que aparece por cima da imagem da seção (ex.: VERÃO 26).',
    marquee: '<b>Faixa animada.</b> As palavras que correm em loop numa tira. Separe por vírgula.',
    status:  '<b>Status do drop.</b> <b>Público</b> aparece normalmente na listagem. <b>Secreto</b> exige senha — o card fica com efeito neon e bloqueia acesso. <b>Arquivado</b> aparece em grayscale como coleção encerrada.',
    senha:   '<b>Senha de acesso.</b> Só necessária quando Status = Secreto. O backend salva o hash SHA-256, nunca a senha em texto claro. Ao editar, deixe em branco para manter a senha atual.',
    thumb:   '<b>Thumbnail do card.</b> Imagem 3:4 que aparece no card da listagem /drops. Se não definido, usa o banner principal como fallback.',
    desc:    '<b>Descrição editorial.</b> Texto curto (1–2 linhas) que aparece no card da coleção ao hover. Ex.: "Moletons brutais, jaquetas táticas e calças que encaram qualquer frio."'
};

function setupHelp () {
    let pop = document.getElementById('help-pop');
    if (!pop) { pop = document.createElement('div'); pop.id = 'help-pop'; pop.className = 'help-pop'; document.body.appendChild(pop); }
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.help');
        if (btn) {
            e.preventDefault(); e.stopPropagation();
            pop.innerHTML = HELP[btn.dataset.help] || '';
            pop.classList.add('open');
            const r = btn.getBoundingClientRect();
            const pw = Math.min(280, window.innerWidth - 24);
            const left = Math.min(r.left, window.innerWidth - pw - 12);
            pop.style.left = Math.max(12, left) + 'px';
            pop.style.top = (r.bottom + 8) + 'px';
        } else if (!e.target.closest('#help-pop')) {
            pop.classList.remove('open');
        }
    });
}

async function carregarProdutosPicker (selecionados) {
    const cont = document.getElementById('d-pecas');
    const sel = new Set((selecionados || []).map(Number));
    try {
        if (!_produtosCache) {
            const res = await fetch(`${API}/admin/produtos`, { headers: authHeaders() });
            _produtosCache = await res.json();
        }
        const ativos = (_produtosCache || []).filter(p => p.ativo);
        cont.innerHTML = ativos.length ? ativos.map(p => `
          <label>
            <input type="checkbox" value="${p.id}" ${sel.has(Number(p.id)) ? 'checked' : ''} />
            <img src="${imgUrl(p.imagem)}" alt="" onerror="this.style.opacity=.2"/>
            <span class="pp-nome">${escapeHtml(p.nome)}</span>
            <span class="pp-tipo">${p.tipo}</span>
          </label>`).join('') : '<p class="loading" style="padding:16px">Cadastre peças primeiro (aba Peças).</p>';
    } catch (e) { cont.innerHTML = '<p class="loading" style="padding:16px">Erro ao carregar as peças.</p>'; }
}

function dSet (id, v) { const el = document.getElementById(id); if (el) el.value = (v == null ? '' : v); }
function dChk (id, v) { const el = document.getElementById(id); if (el) el.checked = !!v; }
function dLinhas (id) { return document.getElementById(id).value.split('\n').map(l => l.trim()).filter(Boolean); }

async function abrirDropForm (id) {
    document.getElementById('drop-form').reset();
    setSlot(document.getElementById('d-bannerslot'), '');
    document.getElementById('d-accent').value = '#3A7D59';
    msg('drop-form-msg', '', '');
    const idInput = document.getElementById('d-id');

    // Reset status radio e campos novos
    const radioPublico = document.querySelector('[name="d-status"][value="publico"]');
    if (radioPublico) { radioPublico.checked = true; radioPublico.dispatchEvent(new Event('change')); }
    document.getElementById('d-senha').value = '';
    setSlot(document.getElementById('d-thumbslot'), '');

    if (!id) {
        document.getElementById('drop-modal-title').textContent = 'Novo drop';
        idInput.disabled = false;
        await carregarProdutosPicker([]);
    } else {
        document.getElementById('drop-modal-title').textContent = 'Editar drop';
        idInput.disabled = true;   // id = nome do arquivo, não muda
        try {
            const res = await fetch(CONFIG.API_STOREFRONT_URL + '/drops/' + encodeURIComponent(id), { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro');
            preencherDropForm(data.config || {});
            await carregarProdutosPicker(data.produto_ids || []);
        } catch (e) { msg('drop-form-msg', 'Erro ao carregar o drop.', 'err'); }
    }
    document.getElementById('drop-modal').classList.add('open');
}

function preencherDropForm (c) {
    dSet('d-id', c.id); dSet('d-nome', c.nome); dSet('d-dropnome', c.drop_nome);
    dSet('d-topbar', c.topbar); dChk('d-snow', c.snow);
    if (c.accent) document.getElementById('d-accent').value = c.accent;
    if (c.banner) setSlot(document.getElementById('d-bannerslot'), c.banner);
    dSet('d-marquee', Array.isArray(c.marquee) ? c.marquee.join(', ') : '');

    // Status radio
    const statusVal = c.arquivado ? 'arquivado' : (c.trancado ? 'secreto' : 'publico');
    const radioEl = document.querySelector(`[name="d-status"][value="${statusVal}"]`);
    if (radioEl) { radioEl.checked = true; radioEl.dispatchEvent(new Event('change')); }

    // Thumbnail e descrição
    if (c.thumb) setSlot(document.getElementById('d-thumbslot'), c.thumb);
    dSet('d-desc', c.desc);

    const h = c.hero || {};
    dSet('d-h-eyebrow', h.eyebrow); dSet('d-h-meta', h.meta_label);
    dSet('d-h-headline', Array.isArray(h.headline) ? h.headline.join('\n') : '');
    dSet('d-h-sub', h.sub); dSet('d-h-cta1', h.cta_primary); dSet('d-h-cta2', h.cta_secondary);
    const s = c.drop_section || {};
    dChk('d-s-hidden', s.hidden); dSet('d-s-label', s.label);
    dSet('d-s-titulo', Array.isArray(s.titulo) ? s.titulo.join('\n') : '');
    dSet('d-s-texto', s.texto); dSet('d-s-visual', s.visual_text);
    dSet('d-s-count', s.countdown ? String(s.countdown).slice(0, 16) : '');
    const p = c.drop_page || {};
    dSet('d-p-label', p.label); dSet('d-p-titulo', p.titulo); dSet('d-p-sub', p.subtitulo);
}

function coletarDropConfig () {
    const banner   = document.getElementById('d-bannerslot').dataset.caminho || '';
    const thumb    = document.getElementById('d-thumbslot').dataset.caminho  || '';
    const countRaw = document.getElementById('d-s-count').value;
    const statusVal = document.querySelector('[name="d-status"]:checked')?.value || 'publico';
    const trancado  = statusVal === 'secreto';
    const arquivado = statusVal === 'arquivado';
    const config = {
        id: document.getElementById('d-id').value.trim(),
        nome: document.getElementById('d-nome').value.trim(),
        drop_nome: document.getElementById('d-dropnome').value.trim() || null,
        trancado,
        arquivado,
        senha: trancado ? (document.getElementById('d-senha').value.trim()) : '',
        thumb,
        desc: document.getElementById('d-desc').value.trim(),
        accent: document.getElementById('d-accent').value,
        snow: document.getElementById('d-snow').checked,
        topbar: document.getElementById('d-topbar').value.trim(),
        marquee: document.getElementById('d-marquee').value.split(',').map(s => s.trim()).filter(Boolean),
        hero: {
            eyebrow: document.getElementById('d-h-eyebrow').value.trim(),
            meta_index: '',
            meta_label: document.getElementById('d-h-meta').value.trim(),
            headline: dLinhas('d-h-headline'),
            sub: document.getElementById('d-h-sub').value.trim(),
            banner: banner,
            cta_primary: document.getElementById('d-h-cta1').value.trim(),
            cta_secondary: document.getElementById('d-h-cta2').value.trim()
        },
        drop_section: {
            hidden: document.getElementById('d-s-hidden').checked,
            label: document.getElementById('d-s-label').value.trim(),
            titulo: dLinhas('d-s-titulo'),
            texto: document.getElementById('d-s-texto').value.trim(),
            visual_text: document.getElementById('d-s-visual').value.trim(),
            banner: banner,
            countdown: countRaw ? countRaw + ':00' : ''
        },
        drop_page: {
            label: document.getElementById('d-p-label').value.trim(),
            titulo: document.getElementById('d-p-titulo').value.trim(),
            subtitulo: document.getElementById('d-p-sub').value.trim(),
            banner: banner
        }
    };
    const produto_ids = [...document.querySelectorAll('#d-pecas input:checked')].map(i => parseInt(i.value, 10));
    return { config, produto_ids };
}

async function salvarDrop (e) {
    e.preventDefault();
    const btn = document.getElementById('submit-drop');
    btn.disabled = true; msg('drop-form-msg', 'Salvando…', '');
    try {
        const res = await fetch(CONFIG.API_STOREFRONT_URL + '/drops', {
            method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(coletarDropConfig())
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('drop-modal').classList.remove('open');
            await carregarDrops();
            await carregarEstado();   // a aba Estado passa a listar o novo drop
            msg('drops-msg', data.aviso || 'Drop salvo ✦', data.aviso ? 'err' : 'ok');
            setTimeout(() => msg('drops-msg', '', ''), 4000);
        } else { msg('drop-form-msg', data.error || 'Erro ao salvar.', 'err'); btn.disabled = false; }
    } catch (err) { msg('drop-form-msg', 'Erro de conexão ao salvar.', 'err'); btn.disabled = false; }
    finally { btn.disabled = false; }
}

async function excluirDrop (id, nome) {
    if (!confirm(`Excluir o drop "${nome}"? O arquivo ${id}.json será apagado.`)) return;
    try {
        const res = await fetch(CONFIG.API_STOREFRONT_URL + '/drops/' + encodeURIComponent(id), { method: 'DELETE', headers: authHeaders() });
        const data = await res.json();
        if (res.ok) { await carregarDrops(); await carregarEstado(); msg('drops-msg', 'Drop excluído.', 'ok'); setTimeout(() => msg('drops-msg', '', ''), 3000); }
        else msg('drops-msg', data.error || 'Erro ao excluir.', 'err');
    } catch (e) { msg('drops-msg', 'Erro de conexão.', 'err'); }
}

/* ══════════════════════════════════════
   ABA 4 — CUPONS  (Order Service, porta 5002)
══════════════════════════════════════ */
const ORDER_API = CONFIG.API_ORDER_URL;

async function carregarCupons () {
    const cont = document.getElementById('cupons-lista');
    try {
        const res = await fetch(`${ORDER_API}/cupons`, { headers: authHeaders() });
        if (res.status === 401 || res.status === 403)
            return cont.innerHTML = '<p class="loading">Sessão de admin expirada. Faça login de novo.</p>';
        const lista = await res.json();
        if (!Array.isArray(lista) || !lista.length)
            return cont.innerHTML = '<p class="loading">Nenhum cupom criado ainda.</p>';

        cont.innerHTML = `
          <table class="pecas"><thead><tr>
            <th>Código</th><th>Desconto</th><th class="hide-sm">Mínimo</th><th class="hide-sm">Usos</th><th>Status</th><th></th>
          </tr></thead><tbody>${lista.map(c => {
            const desc = c.tipo === 'percentual' ? `${Number(c.valor).toFixed(0)}% OFF` : money(c.valor);
            const usos = c.uso_maximo ? `${c.usos}/${c.uso_maximo}` : `${c.usos}`;
            const expirado = c.validade && new Date(c.validade) < new Date();
            const ativoOk = c.ativo && !expirado;
            return `
            <tr>
              <td style="font-family:'Bebas Neue',sans-serif;font-size:1.15rem;letter-spacing:1px">${escapeHtml(c.codigo)}</td>
              <td>${desc}</td>
              <td class="hide-sm">${Number(c.valor_minimo) > 0 ? money(c.valor_minimo) : '—'}</td>
              <td class="hide-sm">${usos}</td>
              <td><span class="pill ${ativoOk ? 'on' : 'off'}">${expirado ? 'Expirado' : (c.ativo ? 'Ativo' : 'Inativo')}</span></td>
              <td><div class="row-actions">
                <button class="mini" data-toggle="${c.id}" data-ativo="${c.ativo}">${c.ativo ? 'Desativar' : 'Ativar'}</button>
                <button class="mini del" data-del-cupom="${c.id}" data-cod="${escapeAttr(c.codigo)}">Excluir</button>
              </div></td>
            </tr>`;
          }).join('')}</tbody></table>`;

        cont.querySelectorAll('[data-toggle]').forEach(b =>
            b.addEventListener('click', () => toggleCupom(b.dataset.toggle, b.dataset.ativo !== '1')));
        cont.querySelectorAll('[data-del-cupom]').forEach(b =>
            b.addEventListener('click', () => excluirCupom(b.dataset.delCupom, b.dataset.cod)));
    } catch (e) {
        cont.innerHTML = '<p class="loading">Erro ao carregar (o Order Service na porta 5002 está rodando?).</p>';
    }
}

function setupCupomForm () {
    document.getElementById('cancel-cupom').addEventListener('click', () => document.getElementById('cupom-modal').classList.remove('open'));
    document.getElementById('cupom-modal').addEventListener('click', e => { if (e.target.id === 'cupom-modal') document.getElementById('cupom-modal').classList.remove('open'); });
    document.getElementById('cupom-form').addEventListener('submit', salvarCupom);
}

function abrirCupomForm () {
    document.getElementById('cupom-form').reset();
    msg('cupom-form-msg', '', '');
    document.getElementById('cupom-modal').classList.add('open');
    document.getElementById('c-codigo').focus();
}

async function salvarCupom (e) {
    e.preventDefault();
    const btn = document.getElementById('submit-cupom');
    btn.disabled = true; msg('cupom-form-msg', 'Salvando…', '');
    const payload = {
        codigo: document.getElementById('c-codigo').value.trim(),
        tipo: document.getElementById('c-tipo').value,
        valor: parseFloat(document.getElementById('c-valor').value),
        valor_minimo: document.getElementById('c-minimo').value || 0,
        validade: document.getElementById('c-validade').value || null,
        uso_maximo: document.getElementById('c-usomax').value || null
    };
    try {
        const res = await fetch(`${ORDER_API}/cupons`, {
            method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('cupom-modal').classList.remove('open');
            await carregarCupons();
            msg('cupons-msg', 'Cupom criado ✦', 'ok');
            setTimeout(() => msg('cupons-msg', '', ''), 3000);
        } else { msg('cupom-form-msg', data.error || 'Erro ao salvar.', 'err'); btn.disabled = false; }
    } catch (err) { msg('cupom-form-msg', 'Erro de conexão ao salvar.', 'err'); btn.disabled = false; }
    finally { btn.disabled = false; }
}

async function toggleCupom (id, ativar) {
    try {
        const res = await fetch(`${ORDER_API}/cupons/${id}`, {
            method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ ativo: ativar })
        });
        if (res.ok) { await carregarCupons(); msg('cupons-msg', ativar ? 'Cupom ativado.' : 'Cupom desativado.', 'ok'); setTimeout(() => msg('cupons-msg', '', ''), 2500); }
        else { const d = await res.json(); msg('cupons-msg', d.error || 'Erro.', 'err'); }
    } catch (e) { msg('cupons-msg', 'Erro de conexão.', 'err'); }
}

async function excluirCupom (id, codigo) {
    if (!confirm(`Excluir o cupom "${codigo}"? Essa ação não pode ser desfeita.`)) return;
    try {
        const res = await fetch(`${ORDER_API}/cupons/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (res.ok) { await carregarCupons(); msg('cupons-msg', 'Cupom excluído.', 'ok'); setTimeout(() => msg('cupons-msg', '', ''), 2500); }
        else { const d = await res.json(); msg('cupons-msg', d.error || 'Erro.', 'err'); }
    } catch (e) { msg('cupons-msg', 'Erro de conexão.', 'err'); }
}

/* ══════════════════════════════════════
   ABA 5 — CATEGORIAS (imagens da home)
══════════════════════════════════════ */
const CATS_META = [
    { key: 'moletons',   label: 'MOLETONS',   eyebrow: 'Mais Vendido' },
    { key: 'camisas',    label: 'CAMISAS',     eyebrow: 'Novo Drop' },
    { key: 'calcas',     label: 'CALÇAS',      eyebrow: 'Oversized' },
    { key: 'tenis',      label: 'TÊNIS',       eyebrow: 'Drops Limitados' },
    { key: 'acessorios', label: 'ACESSÓRIOS',  eyebrow: 'Completa o Look' },
];

async function carregarCategorias () {
    const cont = document.getElementById('cat-admin-grid');
    if (!cont) return;
    try {
        const res = await fetch(`${API}/categories`);
        const cats = res.ok ? await res.json() : {};
        cont.innerHTML = CATS_META.map(c => {
            const bg = cats[c.key] ? `background-image:url('${imgUrl(cats[c.key])}');` : '';
            return `
              <div class="cat-admin-card">
                <div class="cat-admin-preview" style="${bg}">
                  <div class="cat-admin-name">${c.label}</div>
                </div>
                <label class="cat-upload-label">
                  <div class="mini" style="cursor:pointer">📷 Trocar imagem</div>
                  <input type="file" accept="image/*" hidden data-tipo="${c.key}" />
                </label>
              </div>`;
        }).join('');
        cont.querySelectorAll('input[type=file]').forEach(input => {
            input.addEventListener('change', () => {
                if (input.files[0]) uploadCategoriaImagem(input.dataset.tipo, input.files[0]);
            });
        });
    } catch (e) {
        if (cont) cont.innerHTML = '<p class="loading">Erro ao carregar categorias.</p>';
    }
}

async function uploadCategoriaImagem (tipo, file) {
    msg('categorias-msg', 'Enviando imagem…', '');
    const fd = new FormData();
    fd.append('file', file);
    try {
        const upRes  = await fetch(`${API}/admin/upload`, { method: 'POST', headers: authHeaders(), body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error || 'Falha no upload');

        const putRes  = await fetch(`${API}/admin/categories/${tipo}`, {
            method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ caminho: upData.caminho })
        });
        const putData = await putRes.json();
        if (!putRes.ok) throw new Error(putData.error || 'Falha ao salvar');

        msg('categorias-msg', 'Imagem de "' + tipo + '" atualizada ✦', 'ok');
        setTimeout(() => msg('categorias-msg', '', ''), 3500);
        await carregarCategorias();
    } catch (e) {
        msg('categorias-msg', e.message || 'Erro desconhecido.', 'err');
    }
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
