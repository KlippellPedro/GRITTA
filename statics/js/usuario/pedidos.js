const API_ORDER_URL = "http://127.0.0.1:5002/api/pedidos";

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const container = document.getElementById('pedidos-lista');
    const modal = document.getElementById('modal-pedido');
    const btnFechar = document.getElementById('btn-fechar-modal');

    if (btnFechar) btnFechar.onclick = () => modal.classList.remove('active');
    window.onclick = (event) => { if (event.target == modal) modal.classList.remove('active'); };

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_ORDER_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const pedidos = await response.json();
            renderizarPedidos(pedidos, container);
        } else {
            container.innerHTML = '<p class="empty-msg">Erro ao carregar pedidos.</p>';
        }
    } catch (error) {
        console.error("Erro:", error);
    }
});

function renderizarPedidos(pedidos, container) {
    if (pedidos.length === 0) {
        container.innerHTML = '<p class="empty-msg" style="color: white; text-align: center;">Você ainda não possui pedidos.</p>';
        return;
    }

    container.innerHTML = pedidos.map(p => `
        <div class="pedido-card" onclick="verDetalhes(${p.id})">
            <div class="pedido-info">
                <h4>Nº PEDIDO</h4>
                <p>#${p.id}</p>
            </div>
            <div class="pedido-info">
                <h4>DATA</h4>
                <p>${new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="pedido-info">
                <h4>TOTAL</h4>
                <p>${Number(p.total_pedido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div class="status-badge ${p.status === 'Pago' ? 'status-pago' : 'status-aguardando'}">
                ${p.status}
            </div>
        </div>
    `).join('');
}

window.verDetalhes = async function (pedidoId) {
    const token = localStorage.getItem('auth_token');
    const modal = document.getElementById('modal-pedido');
    const listaItens = document.getElementById('detalhes-itens-lista');
    const titulo = document.getElementById('detalhe-titulo');

    titulo.textContent = `CARREGANDO PEDIDO #${pedidoId}...`;
    listaItens.innerHTML = '';
    modal.classList.add('active');

    try {
        const response = await fetch(`${API_ORDER_URL}/${pedidoId}/itens`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const itens = await response.json();

        titulo.textContent = `PEDIDO #${pedidoId}`;

        listaItens.innerHTML = itens.map(item => {
            let imagemUrl = item.imagem || '../../statics/img/placeholder.png';
            if (imagemUrl.includes('../../statics')) imagemUrl = imagemUrl.replace('../../statics', '../../statics');

            return `
                <div class="item-detalhe">
                    <img src="${imagemUrl}" alt="${item.nome}">
                    <div class="item-info-detalhe">
                        <h5>${item.nome}</h5>
                        <p>Tamanho: ${item.tamanho}</p>
                        <p>${item.quantidade}x ${Number(item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
        listaItens.innerHTML = '<p>Erro ao carregar detalhes do pedido.</p>';
    }
}