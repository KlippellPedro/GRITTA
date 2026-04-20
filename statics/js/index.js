/**
 * GR!TTA - Home Logic (is_special integration)
 */
const API_CATALOG_URL = `${CONFIG.API_CATALOG_URL}?special=true`;
const API_ORDER_URL = CONFIG.API_ORDER_URL;
const API_FAVORITOS_URL = CONFIG.API_FAVORITOS_URL;

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosVitrine();
});

// Garante que os dados (especialmente favoritos) sejam atualizados ao usar o botão "Voltar" do navegador
window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        carregarProdutosVitrine();
    }
});

async function carregarProdutosVitrine() {
    const vitrineContainer = document.querySelector('.vitrine');

    if (!vitrineContainer) return;

    try {
        const token = localStorage.getItem('auth_token');

        // Inicializamos as variáveis de retorno
        let produtos = [];
        let favoritos = [];
        let carrinhoData = null;

        // Lista de promessas com tratamento de erro individual para não quebrar a página
        const promises = [
            fetch(API_CATALOG_URL, { cache: 'no-store' }).then(res => {
                if (!res.ok) console.warn("Catalog Service respondeu com erro:", res.status);
                return res.ok ? res.json() : [];
            }).catch(err => {
                console.error("Falha crítica ao conectar no Catalog Service (5003). Verifique se o Python está rodando.");
                return [];
            })
        ];

        // Se logado, adicionamos as promessas de serviços de usuário
        if (token) {
            promises.push(fetch(API_FAVORITOS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : []).catch(() => []));

            promises.push(fetch(`${API_ORDER_URL}/carrinho`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : null).catch(() => null));
        }

        const resultados = await Promise.all(promises);
        produtos = resultados[0];

        if (token && resultados.length >= 3) {
            favoritos = resultados[1] || [];
            carrinhoData = resultados[2] || null;
        }

        let favMap = {}; // Mapeia produto_id -> favorito_id (PK da tabela favoritos)
        let cartTotalItens = 0;

        if (favoritos && favoritos.length > 0) {
            favoritos.forEach(fav => { favMap[fav.produto_id] = fav.id; });
            atualizarContadorFavoritos(favoritos.length);
        }

        if (carrinhoData) {
            cartTotalItens = carrinhoData.total_itens || 0;
            atualizarContadorCarrinho(cartTotalItens);
        }

        console.log("Produtos carregados:", produtos);
        if (produtos.length === 0) {
            vitrineContainer.innerHTML = "<p style='color: #888; text-align: center; width: 100%;'>Nenhum produto encontrado no banco de dados.</p>";
            return;
        }

        renderizarProdutos(produtos, vitrineContainer, favMap);
    } catch (error) {
        console.error("Erro no Catalog Service:", error);
        vitrineContainer.innerHTML = "<p style='color: #666; text-align: center; width: 100%;'>Não foi possível carregar os produtos no momento.</p>";
    }
}

function renderizarProdutos(lista, container, favMap = {}) {
    container.innerHTML = ""; // Limpa a vitrine

    if (lista.length === 0) {
        container.innerHTML = "<p style='color: white;'>Nenhum produto disponível.</p>";
        return;
    }

    lista.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'produto-card';

        // Log de depuração para verificar o estoque vindo do banco
        console.log(`Produto: ${produto.nome} | Variações:`, produto.variacoes);

        // Removemos ou comentamos a trava de esgotado automática enquanto o service não retorna variações
        // if (!produto.variacoes) card.classList.add('esgotado');

        const imagemUrl = window.resolveStaticPath(produto.imagem);

        // Verifica se o produto atual está na lista de favoritos
        const favId = favMap[produto.id];
        const isFavorito = !!favId;
        const favClass = isFavorito ? 'active' : '';

        // Lógica para badge de "ÚLTIMAS PEÇAS"
        let ultimasPecasHTML = '';
        if (produto.total_estoque > 0 && produto.total_estoque < 5) {
            ultimasPecasHTML = '<div class="badge-ultimas-pecas">ÚLTIMAS PEÇAS</div>';
        }
        // O badge de esgotado está desativado no momento, mas manter a variável
        const esgotadoHTML = '';

        card.innerHTML = `
            <div class="produto-imagem" onclick="window.location.href='usuario/produto.html?slug=${produto.slug || produto.id}'">
                ${ultimasPecasHTML}
                ${esgotadoHTML}
                <button class="btn-favoritar-vitrine ${favClass}" 
                        data-fav-id="${favId || ''}" 
                        onclick="favoritarProduto(this, ${produto.id}); event.stopPropagation();" title="Favoritar">
                    <img src="../statics/img/icons/coracao.png" alt="Favoritar" class="heart-icon">
                </button>
                <img src="${imagemUrl}" alt="${produto.nome}" loading="lazy">
            </div>
            <div class="produto-info" onclick="window.location.href='usuario/produto.html?slug=${produto.slug || produto.id}'">
                <h4>${produto.nome}</h4>
                <p class="preco">${Number(produto.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// Função para favoritar o produto através do User Service
window.favoritarProduto = async function (btn, id) {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        showToast("VOCÊ PRECISA ESTAR LOGADO PARA FAVORITAR PRODUTOS.", "error");
        window.location.href = "usuario/login.html";
        return;
    }

    const isFavorito = btn.classList.contains('active');
    const favId = btn.dataset.favId;

    try {
        if (isFavorito && favId) {
            // Lógica para REMOVER
            const response = await fetch(`${API_FAVORITOS_URL}/${favId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                btn.classList.remove('active');
                btn.dataset.favId = "";
                atualizarContadorFavoritos(-1, true);
            } else {
                const data = await response.json();
                showToast(data.error || "Erro ao remover dos favoritos.", "error");
            }
        } else {
            // Lógica para ADICIONAR
            const response = await fetch(API_FAVORITOS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ produto_id: id })
            });

            const data = await response.json();
            if (response.ok) {
                btn.classList.add('active');
                // Sincroniza o ID retornado para permitir a remoção imediata sem reload
                btn.dataset.favId = data.id || data.favorito_id;
                atualizarContadorFavoritos(1, true);
            } else {
                showToast(data.error || "Erro ao favoritar produto.", "error");
            }
        }
    } catch (error) {
        console.error("Erro ao favoritar:", error);
    }
}