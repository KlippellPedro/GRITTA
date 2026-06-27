"""
GR!TTA — Cálculo de frete por CEP.
Simulação por região (1º dígito do CEP define a macrorregião do Brasil),
sem depender de API externa. Frete grátis acima do valor mínimo.
"""
import re
from .database import get_connection

FRETE_GRATIS_MIN = 399.90

# 1º dígito do CEP -> (região, valor base, prazo em dias úteis)
REGIOES = {
    "0": ("Sudeste", 19.90, 3),
    "1": ("Sudeste", 19.90, 3),
    "2": ("Sudeste", 22.90, 4),
    "3": ("Sudeste", 22.90, 4),
    "4": ("Nordeste", 29.90, 7),
    "5": ("Nordeste", 32.90, 8),
    "6": ("Norte", 39.90, 10),
    "7": ("Centro-Oeste", 27.90, 6),
    "8": ("Sul", 24.90, 5),
    "9": ("Sul", 21.90, 4),
}


def calcular_frete(cep, subtotal):
    cep_num = re.sub(r"\D", "", cep or "")
    if len(cep_num) != 8:
        return None, "CEP inválido. Informe os 8 dígitos."
    try:
        subtotal = float(subtotal or 0)
    except (TypeError, ValueError):
        subtotal = 0.0

    regiao, valor, prazo = REGIOES.get(cep_num[0], ("Sudeste", 24.90, 5))
    gratis = subtotal >= FRETE_GRATIS_MIN
    return {
        "cep": cep_num,
        "regiao": regiao,
        "frete": 0.0 if gratis else round(valor, 2),
        "prazo_dias": prazo,
        "gratis": gratis,
        "minimo_gratis": FRETE_GRATIS_MIN,
    }, None


def get_endereco_cep(endereco_id, usuario_id):
    """CEP do endereço do usuário (autoritativo no checkout). None se não for dele."""
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor()
    try:
        cur.execute("SELECT cep FROM enderecos WHERE id = %s AND usuario_id = %s",
                    (endereco_id, usuario_id))
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        cur.close()
        conn.close()
