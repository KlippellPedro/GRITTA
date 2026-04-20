from flask import Blueprint, request, jsonify
from .service import get_all_products, get_product_by_slug, get_related_products

main = Blueprint('main', __name__)

@main.route('/products', methods=['GET'])
def list_products():
    # 1. Captura os parâmetros da URL (Query String)
    tipo = request.args.get('tipo')
    special = request.args.get('special') # Captura ?special=true
    drop = request.args.get('drop')       # Captura ?drop=NomeDoDrop

    # 2. Passa esses filtros para a camada de serviço
    produtos = get_all_products(tipo=tipo, special=special, drop=drop)
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