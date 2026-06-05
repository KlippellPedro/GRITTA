/**
 * GR!TTA — Home Page Logic  (v2)
 * Mantém toda a lógica de API original + adiciona UI do novo design.
 */

/* ── CONFIG ── */
const API_CATALOG_URL   = `${CONFIG.API_CATALOG_URL}?special=true`;
const API_ORDER_URL     = CONFIG.API_ORDER_URL;
const API_FAVORITOS_URL = CONFIG.API_FAVORITOS_URL;

/* ── MAPEAMENTO: chip data-cat → valor real do banco (campo `tipo`) ── */
const CAT_MAP = {
    'camisas':    'camisa',
    'moletons':   'moletom',
    'calcas':     'calca',
    'tenis':      'tenis',
    'acessorios': 'acessorio',
    'todos':      'todos',
};

/* ── PRODUTOS MOCK com campo `tipo` correto ── */
const MOCK_PRODUCTS = [
    { id:1,  nome:"Camiseta Oversized Angel",      preco_base:199.90, tipo:"camisa",   imagem:"img/roupas/camisas/oversized-angel.webp",                     slug:"oversized-angel",      total_estoque:10 },
    { id:2,  nome:"Camiseta Oversized Archangel",  preco_base:219.90, tipo:"camisa",   imagem:"img/roupas/camisas/oversized-archangel.webp",                 slug:"oversized-archangel",  total_estoque:8  },
    { id:3,  nome:"Camiseta Oversized TDAH",       preco_base:189.90, tipo:"camisa",   imagem:"img/roupas/camisas/oversized-tdah.webp",                      slug:"oversized-tdah",       total_estoque:15 },
    { id:4,  nome:"Moletom Boxy Gaming Squad",     preco_base:349.90, tipo:"moletom",  imagem:"img/roupas/moletons/moletom-boxy-gaming-squad.webp",          slug:"moletom-gaming-squad", total_estoque:5  },
    { id:5,  nome:"Jaqueta Box Corta-Vento",       preco_base:429.90, tipo:"moletom",  imagem:"img/roupas/moletons/jaqueta-box-corta-vento-esportiva.webp",  slug:"jaqueta-corta-vento",  total_estoque:12 },
    { id:6,  nome:"Calça Oversized Cargo Jeans",   preco_base:289.90, tipo:"calca",    imagem:"img/roupas/calcas/calca-oversized-cargo-em-jeans.webp",       slug:"calca-cargo-jeans",    total_estoque:3  },
    { id:7,  nome:"Calça Sarja Baggy Cargo",       preco_base:219.90, tipo:"calca",    imagem:"img/roupas/calcas/calca-sarja-baggy-cargo-camuflada.webp",    slug:"calca-sarja-baggy",    total_estoque:7  },
    { id:8,  nome:"Boné Dad Hat Preto",            preco_base:129.90, tipo:"acessorio",imagem:"img/roupas/acessorios/bone-cbjr-logo-preto.webp",             slug:"bone-dad-hat-preto",   total_estoque:20 },
    { id:9,  nome:"Tênis QIX 90s Preto & Branco",  preco_base:499.90, tipo:"tenis",    imagem:"img/roupas/tenis/qix-90s-preto-e-branco.webp",               slug:"tenis-qix-90s-pb",     total_estoque:6  },
    { id:10, nome:"Tênis QIX Trek Urban Hiking",   preco_base:329.90, tipo:"tenis",    imagem:"img/roupas/tenis/qix-trek-urban-hiking-branco.webp",          slug:"tenis-qix-trek",       total_estoque:4  },
];

/* ── ESTADO ── */
let todosOsProdutos = [];   // todos carregados da API ou mock
let filtroAtivo     = 'todos';
let isOfflineMode   = false;

/* ══════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    buildMarquee('marquee-inner');
    initCountdown();
    initFilterChips();
    carregarProdutosVitrine();
});

window.addEventListener('pageshow', (e) => {
    if (e.persisted || (window.performance && window.performance.navigation.type === 2)) {
        carregarProdutosVitrine();
    }
});

/* ══════════════════════════════════════
   COUNTDOWN
══════════════════════════════════════ */
function initCountdown () {
    const target = new Date();
    target.setDate(target.getDate() + 14);
    target.setHours(23, 59, 59, 0);

    function tick () {
        const diff = Math.max(0, target - new Date());
        const d  = document.getElementById('cd-d');
        const h  = document.getElementById('cd-h');
        const m  = document.getElementById('cd-m');
        const s  = document.getElementById('cd-s');
        if (!d) return;
        d.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
        h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
}

/* ══════════════════════════════════════
   FILTER CHIPS
══════════════════════════════════════ */
function initFilterChips () {
    const chips = document.querySelectorAll('#filter-chips .chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filtroAtivo = chip.dataset.cat || 'todos';
            renderizarProdutos(todosOsProdutos, document.getElementById('vitrine-container'), {});
        });
    });
}

/* ══════════════════════════════════════
   CARREGAR PRODUTOS
══════════════════════════════════════ */
async function carregarProdutosVitrine () {
    const vitrineContainer = document.getElementById('vitrine-container');
    if (!vitrineContainer) return;

    // Esqueleto de carregamento
    vitrineContainer.innerHTML = Array(4).fill(0).map(() => `
        <div class="produto-card">
            <div class="produto-imagem skeleton" style="aspect-ratio:3/4"></div>
            <div class="produto-info">
                <div class="skeleton" style="height:14px;width:80%;margin-bottom:10px"></div>
                <div class="skeleton" style="height:20px;width:50%"></div>
            </div>
        </div>`).join('');

    try {
        const token = localStorage.getItem('auth_token');
        let produtos = [], favoritos = [], carrinhoData = null;

        // AbortController para timeout de 4s
        const ctrl    = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 4000);

        const promises = [
            fetch(API_CATALOG_URL, { cache: 'no-store', signal: ctrl.signal })
                .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
                .catch(() => null)
        ];

        if (token) {
            promises.push(
                fetch(API_FAVORITOS_URL, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.ok ? res.json() : []).catch(() => [])
            );
            promises.push(
                fetch(`${API_ORDER_URL}/carrinho`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.ok ? res.json() : null).catch(() => null)
            );
        }

        const resultados = await Promise.all(promises);
        clearTimeout(timeout);

        produtos = resultados[0];

        /* ── MODO OFFLINE ── */
        if (!produtos || produtos.length === 0) {
            isOfflineMode = true;
            const banner = document.getElementById('db-banner');
            if (banner) banner.classList.add('show');
            todosOsProdutos = MOCK_PRODUCTS;
            renderizarProdutos(MOCK_PRODUCTS, vitrineContainer, {});
            return;
        }

        isOfflineMode = false;
        const banner = document.getElementById('db-banner');
        if (banner) banner.classList.remove('show');

        if (token && resultados.length >= 3) {
            favoritos    = resultados[1] || [];
            carrinhoData = resultados[2] || null;
        }

        const favMap = {};
        if (favoritos?.length > 0) {
            favoritos.forEach(fav => { favMap[fav.produto_id] = fav.id; });
            atualizarContadorFavoritos(favoritos.length);
        }
        if (carrinhoData) atualizarContadorCarrinho(carrinhoData.total_itens || 0);

        todosOsProdutos = produtos;
        renderizarProdutos(produtos, vitrineContainer, favMap);

    } catch (error) {
        console.error('Erro ao carregar vitrine:', error);
        isOfflineMode = true;
        const banner = document.getElementById('db-banner');
        if (banner) banner.classList.add('show');
        todosOsProdutos = MOCK_PRODUCTS;
        renderizarProdutos(MOCK_PRODUCTS, vitrineContainer, {});
    }
}

/* ══════════════════════════════════════
   RENDERIZAR PRODUTOS
══════════════════════════════════════ */
function renderizarProdutos (lista, container, favMap = {}) {
    if (!container) return;

    // Converte o chip selecionado (plural) para o valor real do banco (singular)
    const tipoFiltro = CAT_MAP[filtroAtivo] || filtroAtivo;

    // Aplica filtro: usa campo `tipo` (DB) ou `categoria` (fallback legado)
    const filtrada = filtroAtivo === 'todos'
        ? lista
        : lista.filter(p => {
            const t = (p.tipo || p.categoria || '').toLowerCase();
            return t === tipoFiltro;
          });

    container.innerHTML = '';

    if (filtrada.length === 0) {
        container.innerHTML = `<p class="empty-msg">NENHUM PRODUTO NESSA CATEGORIA NO MOMENTO.</p>`;
        return;
    }

    filtrada.forEach(produto => {
        const card     = document.createElement('div');
        card.className = 'produto-card';

        const imagemUrl  = window.resolveStaticPath(produto.imagem);
        const favId      = favMap[produto.id];
        const isFavorito = !!favId;
        const favClass   = isFavorito ? 'active' : '';
        const slug       = produto.slug || produto.id;

        // Badge
        let badgeHTML = '';
        if (isOfflineMode) {
            badgeHTML = '<div class="badge-ultimas-pecas" style="background:#555">EXEMPLO</div>';
        } else if (produto.total_estoque > 0 && produto.total_estoque < 5) {
            badgeHTML = '<div class="badge-ultimas-pecas">ÚLTIMAS PEÇAS</div>';
        }

        card.innerHTML = `
            <div class="produto-imagem" onclick="window.location.href='usuario/produto.html?slug=${slug}'" style="cursor:none">
                ${badgeHTML}
                <button class="btn-favoritar-vitrine ${favClass}"
                        data-fav-id="${favId || ''}"
                        onclick="favoritarProduto(this, ${produto.id}); event.stopPropagation();"
                        title="Favoritar">
                    <img src="../statics/img/icons/coracao.png" alt="Favoritar" />
                </button>
                <img src="${imagemUrl}" alt="${produto.nome}" loading="lazy"
                     onerror="this.style.padding='40px';this.style.objectFit='contain';this.style.background='#f5f5f5'"/>
            </div>
            <div class="produto-info" onclick="window.location.href='usuario/produto.html?slug=${slug}'" style="cursor:none">
                <h4>${produto.nome}</h4>
                <p class="preco">
                    <strong>${Number(produto.preco_base).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}</strong>
                    <small style="font-size:.68rem;margin-left:6px;font-weight:400">3x sem juros</small>
                </p>
                <button class="add-carrinho" onclick="event.stopPropagation(); window.location.href='usuario/produto.html?slug=${slug}'">
                    VER PRODUTO
                </button>
            </div>`;

        container.appendChild(card);
    });
}

/* ══════════════════════════════════════
   FAVORITAR (mantido do original)
══════════════════════════════════════ */
window.favoritarProduto = async function (btn, id) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('VOCÊ PRECISA ESTAR LOGADO PARA FAVORITAR.', 'error');
        setTimeout(() => { window.location.href = 'usuario/login.html'; }, 1500);
        return;
    }

    const isFavorito = btn.classList.contains('active');
    const favId      = btn.dataset.favId;

    try {
        if (isFavorito && favId) {
            const res = await fetch(`${API_FAVORITOS_URL}/${favId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                btn.classList.remove('active');
                btn.dataset.favId = '';
                atualizarContadorFavoritos(-1, true);
                showToast('REMOVIDO DOS FAVORITOS', 'error');
            } else {
                const data = await res.json();
                showToast(data.error || 'Erro ao remover.', 'error');
            }
        } else {
            const res = await fetch(API_FAVORITOS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ produto_id: id })
            });
            const data = await res.json();
            if (res.ok) {
                btn.classList.add('active');
                btn.dataset.favId = data.id || data.favorito_id;
                atualizarContadorFavoritos(1, true);
                showToast('ADICIONADO AOS FAVORITOS ❤️', 'success');
            } else {
                showToast(data.error || 'Erro ao favoritar.', 'error');
            }
        }
    } catch (e) {
        console.error('Erro ao favoritar:', e);
    }
};
