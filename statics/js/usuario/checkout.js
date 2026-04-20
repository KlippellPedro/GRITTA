const API_USER_URL = CONFIG.API_USER_URL;
const API_ORDER_URL = CONFIG.API_ORDER_URL;

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
});

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

        if (response.status === 401) {
            window.logoutUser();
            return;
        }

        const carrinho = await resCart.json();
        renderizarItensCheckout(carrinho.itens);

        const totalFormatado = Number(carrinho.total_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('checkout-total-valor').textContent = totalFormatado;
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
    const container = document.getElementById('lista-enderecos-checkout');
    if (lista.length === 0) {
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

    btn.disabled = true;
    btn.textContent = "PROCESSANDO...";

    try {
        const response = await fetch(`${API_ORDER_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ endereco_id, metodo })
        });

        const data = await response.json();

        if (response.status === 401) {
            window.logoutUser();
            return;
        }

        if (response.ok) {
            window.location.href = `sucesso.html?id=${data.pedido_id}`;
        } else {
            showToast("Erro no checkout: " + data.error, "error");
            btn.disabled = false;
            btn.textContent = "CONFIRMAR E PAGAR";
        }
    } catch (error) {
        showToast("Erro de conexão com o servidor de pedidos.", "error");
    }
}