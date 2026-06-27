const API_USER_URL = CONFIG.API_USER_URL;
const API_ORDER_URL = CONFIG.API_ORDER_URL;

let subtotalCheckout = 0;
let cupomAplicado = null;   // { codigo, desconto, total }
let enderecosCheckout = [];
let freteAtual = { valor: 0, prazo: 0, calculado: false };

function fmtBRL(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderTotais() {
    const desconto = cupomAplicado ? cupomAplicado.desconto : 0;
    const frete = freteAtual.calculado ? freteAtual.valor : 0;
    const total = Math.max(0, subtotalCheckout - desconto + frete);
    document.getElementById('checkout-subtotal-valor').textContent = fmtBRL(subtotalCheckout);
    document.getElementById('checkout-total-valor').textContent = fmtBRL(total);

    const linhaDesc = document.getElementById('linha-desconto');
    if (cupomAplicado) {
        document.getElementById('cupom-aplicado-cod').textContent = cupomAplicado.codigo;
        document.getElementById('checkout-desconto-valor').textContent = '- ' + fmtBRL(desconto);
        linhaDesc.style.display = 'flex';
    } else {
        linhaDesc.style.display = 'none';
    }

    const freteVal = document.getElementById('checkout-frete-valor');
    const fretePrazo = document.getElementById('frete-prazo');
    if (freteAtual.calculado) {
        freteVal.textContent = freteAtual.valor === 0 ? 'GRÁTIS' : fmtBRL(freteAtual.valor);
        fretePrazo.textContent = freteAtual.prazo ? `(${freteAtual.prazo} dias úteis)` : '';
    } else {
        freteVal.textContent = '—';
        fretePrazo.textContent = '';
    }
}

async function calcularFreteCheckout(cep) {
    if (!cep) { freteAtual = { valor: 0, prazo: 0, calculado: false }; renderTotais(); return; }
    const token = localStorage.getItem('auth_token');
    try {
        const res = await fetch(`${API_ORDER_URL}/frete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cep, subtotal: subtotalCheckout })
        });
        const data = await res.json();
        freteAtual = res.ok
            ? { valor: data.frete, prazo: data.prazo_dias, calculado: true }
            : { valor: 0, prazo: 0, calculado: false };
    } catch (e) {
        freteAtual = { valor: 0, prazo: 0, calculado: false };
    }
    renderTotais();
}

function freteDoEnderecoSelecionado() {
    const sel = document.querySelector('input[name="endereco_id"]:checked');
    if (!sel) return;
    const addr = enderecosCheckout.find(a => String(a.id) === sel.value);
    if (addr) calcularFreteCheckout(addr.cep);
}

async function aplicarCupom() {
    const input = document.getElementById('cupom-input');
    const btn = document.getElementById('btn-aplicar-cupom');
    const fb = document.getElementById('cupom-feedback');

    // Se já há cupom aplicado, o botão vira "REMOVER"
    if (cupomAplicado) {
        cupomAplicado = null;
        input.disabled = false; input.value = '';
        btn.textContent = 'APLICAR';
        fb.textContent = ''; fb.className = 'cupom-feedback';
        renderTotais();
        return;
    }

    const codigo = input.value.trim().toUpperCase();
    fb.className = 'cupom-feedback';
    if (!codigo) { fb.textContent = 'Digite um código.'; fb.classList.add('err'); return; }

    const token = localStorage.getItem('auth_token');
    try {
        const res = await fetch(`${API_ORDER_URL}/cupons/validar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ codigo, subtotal: subtotalCheckout })
        });
        const data = await res.json();
        if (data.valido) {
            cupomAplicado = { codigo: data.codigo, desconto: data.desconto, total: data.total };
            fb.textContent = `Cupom aplicado! Você economizou ${fmtBRL(data.desconto)}.`;
            fb.classList.add('ok');
            input.disabled = true;
            btn.textContent = 'REMOVER';
        } else {
            fb.textContent = data.mensagem || 'Cupom inválido.';
            fb.classList.add('err');
        }
        renderTotais();
    } catch (e) {
        fb.textContent = 'Erro ao validar o cupom. Tente de novo.';
        fb.classList.add('err');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    await carregarDadosCheckout();

    // Eventos do Modal
    const modal = document.getElementById('modal-endereco');
    const btnAbrir = document.getElementById('btn-abrir-modal-endereco');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const formEndereco = document.getElementById('form-endereco');

    btnAbrir.addEventListener('click', () => modal.classList.add('active'));
    btnFechar.addEventListener('click', () => modal.classList.remove('active'));

    formEndereco.addEventListener('submit', salvarNovoEndereco);

    document.getElementById('btn-confirmar-pedido').addEventListener('click', finalizarCompra);
    document.getElementById('btn-aplicar-cupom').addEventListener('click', aplicarCupom);
    document.getElementById('cupom-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); aplicarCupom(); }
    });
    setupPagamento();
});

function totalAtual() {
    const desconto = cupomAplicado ? cupomAplicado.desconto : 0;
    const frete = freteAtual.calculado ? freteAtual.valor : 0;
    return Math.max(0, subtotalCheckout - desconto + frete);
}

function detectarBandeira(num) {
    if (/^4/.test(num)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'Amex';
    if (/^(4011|4312|4389|5041|5067|509|636368|650|651|655)/.test(num)) return 'Elo';
    if (/^(606282|3841)/.test(num)) return 'Hipercard';
    if (/^3(0|6|8)/.test(num)) return 'Diners';
    return num.length >= 4 ? 'Cartão' : '';
}

function carregarParcelas() {
    const sel = document.getElementById('card-parcelas');
    if (!sel) return;
    const total = totalAtual();
    let html = '';
    for (let n = 1; n <= 12; n++) {
        const parcela = total / n;
        if (n > 1 && parcela < 20) break;
        html += `<option value="${n}">${n}x de ${fmtBRL(parcela)}${n === 1 ? ' à vista' : ' sem juros'}</option>`;
    }
    sel.innerHTML = html || '<option value="1">1x</option>';
}

function setupPagamento() {
    const formCartao = document.getElementById('form-cartao');
    document.querySelectorAll('input[name="metodo_pagamento"]').forEach(r => {
        r.addEventListener('change', () => {
            const ehCartao = r.checked && r.value === 'cartao';
            if (formCartao) formCartao.style.display = ehCartao ? 'block' : 'none';
            if (ehCartao) carregarParcelas();
        });
    });
    const numEl = document.getElementById('card-numero');
    if (numEl) numEl.addEventListener('input', () => {
        const v = numEl.value.replace(/\D/g, '').slice(0, 19);
        numEl.value = v.replace(/(.{4})/g, '$1 ').trim();
        document.getElementById('card-bandeira').textContent = detectarBandeira(v);
    });
    const valEl = document.getElementById('card-validade');
    if (valEl) valEl.addEventListener('input', () => {
        const v = valEl.value.replace(/\D/g, '').slice(0, 4);
        valEl.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
    });
    const cvvEl = document.getElementById('card-cvv');
    if (cvvEl) cvvEl.addEventListener('input', () => { cvvEl.value = cvvEl.value.replace(/\D/g, '').slice(0, 4); });
}

async function salvarNovoEndereco(e) {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    const modal = document.getElementById('modal-endereco');

    const dados = {
        cep: document.getElementById('addr-cep').value,
        rua: document.getElementById('addr-rua').value,
        numero: document.getElementById('addr-numero').value,
        bairro: document.getElementById('addr-bairro').value,
        cidade: document.getElementById('addr-cidade').value,
        estado: document.getElementById('addr-estado').value
    };

    try {
        const response = await fetch(`${API_USER_URL}/${userId}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            // Limpa o formulário e fecha o modal
            document.getElementById('form-endereco').reset();
            modal.classList.remove('active');

            // Recarrega apenas a lista de endereços para mostrar o novo
            const resAddr = await fetch(`${API_USER_URL}/${userId}/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const enderecos = await resAddr.json();
            renderizarEnderecos(enderecos);

            showToast("Endereço adicionado com sucesso!", "success");
        } else {
            showToast("Erro ao salvar endereço.", "error");
        }
    } catch (error) {
        console.error("Erro ao salvar endereço:", error);
    }
}

async function carregarDadosCheckout() {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');

    try {
        // 1. Carregar Endereços
        const resAddr = await fetch(`${API_USER_URL}/${userId}/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const enderecos = await resAddr.json();
        renderizarEnderecos(enderecos);

        // 2. Carregar Resumo do Carrinho
        const resCart = await fetch(`${API_ORDER_URL}/carrinho`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resCart.status === 401) {
            window.logoutUser();
            return;
        }

        const carrinho = await resCart.json();
        renderizarItensCheckout(carrinho.itens);

        subtotalCheckout = Number(carrinho.total_venda || 0);
        renderTotais();
        freteDoEnderecoSelecionado();   // frete do endereço padrão (após o subtotal carregar)
    } catch (error) {
        console.error("Erro ao carregar checkout:", error);
    }
}

function renderizarItensCheckout(itens) {
    const container = document.getElementById('itens-checkout');
    if (!itens || itens.length === 0) return;

    container.innerHTML = itens.map(item => `
        <div class="item-checkout-resumo">
            <img src="${item.imagem}" alt="${item.nome}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px;">
            <div class="item-resumo-info">
                <p><strong>${item.quantidade}x</strong> ${item.nome}</p>
                <small>Tamanho: ${item.tamanho}</small>
            </div>
        </div>
    `).join('');
}

function renderizarEnderecos(lista) {
    enderecosCheckout = lista || [];
    const container = document.getElementById('lista-enderecos-checkout');
    if (!lista || lista.length === 0) {
        container.innerHTML = "<p>Nenhum endereço cadastrado. <a href='perfil.html'>Cadastre um aqui</a>.</p>";
        return;
    }

    container.innerHTML = lista.map((addr, index) => `
        <label class="endereco-option">
            <input type="radio" name="endereco_id" value="${addr.id}" ${index === 0 ? 'checked' : ''}>
            <div class="addr-details">
                <strong>${addr.rua}, ${addr.numero}</strong><br>
                <small>${addr.bairro} - ${addr.cidade}/${addr.estado}</small>
            </div>
        </label>
    `).join('');

    // Recalcula o frete sempre que o endereço selecionado muda
    container.querySelectorAll('input[name="endereco_id"]').forEach(r =>
        r.addEventListener('change', freteDoEnderecoSelecionado));
}

async function finalizarCompra() {
    const btn = document.getElementById('btn-confirmar-pedido');
    const token = localStorage.getItem('auth_token');

    const endereco_id = document.querySelector('input[name="endereco_id"]:checked')?.value;
    const metodo = document.querySelector('input[name="metodo_pagamento"]:checked')?.value;

    if (!endereco_id) {
        showToast("Por favor, selecione um endereço de entrega.", "error");
        return;
    }

    let dados_pagamento = {};
    let parcelas = 1;
    if (metodo === 'cartao') {
        const numero = document.getElementById('card-numero').value.replace(/\s/g, '');
        const nome = document.getElementById('card-nome').value.trim();
        const validade = document.getElementById('card-validade').value.trim();
        const cvv = document.getElementById('card-cvv').value.trim();
        if (!numero || !nome || !validade || !cvv) {
            showToast("Preencha todos os dados do cartão.", "error");
            return;
        }
        dados_pagamento = { numero, nome, validade, cvv };
        parcelas = parseInt(document.getElementById('card-parcelas').value || '1', 10);
    }

    btn.disabled = true;
    btn.textContent = "PROCESSANDO...";

    try {
        const response = await fetch(`${API_ORDER_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                endereco_id, metodo, parcelas, dados_pagamento,
                cupom_codigo: cupomAplicado ? cupomAplicado.codigo : null
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            window.logoutUser();
            return;
        }

        if (response.ok) {
            try { sessionStorage.setItem('gritta_pagamento', JSON.stringify(data.pagamento || {})); } catch (e) {}
            window.location.href = `sucesso.html?id=${data.pedido_id}`;
        } else {
            showToast(data.error || "Erro no checkout.", "error");
            btn.disabled = false;
            btn.textContent = "CONFIRMAR E PAGAR";
        }
    } catch (error) {
        showToast("Erro de conexão com o servidor de pedidos.", "error");
        btn.disabled = false;
        btn.textContent = "CONFIRMAR E PAGAR";
    }
}