from flask import Blueprint, request, jsonify
from .service import (get_user_by_id, update_user, get_user_addresses, add_address,
                     delete_address, get_user_favorites, add_favorite, remove_favorite)
from .auth import token_required

main = Blueprint('main', __name__)


def _eh_dono(user_id):
    """True se o id da URL é o mesmo do usuário autenticado (anti-IDOR)."""
    return user_id == request.user.get('id')

@main.route('/users/<int:user_id>', methods=['GET'])
@token_required
def profile(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    user = get_user_by_id(user_id)
    return jsonify(user) if user else (jsonify({"error": "User not found"}), 404)

@main.route('/users/<int:user_id>', methods=['PUT'])
@token_required
def update_profile(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    data = request.json
    if update_user(user_id, data):
        return jsonify({"message": "Perfil atualizado"}), 200
    return jsonify({"error": "Falha ao atualizar"}), 400

@main.route('/users/<int:user_id>/addresses', methods=['GET'])
@token_required
def list_addresses(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    return jsonify(get_user_addresses(user_id)), 200

@main.route('/users/<int:user_id>/addresses', methods=['POST'])
@token_required
def create_address(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    data = request.json
    addr_id = add_address(user_id, data)
    return jsonify({"id": addr_id}), 201

@main.route('/users/<int:user_id>/addresses/<int:address_id>', methods=['DELETE'])
@token_required
def remove_address(user_id, address_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    if delete_address(user_id, address_id):
        return jsonify({"message": "Endereço removido"}), 200
    return jsonify({"error": "Falha ao remover"}), 400

@main.route('/favoritos', methods=['GET'])
@token_required
def list_favs():
    user_id = request.user.get('id')
    return jsonify(get_user_favorites(user_id)), 200

@main.route('/favoritos', methods=['POST'])
@token_required
def create_fav():
    user_id = request.user.get('id')
    data = request.json
    fav_id = add_favorite(user_id, data.get('produto_id'))
    if fav_id:
        return jsonify({"id": fav_id}), 201
    return jsonify({"error": "Erro ao favoritar"}), 400

@main.route('/favoritos/<int:fav_id>', methods=['DELETE'])
@token_required
def delete_fav(fav_id):
    user_id = request.user.get('id')
    if remove_favorite(user_id, fav_id):
        return jsonify({"message": "Removido"}), 200
    return jsonify({"error": "Erro ao remover"}), 400