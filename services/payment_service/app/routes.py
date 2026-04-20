from flask import Blueprint, request, jsonify
import time
import random

main = Blueprint('main', __name__)

@main.route('/processar', methods=['POST'])
def processar_pagamento():
    data = request.json
    if not data:
        return jsonify({"success": False, "message": "Dados do pagamento ausentes"}), 400

    valor = data.get('valor')
    metodo = data.get('metodo') # 'pix' ou 'cartao'

    # Simulação de processamento (Stripe/Mercado Pago/Pix)
    time.sleep(1.5)

    # Mock de aprovação (90% de chance de sucesso)
    if random.random() < 0.9:
        return jsonify({
            "success": True,
            "transacao_id": f"GR-PAY-{random.randint(100000, 999999)}",
            "status": "pago"
        }), 200
    
    return jsonify({"success": False, "message": "Pagamento recusado pela operadora"}), 402