from flask import Blueprint, request, jsonify
from .gateway import processar, MAX_PARCELAS
from .auth import token_required

main = Blueprint('main', __name__)


@main.route('/processar', methods=['POST'])
@token_required
def processar_pagamento():
    data = request.json or {}
    if not data:
        return jsonify({"success": False, "message": "Dados do pagamento ausentes"}), 400

    resultado, status = processar(
        data.get('metodo'),
        data.get('valor'),
        data.get('dados') or {},
        data.get('parcelas', 1),
    )
    return jsonify(resultado), status


@main.route('/parcelas', methods=['GET'])
def opcoes_parcelas():
    """Opções de parcelamento de um valor (até 12x sem juros, parcela mínima R$ 20)."""
    valor = request.args.get('valor', 0, type=float)
    opcoes = []
    for n in range(1, MAX_PARCELAS + 1):
        parcela = valor / n if n else valor
        if n > 1 and parcela < 20:
            break
        opcoes.append({"parcelas": n, "valor_parcela": round(parcela, 2)})
    return jsonify(opcoes), 200
