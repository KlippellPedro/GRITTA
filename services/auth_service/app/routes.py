from flask import Blueprint, request, jsonify
from .service import register_user, login_user, refresh_access_token, request_password_reset, reset_password

main = Blueprint('main', __name__)

@main.route('/register', methods=['POST'])
def register():
    data = request.json
    user_id, error = register_user(data)
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "message": "Usuário registrado!", "id": user_id}), 201

@main.route('/login', methods=['POST'])
def login():
    data = request.json
    response, status = login_user(data)
    return jsonify(response), status

@main.route('/refresh', methods=['POST'])
def refresh():
    data = request.json
    token = data.get('refresh_token')
    response, status = refresh_access_token(token)
    return jsonify(response), status

@main.route('/forgot-password', methods=['POST'])
def forgot():
    email = request.json.get('email')
    response, status = request_password_reset(email)
    return jsonify(response), status

@main.route('/reset-password', methods=['POST'])
def reset():
    data = request.json
    response, status = reset_password(data.get('token'), data.get('senha'))
    return jsonify(response), status