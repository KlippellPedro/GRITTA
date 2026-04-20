const API_FAV_URL = CONFIG.API_FAVORITOS_URL;
const API_ORDER_URL = CONFIG.API_ORDER_URL;
const containerFavoritos = document.querySelector('.vitrine');
const contadorFav = document.getElementById('fav-qty');

async function carregarFavoritos() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(API_FAV_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const favoritos = await response.json(); // Assume que o backend retorna um array diretamente

        renderizarFavoritos(favoritos);
        if (contadorFav) contadorFav.textContent = favoritos.length;
    } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        // Opcional: Mostrar uma mensagem de erro na UI
    }
}

function renderizarFavoritos(itens) {
    if (itens.length === 0) {
        document.querySelector('.favoritos-vazio').style.display = 'block';
        containerFavoritos.style.display = 'none';
        return;
    }

    containerFavoritos.innerHTML = itens.map(item => {
        const imagemUrl = window.resolveStaticPath(item.imagem);

        // Lógica para badge de "ÚLTIMAS PEÇAS"
        let ultimasPecasHTML = '';
        if (item.total_estoque > 0 && item.total_estoque < 5) {
            ultimasPecasHTML = '<div class="badge-ultimas-pecas">ÚLTIMAS PEÇAS</div>';
        }

        return `
        <div class="produto-card">
            <div class="produto-imagem">
                ${ultimasPecasHTML}
                <button class="btn-favoritar-vitrine active" onclick="removerFavorito(this, ${item.id})" title="Remover dos favoritos">
                    <img src="../../statics/img/icons/coracao.png" alt="Favoritos" class="heart-icon">
                </button>
                <img src="${imagemUrl}" alt="${item.nome}">
            </div>
            <div class="produto-info">
                <h4>${item.nome}</h4>
                <p class="preco">${Number(item.preco_base || item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <button class="add-carrinho" onclick="window.location.href='produto.html?slug=${item.slug || item.id}'">VER DETALHES</button>
            </div>
        </div>
    `}).join('');
}

// Função para adicionar um item ao carrinho (chama o order_service)
window.adicionarAoCarrinho = async function (produto_id, nome, preco, imagem) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_ORDER_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                variacao_id: produto_id,
                quantidade: 1
            })
        });
        const data = await response.json();
        if (data.success) {
            if (window.atualizarContadorCarrinho) window.atualizarContadorCarrinho(1, true);
        }
    } catch (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
    }
};

window.removerFavorito = async function (btn, id) {
    try {
        btn.classList.remove('active'); // Remove o vermelho imediatamente para feedback visual
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_FAV_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Aguarda um pequeno delay para o usuário ver a cor saindo antes de remover o card
        carregarFavoritos();
    } catch (error) {
        console.error("Erro ao remover favorito:", error);
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', carregarFavoritos);