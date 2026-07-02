document.addEventListener('DOMContentLoaded', async () => {
    if (typeof buildMarquee === 'function') buildMarquee('marquee-inner');

    const grid = document.getElementById('drops-grid');
    const BASE  = CONFIG.API_CATALOG_URL.replace('/products', '');

    try {
        const lista = await fetch(`${BASE}/drops`).then(r => r.json());

        if (!lista || !lista.length) {
            grid.innerHTML = '<p class="drops-empty">NENHUMA COLEÇÃO DISPONÍVEL NO MOMENTO.</p>';
            return;
        }

        grid.innerHTML = lista.map(drop => renderCard(drop)).join('');

        // Click handlers
        grid.querySelectorAll('.drop-card').forEach(card => {
            const id        = card.dataset.id;
            const trancado  = card.dataset.trancado === 'true';
            const arquivado = card.dataset.arquivado === 'true';

            card.addEventListener('click', () => {
                const destino = `drop.html?slug=${encodeURIComponent(id)}`;

                if (arquivado) {
                    // Arquivado ainda abre a página (só visual "morto")
                    window.grittaGo ? window.grittaGo(destino) : (window.location.href = destino);
                    return;
                }

                if (trancado) {
                    const back = encodeURIComponent(window.location.origin + window.location.pathname.replace('drops.html', '') + destino);
                    const url  = `drop-senha.html?drop=${encodeURIComponent(id)}&back=${back}`;
                    window.grittaGo ? window.grittaGo(url) : (window.location.href = url);
                    return;
                }

                window.grittaGo ? window.grittaGo(destino) : (window.location.href = destino);
            });

            // Acessibilidade: ativa via teclado (Enter / Espaço) — WCAG 2.1.1
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
            });
        });

    } catch (err) {
        console.error('Erro ao carregar drops:', err);
        grid.innerHTML = '<p class="drops-empty">ERRO AO CARREGAR AS COLEÇÕES.</p>';
    }
});

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderCard(drop) {
    const nome      = escapeHtml(drop.nome);
    const desc      = escapeHtml(drop.desc || '');
    const imgSrc    = drop.thumb ? window.resolveStaticPath(drop.thumb) : '../statics/img/placeholder.png';
    const trancado  = !!drop.trancado;
    const arquivado = !!drop.arquivado;

    // ── Secreto (trancado + não arquivado)
    if (trancado && !arquivado) {
        return `
        <div class="drop-card secreto" data-id="${escapeHtml(drop.id)}" data-trancado="true" data-arquivado="false" role="button" tabindex="0" aria-label="Drop secreto: ${nome}">
          <img class="drop-card-bg" src="${imgSrc}" alt="" loading="lazy" aria-hidden="true" />
          <span class="dc-tag restrito">[ RESTRITO ]</span>
          <div class="drop-card-secreto-overlay">
            <span class="secreto-lock" aria-hidden="true">🔒</span>
            <span class="secreto-nome">${nome}</span>
            <div class="secreto-status-idle">
              [ STATUS: RESTRICTED ]<br>[ REQUER CHAVE DE ACESSO ]
            </div>
            <div class="secreto-status-hover">
              CLIQUE PARA INSERIR A SENHA
            </div>
          </div>
        </div>`;
    }

    // ── Arquivado
    if (arquivado) {
        return `
        <div class="drop-card arquivado" data-id="${escapeHtml(drop.id)}" data-trancado="false" data-arquivado="true" role="button" tabindex="0" aria-label="Coleção encerrada: ${nome}">
          <img class="drop-card-bg" src="${imgSrc}" alt="${nome}" loading="lazy" />
          <div class="drop-card-overlay"></div>
          <span class="dc-tag encerrado">ENCERRADO</span>
          <div class="drop-card-info">
            <span class="dc-nome">${nome}</span>
            ${desc ? `<span class="dc-desc">${desc}</span>` : ''}
            <span class="dc-cta-arquivo">[ COLEÇÃO ENCERRADA ]</span>
          </div>
        </div>`;
    }

    // ── Público e ativo
    return `
        <div class="drop-card" data-id="${escapeHtml(drop.id)}" data-trancado="false" data-arquivado="false" role="button" tabindex="0" aria-label="Acessar drop: ${nome}">
          <img class="drop-card-bg" src="${imgSrc}" alt="${nome}" loading="lazy" />
          <div class="drop-card-overlay"></div>
          ${drop.ativo ? '<span class="dc-tag ativo">ATIVO</span>' : ''}
          <div class="drop-card-info">
            <span class="dc-eyebrow">Coleção</span>
            <span class="dc-nome">${nome}</span>
            ${desc ? `<span class="dc-desc">${desc}</span>` : ''}
            <span class="dc-cta">[ ACESSAR DROP ] →</span>
          </div>
        </div>`;
}
