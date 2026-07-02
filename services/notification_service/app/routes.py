import re
from flask import Blueprint, request, jsonify
from .email_service import processar_envio_email
from .email_templates import montar
from .auth import token_required

main = Blueprint('main', __name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@main.route('/email', methods=['POST'])
@token_required
def enviar_email():
    data = request.json
    destinatario = data.get('email')
    assunto = data.get('assunto')
    mensagem = data.get('mensagem')
    html = data.get('html')

    sucesso, msg_resultado = processar_envio_email(destinatario, assunto, mensagem, html)

    if sucesso:
        return jsonify({"success": True, "message": msg_resultado}), 200
    return jsonify({"success": False, "message": msg_resultado}), 400


@main.route('/email/template', methods=['POST'])
@token_required
def enviar_email_template():
    """Monta um e-mail profissional a partir de um tipo ('boas_vindas',
    'pedido_confirmado', 'newsletter') + dados, e envia."""
    data = request.json or {}
    montado = montar(data.get('tipo'), data.get('dados') or {})
    if not montado:
        return jsonify({"success": False, "message": "Tipo de e-mail inválido."}), 400
    assunto, texto, html = montado
    sucesso, msg_resultado = processar_envio_email(data.get('email'), assunto, texto, html)
    if sucesso:
        return jsonify({"success": True, "message": msg_resultado}), 200
    return jsonify({"success": False, "message": msg_resultado}), 400


@main.route('/newsletter', methods=['POST'])
def assinar_newsletter():
    """Público: entra na lista VIP e recebe o e-mail de boas-vindas VIP.
    Envia somente o template fixo (não permite conteúdo arbitrário)."""
    data = request.json or {}
    email = (data.get('email') or '').strip()
    if not _EMAIL_RE.match(email):
        return jsonify({"success": False, "message": "E-mail inválido."}), 400
    assunto, texto, html = montar("newsletter", {"nome": data.get('nome', '')})
    processar_envio_email(email, assunto, texto, html)   # best-effort
    return jsonify({"success": True, "message": "Pronto! Você está na lista VIP da GR!TTA."}), 200