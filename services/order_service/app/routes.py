import requests
import logging
import os
from flask import Blueprint, request, jsonify
from .service import (get_user_cart, add_to_cart, update_cart_item, remove_from_cart,
                     get_user_orders, get_order_items, create_order, get_order_info,
                     get_cart_item_details)
from .cupom_service import (listar_cupons, criar_cupom, definir_ativo, excluir_cupom,
                            validar_cupom, registrar_uso)
from .auth import token_required, admin_required
from .utils import send_notification_async

# Configuração do Logger
# Cria a pasta logs se não existir
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

main = Blueprint("main", __name__)

# URLs dos outros microsserviços
INVENTORY_URL = "http://127.0.0.1:5004/api/estoque/baixa"
INVENTORY_BASE_URL = "http://127.0.0.1:5004/api/estoque"
INVENTORY_ROLLBACK_URL = "http://127.0.0.1:5004/api/estoque/devolver"
CATALOG_PRODUCT_DETAILS_URL = "http://127.0.0.1:5003/products"
PAYMENT_URL = "http://127.0.0.1:5006/api/pagamento/processar"

@main.route('/checkout', methods=['POST'])
@token_required
def checkout():
    data = request.get_json()
    user_id = request.user.get("id")
    endereco_id = data.get("endereco_id")
    token_original = request.headers.get("Authorization").split(" ")[1]

    if not endereco_id:
        return jsonify({"error": "ID do endereço de entrega é obrigatório"}), 400
    
    # 1. Pegar o carrinho atual do usuário
    carrinho = get_user_cart(user_id)
    if not carrinho['itens']:
        return jsonify({"error": "Carrinho vazio"}), 400

    # NEW: Price Validation - Ensure prices haven't changed since added to cart
    for item in carrinho['itens']:
        try:
            # Fetch current product details from Catalog Service using the item's slug
            # The cart item has 'produto_id', 'preco' (which is preco_base from product), and now 'slug'
            res_catalog = requests.get(f"{CATALOG_PRODUCT_DETAILS_URL}/{item['slug']}", headers={"Authorization": f"Bearer {token_original}"})
            if res_catalog.status_code != 200:
                logger.error(f"Falha ao obter detalhes do produto {item['slug']} do Catalog Service. Status: {res_catalog.status_code}")
                return jsonify({"error": f"Não foi possível validar o preço do produto '{item['nome']}'. Tente novamente."}), 500
            
            catalog_product = res_catalog.json()
            current_price = float(catalog_product.get('preco_base', 0))
            
            if abs(current_price - float(item['preco'])) > 0.001: # Use a small epsilon for float comparison
                logger.warning(f"DISCREPÂNCIA DE PREÇO: Produto {item['nome']} (ID: {item['produto_id']}). Preço no carrinho: {item['preco']}, Preço atual: {current_price}")
                return jsonify({"error": f"O preço do produto '{item['nome']}' foi alterado. Por favor, revise seu carrinho."}), 400
        except Exception as e:
            logger.error(f"Erro ao validar preço do produto {item['nome']}: {e}")
            return jsonify({"error": f"Erro interno ao validar preço do produto '{item['nome']}'."}), 500

    itens_reservados = []

    # 2. Tentar dar baixa no estoque
    for item in carrinho['itens']:
        payload_estoque = {"variacao_id": item['variacao_id'], "quantidade": item['quantidade']}
        res_estoque = requests.post(INVENTORY_URL, json={
            "variacao_id": item['variacao_id'],
            "quantidade": item['quantidade']
        }, headers={"Authorization": f"Bearer {token_original}"})
        
        if res_estoque.status_code != 200:
            logger.error(f"FALHA NO ESTOQUE: Variação ID {item['variacao_id']} (Produto: {item['nome']}) indisponível.")
            # Rollback imediato do que já foi reservado nesta tentativa
            for reservado in itens_reservados:
                requests.post(INVENTORY_ROLLBACK_URL, json=reservado, headers={"Authorization": f"Bearer {token_original}"})
            return jsonify({"error": f"Estoque insuficiente para {item['nome']} (ID Variação: {item['variacao_id']})"}), 400
        
        itens_reservados.append(payload_estoque)

    # 3. Aplicar cupom de desconto (se enviado). Revalida no servidor — nunca confia no front.
    total_venda = carrinho['total_venda']
    cupom_codigo = (data.get("cupom_codigo") or "").strip().upper()
    desconto = 0.0
    if cupom_codigo:
        res_cupom = validar_cupom(cupom_codigo, total_venda)
        if not res_cupom.get("valido"):
            for reservado in itens_reservados:   # devolve o estoque reservado antes de abortar
                requests.post(INVENTORY_ROLLBACK_URL, json=reservado, headers={"Authorization": f"Bearer {token_original}"})
            return jsonify({"error": res_cupom.get("mensagem", "Cupom inválido.")}), 400
        desconto = res_cupom["desconto"]
        total_venda = res_cupom["total"]
        logger.info(f"Cupom {cupom_codigo} aplicado: -R$ {desconto:.2f} (total: R$ {total_venda:.2f})")

    # 4. Processar o Pagamento (com o total já com o desconto do cupom)
    res_pagamento = requests.post(PAYMENT_URL, json={
        "valor": total_venda,
        "metodo": data.get("metodo", "pix")
    }, headers={"Authorization": f"Bearer {token_original}"})

    if res_pagamento.status_code != 200:
        logger.warning(f"PAGAMENTO RECUSADO: Iniciando estorno de estoque para o usuário {user_id}")
        # Estorno total: O pagamento falhou, devolvemos tudo ao estoque
        for reservado in itens_reservados:
            requests.post(INVENTORY_ROLLBACK_URL, json=reservado, headers={"Authorization": f"Bearer {token_original}"})
            logger.info(f"Solicitado estorno: Variação {reservado['variacao_id']}, Qtd {reservado['quantidade']}")
        return jsonify({"error": "Pagamento recusado"}), 402

    # 5. Registrar o pedido no Banco de Dados (total_venda já com o desconto aplicado)
    pedido_id = create_order(user_id, endereco_id, total_venda, carrinho['itens'])
    if not pedido_id:
        return jsonify({"error": "Falha ao registrar pedido no banco de dados"}), 500

    # 6. Consome 1 uso do cupom (apenas depois do pedido confirmado)
    if cupom_codigo:
        registrar_uso(cupom_codigo)

    # 7. Se tudo deu certo, envia a notificação assíncrona
    send_notification_async(
        token_original, 
        request.user.get('email'), 
        "Seu pedido na GR!TTA foi confirmado!", 
        f"Olá {request.user.get('nome', 'Cliente')}, recebemos seu pagamento. Seu estilo está a caminho!"
    )
    
    return jsonify({"success": True, "message": "Pedido finalizado com sucesso!", "pedido_id": pedido_id}), 200


@main.route("/carrinho", methods=["GET"])
@token_required
def route_get_carrinho():
    user_id = request.user.get("id")
    return jsonify(get_user_cart(user_id)), 200

@main.route("/carrinho/adicionar", methods=["POST"])
@token_required
def route_adicionar_item():
    user_id = request.user.get("id")
    data = request.get_json()
    token_original = request.headers.get("Authorization").split(" ")[1]

    variacao_id = data.get("variacao_id")
    quantidade = data.get("quantidade", 1)

    if not variacao_id:
        return jsonify({"error": "variacao_id é obrigatório"}), 400

    # 1. Validar estoque no Inventory Service antes de adicionar ao carrinho
    # Isso garante que ninguém 'fure' o limite enviando requisições manuais para a API
    try:
        res_estoque = requests.get(f"{INVENTORY_BASE_URL}/{variacao_id}", headers={"Authorization": f"Bearer {token_original}"})
        
        if res_estoque.status_code == 200:
            estoque_atual = res_estoque.json().get('estoque', 0)
            if int(quantidade) > estoque_atual:
                return jsonify({
                    "error": f"Ops! Só temos {estoque_atual} unidades em estoque para este tamanho."
                }), 400
        elif res_estoque.status_code == 404:
            return jsonify({"error": "Variação de produto não encontrada no estoque."}), 404
        else:
            return jsonify({"error": "Não foi possível validar o estoque no momento."}), 500
    except Exception as e:
        logger.error(f"Falha ao validar estoque no Checkout: {e}")
        return jsonify({"error": "Erro de comunicação com o serviço de estoque."}), 500

    if add_to_cart(user_id, data):
        return jsonify({"success": True, "message": "Item adicionado ao carrinho"}), 201
    return jsonify({"error": "Erro ao adicionar item ao carrinho"}), 500

@main.route("/carrinho/atualizar", methods=["POST"])
@token_required
def route_atualizar_carrinho():
    user_id = request.user.get("id")
    data = request.get_json()
    token_original = request.headers.get("Authorization").split(" ")[1]
    
    carrinho_item_id = data.get("carrinho_item_id")
    nova_quantidade = data.get("quantidade")

    if not carrinho_item_id or nova_quantidade is None:
        return jsonify({"error": "ID do item do carrinho e quantidade são obrigatórios"}), 400
    
    if nova_quantidade < 1:
        return jsonify({"error": "Quantidade deve ser no mínimo 1."}), 400

    # 1. Obter detalhes do item do carrinho para pegar o variacao_id
    cart_item_details = get_cart_item_details(user_id, carrinho_item_id)
    if not cart_item_details:
        return jsonify({"error": "Item do carrinho não encontrado."}), 404
    
    variacao_id = cart_item_details['variacao_id']

    # 2. Validar estoque no Inventory Service
    try:
        res_estoque = requests.get(f"{INVENTORY_BASE_URL}/{variacao_id}", headers={"Authorization": f"Bearer {token_original}"})
        
        if res_estoque.status_code == 200:
            estoque_atual = res_estoque.json().get('estoque', 0)
            if nova_quantidade > estoque_atual:
                return jsonify({
                    "error": f"Ops! Só temos {estoque_atual} unidades em estoque para este tamanho."
                }), 400
        elif res_estoque.status_code == 404:
            return jsonify({"error": "Variação de produto não encontrada no estoque."}), 404
        else:
            logger.error(f"Falha ao obter detalhes do estoque para variacao_id {variacao_id}. Status: {res_estoque.status_code}")
            return jsonify({"error": "Não foi possível validar o estoque no momento."}), 500
    except Exception as e:
        logger.error(f"Erro de comunicação com o Inventory Service ao validar estoque: {e}")
        return jsonify({"error": "Erro de comunicação com o serviço de estoque."}), 500

    # 3. Se a validação de estoque passou, atualiza o item no carrinho
    if update_cart_item(user_id, carrinho_item_id, nova_quantidade):
        return jsonify({"success": True, "message": "Quantidade atualizada"}), 200
    return jsonify({"error": "Erro ao atualizar quantidade"}), 500

@main.route("/carrinho/remover", methods=["DELETE"])
@token_required
def route_remover_item():
    user_id = request.user.get("id")
    data = request.get_json()
    
    # Esperamos o ID do item do carrinho (c.id)
    if remove_from_cart(user_id, data.get("carrinho_item_id")):
        return jsonify({"success": True, "message": "Item removido do carrinho"}), 200
    return jsonify({"error": "Erro ao remover item do carrinho"}), 500

@main.route("/pedidos", methods=["GET"])
@token_required
def route_get_orders():
    user_id = request.user.get("id")
    return jsonify(get_user_orders(user_id)), 200

@main.route("/pedidos/<int:pedido_id>", methods=["GET"])
@token_required
def route_get_order_info(pedido_id):
    user_id = request.user.get("id")
    order = get_order_info(user_id, pedido_id)
    if order:
        return jsonify(order), 200
    return jsonify({"error": "Pedido não encontrado"}), 404

@main.route("/pedidos/<int:pedido_id>/itens", methods=["GET"])
@token_required
def route_get_order_items(pedido_id):
    user_id = request.user.get("id")
    return jsonify(get_order_items(user_id, pedido_id)), 200


# ══════════════════════════════════════
#  CUPONS DE DESCONTO
# ══════════════════════════════════════
@main.route("/cupons", methods=["GET"])
@admin_required
def route_listar_cupons():
    return jsonify(listar_cupons()), 200

@main.route("/cupons", methods=["POST"])
@admin_required
def route_criar_cupom():
    novo_id, err = criar_cupom(request.get_json() or {})
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"success": True, "id": novo_id}), 201

@main.route("/cupons/<int:cupom_id>", methods=["PUT"])
@admin_required
def route_atualizar_cupom(cupom_id):
    data = request.get_json() or {}
    if "ativo" in data:
        if definir_ativo(cupom_id, bool(data["ativo"])):
            return jsonify({"success": True}), 200
        return jsonify({"error": "Cupom não encontrado."}), 404
    return jsonify({"error": "Nada para atualizar."}), 400

@main.route("/cupons/<int:cupom_id>", methods=["DELETE"])
@admin_required
def route_excluir_cupom(cupom_id):
    if excluir_cupom(cupom_id):
        return jsonify({"success": True}), 200
    return jsonify({"error": "Cupom não encontrado."}), 404

@main.route("/cupons/validar", methods=["POST"])
@token_required
def route_validar_cupom():
    """Cliente: confere o cupom e devolve o desconto (sem consumir o uso)."""
    data = request.get_json() or {}
    return jsonify(validar_cupom(data.get("codigo"), data.get("subtotal", 0))), 200