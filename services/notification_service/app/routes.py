from flask import Blueprint, request, jsonify
from .service import processar_envio_email
from .auth import token_required

main = Blueprint('main', __name__)

@main.route('/email', methods=['POST'])
@token_required
def enviar_email():
    data = request.json
    destinatario = data.get('email')
    assunto = data.get('assunto')
    mensagem = data.get('mensagem')

    sucesso, msg_resultado = processar_envio_email(destinatario, assunto, mensagem)

    if sucesso:
        return jsonify({"success": True, "message": msg_resultado}), 200
    return jsonify({"success": False, "message": msg_resultado}), 400