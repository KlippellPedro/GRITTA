const API_AUTH_URL_REFRESH = CONFIG.API_AUTH_URL;

// Helper para verificar se o token JWT expirou decodificando o payload
function isTokenExpired(token) {
    if (!token) return true;
    try {
        // O payload é a segunda parte do JWT (Base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch (e) {
        return true;
    }
}

// Helper para verificar se o token está PERTO de expirar (ex: faltam menos de 5 minutos)
function shouldRefreshToken(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        // Retorna true se faltar menos de 300 segundos (5 minutos)
        return (payload.exp - now) < 300;
    } catch (e) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Pequeno atraso para garantir que os Custom Elements terminaram de renderizar
    setTimeout(initMenuSystem, 10);
});

function initMenuSystem() {
    verificarSessaoNoCarregamento();
    destacarLinkAtivo();

    const header = document.querySelector('.header');
    const checkScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', checkScroll);
    checkScroll();

    const userIcon = document.getElementById('user-icon-link');
    const dropdown = document.getElementById('user-dropdown');
    if (userIcon && dropdown) {
        userIcon.addEventListener('click', (e) => {
            const token = localStorage.getItem('auth_token');

            // Só cancela o link e abre o dropdown se o usuário estiver logado
            if (token) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
        document.addEventListener('click', (e) => {
            if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    const toggle  = document.querySelector('.navbar-toggle');
    const navMenu = document.querySelector('.menu');
    const menuClose = document.getElementById('menu-close');
    const menuOverlay = document.getElementById('menu-overlay');
    if (toggle && navMenu) {
        const closeMobileMenu = () => {
            toggle.classList.remove('active');
            navMenu.classList.remove('active');
            if (menuOverlay) menuOverlay.classList.remove('active');
        };
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (menuOverlay) menuOverlay.classList.toggle('active');
        });
        if (menuClose) menuClose.addEventListener('click', closeMobileMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', closeMobileMenu);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMobileMenu();
        });
        // Fecha o menu ao clicar em qualquer link dentro dele
        navMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeMobileMenu);
        });
    }

    const btnLogout = document.getElementById('dropdown-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.logoutUser(true);   // logout manual → sempre vai pro login
        });
    }

    mostrarLinkAdmin();   // atalho do painel admin no dropdown (só pra admin)
    setupNotificacoes();  // sininho de notificações
    setupMegaMenu();      // mega menu hover panels
}

function setupMegaMenu() {
    const items = document.querySelectorAll('.mega-item');
    if (!items.length) return;

    let timer = null;

    const closeAll = () => {
        document.querySelectorAll('.mega-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.mega-trigger[aria-expanded]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    };

    const scheduleClose = () => {
        timer = setTimeout(closeAll, 120);
    };

    items.forEach(item => {
        const panelId = item.dataset.mega;
        const panel   = panelId ? document.getElementById(panelId) : null;
        const trigger = item.querySelector('.mega-trigger');

        item.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            closeAll();
            if (panel) panel.classList.add('active');
            if (trigger) trigger.setAttribute('aria-expanded', 'true');
        });

        item.addEventListener('mouseleave', scheduleClose);

        if (panel) {
            panel.addEventListener('mouseenter', () => clearTimeout(timer));
            panel.addEventListener('mouseleave', scheduleClose);
        }
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.mega-item') && !e.target.closest('.mega-panel')) closeAll();
    });
}

// Mostra o "⚙ PAINEL ADMIN" no dropdown apenas se o JWT for de um administrador.
// (Gate de UX — a segurança real é server-side via admin_required.)
function mostrarLinkAdmin() {
    const token = localStorage.getItem('auth_token');
    const link = document.getElementById('dropdown-admin');
    if (!token || !link || isTokenExpired(token)) return;
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(b64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        if (payload.tipo === 'admin') link.style.display = 'block';
    } catch (e) { }
}

/* ── Central de notificações (sininho) ── */
function notifEscape(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function setupNotificacoes() {
    const icon = document.getElementById('notif-icon');
    const dropdown = document.getElementById('notif-dropdown');
    if (!icon || !dropdown) return;
    icon.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('active'); });
    document.addEventListener('click', (e) => {
        if (!icon.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('active');
    });
    const markAll = document.getElementById('notif-mark-all');
    if (markAll) markAll.addEventListener('click', async (e) => {
        e.stopPropagation();
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        try {
            await fetch(`${CONFIG.API_NOTIF_URL}/lidas`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            carregarNotificacoes();
        } catch (e) { }
    });
}

async function carregarNotificacoes() {
    const token = localStorage.getItem('auth_token');
    const container = document.getElementById('notif-container');
    if (!token || !container) return;
    container.style.display = 'flex';
    try {
        const res = await fetch(CONFIG.API_NOTIF_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const lista = await res.json();
        const naoLidas = lista.filter(n => !n.lida).length;
        const badge = document.getElementById('notif-count');
        if (badge) { badge.textContent = naoLidas; badge.style.display = naoLidas > 0 ? 'flex' : 'none'; }

        const listEl = document.getElementById('notif-list');
        if (!listEl) return;
        if (!lista.length) { listEl.innerHTML = '<p class="notif-empty">Você não tem notificações ainda.</p>'; return; }
        listEl.innerHTML = lista.map(n => {
            const dt = n.criado_em ? new Date(n.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
            return `<div class="notif-item ${n.lida ? '' : 'nao-lida'}" data-id="${n.id}" data-link="${notifEscape(n.link || '')}">
                <div class="notif-item-titulo">${notifEscape(n.titulo)}</div>
                <div class="notif-item-msg">${notifEscape(n.mensagem || '')}</div>
                <div class="notif-item-data">${dt}</div>
            </div>`;
        }).join('');
        listEl.querySelectorAll('.notif-item').forEach(el =>
            el.addEventListener('click', () => abrirNotificacao(el.dataset.id, el.dataset.link)));
    } catch (e) { }
}

async function abrirNotificacao(id, link) {
    const token = localStorage.getItem('auth_token');
    try { await fetch(`${CONFIG.API_NOTIF_URL}/${id}/lida`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); } catch (e) { }
    if (link) {
        const path = window.location.pathname;
        const prefix = path.includes('/usuario/') ? '' : (path.includes('/pages/') ? '../usuario/' : 'usuario/');
        window.location.href = prefix + link;
    } else {
        carregarNotificacoes();
    }
}

/**
 * Identifica a página atual e adiciona a classe 'active' ao link correspondente no menu
 */
function destacarLinkAtivo() {
    const currentPath = window.location.pathname + window.location.search;
    const links = document.querySelectorAll('.menu a');

    links.forEach(link => {
        try {
            const urlObj = new URL(link.href);
            const linkPath = urlObj.pathname + urlObj.search;

            if (currentPath === linkPath || (window.location.pathname === '/' && linkPath.endsWith('index.html'))) {
                link.classList.add('active');
            }
        } catch (e) { }
    });
}

async function verificarSessaoNoCarregamento() {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (token) {
        if (isTokenExpired(token)) {
            console.warn("Sessão expirada detectada no carregamento.");
            window.logoutUser();
        } else if (shouldRefreshToken(token) && refreshToken) {
            // Se não expirou mas está perto, tenta renovar silenciosamente
            await tentarRenovarSessao(refreshToken);
        }

        // Se o usuário está logado e o token é válido, carrega os totais do menu
        carregarTotaisBadges();
        carregarNotificacoes();
    }

    // Lógica Global de ver/esconder senha (funciona com ou sem login)
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.toggle-password');
        if (toggleBtn) {
            const input = toggleBtn.parentElement.querySelector('input');
            const icon = toggleBtn.querySelector('img');
            const isPassword = input.getAttribute('type') === 'password';

            // Altera o tipo do input entre password e text
            input.setAttribute('type', isPassword ? 'text' : 'password');

            if (icon && icon.src) {
                // Pega o caminho atual e troca apenas o nome do arquivo final (.png)
                const newIconName = isPassword ? 'olho-aberto.png' : 'olho-fechado.png';
                const baseDir = icon.src.substring(0, icon.src.lastIndexOf('/') + 1);
                icon.src = baseDir + newIconName;
            }
        }
    });
}

async function carregarTotaisBadges() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        // 1. Busca total de Favoritos
        fetch(CONFIG.API_FAVORITOS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(favs => {
                window.atualizarContadorFavoritos(favs.length);
            });

        // 2. Busca total de itens no Carrinho
        fetch(`${CONFIG.API_ORDER_URL}/carrinho`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) window.atualizarContadorCarrinho(data.total_itens);
            });

    } catch (error) {
        console.error("Erro ao sincronizar contadores do menu:", error);
    }
}

async function tentarRenovarSessao(refreshToken) {
    try {
        const response = await fetch(`${API_AUTH_URL_REFRESH}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.access_token);
            console.log("Sessão renovada automaticamente durante a navegação.");
        } else {
            // Se o refresh token também falhar (ex: expirou os 30 dias), desloga
            window.logoutUser();
        }
    } catch (error) {
        console.error("Erro ao tentar renovar sessão:", error);
    }
}

// Funções globais para os badges (usadas por index.js e outros scripts)
window.atualizarContadorFavoritos = function (valor, acumulativo = false) {
    const badge = document.getElementById('fav-count');
    if (!badge) return;

    let total = valor;
    if (acumulativo) {
        const atual = parseInt(badge.textContent) || 0;
        total = Math.max(0, atual + valor);
    }

    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';

    // Se o contador for 0, o badge some, se for > 0, ele aparece
    if (total === 0) {
        badge.style.display = 'none';
    }

    // Dispara animação de pulso se for uma adição
    if (valor > 0) {
        const container = badge.parentElement;
        container.classList.remove('animate-pop');
        void container.offsetWidth; // Força o reflow para reiniciar a animação
        container.classList.add('animate-pop');
    }
}

window.atualizarContadorCarrinho = function (valor, acumulativo = false) {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    let total = valor;
    if (acumulativo) {
        const atual = parseInt(badge.textContent) || 0;
        total = Math.max(0, atual + valor);
    }
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';

    // Dispara animação de pulso se for uma adição
    if (valor > 0) {
        const container = badge.parentElement;
        container.classList.remove('animate-pop');
        void container.offsetWidth; // Força o reflow para reiniciar a animação
        container.classList.add('animate-pop');
    }
}

// Função global para mostrar notificações (Toasts) estilo site premium
window.showToast = function (message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove o toast automaticamente após 4 segundos
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

// Função global para deslogar e limpar o sistema.
// explicito=true  → logout manual (botão SAIR): sempre redireciona pro login.
// explicito=false → sessão expirou: só redireciona se a página EXIGE login;
//                   em página pública, limpa em silêncio e fica na página.
window.logoutUser = function (explicito) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_tipo');
    localStorage.removeItem('user_id');

    const path = window.location.pathname;
    const PROTEGIDAS = ['carrinho.html', 'checkout.html', 'perfil.html', 'pedidos.html', 'favoritos.html'];
    const ehProtegida = PROTEGIDAS.some(p => path.endsWith(p));

    if (explicito || ehProtegida) {
        const prefix = (path.includes('/pages/') || path.includes('/usuario/')) ? '../' : '';
        window.location.href = prefix + 'usuario/login.html';
    } else {
        // Página pública: não chuta o visitante. Zera os badges do menu.
        document.querySelectorAll('.fav-badge, .cart-badge').forEach(b => { b.style.display = 'none'; });
    }
};