from flask import Blueprint, request, jsonify
from .service import get_all_products, get_product_by_slug, get_related_products
from .storefront import get_estado, list_drops, set_estado
from .auth import admin_required

main = Blueprint('main', __name__)

@main.route('/products', methods=['GET'])
def list_products():
    # 1. Captura os parâmetros da URL (Query String)
    tipo = request.args.get('tipo')
    special = request.args.get('special') # Captura ?special=true
    drop = request.args.get('drop')       # Captura ?drop=NomeDoDrop
    q = request.args.get('q')             # Captura ?q=termo (busca por nome)

    # 2. Passa esses filtros para a camada de serviço
    produtos = get_all_products(tipo=tipo, special=special, drop=drop, q=q)
    return jsonify(produtos), 200

@main.route('/products/<string:slug>', methods=['GET'])
def get_product(slug):
    produto = get_product_by_slug(slug)
    if produto:
        return jsonify(produto), 200
    return jsonify({"error": "Produto não encontrado"}), 404

@main.route('/products/<int:product_id>/related', methods=['GET'])
def get_related(product_id):
    limit = request.args.get('limit', 4, type=int)
    # Busca produtos relacionados baseado no tipo do produto atual
    produtos = get_related_products(product_id, limit)
    return jsonify(produtos), 200


# ─────────────────────────────────────────────
#  STOREFRONT — estado da loja / drops ativos
# ─────────────────────────────────────────────
@main.route('/storefront', methods=['GET'])
def storefront_get():
    """Público: o front lê o estado ativo e aplica as personalizações."""
    return jsonify(get_estado()), 200


@main.route('/storefront/drops', methods=['GET'])
@admin_required
def storefront_list():
    """Admin: lista os drops/configs disponíveis."""
    return jsonify(list_drops()), 200


@main.route('/storefront', methods=['PUT'])
@admin_required
def storefront_set():
    """Admin: define o drop ativo (ou 'normal'). Grava em drops/_estado.json."""
    data = request.get_json(silent=True) or {}
    estado, err = set_estado(data.get('ativo'))
    if err:
        return jsonify({"error": err}), 400
    return jsonify(estado), 200