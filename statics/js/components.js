/**
 * GR!TTA — Componentes Reutilizáveis  (Design System v2)
 * Cursor, header e footer injetados via Web Components
 */

/* ══════════════════════════════════════════════
   CURSOR GLOBAL
   Injetado uma única vez no body pelo header
══════════════════════════════════════════════ */
function injectCursor () {
    if (document.getElementById('cursor')) return;

    const cur  = document.createElement('div'); cur.id  = 'cursor';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.prepend(ring);
    document.body.prepend(cur);

    let mx=0, my=0, rx=0, ry=0;
    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cur.style.left  = mx + 'px';
        cur.style.top   = my + 'px';
    });
    (function loop(){
        rx += (mx - rx) * .12;
        ry += (my - ry) * .12;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        requestAnimationFrame(loop);
    })();

    // Hover magnético nos elementos interativos
    function addHover (els) {
        els.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }
    // Observa novos elementos que entram no DOM
    new MutationObserver(() => {
        addHover(document.querySelectorAll(
            'button:not([data-cursor-bound]),a:not([data-cursor-bound]),' +
            '.produto-card:not([data-cursor-bound]),.cat-card:not([data-cursor-bound]),' +
            '.chip:not([data-cursor-bound]),.logo:not([data-cursor-bound])'
        ));
        document.querySelectorAll('button,a,.produto-card,.cat-card,.chip,.logo')
            .forEach(el => el.setAttribute('data-cursor-bound','1'));
    }).observe(document.body, { childList: true, subtree: true });
    addHover(document.querySelectorAll('button,a,.produto-card,.cat-card,.chip,.logo'));
}

/* ══════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════ */
function initReveal () {
    const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
        { threshold: .1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════════
   MARQUEE
══════════════════════════════════════════════ */
window.buildMarquee = function (containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const words = [
        'GR!TTA','OVERSIZED','STREETWEAR','FREE DELIVERY',
        'DROP 01','INVERNO 26','NOVA COLEÇÃO','QUALIDADE PREMIUM'
    ];
    let h = '';
    for (let i=0; i<4; i++) words.forEach(w => { h += `<div class="marquee-item">${w}</div>`; });
    el.innerHTML = h;
};

/* ══════════════════════════════════════════════
   HELPER: resolve caminhos de imagens do banco
══════════════════════════════════════════════ */
window.resolveStaticPath = function (dbPath) {
    const placeholder = 'img/placeholder.png';
    let clean = (dbPath && dbPath !== 'undefined') ? dbPath : placeholder;
    if (clean.includes('statics/')) clean = clean.split('statics/').pop();
    clean = clean.replace(/^\//, '');

    const p = window.location.pathname;
    let prefix = '';
    if (p.includes('/pages/') || p.includes('/usuario/')) prefix = '../../statics/';
    else if (p.includes('/templates/'))                    prefix = '../statics/';
    else                                                    prefix = './statics/';

    return prefix + clean;
};

/* ══════════════════════════════════════════════
   GRITTA-HEADER  (Web Component)
══════════════════════════════════════════════ */
class GrittaHeader extends HTMLElement {
    connectedCallback () {
        const isSub  = window.location.pathname.includes('/pages/')
                    || window.location.pathname.includes('/usuario/');
        const root   = isSub ? '../'        : './';
        const assets = isSub ? '../../statics/' : '../statics/';

        this.innerHTML = `
        <header class="header" id="gritta-header">
          <div class="top-bar">
            <p>FRETE GRÁTIS EM COMPRAS ACIMA DE R$250 &nbsp;·&nbsp; <span>NOVO DROP INVERNO 26</span></p>
          </div>
          <div class="main">
            <div class="logo">
              <a href="${root}index.html">
                <img src="${assets}img/icons/loja-icon.png" alt="GR!TTA" />
                <span class="brand-name">GR!TTA</span>
              </a>
            </div>

            <nav class="menu navbar-menu">
              <a href="${root}index.html">INÍCIO</a>
              <a href="${root}pages/categoria.html?tipo=camisas">CAMISAS</a>
              <a href="${root}pages/categoria.html?tipo=moletons">MOLETONS</a>
              <a href="${root}pages/categoria.html?tipo=calcas">CALÇAS</a>
              <a href="${root}pages/categoria.html?tipo=tenis">TÊNIS</a>
              <a href="${root}pages/categoria.html?tipo=acessorios">ACESSÓRIOS</a>
            </nav>

            <div class="icons">
              <a href="${root}usuario/favoritos.html" class="fav-icon-container" title="Favoritos">
                <img src="${assets}img/icons/coracao.png" alt="Favoritos" />
                <span class="fav-badge" id="fav-count">0</span>
              </a>
              <a href="${root}usuario/carrinho.html" class="cart-icon-container" title="Carrinho">
                <img src="${assets}img/icons/sacola.png" alt="Carrinho" />
                <span class="cart-badge" id="cart-count">0</span>
              </a>
              <div class="user-menu-container">
                <a href="${root}usuario/login.html" id="user-icon-link" title="Minha Conta">
                  <img src="${assets}img/icons/usuario.png" alt="Perfil" />
                </a>
                <div class="dropdown-menu" id="user-dropdown">
                  <a href="${root}usuario/perfil.html"  id="dropdown-perfil">MEU PERFIL</a>
                  <a href="${root}usuario/pedidos.html" id="dropdown-pedidos">MEUS PEDIDOS</a>
                  <hr />
                  <button id="dropdown-logout" class="btn-logout">SAIR</button>
                </div>
              </div>
              <button class="navbar-toggle" id="navbar-toggle" aria-label="Menu">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </header>`;

        // Garante cursor e reveal após o header ser montado
        requestAnimationFrame(() => {
            injectCursor();
            initReveal();
        });
    }
}

/* ══════════════════════════════════════════════
   GRITTA-FOOTER  (Web Component)
══════════════════════════════════════════════ */
class GrittaFooter extends HTMLElement {
    connectedCallback () {
        const isSub  = window.location.pathname.includes('/pages/')
                    || window.location.pathname.includes('/usuario/');
        const root   = isSub ? '../' : './';
        const assets = isSub ? '../../statics/' : '../statics/';

        this.innerHTML = `
        <footer class="footer-gritta">
          <div class="footer-container">
            <div class="footer-column brand-info">
              <h2 class="footer-logo">GR<span>!</span>TTA</h2>
              <p>E-commerce de alta performance focada em streetwear oversized. Arquitetura de microsserviços, design bruto, experiência sem compromisso.</p>
              <div class="social-row">
                <div class="social-btn" title="Instagram">
                  <img src="${assets}img/icons/instagram.png" alt="Instagram" />
                </div>
              </div>
            </div>
            <div class="footer-column">
              <h3>Loja</h3>
              <ul>
                <li><a href="${root}index.html">Início</a></li>
                <li><a href="${root}pages/drop.html">Lançamentos</a></li>
                <li><a href="${root}pages/categoria.html?tipo=moletons">Moletons</a></li>
                <li><a href="${root}pages/categoria.html?tipo=camisas">Camisas</a></li>
                <li><a href="${root}pages/categoria.html?tipo=tenis">Tênis</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Conta</h3>
              <ul>
                <li><a href="${root}usuario/login.html">Login</a></li>
                <li><a href="${root}usuario/pedidos.html">Meus Pedidos</a></li>
                <li><a href="${root}usuario/favoritos.html">Favoritos</a></li>
                <li><a href="${root}usuario/perfil.html">Endereços</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Suporte</h3>
              <ul>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Trocas e Devoluções</a></li>
                <li><a href="#">Guia de Tamanhos</a></li>
                <li><a href="#">Contato</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-direitos">
            <p>&copy; 2026 GR!TTA — Pedro Nadalon Klippel</p>
            <p>Flask &middot; MySQL &middot; JWT &middot; Vanilla JS</p>
          </div>
        </footer>`;
    }
}

/* ── Registra os componentes ── */
customElements.define('gritta-header', GrittaHeader);
customElements.define('gritta-footer', GrittaFooter);
