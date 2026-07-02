const API_CATALOG_URL = CONFIG.API_CATALOG_URL;
const API_ORDER_URL = `${CONFIG.API_ORDER_URL}/carrinho`;

let variacaoSelecionada = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = '../index.html';
        return;
    }

    await carregarDadosProduto(slug);
});

window.changeQty = function (delta) {
    const qtySpan = document.getElementById('qty-value');
    let current = parseInt(qtySpan.textContent);
    qtySpan.textContent = Math.max(1, current + delta);
};

async function carregarDadosProduto(slug) {
    try {
        const [prodResp, sfResp] = await Promise.all([
            fetch(`${API_CATALOG_URL}/${slug}`),
            fetch(CONFIG.API_STOREFRONT_URL).catch(() => null),
        ]);
        if (!prodResp.ok) throw new Error("Produto não encontrado");

        const produto    = await prodResp.json();
        const storefront = sfResp?.ok ? await sfResp.json() : null;

        // Gate: produto pertence a um drop trancado e ainda não desbloqueado
        if (storefront?.drop?.trancado && storefront.drop.drop_nome === produto.drop_nome) {
            const dropId = storefront.ativo;
            if (!sessionStorage.getItem(`gritta_unlock_${dropId}`)) {
                const back = encodeURIComponent(location.href);
                window.location.replace(`../pages/drop-senha.html?drop=${dropId}&back=${back}`);
                return;
            }
        }

        renderizarPagina(produto);
        carregarRelacionados(produto.id);
        carregarAvaliacoes(slug, produto.id);
    } catch (error) {
        document.getElementById('loading-product').textContent = "Erro ao carregar produto.";
    }
}

function salvarRecente (p) {
    try {
        const KEY = 'gritta_recentes';
        const item = { id: p.id, nome: p.nome, imagem: p.imagem, preco_base: p.preco_base, slug: p.slug || p.id };
        let lista = JSON.parse(localStorage.getItem(KEY) || '[]');
        lista = lista.filter(x => x.id !== item.id);   // dedup
        lista.unshift(item);                            // mais recente primeiro
        localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 8)));
    } catch (e) {}
}

function renderizarPagina(produto) {
    document.getElementById('loading-product').style.display = 'none';
    document.getElementById('product-content').style.display = 'grid';

    salvarRecente(produto);   // registra para "Vistos Recentemente"

    // Calcula o estoque total para a etiqueta de "ÚLTIMAS PEÇAS"
    let totalEstoqueProduto = 0;
    if (produto.variacoes) {
        produto.variacoes.split(',').forEach(v => {
            const [, , estoque] = v.split(':');
            totalEstoqueProduto += parseInt(estoque || 0);
        });
    }

    document.getElementById('product-name').textContent = produto.nome;
    document.getElementById('product-price').textContent = Number(produto.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('product-desc').textContent = produto.descricao;

    const mainImg = document.getElementById('main-product-img');
    mainImg.src = window.resolveStaticPath(produto.imagem);
    mainImg.alt = produto.nome;

    // Galeria de miniaturas
    const thumbsEl = document.getElementById('galeria-thumbs');
    if (produto.todas_imagens) {
        const imagens = produto.todas_imagens.split('|').filter(Boolean);
        if (imagens.length > 1) {
            thumbsEl.innerHTML = imagens.map((img, i) => {
                const url = window.resolveStaticPath(img);
                return `<img class="galeria-thumb${i === 0 ? ' active' : ''}"
                             src="${url}" alt="Foto ${i + 1}" loading="lazy"
                             onerror="this.onerror=null;this.src=window.resolveStaticPath(null)"
                             onclick="window.trocarImagem(this,'${url}')" />`;
            }).join('');
        }
    }

    const productBadgesContainer = document.getElementById('product-badges');
    productBadgesContainer.innerHTML = ''; // Limpa badges anteriores

    const variacoesCont = document.getElementById('variacoes-container');
    if (produto.variacoes) {
        const lista = produto.variacoes.split(',');
        variacoesCont.innerHTML = '<div class="variation-grid"></div>';
        const grid = variacoesCont.querySelector('.variation-grid');

        lista.forEach(v => {
            const [id, tam, estoque] = v.split(':');
            const qtdEstoque = parseInt(estoque || 0);

            const btn = document.createElement('button');
            btn.className = 'variation-chip';
            if (qtdEstoque <= 0) {
                btn.classList.add('out-of-stock');
                btn.title = "Tamanho esgotado";
            } else {
                btn.onclick = () => selecionarVariacao(btn, id);
            }
            btn.innerHTML = `<span>${tam}</span>`;
            grid.appendChild(btn);
        });

        // Adiciona a etiqueta de "ÚLTIMAS PEÇAS" se o estoque total for baixo
        if (totalEstoqueProduto > 0 && totalEstoqueProduto < 5) {
            const ultimasPecasBadge = document.createElement('span');
            ultimasPecasBadge.className = 'badge-ultimas-pecas-detail';
            ultimasPecasBadge.textContent = 'ÚLTIMAS PEÇAS';
            productBadgesContainer.appendChild(ultimasPecasBadge);
        }
    } else {
        variacoesCont.innerHTML = '<p class="esgotado">INDISPONÍVEL NO MOMENTO</p>';
        const btn = document.getElementById('btn-add-cart');
        btn.disabled = true;
        btn.textContent = "ESGOTADO";
    }

    document.getElementById('btn-add-cart').onclick = () => adicionarAoCarrinho(produto);
}
async function carregarRelacionados(excludeId) {
    try {
        // Usando o novo endpoint especializado do Catalog Service
        const res = await fetch(`${API_CATALOG_URL}/${excludeId}/related?limit=4`);
        const relacionados = await res.json();

        const grid = document.getElementById('related-products-grid');

        grid.innerHTML = relacionados.map(p => {
            const imgUrl = window.resolveStaticPath(p.imagem);

            return `
                <div class="related-card" onclick="window.location.href='produto.html?slug=${p.slug || p.id}'">
                    <div class="related-image-wrapper">
                        <img src="${imgUrl}" alt="${p.nome}">
                    </div>
                    <div class="related-info">
                        <h4>${p.nome}</h4>
                        <p class="related-price">${Number(p.preco_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Erro ao carregar relacionados:", e);
    }
}

window.trocarImagem = function (thumb, url) {
    document.getElementById('main-product-img').src = url;
    document.querySelectorAll('.galeria-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
};

window.selecionarVariacao = function (elemento, id) {
    // Remove ativo de todos
    document.querySelectorAll('.variation-chip').forEach(btn => btn.classList.remove('active'));
    // Adiciona no clicado
    elemento.classList.add('active');
    variacaoSelecionada = id;
};

async function adicionarAoCarrinho(produto) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast("Faça login para comprar.", "error");
        window.location.href = 'login.html';
        return;
    }

    const quantidade = parseInt(document.getElementById('qty-value').textContent);

    if (!variacaoSelecionada) {
        showToast("POR FAVOR, SELECIONE UM TAMANHO.", "error");

        // Feedback visual extra: faz o grid de tamanhos tremer
        const grid = document.querySelector('.variation-grid');
        grid.classList.add('error-shake');
        setTimeout(() => grid.classList.remove('error-shake'), 400);

        return;
    }

    try {
        const res = await fetch(`${API_ORDER_URL}/adicionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ variacao_id: variacaoSelecionada, quantidade })
        });

        if (res.status === 401) {
            showToast("Sessão expirada. Redirecionando para login...", "error");
            setTimeout(() => window.logoutUser(), 1500);
            return;
        }

        if (res.ok) {
            // Feedback visual Premium: Muda o botão temporariamente
            const btn = document.getElementById('btn-add-cart');
            const originalText = btn.textContent;
            btn.textContent = "ADICIONADO!";
            btn.style.backgroundColor = "#27ae60";

            if (window.atualizarContadorCarrinho) window.atualizarContadorCarrinho(quantidade, true);
            if (window.showToast) window.showToast("ADICIONADO À SACOLA ✦", "success");
            if (window.openMiniCart) window.openMiniCart();   // abre a gaveta lateral

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = "#000";
            }, 2000);
        }
    } catch (error) {
        console.error("Erro ao adicionar:", error);
    }
}

/* ══════════════════════════════════════
   AVALIAÇÕES (reviews) da peça
══════════════════════════════════════ */
function avalEscape(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function estrelasHtml(nota) {
    const n = Math.round(nota);
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= n ? '★' : '<span class="empty">★</span>';
    return s;
}
function paintStars(stars, n) {
    stars.forEach(s => s.classList.toggle('on', Number(s.dataset.v) <= n));
}

async function carregarAvaliacoes(slug, produtoId) {
    const resumo = document.getElementById('avaliacoes-resumo');
    const listaEl = document.getElementById('avaliacoes-lista');
    try {
        const res = await fetch(`${API_CATALOG_URL}/${slug}/avaliacoes`);
        const data = await res.json();

        if (data.total > 0) {
            resumo.innerHTML = `
              <span class="aval-media">${Number(data.media).toFixed(1)}</span>
              <span class="aval-stars">${estrelasHtml(data.media)}</span>
              <span class="aval-total">${data.total} avaliaç${data.total === 1 ? 'ão' : 'ões'}</span>`;
        } else {
            resumo.innerHTML = '<p class="aval-vazio">Ainda não há avaliações. Seja o primeiro a avaliar!</p>';
        }

        listaEl.innerHTML = (data.avaliacoes || []).map(a => {
            const dt = a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : '';
            return `
              <div class="aval-item">
                <div class="aval-item-head">
                  <span class="aval-item-nome">${avalEscape(a.nome)}</span>
                  <span class="aval-item-stars">${estrelasHtml(a.nota)}</span>
                  <span class="aval-item-data">${dt}</span>
                </div>
                ${a.comentario ? `<p class="aval-item-texto">${avalEscape(a.comentario)}</p>` : ''}
              </div>`;
        }).join('');

        renderFormAvaliacao(produtoId, slug);
    } catch (e) {
        resumo.innerHTML = '<p class="aval-vazio">Não foi possível carregar as avaliações.</p>';
    }
}

function renderFormAvaliacao(produtoId, slug) {
    const wrap = document.getElementById('avaliacao-form-wrap');
    const token = localStorage.getItem('auth_token');
    if (!token) {
        wrap.innerHTML = '<p class="aval-login-hint"><a href="login.html">Entre na sua conta</a> para avaliar esta peça.</p>';
        return;
    }
    wrap.innerHTML = `
      <div class="avaliacao-form">
        <h3>Deixe sua avaliação</h3>
        <div class="star-pick" id="star-pick">${[1, 2, 3, 4, 5].map(i => `<span data-v="${i}">★</span>`).join('')}</div>
        <textarea id="aval-comentario" placeholder="Conte o que achou da peça (opcional)…" maxlength="1000"></textarea>
        <button id="btn-enviar-aval">ENVIAR AVALIAÇÃO</button>
        <p class="aval-msg" id="aval-msg"></p>
      </div>`;

    let notaSel = 0;
    const stars = wrap.querySelectorAll('#star-pick span');
    stars.forEach(st => {
        st.addEventListener('mouseenter', () => paintStars(stars, Number(st.dataset.v)));
        st.addEventListener('click', () => { notaSel = Number(st.dataset.v); paintStars(stars, notaSel); });
    });
    wrap.querySelector('#star-pick').addEventListener('mouseleave', () => paintStars(stars, notaSel));
    wrap.querySelector('#btn-enviar-aval').addEventListener('click', () => enviarAvaliacao(produtoId, slug, () => notaSel));
}

async function enviarAvaliacao(produtoId, slug, getNota) {
    const nota = getNota();
    const msg = document.getElementById('aval-msg');
    msg.style.color = '#e84545';
    if (!nota) { msg.textContent = 'Escolha uma nota (1 a 5 estrelas).'; return; }
    const comentario = document.getElementById('aval-comentario').value.trim();
    const token = localStorage.getItem('auth_token');
    const btn = document.getElementById('btn-enviar-aval');
    btn.disabled = true;
    try {
        const res = await fetch(`${API_CATALOG_URL}/${produtoId}/avaliacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nota, comentario })
        });
        const data = await res.json();
        if (res.ok) {
            if (window.showToast) showToast('AVALIAÇÃO ENVIADA ✦', 'success');
            await carregarAvaliacoes(slug, produtoId);   // recarrega com a nova avaliação
        } else if (res.status === 401) {
            msg.textContent = 'Faça login de novo para avaliar.'; btn.disabled = false;
        } else {
            msg.textContent = data.error || 'Erro ao enviar.'; btn.disabled = false;
        }
    } catch (e) {
        msg.textContent = 'Erro de conexão.'; btn.disabled = false;
    }
}
