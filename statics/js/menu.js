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

    const toggle = document.querySelector('.navbar-toggle');
    const navMenu = document.querySelector('.menu');
    if (toggle && navMenu) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    const btnLogout = document.getElementById('dropdown-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.logoutUser();
        });
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

// Função global para deslogar e limpar o sistema de forma limpa
window.logoutUser = function () {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_tipo');
    localStorage.removeItem('user_id');

    // Detecta a profundidade do diretório atual para redirecionar corretamente
    if (window.location.pathname.includes('/pages/') || window.location.pathname.includes('/usuario/')) {
        window.location.href = '../usuario/login.html';
    } else {
        window.location.href = 'usuario/login.html';
    }
};