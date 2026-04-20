let produtosOriginais = [];
let filtroTamanho = 'all';
let filtroEstoque = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');

    if (!tipo) {
        window.location.href = '../index.html';
        return;
    }

    // Atualiza o título da página
    const tituloMap = {
        'camisetas': 'CAMISETAS',
        'moletons': 'MOLETONS',
        'calcas': 'CALÇAS',
        'tenis': 'TÊNIS',
        'acessorios': 'ACESSÓRIOS'
    };

    document.title = `GR!TTA | ${tituloMap[tipo] || 'Loja'}`;
    document.getElementById('titulo-categoria').textContent = tituloMap[tipo] || 'PRODUTOS';

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

    let produtosFiltrados = produtosOriginais.filter(p => {
        // Lógica de Estoque
        const temEstoque = parseInt(p.total_estoque || 0) > 0;
        const passaEstoque = filtroEstoque === 'all' ||
            (filtroEstoque === 'in-stock' && temEstoque) ||
            (filtroEstoque === 'out-of-stock' && !temEstoque);

        // Lógica de Tamanho
        const tamanhos = p.tamanhos_disponiveis ? p.tamanhos_disponiveis.split(',') : [];
        const passaTamanho = filtroTamanho === 'all' || tamanhos.includes(filtroTamanho);

        return passaEstoque && passaTamanho;
    });

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

function renderizarProdutos(lista, container) {
    container.innerHTML = lista.map(p => {
        const imagemUrl = window.resolveStaticPath(p.imagem);
        return `
            <div class="produto-card" onclick="window.location.href='../usuario/produto.html?slug=${p.slug || p.id}'">
                <div class="produto-imagem">
                    <img src="${imagemUrl}" alt="${p.nome}">
                </div>
                <div class="produto-info">
                    <h4>${p.nome}</h4>
                    <p class="preco">${Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <button class="add-carrinho">VER PEÇA</button>
                </div>
            </div>
        `;
    }).join('');
}
