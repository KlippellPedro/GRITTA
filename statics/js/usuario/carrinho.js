const API_ORDER_URL = CONFIG.API_ORDER_URL;

document.addEventListener('DOMContentLoaded', carregarCarrinho);

async function carregarCarrinho() {
    const token = localStorage.getItem('auth_token');
    const container = document.getElementById('lista-itens');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_ORDER_URL}/carrinho`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.status === 401) {
            if (window.showToast) window.showToast("Sua sessão expirou. Faça login novamente.", "error");
            setTimeout(() => window.logoutUser(), 1500);
            return;
        }

        console.log("LOG CARRINHO:", data); // Verifique este log no console (F12)

        if (response.ok) {
            renderizarItens(data.itens);
            atualizarResumo(data.total_venda);
            if (window.atualizarContadorCarrinho) window.atualizarContadorCarrinho(data.total_itens);
        } else {
            container.innerHTML = '<p class="empty-msg">Erro ao carregar o carrinho.</p>';
        }
    } catch (error) {
        console.error("Erro:", error);
        container.innerHTML = '<p class="empty-msg">Erro de conexão com o servidor.</p>';
    }
}

function renderizarItens(itens) {
    const container = document.getElementById('lista-itens');
    if (!itens || itens.length === 0) {
        container.innerHTML = '<p class="empty-msg">Seu carrinho está vazio.</p>';
        return;
    }

    container.innerHTML = itens.map(item => `
        <div class="item-carrinho">
            <img src="${item.imagem || '../../statics/img/placeholder.png'}" alt="${item.nome}">
            <div class="detalhes-item">
                <h4>${item.nome}</h4>
                <p>Tamanho: ${item.tamanho}</p>
                <span class="preco-item">${Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div class="controles-item">
                <div class="quantidade">
                    <button onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1})">-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1})">+</button>
                </div>
                <button class="btn-remover" onclick="removerItem(${item.id})">Remover</button>
            </div>
        </div>
    `).join('');
}

async function alterarQuantidade(carrinhoItemId, novaQuantidade) {
    if (novaQuantidade < 1) return;

    const token = localStorage.getItem('auth_token');
    try {
        const response = await fetch(`${API_ORDER_URL}/carrinho/atualizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                carrinho_item_id: carrinhoItemId,
                quantidade: novaQuantidade
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            window.logoutUser();
            return;
        }

        if (response.ok) {
            // Se deu certo, recarregamos o carrinho para atualizar os preços e totais
            carregarCarrinho();
        } else {
            // AQUI ESTÁ O SEGREDO:
            // Capturamos a mensagem de erro que o backend enviou (ex: "Ops! Só temos X unidades...")
            // e mostramos no Toast vermelho.
            if (window.showToast) {
                window.showToast(data.error || "Erro ao atualizar quantidade", "error");
            }
            // Recarregamos os dados para resetar o número visual no HTML para o valor real do banco
            carregarCarrinho();
        }
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        if (window.showToast) window.showToast("Erro de conexão com o servidor.", "error");
    }
}

async function removerItem(carrinhoItemId) {
    const token = localStorage.getItem('auth_token');
    try {
        const response = await fetch(`${API_ORDER_URL}/carrinho/remover`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ carrinho_item_id: carrinhoItemId })
        });

        if (response.ok) {
            carregarCarrinho();
            if (window.showToast) window.showToast("ITEM REMOVIDO DA SACOLA", "success");
        }
    } catch (error) {
        console.error("Erro ao remover:", error);
    }
}

function atualizarResumo(total) {
    const totalFormatado = Number(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('valor-subtotal').textContent = totalFormatado;
    document.getElementById('valor-total').textContent = totalFormatado;
}