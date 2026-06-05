/**
 * GR!TTA — Pedidos  (v2)
 * Usa a estrutura de card atualizada + resolveStaticPath para imagens
 */

const API_ORDER_URL = `${CONFIG.API_ORDER_URL}/pedidos`;

document.addEventListener('DOMContentLoaded', async () => {
    const token     = localStorage.getItem('auth_token');
    const container = document.getElementById('pedidos-lista');
    const modal     = document.getElementById('modal-pedido');
    const btnFechar = document.getElementById('btn-fechar-modal');

    if (btnFechar) btnFechar.onclick = () => modal.classList.remove('active');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    if (!token) { window.location.href = 'login.html'; return; }

    container.innerHTML = '<p class="loading-msg" style="text-align:center;color:var(--muted)">Buscando seus pedidos...</p>';

    try {
        const res = await fetch(API_ORDER_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            const pedidos = await res.json();
            renderizarPedidos(pedidos, container);
        } else {
            container.innerHTML = '<p class="empty-msg">Erro ao carregar pedidos. Tente novamente.</p>';
        }
    } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
        container.innerHTML = '<p class="empty-msg">Não foi possível conectar ao servidor.</p>';
    }
});

/* ── Mapeamento de status ──────────────────────────── */
const STATUS_MAP = {
    'Pago':        { classe: 'enviado',  label: 'PAGO' },
    'Aguardando':  { classe: 'pendente', label: 'AGUARDANDO' },
    'Enviado':     { classe: 'enviado',  label: 'ENVIADO' },
    'Entregue':    { classe: 'entregue', label: 'ENTREGUE' },
    'Cancelado':   { classe: 'cancelado',label: 'CANCELADO' },
};

function getStatus(raw) {
    return STATUS_MAP[raw] || { classe: 'pendente', label: (raw || 'PENDENTE').toUpperCase() };
}

/* ── Renderiza lista de pedidos ───────────────────── */
function renderizarPedidos(pedidos, container) {
    if (!pedidos || pedidos.length === 0) {
        container.innerHTML = `
            <div class="pedidos-vazio">
                <span style="font-size:2.5rem;display:block;margin-bottom:16px;opacity:.3">📦</span>
                <p>Você ainda não realizou nenhum pedido.</p>
                <a href="../index.html" style="
                    display:inline-block;background:#111;color:#fff;
                    padding:14px 36px;font-family:'Bebas Neue',sans-serif;
                    font-size:1.1rem;letter-spacing:2px;text-decoration:none;
                    margin-top:8px;transition:background .25s
                ">IR PARA A LOJA</a>
            </div>`;
        return;
    }

    container.innerHTML = pedidos.map(p => {
        const st   = getStatus(p.status);
        const data = new Date(p.criado_em).toLocaleDateString('pt-BR');
        const total = Number(p.total_pedido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        return `
        <div class="pedido-card" onclick="verDetalhes(${p.id})">
            <div class="pedido-card-faixa ${st.classe}"></div>
            <div class="pedido-card-body">
                <div class="pedido-info">
                    <h4>Nº DO PEDIDO</h4>
                    <p>#${p.id}</p>
                </div>
                <div class="pedido-info">
                    <h4>DATA</h4>
                    <p>${data}</p>
                </div>
                <div class="pedido-info">
                    <h4>TOTAL</h4>
                    <p>${total}</p>
                </div>
                <div class="pedido-info">
                    <h4>STATUS</h4>
                    <span class="status-badge ${st.classe}">${st.label}</span>
                </div>
                <div class="pedido-info" style="text-align:right">
                    <span style="
                        font-family:'Montserrat',sans-serif;font-size:.7rem;
                        font-weight:700;letter-spacing:1px;color:var(--accent);
                        text-transform:uppercase;cursor:none
                    ">VER DETALHES →</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

/* ── Modal de detalhes ───────────────────────────── */
window.verDetalhes = async function (pedidoId) {
    const token     = localStorage.getItem('auth_token');
    const modal     = document.getElementById('modal-pedido');
    const listaItens = document.getElementById('detalhes-itens-lista');
    const titulo    = document.getElementById('detalhe-titulo');

    titulo.textContent = `CARREGANDO PEDIDO #${pedidoId}...`;
    listaItens.innerHTML = '<p style="color:#999;font-size:.85rem;text-align:center;padding:20px">Buscando itens...</p>';
    modal.classList.add('active');

    try {
        const res = await fetch(`${API_ORDER_URL}/${pedidoId}/itens`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Falha ao buscar itens');

        const itens = await res.json();
        titulo.textContent = `PEDIDO #${pedidoId}`;

        if (!itens || itens.length === 0) {
            listaItens.innerHTML = '<p style="color:#999;font-size:.85rem">Nenhum item encontrado.</p>';
            return;
        }

        listaItens.innerHTML = itens.map(item => {
            // Resolve o caminho da imagem corretamente usando o helper global
            const imagemUrl = window.resolveStaticPath
                ? window.resolveStaticPath(item.imagem)
                : (item.imagem ? `../../${item.imagem}` : '../../statics/img/icons/loja-icon.png');

            const preco = Number(item.preco_unitario || 0).toLocaleString('pt-BR', {
                style: 'currency', currency: 'BRL'
            });
            const subtotal = Number((item.preco_unitario || 0) * (item.quantidade || 1)).toLocaleString('pt-BR', {
                style: 'currency', currency: 'BRL'
            });

            return `
            <div class="item-detalhe">
                <img src="${imagemUrl}"
                     alt="${item.nome}"
                     onerror="this.src='../../statics/img/icons/loja-icon.png';this.style.padding='8px';this.style.objectFit='contain';this.style.background='#f5f5f5'"/>
                <div class="item-info-detalhe">
                    <h5>${item.nome}</h5>
                    <p>Tamanho: <strong>${item.tamanho || '—'}</strong></p>
                    <p>${item.quantidade}x ${preco}</p>
                    <p style="color:#111;font-weight:900">Subtotal: ${subtotal}</p>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Erro ao buscar detalhes:', err);
        listaItens.innerHTML = '<p style="color:var(--danger);font-size:.85rem">Erro ao carregar os itens do pedido.</p>';
    }
};
