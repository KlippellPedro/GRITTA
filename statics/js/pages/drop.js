document.addEventListener('DOMContentLoaded', async () => {
    const vitrine = document.getElementById('vitrine-drop');
    const titulo = document.getElementById('titulo-drop');

    // Você pode pegar o nome do drop da URL ou mostrar o mais recente por padrão
    const params = new URLSearchParams(window.location.search);
    const dropAlvo = params.get('nome') || 'Coleção de Inverno'; // Valor padrão

    titulo.textContent = dropAlvo.toUpperCase();

    try {
        // Exemplo de chamada filtrando pela nova coluna
        const response = await fetch(`${CONFIG.API_CATALOG_URL}?drop=${encodeURIComponent(dropAlvo)}`);
        const produtos = await response.json();

        if (produtos.length === 0) {
            vitrine.innerHTML = '<p class="empty-msg">Nenhum item encontrado neste drop.</p>';
            return;
        }

        renderizarProdutos(produtos, vitrine);
    } catch (error) {
        console.error("Erro ao carregar drop:", error);
        vitrine.innerHTML = '<p class="empty-msg">Erro ao carregar os lançamentos.</p>';
    }
});

function renderizarProdutos(lista, container) {
    container.innerHTML = lista.map(p => {
        const imagemUrl = window.resolveStaticPath(p.imagem);

        // Lógica para badge de "ÚLTIMAS PEÇAS"
        let ultimasPecasHTML = '';
        if (p.total_estoque > 0 && p.total_estoque < 5) {
            ultimasPecasHTML = '<div class="badge-ultimas-pecas">ÚLTIMAS PEÇAS</div>';
        }

        return `
        <div class="produto-card" onclick="window.location.href='../usuario/produto.html?slug=${p.slug || p.id}'">
            <div class="produto-imagem">
                ${ultimasPecasHTML}
                <img src="${imagemUrl}" alt="${p.nome}">
            </div>
            <div class="produto-info">
                <h4>${p.nome}</h4>
                <p class="preco">${Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <button class="add-carrinho">VER PEÇA</button>
            </div>
        </div>
    `}).join('');
}