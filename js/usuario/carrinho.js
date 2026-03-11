// Simulando produtos no carrinho (futuramente isso virá do LocalStorage ou Banco de Dados)
let itensCarrinho = [
    {
        id: 1,
        nome: "T-Shirt GR!TTA Heavyweight",
        tamanho: "Oversized - G",
        preco: 149.90,
        quantidade: 1,
        imagem: "https://images.pexels.com/photos/1004014/pexels-photo-1004014.jpeg"
    },
    {
        id: 2,
        nome: "Calça Cargo Parachute",
        tamanho: "M",
        preco: 229.90,
        quantidade: 1,
        imagem: "https://images.pexels.com/photos/1566412/pexels-photo-1566412.jpeg"
    }
];

const containerLista = document.getElementById('lista-itens');
const elSubtotal = document.getElementById('valor-subtotal');
const elTotal = document.getElementById('valor-total');
const elFrete = document.getElementById('valor-frete');

// Função para formatar moeda
const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para renderizar os itens na tela
function renderizarCarrinho() {
    containerLista.innerHTML = '';
    let subtotal = 0;

    if (itensCarrinho.length === 0) {
        containerLista.innerHTML = '<p>Seu carrinho está vazio.</p>';
        atualizarResumo(0);
        return;
    }

    itensCarrinho.forEach((item, index) => {
        subtotal += item.preco * item.quantidade;

        const divItem = document.createElement('article');
        divItem.className = 'item-carrinho';
        divItem.innerHTML = `
        <img src="${item.imagem}" alt="${item.nome}">
        <div class="detalhes-item">
          <h4>${item.nome}</h4>
          <p>Tamanho: ${item.tamanho}</p>
          <p class="preco-item">${formatarMoeda(item.preco)}</p>
        </div>
        <div class="controles-item">
          <div class="quantidade">
            <button onclick="alterarQuantidade(${index}, -1)">-</button>
            <span>${item.quantidade}</span>
            <button onclick="alterarQuantidade(${index}, 1)">+</button>
          </div>
          <button class="btn-remover" onclick="removerItem(${index})">Remover</button>
        </div>
      `;
        containerLista.appendChild(divItem);
    });

    atualizarResumo(subtotal);
}

// Função para atualizar os valores da barra lateral
function atualizarResumo(subtotal) {
    elSubtotal.textContent = formatarMoeda(subtotal);

    // Regra de Frete Grátis acima de R$250
    let frete = 0;
    if (subtotal === 0) {
        elFrete.textContent = 'R$ 0,00';
    } else if (subtotal > 250) {
        elFrete.textContent = 'Grátis';
    } else {
        frete = 25.00; // Valor fixo simulado de frete
        elFrete.textContent = formatarMoeda(frete);
    }

    const total = subtotal + frete;
    elTotal.textContent = formatarMoeda(total);
}

// Aumentar ou diminuir a quantidade
window.alterarQuantidade = function (index, mudanca) {
    if (itensCarrinho[index].quantidade + mudanca > 0) {
        itensCarrinho[index].quantidade += mudanca;
        renderizarCarrinho();
    }
};

// Remover o item da lista
window.removerItem = function (index) {
    itensCarrinho.splice(index, 1);
    renderizarCarrinho();
};

// Inicia o carrinho ao carregar a página
renderizarCarrinho();