"""
GR!TTA — Camada de pagamento.
Suporta PIX, cartão de crédito e boleto. Funciona em modo SIMULAÇÃO enquanto
não houver chave de gateway; a estrutura já está pronta para plugar um provedor
real (Mercado Pago / Stripe / Pagar.me) no futuro — basta setar GATEWAY_API_KEY.
"""
import os
import re
import time
import random
import datetime
import logging

logger = logging.getLogger(__name__)

# ── Config do gateway (preencher no .env do payment_service no futuro) ──
GATEWAY_PROVIDER = os.getenv("GATEWAY_PROVIDER", "simulado")   # ex.: 'mercadopago', 'stripe'
GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "")             # vazio = modo simulação

METODOS = ("pix", "cartao", "boleto")
MAX_PARCELAS = 12


def _luhn(num):
    soma, alt = 0, False
    for d in reversed(num):
        d = int(d)
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        soma += d
        alt = not alt
    return soma % 10 == 0


def detectar_bandeira(num):
    if re.match(r"^4", num):
        return "Visa"
    if re.match(r"^5[1-5]", num) or re.match(r"^222[1-9]|^22[3-9]|^2[3-6]|^27[01]|^2720", num):
        return "Mastercard"
    if re.match(r"^3[47]", num):
        return "Amex"
    if re.match(r"^(4011|4312|4389|5041|5066|5067|509|6277|6362|6363|650|651|655)", num):
        return "Elo"
    if re.match(r"^(606282|3841)", num):
        return "Hipercard"
    if re.match(r"^(30|36|38|39)", num):
        return "Diners"
    return "Cartão"


def validar_cartao(dados):
    num = re.sub(r"\D", "", str(dados.get("numero", "")))
    if len(num) < 13 or len(num) > 19 or not _luhn(num):
        return None, "Número do cartão inválido."

    m = re.match(r"^(\d{2})\s*/\s*(\d{2,4})$", str(dados.get("validade", "")).strip())
    if not m:
        return None, "Validade inválida (use MM/AA)."
    mes = int(m.group(1))
    ano = int(m.group(2))
    ano = ano + 2000 if ano < 100 else ano
    if mes < 1 or mes > 12:
        return None, "Mês da validade inválido."
    hoje = datetime.date.today()
    if (ano, mes) < (hoje.year, hoje.month):
        return None, "Cartão vencido."

    cvv = re.sub(r"\D", "", str(dados.get("cvv", "")))
    if len(cvv) < 3 or len(cvv) > 4:
        return None, "CVV inválido."
    if len(str(dados.get("nome", "")).strip()) < 3:
        return None, "Informe o nome impresso no cartão."

    return {"bandeira": detectar_bandeira(num), "ultimos4": num[-4:]}, None


def _gerar_pix_copia_cola():
    chave = "".join(random.choices("ABCDEFGHJKMNPQRSTUVWXYZ23456789", k=30))
    return ("00020126360014BR.GOV.BCB.PIX0114gritta@pix.com" + chave +
            "5204000053039865802BR5910GRITTA LTDA6009SAO PAULO62070503***6304%04d" % random.randint(0, 9999))


def _gerar_boleto_linha():
    return " ".join("".join(random.choices("0123456789", k=11)) for _ in range(4))


def processar(metodo, valor, dados=None, parcelas=1):
    """Processa o pagamento. Retorna (resultado, http_status)."""
    dados = dados or {}
    if metodo not in METODOS:
        return {"success": False, "message": "Método de pagamento inválido."}, 400
    try:
        valor = float(valor)
    except (TypeError, ValueError):
        return {"success": False, "message": "Valor inválido."}, 400
    if valor <= 0:
        return {"success": False, "message": "Valor inválido."}, 400

    extra = {}
    if metodo == "cartao":
        info, err = validar_cartao(dados)
        if err:
            return {"success": False, "message": err}, 400
        try:
            parcelas = max(1, min(MAX_PARCELAS, int(parcelas or 1)))
        except (TypeError, ValueError):
            parcelas = 1
        extra = {"bandeira": info["bandeira"], "ultimos4": info["ultimos4"],
                 "parcelas": parcelas, "valor_parcela": round(valor / parcelas, 2)}
    elif metodo == "pix":
        extra = {"pix_copia_cola": _gerar_pix_copia_cola(), "expira_em_min": 30}
    elif metodo == "boleto":
        extra = {"boleto_linha": _gerar_boleto_linha(),
                 "vencimento": (datetime.date.today() + datetime.timedelta(days=3)).isoformat()}

    # ───────────────────────────────────────────────────────────────
    #  GATEWAY REAL (futuro): quando GATEWAY_API_KEY estiver no .env,
    #  é aqui que chamamos o provedor de verdade. Sem a chave, simula.
    # ───────────────────────────────────────────────────────────────
    if GATEWAY_API_KEY:
        # TODO: integrar provedor real, ex.:
        #   import requests
        #   resp = requests.post(URL_DO_PROVEDOR, headers={"Authorization": f"Bearer {GATEWAY_API_KEY}"},
        #                        json={"valor": valor, "metodo": metodo, ...})
        #   return _mapear_resposta(resp), resp.status_code
        logger.info("GATEWAY_API_KEY presente, mas integração real ainda não plugada — usando simulação.")

    # ── Simulação (aprova) ──
    time.sleep(0.5)
    return {
        "success": True,
        "status": "pago",
        "metodo": metodo,
        "transacao_id": "GR-PAY-%06d" % random.randint(0, 999999),
        "modo": "simulado" if not GATEWAY_API_KEY else GATEWAY_PROVIDER,
        **extra,
    }, 200
