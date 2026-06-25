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
    { id:1,  nome:"Camiseta Oversized Angel",      preco_base:199.90, tipo:"camisa",   imagem:"img/roupas/camisas/oversized-angel.webp",                     imagem_2:"img/roupas/camisas/oversized-archangel.webp",              slug:"oversized-angel",      total_estoque:10, variacoes:"201:P:4,202:M:6,203:G:0,204:GG:3" },
    { id:2,  nome:"Camiseta Oversized Archangel",  preco_base:219.90, tipo:"camisa",   imagem:"img/roupas/camisas/oversized-archangel.webp",                 imagem_2:"img/roupas/camisas/oversized-tdah.webp",                   slug:"oversized-archangel",  total_estoque:8,  variacoes:"205:P:2,206:M:5,207:G:1,208:GG:0" },
    { id:3,  nome:"Camiseta Oversized TDAH",       preco_base:189.90, tipo:"camisa",   imagem:"img/roupas/camisas/oversized-tdah.webp",                      imagem_2:"img/roupas/camisas/oversized-angel.webp",                  slug:"oversized-tdah",       total_estoque:15, variacoes:"209:P:4,210:M:6,211:G:3,212:GG:2" },
    { id:4,  nome:"Moletom Boxy Gaming Squad",     preco_base:349.90, tipo:"moletom",  imagem:"img/roupas/moletons/moletom-boxy-gaming-squad.webp",          imagem_2:"img/roupas/moletons/jaqueta-box-corta-vento-esportiva.webp",slug:"moletom-gaming-squad", total_estoque:5,  variacoes:"213:P:2,214:M:0,215:G:2,216:GG:1" },
    { id:5,  nome:"Jaqueta Box Corta-Vento",       preco_base:429.90, tipo:"moletom",  imagem:"img/roupas/moletons/jaqueta-box-corta-vento-esportiva.webp",  imagem_2:"img/roupas/moletons/jaqueta-box-puffer-preta-gola-alta.webp",slug:"jaqueta-corta-vento", total_estoque:12, variacoes:"217:P:3,218:M:5,219:G:4,220:GG:0" },
    { id:6,  nome:"Calça Oversized Cargo Jeans",   preco_base:289.90, tipo:"calca",    imagem:"img/roupas/calcas/calca-oversized-cargo-em-jeans.webp",       imagem_2:"img/roupas/calcas/calca-sarja-baggy-cargo-camuflada.webp", slug:"calca-cargo-jeans",    total_estoque:3,  variacoes:"221:38:3,222:40:0,223:42:0,224:44:0" },
    { id:7,  nome:"Calça Sarja Baggy Cargo",       preco_base:219.90, tipo:"calca",    imagem:"img/roupas/calcas/calca-sarja-baggy-cargo-camuflada.webp",    imagem_2:"img/roupas/calcas/calca-oversized-cargo-em-jeans.webp",    slug:"calca-sarja-baggy",    total_estoque:7,  variacoes:"225:38:5,226:40:3,227:42:2,228:44:0" },
    { id:8,  nome:"Boné Dad Hat Preto",            preco_base:129.90, tipo:"acessorio",imagem:"img/roupas/acessorios/bone-cbjr-logo-preto.webp",             imagem_2:"img/roupas/acessorios/bone-qix-lords-preto.webp",          slug:"bone-dad-hat-preto",   total_estoque:20, variacoes:"229:ÚNICO:20" },
    { id:9,  nome:"Tênis QIX 90s Preto & Branco",  preco_base:499.90, tipo:"tenis",    imagem:"img/roupas/tenis/qix-90s-preto-e-branco.webp",               imagem_2:"img/roupas/tenis/qix-trek-urban-hiking-branco.webp",       slug:"tenis-qix-90s-pb",     total_estoque:6,  variacoes:"230:39:2,231:40:4,232:41:0,233:42:3,234:43:1" },
    { id:10, nome:"Tênis QIX Trek Urban Hiking",   preco_base:329.90, tipo:"tenis",    imagem:"img/roupas/tenis/qix-trek-urban-hiking-branco.webp",          imagem_2:"img/roupas/tenis/qix-park-preto.webp",                     slug:"tenis-qix-trek",       total_estoque:4,  variacoes:"235:39:0,236:40:3,237:41:5,238:42:2,239:43:4" },
];

/* ── ESTADO ── */
let todosOsProdutos = [];   // todos carregados da API ou mock
let filtroAtivo     = 'todos';
let isOfflineMode   = false;
let favMapAtual     = {};   // mapa de favoritos atual (compartilhado com a busca)
let buscaTimer      = null;

/* ══════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    buildMarquee('marquee-inner');
    initHero();
    startCountdown();
    initFilterChips();
    initBusca();
    initRecentes();
    carregarProdutosVitrine().then(aplicarBuscaDaURL);
});

/* Busca vinda do header global (home?busca=termo) */
function aplicarBuscaDaURL () {
    const bq = new URLSearchParams(location.search).get('busca');
    if (!bq) return;
    const input = document.getElementById('busca-input');
    const clear = document.getElementById('busca-clear');
    if (input) input.value = bq;
    if (clear) clear.hidden = false;
    executarBusca(bq);
    document.getElementById('vitrine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════════
   VISTOS RECENTEMENTE (localStorage, sem backend)
══════════════════════════════════════ */
function initRecentes () {
    const sec  = document.getElementById('recentes');
    const cont = document.getElementById('recentes-container');
    if (!sec || !cont) return;

    let lista = [];
    try { lista = JSON.parse(localStorage.getItem('gritta_recentes') || '[]'); } catch (e) {}
    if (!lista.length) return;

    sec.hidden = false;
    cont.innerHTML = lista.map(p => {
        const img      = window.resolveStaticPath(p.imagem);
        const slug     = p.slug || p.id;
        const precoFmt = Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `
        <div class="produto-card" onclick="window.grittaGo('usuario/produto.html?slug=${slug}')" style="cursor:none">
            <div class="produto-imagem">
                <img class="img-primary" src="${img}" alt="${p.nome}" loading="lazy"
                     onerror="this.style.padding='40px';this.style.objectFit='contain'"/>
            </div>
            <div class="produto-info">
                <h4>${p.nome}</h4>
                <p class="preco"><strong>${precoFmt}</strong></p>
                <button class="add-carrinho">VER PEÇA</button>
            </div>
        </div>`;
    }).join('');
}

/* ══════════════════════════════════════
   HERO — parallax leve da foto no scroll
   (o reveal do título é 100% CSS, robusto sem JS)
══════════════════════════════════════ */
function initHero () {
    const photo = document.querySelector('.hero-photo');
    if (!photo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = Math.min(window.scrollY || window.pageYOffset, 700);
            photo.style.setProperty('--py', (y * 0.12).toFixed(1) + 'px');
            ticking = false;
        });
    }, { passive: true });
}

window.addEventListener('pageshow', (e) => {
    if (e.persisted || (window.performance && window.performance.navigation.type === 2)) {
        carregarProdutosVitrine();
    }
});

/* ══════════════════════════════════════
   COUNTDOWN — alvo vem do config do drop (storefront)
   ou cai num padrão de +14 dias se não houver
══════════════════════════════════════ */
let _cdInterval = null;
window.startCountdown = function (target) {
    if (!(target instanceof Date) || isNaN(target)) {
        target = new Date();
        target.setDate(target.getDate() + 14);
        target.setHours(23, 59, 59, 0);
    }
    if (_cdInterval) clearInterval(_cdInterval);

    function tick () {
        const d = document.getElementById('cd-d');
        if (!d) return;
        const diff = Math.max(0, target - new Date());
        document.getElementById('cd-d').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
        document.getElementById('cd-h').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        document.getElementById('cd-m').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        document.getElementById('cd-s').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }
    tick();
    _cdInterval = setInterval(tick, 1000);
};

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
            limparBusca();   // filtrar por categoria sai do modo busca
            renderizarProdutos(todosOsProdutos, document.getElementById('vitrine-container'), favMapAtual);
        });
    });
}

/* ══════════════════════════════════════
   BUSCA NA HOME
══════════════════════════════════════ */
function initBusca () {
    const input = document.getElementById('busca-input');
    const clear = document.getElementById('busca-clear');
    const form  = document.getElementById('busca-form');
    if (!input || !form) return;

    input.addEventListener('input', () => {
        clear.hidden = !input.value;
        clearTimeout(buscaTimer);
        buscaTimer = setTimeout(() => executarBusca(input.value), 320);
    });
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(buscaTimer);
        executarBusca(input.value);
    });
    clear.addEventListener('click', () => {
        input.value = '';
        clear.hidden = true;
        executarBusca('');
        input.focus();
    });
}

function limparBusca () {
    const input = document.getElementById('busca-input');
    const info  = document.getElementById('busca-info');
    const clear = document.getElementById('busca-clear');
    if (input) input.value = '';
    if (info)  info.hidden = true;
    if (clear) clear.hidden = true;
}

async function executarBusca (termoRaw) {
    const vitrine = document.getElementById('vitrine-container');
    const info    = document.getElementById('busca-info');
    if (!vitrine) return;
    const termo = (termoRaw || '').trim();

    // termo curto/vazio → volta pra vitrine de destaques (respeitando o chip ativo)
    if (termo.length < 2) {
        if (info) info.hidden = true;
        renderizarProdutos(todosOsProdutos, vitrine, favMapAtual);
        return;
    }

    vitrine.innerHTML = '<p class="loading">Buscando…</p>';

    let resultados = [];
    if (isOfflineMode) {
        resultados = MOCK_PRODUCTS.filter(p => p.nome.toLowerCase().includes(termo.toLowerCase()));
    } else {
        try {
            const ctrl = new AbortController();
            const tt = setTimeout(() => ctrl.abort(), 4000);
            const res = await fetch(`${CONFIG.API_CATALOG_URL}?q=${encodeURIComponent(termo)}`,
                                    { cache: 'no-store', signal: ctrl.signal });
            clearTimeout(tt);
            resultados = res.ok ? await res.json() : [];
        } catch (e) {
            // API fora → busca nos produtos de exemplo
            resultados = MOCK_PRODUCTS.filter(p => p.nome.toLowerCase().includes(termo.toLowerCase()));
        }
    }

    // A busca ignora o filtro de categoria — mostra tudo que casa
    filtroAtivo = 'todos';
    document.querySelectorAll('#filter-chips .chip')
        .forEach(c => c.classList.toggle('active', c.dataset.cat === 'todos'));

    if (info) {
        info.hidden = false;
        info.innerHTML = resultados.length
            ? `<b>${resultados.length}</b> ${resultados.length > 1 ? 'resultados' : 'resultado'} para “${escapeHtml(termo)}”`
            : `Nada encontrado para “${escapeHtml(termo)}”. Tenta outro termo.`;
    }
    renderizarProdutos(resultados, vitrine, favMapAtual);
}

function escapeHtml (s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
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
        favMapAtual = favMap;
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
        const preco      = Number(produto.preco_base);
        const precoFmt   = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const parcelaFmt = (preco / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const imagem2Url = produto.imagem_2 ? window.resolveStaticPath(produto.imagem_2) : null;
        if (imagem2Url) card.classList.add('has-2nd');

        // Quick-add: chips de tamanho revelados no hover
        let quickAddHTML = '';
        if (produto.variacoes) {
            const chips = String(produto.variacoes).split(',').map(v => {
                const [vid, tam, est] = v.split(':');
                return parseInt(est || 0, 10) <= 0
                    ? `<button class="qa-size out" disabled title="Esgotado">${tam}</button>`
                    : `<button class="qa-size" onclick="event.stopPropagation(); window.quickAddCarrinho('${vid}')">${tam}</button>`;
            }).join('');
            quickAddHTML = `<div class="quick-add"><span class="qa-label">Add</span><div class="qa-sizes">${chips}</div></div>`;
        }

        // Badge
        let badgeHTML = '';
        if (isOfflineMode) {
            badgeHTML = '<div class="badge-ultimas-pecas" style="background:#555">EXEMPLO</div>';
        } else if (produto.total_estoque > 0 && produto.total_estoque < 5) {
            badgeHTML = '<div class="badge-ultimas-pecas">ÚLTIMAS PEÇAS</div>';
        }

        card.innerHTML = `
            <div class="produto-imagem" onclick="window.grittaGo('usuario/produto.html?slug=${slug}')" style="cursor:none">
                ${badgeHTML}
                <button class="btn-favoritar-vitrine ${favClass}"
                        data-fav-id="${favId || ''}"
                        onclick="favoritarProduto(this, ${produto.id}); event.stopPropagation();"
                        title="Favoritar">
                    <img src="../statics/img/icons/coracao.png" alt="Favoritar" />
                </button>
                <img class="img-primary" src="${imagemUrl}" alt="${produto.nome}" loading="lazy"
                     onerror="this.style.padding='40px';this.style.objectFit='contain';this.style.background='#f5f5f5'"/>
                ${imagem2Url ? `<img class="img-secondary" src="${imagem2Url}" alt="" loading="lazy" />` : ''}
                ${quickAddHTML}
            </div>
            <div class="produto-info" onclick="window.grittaGo('usuario/produto.html?slug=${slug}')" style="cursor:none">
                <h4>${produto.nome}</h4>
                <p class="preco"><strong>${precoFmt}</strong></p>
                <p class="parcelas">ou 12x de ${parcelaFmt}</p>
                <button class="add-carrinho" onclick="event.stopPropagation(); window.grittaGo('usuario/produto.html?slug=${slug}')">
                    VER PEÇA
                </button>
            </div>`;

        container.appendChild(card);
    });
}

/* ══════════════════════════════════════
   QUICK-ADD (adiciona tamanho direto do card)
══════════════════════════════════════ */
window.quickAddCarrinho = async function (variacaoId) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('FAÇA LOGIN PRA ADICIONAR À SACOLA', 'error');
        setTimeout(() => { window.grittaGo('usuario/login.html'); }, 1400);
        return;
    }
    try {
        const res = await fetch(`${API_ORDER_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ variacao_id: variacaoId, quantidade: 1 })
        });
        if (res.ok) {
            if (window.openMiniCart) window.openMiniCart();
            else showToast('ADICIONADO À SACOLA ✦', 'success');
        } else {
            const d = await res.json().catch(() => ({}));
            showToast(d.error || 'Não deu pra adicionar.', 'error');
        }
    } catch (e) {
        showToast('Erro de conexão com a sacola.', 'error');
    }
};

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
                btn.classList.add('animate-pop');
                setTimeout(() => btn.classList.remove('animate-pop'), 420);
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
