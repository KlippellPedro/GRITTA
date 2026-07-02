document.addEventListener('DOMContentLoaded', async () => {
    if (typeof buildMarquee === 'function') buildMarquee('marquee-inner');

    const vitrine   = document.getElementById('vitrine-drop');
    const tituloEl  = document.getElementById('titulo-drop');
    const labelEl   = document.getElementById('drop-label');
    const subEl     = document.getElementById('drop-subtitulo');

    const params = new URLSearchParams(window.location.search);
    // Aceita ?slug=winter-is-coming (novo) ou fallback legado ?drop=X&nome=Y
    const slug = params.get('slug') || 'winter-is-coming';

    const BASE = CONFIG.API_CATALOG_URL.replace('/products', '');

    // ── 1. Carrega info do drop via slug ──────────────────────────────────
    let dropInfo = null;
    try {
        const res = await fetch(`${BASE}/drops/${encodeURIComponent(slug)}/info`);
        if (res.ok) dropInfo = await res.json();
    } catch (_) {}

    if (!dropInfo) {
        tituloEl.textContent = 'DROP NÃO ENCONTRADO';
        vitrine.innerHTML    = '<p class="empty-msg">Esse drop não existe ou foi removido.</p>';
        return;
    }

    // ── 2. Atualiza título e meta da página ───────────────────────────────
    const nomeDisplay = dropInfo.nome || slug.replace(/-/g, ' ').toUpperCase();
    document.title    = `GR!TTA | ${nomeDisplay}`;
    tituloEl.textContent = nomeDisplay.toUpperCase();
    if (labelEl) labelEl.textContent = `✦ ${nomeDisplay}`;
    if (subEl && dropInfo.desc) subEl.textContent = dropInfo.desc;

    // ── 3. Gate: verifica se o drop está trancado ─────────────────────────
    if (dropInfo.trancado) {
        const chaveSessao = `gritta_unlock_${slug}`;
        if (!sessionStorage.getItem(chaveSessao)) {
            const back = encodeURIComponent(location.href);
            window.location.replace(`drop-senha.html?drop=${encodeURIComponent(slug)}&back=${back}`);
            return;
        }
    }

    // ── 4. Busca produtos do drop ─────────────────────────────────────────
    const dropNome = dropInfo.drop_nome;
    if (!dropNome) {
        // sem drop_nome associado, exibe todos (modo "loja normal")
        vitrine.innerHTML = '<p class="empty-msg">Nenhum produto associado a este drop.</p>';
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_CATALOG_URL}?drop=${encodeURIComponent(dropNome)}`);
        const produtos  = await response.json();

        if (!produtos.length) {
            vitrine.innerHTML = '<p class="empty-msg">Nenhum item encontrado neste drop.</p>';
            return;
        }

        renderizarProdutos(produtos, vitrine);
    } catch (error) {
        console.error('Erro ao carregar drop:', error);
        vitrine.innerHTML = '<p class="empty-msg">Erro ao carregar os lançamentos.</p>';
    }
});

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderizarProdutos(lista, container) {
    container.innerHTML = lista.map(p => {
        const imagemUrl  = window.resolveStaticPath(p.imagem);
        const imagem2Url = p.imagem_2 ? window.resolveStaticPath(p.imagem_2) : null;
        const nomeSafe   = escapeHtml(p.nome);
        const href       = `../usuario/produto.html?slug=${encodeURIComponent(p.slug || p.id)}`;
        const classes    = ['produto-card', imagem2Url ? 'has-2nd' : '', p.is_special ? 'is-special' : ''].filter(Boolean).join(' ');

        let ultimasPecasHTML = '';
        if (p.total_estoque > 0 && p.total_estoque < 5) {
            ultimasPecasHTML = '<div class="badge-ultimas-pecas">ÚLTIMAS PEÇAS</div>';
        }

        return `
        <div class="${classes}" role="button" tabindex="0" aria-label="${nomeSafe}" data-href="${escapeHtml(href)}">
            <div class="produto-imagem">
                ${ultimasPecasHTML}
                <img class="img-primary" src="${imagemUrl}" alt="${nomeSafe}">
                ${imagem2Url ? `<img class="img-secondary" src="${imagem2Url}" alt="" loading="lazy">` : ''}
            </div>
            <div class="produto-info">
                <h4>${nomeSafe}</h4>
                <p class="preco">${Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <button class="add-carrinho" tabindex="-1">VER PEÇA</button>
            </div>
        </div>`;
    }).join('');

    // Acessibilidade: click e keydown nos cards — WCAG 2.1.1
    container.querySelectorAll('.produto-card[data-href]').forEach(card => {
        const navigate = () => {
            const dest = card.dataset.href;
            window.grittaGo ? window.grittaGo(dest) : (window.location.href = dest);
        };
        card.addEventListener('click', navigate);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
        });
    });
}
