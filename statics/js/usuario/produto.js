const API_CATALOG_URL = CONFIG.API_CATALOG_URL;
const API_ORDER_URL = `${CONFIG.API_ORDER_URL}/carrinho`;

let variacaoSelecionada = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = '../index.html';
        return;
    }

    await carregarDadosProduto(slug);
});

window.changeQty = function (delta) {
    const qtySpan = document.getElementById('qty-value');
    let current = parseInt(qtySpan.textContent);
    qtySpan.textContent = Math.max(1, current + delta);
};

async function carregarDadosProduto(slug) {
    try {
        // Aqui usamos o slug para buscar os detalhes no Catalog Service
        const response = await fetch(`${API_CATALOG_URL}/${slug}`);
        if (!response.ok) throw new Error("Produto não encontrado");

        const produto = await response.json();
        renderizarPagina(produto);
        carregarRelacionados(produto.id); // Chamada necessária para carregar os itens em baixo
    } catch (error) {
        document.getElementById('loading-product').textContent = "Erro ao carregar produto.";
    }
}

function renderizarPagina(produto) {
    document.getElementById('loading-product').style.display = 'none';
    document.getElementById('product-content').style.display = 'grid';

    // Calcula o estoque total para a etiqueta de "ÚLTIMAS PEÇAS"
    let totalEstoqueProduto = 0;
    if (produto.variacoes) {
        produto.variacoes.split(',').forEach(v => {
            const [, , estoque] = v.split(':');
            totalEstoqueProduto += parseInt(estoque || 0);
        });
    }

    document.getElementById('product-name').textContent = produto.nome;
    document.getElementById('product-price').textContent = Number(produto.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('product-desc').textContent = produto.descricao;

    document.getElementById('main-product-img').src = window.resolveStaticPath(produto.imagem);

    const productBadgesContainer = document.getElementById('product-badges');
    productBadgesContainer.innerHTML = ''; // Limpa badges anteriores

    const variacoesCont = document.getElementById('variacoes-container');
    if (produto.variacoes) {
        const lista = produto.variacoes.split(',');
        variacoesCont.innerHTML = '<div class="variation-grid"></div>';
        const grid = variacoesCont.querySelector('.variation-grid');

        lista.forEach(v => {
            const [id, tam, estoque] = v.split(':');
            const qtdEstoque = parseInt(estoque || 0);

            const btn = document.createElement('button');
            btn.className = 'variation-chip';
            if (qtdEstoque <= 0) {
                btn.classList.add('out-of-stock');
                btn.title = "Tamanho esgotado";
            } else {
                btn.onclick = () => selecionarVariacao(btn, id);
            }
            btn.innerHTML = `<span>${tam}</span>`;
            grid.appendChild(btn);
        });

        // Adiciona a etiqueta de "ÚLTIMAS PEÇAS" se o estoque total for baixo
        if (totalEstoqueProduto > 0 && totalEstoqueProduto < 5) {
            const ultimasPecasBadge = document.createElement('span');
            ultimasPecasBadge.className = 'badge-ultimas-pecas-detail';
            ultimasPecasBadge.textContent = 'ÚLTIMAS PEÇAS';
            productBadgesContainer.appendChild(ultimasPecasBadge);
        }
    } else {
        variacoesCont.innerHTML = '<p class="esgotado">INDISPONÍVEL NO MOMENTO</p>';
        const btn = document.getElementById('btn-add-cart');
        btn.disabled = true;
        btn.textContent = "ESGOTADO";
    }

    document.getElementById('btn-add-cart').onclick = () => adicionarAoCarrinho(produto);
}
async function carregarRelacionados(excludeId) {
    try {
        // Usando o novo endpoint especializado do Catalog Service
        const res = await fetch(`${API_CATALOG_URL}/${excludeId}/related?limit=4`);
        const relacionados = await res.json();

        const grid = document.getElementById('related-products-grid');

        grid.innerHTML = relacionados.map(p => {
            const imgUrl = window.resolveStaticPath(p.imagem);

            return `
                <div class="related-card" onclick="window.location.href='produto.html?slug=${p.slug || p.id}'">
                    <div class="related-image-wrapper">
                        <img src="${imgUrl}" alt="${p.nome}">
                    </div>
                    <div class="related-info">
                        <h4>${p.nome}</h4>
                        <p class="related-price">${Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Erro ao carregar relacionados:", e);
    }
}

window.selecionarVariacao = function (elemento, id) {
    // Remove ativo de todos
    document.querySelectorAll('.variation-chip').forEach(btn => btn.classList.remove('active'));
    // Adiciona no clicado
    elemento.classList.add('active');
    variacaoSelecionada = id;
};

async function adicionarAoCarrinho(produto) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast("Faça login para comprar.", "error");
        window.location.href = 'login.html';
        return;
    }

    const quantidade = parseInt(document.getElementById('qty-value').textContent);

    if (!variacaoSelecionada) {
        showToast("POR FAVOR, SELECIONE UM TAMANHO.", "error");

        // Feedback visual extra: faz o grid de tamanhos tremer
        const grid = document.querySelector('.variation-grid');
        grid.classList.add('error-shake');
        setTimeout(() => grid.classList.remove('error-shake'), 400);

        return;
    }

    try {
        const res = await fetch(`${API_ORDER_URL}/adicionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ variacao_id: variacaoSelecionada, quantidade })
        });

        if (res.status === 401) {
            showToast("Sessão expirada. Redirecionando para login...", "error");
            setTimeout(() => window.logoutUser(), 1500);
            return;
        }

        if (res.ok) {
            // Feedback visual Premium: Muda o botão temporariamente
            const btn = document.getElementById('btn-add-cart');
            const originalText = btn.textContent;
            btn.textContent = "ADICIONADO!";
            btn.style.backgroundColor = "#27ae60";

            if (window.atualizarContadorCarrinho) window.atualizarContadorCarrinho(quantidade, true);

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = "#000";
            }, 2000);
        }
    } catch (error) {
        console.error("Erro ao adicionar:", error);
    }
}
