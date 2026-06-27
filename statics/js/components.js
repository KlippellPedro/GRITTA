/**
 * GR!TTA — Componentes Reutilizáveis  (Design System v2)
 * Cursor, header e footer injetados via Web Components
 */

/* ══════════════════════════════════════════════
   CURSOR GLOBAL
   Injetado uma única vez no body pelo header.
   Estados: hover (links/botões) · view (cards "VER") · down (clique)
══════════════════════════════════════════════ */
function injectCursor () {
    if (document.getElementById('cursor')) return;
    // Só em dispositivos com mouse de verdade — touch usa o toque nativo
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const body = document.body;
    const cur  = document.createElement('div'); cur.id  = 'cursor';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    ring.innerHTML = '<span id="cursor-label">VER</span>';
    body.prepend(ring);
    body.prepend(cur);

    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cur.style.left = mx + 'px';
        cur.style.top  = my + 'px';
    });
    (function loop () {
        rx += (mx - rx) * .16;
        ry += (my - ry) * .16;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        requestAnimationFrame(loop);
    })();

    // Delegação: detecta o tipo de alvo a cada movimento de entrada.
    // Funciona automaticamente com conteúdo injetado dinamicamente.
    document.addEventListener('mouseover', e => {
        if (e.target.closest('.produto-card,.cat-card,.drop-card')) {
            body.classList.add('cursor-view');
            body.classList.remove('cursor-hover');
        } else if (e.target.closest('a,button,.chip,.size-chip,.logo')) {
            body.classList.add('cursor-hover');
            body.classList.remove('cursor-view');
        } else {
            body.classList.remove('cursor-view', 'cursor-hover');
        }
    });
    document.addEventListener('mousedown', () => body.classList.add('cursor-down'));
    document.addEventListener('mouseup',   () => body.classList.remove('cursor-down'));
}

/* ══════════════════════════════════════════════
   PAGE TRANSITION  (cortina branded ao navegar)
   Cobre a tela ao sair, revela ao chegar — movimento
   contínuo de baixo→cima entre as páginas.
══════════════════════════════════════════════ */
function initPageTransition () {
    if (document.getElementById('page-transition')) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ov = document.createElement('div');
    ov.id = 'page-transition';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
        '<span class="pt-logo">GR<span class="pt-accent">!</span>TTA</span>' +
        '<span class="pt-bar"></span>';
    document.body.appendChild(ov);

    // Helper global usado também por cliques em cards (onclick inline)
    window.grittaGo = function (url) {
        if (reduce) { window.location.href = url; return; }
        sessionStorage.setItem('gritta-pt', '1');
        ov.classList.add('pt-anim', 'pt-cover');
        setTimeout(() => { window.location.href = url; }, 600);
    };

    // Chegou de uma navegação interna → revela (cortina sobe e sai pelo topo)
    if (!reduce && sessionStorage.getItem('gritta-pt') === '1') {
        sessionStorage.removeItem('gritta-pt');
        ov.classList.add('pt-cover');     // cobre instantaneamente
        void ov.offsetWidth;              // força reflow antes de animar
        ov.classList.add('pt-anim');
        requestAnimationFrame(() => ov.classList.add('pt-up'));
        ov.addEventListener('transitionend', function te (e) {
            if (e.propertyName !== 'transform') return;
            ov.classList.remove('pt-anim', 'pt-cover', 'pt-up');
            ov.removeEventListener('transitionend', te);
        });
    }

    if (reduce) return;

    // Intercepta cliques em links internos
    document.addEventListener('click', e => {
        if (e.defaultPrevented || e.button !== 0 ||
            e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') ||
            href.startsWith('mailto:') || href.startsWith('tel:') ||
            href.toLowerCase().startsWith('javascript:')) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        if (a.hostname && a.hostname !== window.location.hostname) return; // externo
        e.preventDefault();
        window.grittaGo(a.href);
    });

    // bfcache: ao voltar, garante que a cortina não fique presa cobrindo
    window.addEventListener('pageshow', e => {
        if (e.persisted) ov.classList.remove('pt-anim', 'pt-cover', 'pt-up');
    });
}

/* ══════════════════════════════════════════════
   SNOW  (Winter Is Coming) — neve leve sob o conteúdo
══════════════════════════════════════════════ */
window.initSnow = function (target, count = 24) {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host || host.querySelector('.snow-layer')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layer = document.createElement('div');
    layer.className = 'snow-layer';
    let html = '';
    for (let i = 0; i < count; i++) {
        const size  = (Math.random() * 4 + 2).toFixed(1);   // 2–6px
        const left  = (Math.random() * 100).toFixed(2);
        const dur   = (Math.random() * 8 + 6).toFixed(1);    // 6–14s
        const delay = (Math.random() * -14).toFixed(1);
        const drift = (Math.random() * 60 - 30).toFixed(0);  // -30..30px
        const op    = (Math.random() * .5 + .3).toFixed(2);
        html += `<span class="snowflake" style="left:${left}%;width:${size}px;height:${size}px;`
              + `animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op};`
              + `--drift:${drift}px"></span>`;
    }
    layer.innerHTML = html;
    host.prepend(layer);
};

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
window.buildMarquee = function (containerId, customWords) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const words = (Array.isArray(customWords) && customWords.length) ? customWords : [
        'GR!TTA','OVERSIZED','STREETWEAR','FRETE GRÁTIS',
        'DROP 01','WINTER IS COMING','SEM CONCESSÃO','O FRIO NÃO PERDOA'
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
            <p>FRETE GRÁTIS ACIMA DE R$399,99 &nbsp;·&nbsp; <span>O FRIO TÁ VINDO — DROP 01</span></p>
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
              <button class="search-icon-btn" id="search-icon" aria-label="Buscar" title="Buscar">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
              <a href="${root}usuario/favoritos.html" class="fav-icon-container" title="Favoritos">
                <img src="${assets}img/icons/coracao.png" alt="Favoritos" />
                <span class="fav-badge" id="fav-count">0</span>
              </a>
              <a href="${root}usuario/carrinho.html" class="cart-icon-container" title="Carrinho">
                <img src="${assets}img/icons/sacola.png" alt="Carrinho" />
                <span class="cart-badge" id="cart-count">0</span>
              </a>
              <div class="notif-menu-container" id="notif-container" style="display:none">
                <button class="notif-icon-btn" id="notif-icon" aria-label="Notificações" title="Notificações">
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6.36-6.4-1.36-1.4V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C6.64 5.36 5 7.92 5 11v3.2l-1.36 1.4c-.4.42-.11 1.1.47 1.1h14.78c.58 0 .87-.68.47-1.1Z"/></svg>
                  <span class="notif-badge" id="notif-count" style="display:none">0</span>
                </button>
                <div class="dropdown-menu notif-dropdown" id="notif-dropdown">
                  <div class="notif-head"><span>NOTIFICAÇÕES</span><button id="notif-mark-all" type="button">Marcar lidas</button></div>
                  <div class="notif-list" id="notif-list"><p class="notif-empty">Carregando…</p></div>
                </div>
              </div>
              <div class="user-menu-container">
                <a href="${root}usuario/login.html" id="user-icon-link" title="Minha Conta">
                  <img src="${assets}img/icons/usuario.png" alt="Perfil" />
                </a>
                <div class="dropdown-menu" id="user-dropdown">
                  <a href="${root}admin/painel.html" id="dropdown-admin" class="dropdown-admin" style="display:none">⚙ PAINEL ADMIN</a>
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

        const ig = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>';
        const tk = '<svg viewBox="0 0 24 24"><path d="M14 3v11.6a3.4 3.4 0 1 1-3-3.38v2.06a1.4 1.4 0 1 0 1 1.32V3h2c.2 1.9 1.7 3.4 3.6 3.6V8.7A6 6 0 0 1 14 6.9" fill="currentColor"/></svg>';
        const yt = '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 9.2l4.5 2.8-4.5 2.8z" fill="currentColor"/></svg>';
        const wa = '<svg viewBox="0 0 24 24"><path d="M12 2.5A9.5 9.5 0 0 0 3.6 16.7L2.5 21.5l4.9-1.1A9.5 9.5 0 1 0 12 2.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8.4c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c0 .2 0 .3-.1.5l-.4.5c-.1.2-.2.3 0 .6.3.5.8 1.1 1.4 1.5.7.5 1 .5 1.2.4l.5-.5c.2-.2.3-.1.5 0l1.4.7c.2.1.3.2.3.3 0 .6-.4 1.3-.7 1.5-.3.2-1.3.6-2.6.1a8 8 0 0 1-4.6-4.6c-.5-1.3-.1-2.3.2-2.6z" fill="currentColor"/></svg>';
        const lock = '<svg viewBox="0 0 24 24" class="lock"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

        this.innerHTML = `
        <footer class="footer-gritta">
          <!-- Newsletter + marca -->
          <div class="footer-news">
            <div class="footer-news-brand">
              <h2 class="footer-logo">GR<span>!</span>TTA</h2>
              <p>Streetwear oversized pra quem não pede licença. Peça bruta, caimento largo, sem firula.</p>
              <div class="social-row">
                <a class="social-btn" href="#" aria-label="Instagram" title="Instagram">${ig}</a>
                <a class="social-btn" href="#" aria-label="TikTok" title="TikTok">${tk}</a>
                <a class="social-btn" href="#" aria-label="YouTube" title="YouTube">${yt}</a>
                <a class="social-btn" href="#" aria-label="WhatsApp" title="WhatsApp">${wa}</a>
              </div>
            </div>
            <form class="footer-newsletter" id="footer-news-form">
              <span class="fn-label">Entra pro Movimento</span>
              <p class="fn-desc">Drop novo antes de todo mundo + 10% OFF na primeira compra. Sem spam, só peça boa.</p>
              <div class="fn-row">
                <input type="email" id="fn-email" placeholder="seu@email.com" aria-label="Seu e-mail" required />
                <button type="submit">QUERO ENTRAR</button>
              </div>
            </form>
          </div>

          <!-- Colunas de links -->
          <div class="footer-container">
            <div class="footer-column">
              <h3>Loja</h3>
              <ul>
                <li><a href="${root}pages/categoria.html?tipo=camisas">Camisetas</a></li>
                <li><a href="${root}pages/categoria.html?tipo=moletons">Moletons</a></li>
                <li><a href="${root}pages/categoria.html?tipo=calcas">Calças</a></li>
                <li><a href="${root}pages/categoria.html?tipo=tenis">Tênis</a></li>
                <li><a href="${root}pages/categoria.html?tipo=acessorios">Acessórios</a></li>
                <li><a href="${root}pages/drop.html">Drops</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Ajuda</h3>
              <ul>
                <li><a href="${root}pages/faq.html">Central de Ajuda</a></li>
                <li><a href="${root}pages/trocas-e-devolucoes.html">Trocas e Devoluções</a></li>
                <li><a href="${root}pages/guia-de-tamanhos.html">Guia de Tamanhos</a></li>
                <li><a href="${root}pages/frete-e-entrega.html">Frete e Entrega</a></li>
                <li><a href="${root}pages/formas-de-pagamento.html">Formas de Pagamento</a></li>
                <li><a href="${root}usuario/pedidos.html">Rastrear Pedido</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>A GR!TTA</h3>
              <ul>
                <li><a href="${root}pages/sobre.html">Sobre a Marca</a></li>
                <li><a href="${root}pages/contato.html">Fale Conosco</a></li>
                <li><a href="${root}pages/politica-de-privacidade.html">Política de Privacidade</a></li>
                <li><a href="${root}pages/termos-de-uso.html">Termos de Uso</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Atendimento</h3>
              <ul class="atend-list">
                <li><span>WhatsApp</span><a href="#">(11) 90000-0000</a></li>
                <li><span>E-mail</span><a href="mailto:contato@gritta.com.br">contato@gritta.com.br</a></li>
                <li><span>Horário</span><em>Seg. a Sex. · 9h às 18h</em></li>
              </ul>
            </div>
          </div>

          <!-- Pagamentos + segurança -->
          <div class="footer-pay">
            <div class="pay-group">
              <span class="pay-label">Pagamento</span>
              <div class="pay-chips">
                <span class="pay-chip">Pix</span><span class="pay-chip">Visa</span>
                <span class="pay-chip">Mastercard</span><span class="pay-chip">Elo</span>
                <span class="pay-chip">Amex</span><span class="pay-chip">Boleto</span>
              </div>
            </div>
            <div class="pay-group">
              <span class="pay-label">Compra Segura</span>
              <div class="pay-chips">
                <span class="pay-chip secure">${lock} Ambiente Protegido</span><span class="pay-chip secure">SSL</span>
              </div>
            </div>
          </div>

          <div class="footer-direitos">
            <p>&copy; 2026 GR!TTA Streetwear LTDA &middot; CNPJ XX.XXX.XXX/0001-XX &middot; Todos os direitos reservados.</p>
            <p><a href="${root}pages/politica-de-privacidade.html">Privacidade</a> &middot; <a href="${root}pages/termos-de-uso.html">Termos</a></p>
          </div>
        </footer>`;

        // Newsletter (placeholder — captura real depende de backend)
        const form = this.querySelector('#footer-news-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (typeof showToast === 'function') showToast('VOCÊ TÁ NO MOVIMENTO ✦', 'success');
                form.reset();
            });
        }
    }
}

/* ══════════════════════════════════════════════
   STOREFRONT — aplica o drop ativo (lido do backend)
   Personalizações por drop ficam em /drops/*.json.
   Tudo é guardado por existência de elemento, então roda
   em qualquer página sem quebrar.
══════════════════════════════════════════════ */
function setText (sel, text, root) {
    if (text === undefined || text === null) return;
    const el = (root || document).querySelector(sel);
    if (el) el.textContent = text;
}

/* Monta o <h1> do hero a partir de um array de linhas.
   Palavra entre { } vira destaque (.accent). */
function buildHeadline (lines) {
    let i = 0, html = '';
    lines.forEach(line => {
        html += '<span class="line">';
        const words = String(line).split(' ').filter(Boolean);
        words.forEach((w, j) => {
            let cls = 'word', text = w;
            if (w.startsWith('{') && w.endsWith('}')) { cls += ' accent'; text = w.slice(1, -1); }
            html += `<span class="${cls}" style="--i:${i}">${text}</span>`;
            if (j < words.length - 1) html += ' ';
            i++;
        });
        html += '</span>';
    });
    return html;
}

/* Título da seção drop: { } vira <em> (acento teal), linhas viram <br>. */
function buildDropTitle (lines) {
    return lines.map(l => String(l).replace(/\{([^}]+)\}/g, '<em>$1</em>')).join('<br/>');
}

function applyStorefront (state) {
    if (!state || !state.drop) return;
    const d  = state.drop;
    const sp = window.resolveStaticPath;

    if (d.accent) document.documentElement.style.setProperty('--accent', d.accent);

    // Top-bar (tagline do drop) e marquee — globais (todas as páginas)
    setText('.top-bar span', d.topbar);
    if (Array.isArray(d.marquee)) window.buildMarquee('marquee-inner', d.marquee);

    // Neve: liga/desliga
    if (d.snow === false) document.querySelectorAll('.snow-layer').forEach(n => n.remove());

    // ── HERO (home) ──
    if (d.hero && document.querySelector('.hero')) {
        const h = d.hero;
        setText('.hero-eyebrow', h.eyebrow);
        setText('.hero-index', h.meta_index);
        setText('.hero-meta-label', h.meta_label);
        setText('.hero-sub', h.sub);
        setText('.btn-hero-primary span', h.cta_primary);
        setText('.btn-hero-ghost span', h.cta_secondary);

        const ht = document.querySelector('.hero-title');
        if (ht && Array.isArray(h.headline)) {
            const novo = h.headline.join(' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
            const atual = ht.textContent.replace(/\s+/g, ' ').trim();
            if (novo !== atual) ht.innerHTML = buildHeadline(h.headline); // evita re-animar se igual
        }
        const hp = document.querySelector('.hero-photo-img');
        if (hp && h.banner) hp.style.background = `url("${sp(h.banner)}") center 24%/cover no-repeat`;
    }

    // ── SEÇÃO DROP (home #drop) ──
    const dropSec = document.getElementById('drop');
    if (dropSec && d.drop_section) {
        const ds = d.drop_section;
        if (ds.hidden) {
            dropSec.style.display = 'none';
        } else {
            dropSec.style.display = '';
            setText('.section-label', ds.label ? '✦ ' + ds.label : undefined, dropSec);
            const dt = dropSec.querySelector('.drop-title');
            if (dt && Array.isArray(ds.titulo)) dt.innerHTML = buildDropTitle(ds.titulo);
            setText('.drop-text', ds.texto, dropSec);
            const dv = dropSec.querySelector('.drop-visual-text');
            if (dv && ds.visual_text) dv.innerHTML = String(ds.visual_text).replace(/\n/g, '<br/>');
            const sec = dropSec.querySelector('.drop-section');
            if (sec && ds.banner) {
                sec.style.background =
                    'linear-gradient(to right, rgba(8,16,24,.93) 0%, rgba(8,16,24,.62) 55%, rgba(8,16,24,.42) 100%), '
                    + `url("${sp(ds.banner)}") center 28%/cover no-repeat`;
            }
            // Countdown com a data real do drop (cai no padrão se ausente/ inválida)
            if (ds.countdown && typeof window.startCountdown === 'function') {
                window.startCountdown(new Date(ds.countdown));
            }
        }
    }

    // ── PÁGINA DE DROP ──
    const dropTitulo = document.getElementById('titulo-drop');
    if (dropTitulo && d.drop_page) {
        const dp = d.drop_page;
        if (dp.titulo) dropTitulo.textContent = dp.titulo;
        setText('.drop-subtitulo', dp.subtitulo);
        const dh = document.querySelector('.drop-header');
        if (dh) {
            setText('.section-label', dp.label ? '✦ ' + dp.label : undefined, dh);
            if (dp.banner) {
                dh.style.background =
                    'linear-gradient(rgba(8,16,24,.62), rgba(8,16,24,.84)), '
                    + `url("${sp(dp.banner)}") center 32%/cover no-repeat`;
            }
        }
    }
}

function initStorefront () {
    if (!window.CONFIG || !window.CONFIG.API_STOREFRONT_URL) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    fetch(window.CONFIG.API_STOREFRONT_URL, { signal: ctrl.signal })
        .then(r => r.ok ? r.json() : null)
        .then(state => { if (state) applyStorefront(state); })
        .catch(() => {})            // serviço fora → mantém os defaults do HTML
        .finally(() => clearTimeout(t));
}

/* ══════════════════════════════════════════════
   MINI-CART DRAWER  (gaveta lateral da sacola)
   Abre ao clicar no ícone do carrinho ou ao adicionar.
══════════════════════════════════════════════ */
function mcMoney (v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function mcRoot ()  { return (location.pathname.includes('/pages/') || location.pathname.includes('/usuario/')) ? '../' : './'; }

function injectMiniCart () {
    if (document.getElementById('minicart')) return;
    const root = mcRoot();

    const overlay = document.createElement('div');
    overlay.id = 'minicart-overlay';
    const drawer = document.createElement('aside');
    drawer.id = 'minicart';
    drawer.setAttribute('aria-label', 'Sua sacola');
    drawer.innerHTML = `
        <div class="mc-head">
          <h3>Sua Sacola <span id="mc-count">0</span></h3>
          <button class="mc-close" id="mc-close" aria-label="Fechar sacola">&times;</button>
        </div>
        <div class="mc-freebar" id="mc-freebar">
          <p id="mc-freetext"></p>
          <div class="mc-progress"><div id="mc-progress-fill"></div></div>
        </div>
        <div class="mc-body" id="mc-body"></div>
        <div class="mc-foot" id="mc-foot">
          <div class="mc-subtotal"><span>Subtotal</span><strong id="mc-subtotal">R$ 0,00</strong></div>
          <a class="mc-checkout" href="${root}usuario/checkout.html"><span>FINALIZAR COMPRA</span></a>
          <a class="mc-viewcart" href="${root}usuario/carrinho.html">Ver sacola completa</a>
        </div>`;
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener('click', window.closeMiniCart);
    drawer.querySelector('#mc-close').addEventListener('click', window.closeMiniCart);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeMiniCart(); });

    // Intercepta o ícone de carrinho do header (captura → roda antes da transição de página)
    document.addEventListener('click', e => {
        if (e.target.closest('.cart-icon-container')) { e.preventDefault(); window.openMiniCart(); }
    }, true);
}

window.openMiniCart = function () {
    const dr = document.getElementById('minicart');
    if (!dr) return;
    document.getElementById('minicart-overlay').classList.add('active');
    dr.classList.add('active');
    document.body.classList.add('mc-open');
    window.refreshMiniCart();
};
window.closeMiniCart = function () {
    document.getElementById('minicart-overlay')?.classList.remove('active');
    document.getElementById('minicart')?.classList.remove('active');
    document.body.classList.remove('mc-open');
};

// injeta = dados já prontos (usado em testes); senão busca do order_service
window.refreshMiniCart = async function (injetado) {
    if (injetado) return renderMiniCart(injetado);
    const token = localStorage.getItem('auth_token');
    if (!token) return renderMiniCart(null, 'login');
    try {
        const res = await fetch(`${CONFIG.API_ORDER_URL}/carrinho`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) return renderMiniCart(null, 'login');
        if (!res.ok) return renderMiniCart(null, 'error');
        renderMiniCart(await res.json());
    } catch (e) { renderMiniCart(null, 'error'); }
};

function renderMiniCart (data, state) {
    const body = document.getElementById('mc-body');
    const foot = document.getElementById('mc-foot');
    const freebar = document.getElementById('mc-freebar');
    const count = document.getElementById('mc-count');
    if (!body) return;
    const root = mcRoot();

    const showMsg = (msg, ctaText, ctaHref) => {
        body.innerHTML = `<div class="mc-empty"><p>${msg}</p>${ctaText ? `<a class="mc-cta" href="${ctaHref}">${ctaText}</a>` : ''}</div>`;
        foot.style.display = 'none'; freebar.style.display = 'none'; count.textContent = '0';
    };
    if (state === 'login') return showMsg('Entra na conta pra ver e fechar sua sacola.', 'FAZER LOGIN', `${root}usuario/login.html`);
    if (state === 'error') return showMsg('Não rolou carregar a sacola agora. Tenta de novo.');

    const itens = (data && data.itens) || [];
    if (itens.length === 0) return showMsg('Sua sacola tá vazia.', 'EXPLORAR A LOJA', `${root}index.html`);

    foot.style.display = ''; freebar.style.display = '';
    const subtotal = Number(data.total_venda || 0);
    count.textContent = data.total_itens || itens.length;
    document.getElementById('mc-subtotal').textContent = mcMoney(subtotal);
    if (typeof window.atualizarContadorCarrinho === 'function') window.atualizarContadorCarrinho(data.total_itens || itens.length);

    // Barra "faltam R$X pro frete grátis"
    const FRETE = (window.CONFIG && window.CONFIG.FRETE_GRATIS) || 399.90;
    const ftext = document.getElementById('mc-freetext');
    const fill  = document.getElementById('mc-progress-fill');
    if (subtotal >= FRETE) {
        ftext.innerHTML = '✦ <b>Você ganhou frete grátis!</b>';
        fill.style.width = '100%';
    } else {
        ftext.innerHTML = `Faltam <b>${mcMoney(FRETE - subtotal)}</b> pro frete grátis`;
        fill.style.width = Math.min(100, (subtotal / FRETE) * 100) + '%';
    }

    body.innerHTML = itens.map(item => `
        <div class="mc-item" data-id="${item.id}">
          <img src="${window.resolveStaticPath(item.imagem)}" alt="${item.nome}" onerror="this.style.objectFit='contain'" />
          <div class="mc-item-info">
            <h4>${item.nome}</h4>
            <span class="mc-size">Tam: ${item.tamanho}</span>
            <div class="mc-qty">
              <button class="mc-q" data-act="dec" aria-label="Diminuir">−</button>
              <span>${item.quantidade}</span>
              <button class="mc-q" data-act="inc" aria-label="Aumentar">+</button>
            </div>
          </div>
          <div class="mc-item-right">
            <strong>${mcMoney(item.preco * item.quantidade)}</strong>
            <button class="mc-remove">Remover</button>
          </div>
        </div>`).join('');

    body.querySelectorAll('.mc-item').forEach(row => {
        const id = row.dataset.id;
        const qty = parseInt(row.querySelector('.mc-qty span').textContent, 10);
        row.querySelector('[data-act="inc"]').addEventListener('click', () => mcUpdateQty(id, qty + 1));
        row.querySelector('[data-act="dec"]').addEventListener('click', () => { if (qty > 1) mcUpdateQty(id, qty - 1); });
        row.querySelector('.mc-remove').addEventListener('click', () => mcRemove(id));
    });
}

async function mcUpdateQty (id, qtd) {
    const token = localStorage.getItem('auth_token');
    try {
        const res = await fetch(`${CONFIG.API_ORDER_URL}/carrinho/atualizar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ carrinho_item_id: id, quantidade: qtd })
        });
        if (!res.ok && typeof showToast === 'function') {
            const d = await res.json().catch(() => ({}));
            showToast(d.error || 'Não deu pra atualizar.', 'error');
        }
    } catch (e) {}
    window.refreshMiniCart();
}
async function mcRemove (id) {
    const token = localStorage.getItem('auth_token');
    try {
        await fetch(`${CONFIG.API_ORDER_URL}/carrinho/remover`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ carrinho_item_id: id })
        });
        if (typeof showToast === 'function') showToast('ITEM REMOVIDO DA SACOLA', 'error');
    } catch (e) {}
    window.refreshMiniCart();
}

/* ══════════════════════════════════════════════
   BUSCA GLOBAL (overlay aberto pelo ícone do header)
   Submete redirecionando pra home?busca= (a home roda a busca).
══════════════════════════════════════════════ */
function injectSearch () {
    if (document.getElementById('search-overlay')) return;
    const root = mcRoot();
    const ov = document.createElement('div');
    ov.id = 'search-overlay';
    ov.innerHTML = `
        <form id="search-form" role="search">
          <svg class="so-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input type="search" id="so-input" placeholder="Buscar peça — moletom, cargo, oversized…" aria-label="Buscar produtos" autocomplete="off" />
          <button type="button" id="so-close" aria-label="Fechar busca">&times;</button>
        </form>`;
    document.body.appendChild(ov);

    const input = ov.querySelector('#so-input');
    ov.querySelector('#search-form').addEventListener('submit', e => {
        e.preventDefault();
        const term = input.value.trim();
        if (!term) return;
        window.grittaGo(`${mcRoot()}index.html?busca=${encodeURIComponent(term)}`);
    });
    ov.querySelector('#so-close').addEventListener('click', window.closeSearch);
    ov.addEventListener('click', e => { if (e.target === ov) window.closeSearch(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeSearch(); });

    // Ícone de busca do header (captura → antes da transição de página)
    document.addEventListener('click', e => {
        if (e.target.closest('#search-icon')) { e.preventDefault(); window.openSearch(); }
    }, true);
}
window.openSearch = function () {
    const ov = document.getElementById('search-overlay');
    if (!ov) return;
    ov.classList.add('active');
    setTimeout(() => document.getElementById('so-input')?.focus(), 160);
};
window.closeSearch = function () {
    document.getElementById('search-overlay')?.classList.remove('active');
};

/* ══════════════════════════════════════════════
   MODAL NEWSLETTER (10% OFF · LGPD) — 1ª visita
══════════════════════════════════════════════ */
function injectNewsModal () {
    if (document.getElementById('news-modal-overlay')) return;
    const root = mcRoot();
    const ov = document.createElement('div');
    ov.id = 'news-modal-overlay';
    ov.innerHTML = `
        <div id="news-modal" role="dialog" aria-label="Newsletter GR!TTA">
          <button class="nm-close" id="nm-close" aria-label="Fechar">&times;</button>
          <span class="nm-eyebrow">✦ Entra pro Movimento</span>
          <h2>10% OFF<br/>na primeira compra</h2>
          <p>Drop novo antes de todo mundo, descontos exclusivos e zero spam. Só peça boa.</p>
          <form id="news-modal-form">
            <input type="email" id="nm-email" placeholder="seu@email.com" aria-label="Seu e-mail" required />
            <label class="nm-consent">
              <input type="checkbox" id="nm-consent" required />
              <span>Concordo em receber e-mails e li a <a href="${root}pages/politica-de-privacidade.html">Política de Privacidade</a>.</span>
            </label>
            <button type="submit">QUERO MEU DESCONTO</button>
          </form>
          <button class="nm-dismiss" id="nm-dismiss">Agora não</button>
        </div>`;
    document.body.appendChild(ov);

    const close = () => ov.classList.remove('active');
    ov.querySelector('#nm-close').addEventListener('click', close);
    ov.querySelector('#nm-dismiss').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#news-modal-form').addEventListener('submit', e => {
        e.preventDefault();
        if (typeof showToast === 'function') showToast('BEM-VINDO AO MOVIMENTO ✦ CONFERE TEU E-MAIL', 'success');
        close();
    });
    window.openNewsModal = () => ov.classList.add('active');

    // Mostra uma vez por navegador, ~4,5s após a 1ª visita
    if (!localStorage.getItem('gritta_news_seen')) {
        setTimeout(() => {
            localStorage.setItem('gritta_news_seen', '1');
            ov.classList.add('active');
        }, 4500);
    }
}

/* ── Registra os componentes ── */
customElements.define('gritta-header', GrittaHeader);
customElements.define('gritta-footer', GrittaFooter);

/* ── Fallback do navegador padrão (sobrescrito por initPageTransition) ── */
window.grittaGo = window.grittaGo || function (url) { window.location.href = url; };

/* ── Boot ── */
initPageTransition();
injectMiniCart();
injectSearch();
injectNewsModal();
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-snow]').forEach(el =>
        window.initSnow(el, parseInt(el.dataset.snow, 10) || 24)
    );
    initStorefront();
});
