/**
 * GR!TTA - Gerenciador de Componentes Reutilizáveis
 */

class GrittaHeader extends HTMLElement {
    connectedCallback() {
        const isSub = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/usuario/');
        const root = isSub ? '../' : './';
        const assets = isSub ? '../../statics/' : '../statics/';

        this.innerHTML = `
        <header class="header">
          <div class="top-bar">
            <p>FRETE GRÁTIS EM COMPRAS ACIMA DE R$250</p>
          </div>
          <div class="main">
            <div class="logo">
              <a href="${root}index.html">
                <img src="${assets}img/icons/loja-icon.png" alt="logo GR!TTA" />
                <span class="brand-name">GRITTA</span>
              </a>
            </div>
            <nav class="menu navbar-menu">
              <a href="${root}index.html">INÍCIO</a>
              <a href="${root}pages/categoria.html?tipo=camisetas">CAMISETAS</a>
              <a href="${root}pages/categoria.html?tipo=moletons">MOLETONS</a>
              <a href="${root}pages/categoria.html?tipo=calcas">CALÇAS</a>
              <a href="${root}pages/categoria.html?tipo=tenis">TÊNIS</a>
              <a href="${root}pages/categoria.html?tipo=acessorios">ACESSÓRIOS</a>
            </nav>
            <div class="icons">
              <a href="${root}usuario/favoritos.html" class="fav-icon-container">
                <img src="${assets}img/icons/coracao.png" alt="Favoritos" />
                <span class="fav-badge" id="fav-count">0</span>
              </a>
              <a href="${root}usuario/carrinho.html" class="cart-icon-container">
                <img src="${assets}img/icons/sacola.png" alt="Carrinho" />
                <span class="cart-badge" id="cart-count">0</span>
              </a>
              <div class="user-menu-container">
                <a href="${root}usuario/login.html" id="user-icon-link">
                  <img src="${assets}img/icons/usuario.png" alt="Perfil" />
                </a>
                <div class="dropdown-menu" id="user-dropdown">
                  <a href="${root}usuario/perfil.html" id="dropdown-perfil">Meu Perfil</a>
                  <a href="${root}usuario/pedidos.html" id="dropdown-pedidos">Meus Pedidos</a>
                  <hr />
                  <button id="dropdown-logout" class="btn-logout">Sair</button>
                </div>
              </div>
              <div class="navbar-toggle">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </header>`;
    }
}

class GrittaFooter extends HTMLElement {
    connectedCallback() {
        const isSub = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/usuario/');
        const root = isSub ? '../' : './';

        this.innerHTML = `
        <footer class="footer-gritta">
          <div class="footer-container">
            <div class="footer-column brand-info">
              <h2 class="footer-logo">GR!TTA</h2>
              <p>Elevando o streetwear oversized.</p>
            </div>
            <div class="footer-column">
              <h3>Loja</h3>
              <ul>
                <li><a href="#">Todos os Produtos</a></li>
                <li><a href="${root}pages/drop.html">Lançamentos</a></li>
                <li><a href="#">Sobre a Marca</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Suporte</h3>
              <ul>
                <li><a href="#">Trocas e Devoluções</a></li>
                <li><a href="#">Prazos de Entrega</a></li>
                <li><a href="#">Perguntas Frequentes</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Redes Sociais</h3>
              <ul>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">TikTok</a></li>
                <li><a href="#">E-mail</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-direitos">
            <p>&copy; 2026 GR!TTA. Todos os direitos reservados.</p>
          </div>
        </footer>`;
    }
}

// Helper global para resolver caminhos de arquivos estáticos
window.resolveStaticPath = function (dbPath) {
    const defaultPlaceholder = 'img/placeholder.png'; // Verifique se este arquivo existe!

    // Limpa o caminho vindo do banco (remove ../ ou / iniciais)
    let cleanPath = (dbPath && dbPath !== 'undefined') ? dbPath : defaultPlaceholder;
    if (cleanPath.includes('statics/')) {
        cleanPath = cleanPath.split('statics/').pop();
    }
    cleanPath = cleanPath.replace(/^\//, '');

    // Lógica inteligente de caminhos baseada na URL atual
    const path = window.location.pathname;
    let prefix = '';

    if (path.includes('/pages/') || path.includes('/usuario/')) {
        prefix = '../../statics/';
    } else if (path.includes('/templates/')) {
        prefix = '../statics/';
    } else {
        prefix = './statics/';
    }

    return prefix + cleanPath;
};

// Registra os componentes no navegador
customElements.define('gritta-header', GrittaHeader);
customElements.define('gritta-footer', GrittaFooter);