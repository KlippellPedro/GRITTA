const API_ORDER_URL = "http://127.0.0.1:5002/api/pedidos";

document.addEventListener('DOMContentLoaded', async () => {
    // Extrai o ID do pedido da URL (?id=...)
    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get('id');
    const token = localStorage.getItem('auth_token');

    if (pedidoId) {
        document.getElementById('display-pedido-id').textContent = `#${pedidoId}`;

        if (token) {
            await carregarDadosPedido(pedidoId, token);
        }
    } else {
        document.getElementById('display-pedido-id').textContent = "Confirmado";
    }
});

async function carregarDadosPedido(pedidoId, token) {
    const container = document.getElementById('resumo-itens-sucesso');
    try {
        // Busca informações básicas (como o total)
        const resInfo = await fetch(`${API_ORDER_URL}/${pedidoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resInfo.ok) {
            const pedido = await resInfo.json();
            document.getElementById('display-pedido-total').textContent =
                Number(pedido.total_pedido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        // Busca os itens do pedido
        const response = await fetch(`${API_ORDER_URL}/${pedidoId}/itens`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const itens = await response.json();

        container.innerHTML = itens.map(item => {
            let imagemUrl = item.imagem || '../../statics/img/placeholder.png';
            if (imagemUrl.includes('../../statics')) imagemUrl = imagemUrl.replace('../../statics', '../../statics');

            return `
                <div class="item-sucesso">
                    <img src="${imagemUrl}" alt="${item.nome}">
                    <div class="item-sucesso-info">
                        <p>${item.quantidade}x ${item.nome}</p>
                        <small style="color: #888;">TAMANHO: ${item.tamanho}</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Erro ao carregar resumo de itens:", error);
    }
}