let produtosOriginais = [];
let filtroTamanho = 'all';
let filtroEstoque = 'all';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof buildMarquee === 'function') buildMarquee('marquee-inner');

    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');

    if (!tipo) {
        window.location.href = '../index.html';
        return;
    }

    const tituloMap = {
        'camisas':    'CAMISAS',
        'camisetas':  'CAMISETAS',
        'moletons':   'MOLETONS',
        'calcas':     'CALÇAS',
        'tenis':      'TÊNIS',
        'acessorios': 'ACESSÓRIOS'
    };
    const labelMap = {
        'camisas':    '✦ Streetwear',
        'camisetas':  '✦ Streetwear',
        'moletons':   '✦ Inverno 2026',
        'calcas':     '✦ Oversized',
        'tenis':      '✦ Drops Limitados',
        'acessorios': '✦ Complete o Look'
    };

    document.title = `GR!TTA | ${tituloMap[tipo] || 'Loja'}`;
    const tituloEl = document.getElementById('titulo-categoria');
    const labelEl  = document.getElementById('label-categoria');
    if (tituloEl) tituloEl.textContent = tituloMap[tipo] || 'PRODUTOS';
    if (labelEl)  labelEl.textContent  = labelMap[tipo]  || '✦ Coleção';

    carregarProdutosDaCategoria(tipo);
    configurarListeners();
});

function configurarListeners() {
    const sidebar = document.getElementById('filter-sidebar');
    const overlay = document.getElementById('filter-overlay');
    const btnOpen = document.getElementById('btn-open-filters');
    const btnClose = document.getElementById('btn-close-filters');
    const btnApply = document.getElementById('btn-apply-filters');

    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    };

    if (btnOpen) btnOpen.addEventListener('click', toggleSidebar);
    if (btnClose) btnClose.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    // O filtro só é aplicado aqui
    if (btnApply) {
        btnApply.addEventListener('click', () => {
            aplicarFiltros();
            toggleSidebar();
        });
    }

    // Filtro de Estoque (Chips)
    document.querySelectorAll('#stock-filters .size-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#stock-filters .size-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filtroEstoque = chip.dataset.stock;
        });
    });

    // Filtro de Tamanho (Chips)
    document.querySelectorAll('#size-filters .size-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#size-filters .size-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filtroTamanho = chip.dataset.size;
        });
    });
}

function aplicarFiltros() {
    const vitrine = document.getElementById('vitrine-categoria');

    const precoMin = parseFloat(document.getElementById('preco-min')?.value);
    const precoMax = parseFloat(document.getElementById('preco-max')?.value);
    const min = isNaN(precoMin) ? 0 : precoMin;
    const max = isNaN(precoMax) ? Infinity : precoMax;
    const ordem = document.getElementById('ordenar-por')?.value || '';

    let produtosFiltrados = produtosOriginais.filter(p => {
        // Lógica de Estoque
        const temEstoque = parseInt(p.total_estoque || 0) > 0;
        const passaEstoque = filtroEstoque === 'all' ||
            (filtroEstoque === 'in-stock' && temEstoque) ||
            (filtroEstoque === 'out-of-stock' && !temEstoque);

        // Lógica de Tamanho
        const tamanhos = p.tamanhos_disponiveis ? p.tamanhos_disponiveis.split(',') : [];
        const passaTamanho = filtroTamanho === 'all' || tamanhos.includes(filtroTamanho);

        // Lógica de Preço
        const preco = Number(p.preco_base) || 0;
        const passaPreco = preco >= min && preco <= max;

        return passaEstoque && passaTamanho && passaPreco;
    });

    // Ordenação
    if (ordem === 'preco_asc') produtosFiltrados.sort((a, b) => a.preco_base - b.preco_base);
    else if (ordem === 'preco_desc') produtosFiltrados.sort((a, b) => b.preco_base - a.preco_base);
    else if (ordem === 'nome') produtosFiltrados.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));

    if (produtosFiltrados.length === 0) {
        vitrine.innerHTML = '<p class="empty-msg">NENHUM PRODUTO CORRESPONDE AOS FILTROS SELECIONADOS.</p>';
    } else {
        renderizarProdutos(produtosFiltrados, vitrine);
    }
}

async function carregarProdutosDaCategoria(tipo) {
    const vitrine = document.getElementById('vitrine-categoria');

    try {
        const response = await fetch(`${CONFIG.API_CATALOG_URL}?tipo=${tipo}`);
        produtosOriginais = await response.json();

        if (produtosOriginais.length === 0) {
            vitrine.innerHTML = `<p class="empty-msg">NENHUM PRODUTO ENCONTRADO EM ${tipo.toUpperCase()}.</p>`;
            return;
        }

        renderizarProdutos(produtosOriginais, vitrine);
    } catch (error) {
        console.error("Erro ao carregar categoria:", error);
        vitrine.innerHTML = '<p class="empty-msg">ERRO AO CARREGAR PRODUTOS.</p>';
    }
}

function escapeHtml (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderizarProdutos(lista, container) {
    container.innerHTML = lista.map(p => {
        const imagemUrl = window.resolveStaticPath(p.imagem);
        const nomeSafe  = escapeHtml(p.nome);
        return `
            <div class="produto-card" onclick="window.grittaGo ? window.grittaGo('../usuario/produto.html?slug=${p.slug || p.id}') : window.location.href='../usuario/produto.html?slug=${p.slug || p.id}'">
                <div class="produto-imagem">
                    <img src="${imagemUrl}" alt="${nomeSafe}">
                </div>
                <div class="produto-info">
                    <h4>${nomeSafe}</h4>
                    <p class="preco">${Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <button class="add-carrinho">VER PEÇA</button>
                </div>
            </div>
        `;
    }).join('');
}
