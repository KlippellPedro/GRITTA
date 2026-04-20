from flask import Blueprint, request, jsonify
from .service import list_users, get_user, create_user, update_user, delete_user, list_favorites, add_favorite, remove_favorite
from .auth import token_required

main = Blueprint("main", __name__)

@main.route("/users", methods=["GET"])
@token_required
def route_list_users():
    users = list_users()
    return jsonify(users), 200

@main.route("/users/<int:user_id>", methods=["GET"])
@token_required
def route_get_user(user_id):
    user = get_user(user_id)
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Usuário não encontrado"}), 404

@main.route("/users", methods=["POST"])
@token_required
def route_create_user():
    data = request.get_json()
    user_id, msg = create_user(data)
    if not user_id:
        return jsonify({"error": msg}), 400
    return jsonify({"message": "Usuário criado", "id": user_id}), 201

@main.route("/users/<int:user_id>", methods=["PUT"])
@token_required
def route_update_user(user_id):
    data = request.get_json()
    update_user(user_id, data)
    return jsonify({"message": "Usuário atualizado"}), 200

@main.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
def route_delete_user(user_id):
    delete_user(user_id)
    return jsonify({"message": "Usuário removido"}), 200

# --- ROTAS DE FAVORITOS ---

@main.route("/favoritos", methods=["GET"])
@token_required
def route_list_favorites():
    # O ID do usuário vem do token (decodificado no decorator token_required)
    user_id = request.user.get("id")
    favs = list_favorites(user_id)
    return jsonify(favs), 200

@main.route("/favoritos", methods=["POST"])
@token_required
def route_add_favorite():
    user_id = request.user.get("id")
    data = request.get_json()
    fav_id, msg = add_favorite(user_id, data.get("produto_id"))
    if not fav_id:
        return jsonify({"error": msg}), 400
    return jsonify({"message": "Adicionado aos favoritos", "id": fav_id}), 201

@main.route("/favoritos/<int:fav_id>", methods=["DELETE"])
@token_required
def route_remove_favorite(fav_id):
    user_id = request.user.get("id")
    remove_favorite(user_id, fav_id)
    return jsonify({"message": "Removido dos favoritos"}), 200