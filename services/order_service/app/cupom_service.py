"""
GR!TTA — Cupons de desconto.
CRUD para o painel admin + validação/aplicação no carrinho.
Tipos: 'percentual' (% sobre o subtotal) ou 'fixo' (valor em R$).
Regras: ativo, validade (opcional), uso_maximo (opcional), valor_minimo (opcional).
"""
import datetime
import logging
from mysql.connector import IntegrityError
from .database import get_connection

logger = logging.getLogger(__name__)


def _serial(c):
    """Converte datas para string (JSON-safe)."""
    if c.get("validade"):
        c["validade"] = c["validade"].isoformat()
    if c.get("criado_em"):
        c["criado_em"] = c["criado_em"].isoformat()
    for k in ("valor", "valor_minimo"):
        if c.get(k) is not None:
            c[k] = float(c[k])
    return c


def listar_cupons():
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, codigo, tipo, valor, ativo, validade, uso_maximo, usos, "
                "valor_minimo, criado_em FROM cupons ORDER BY criado_em DESC")
    rows = [_serial(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return rows


def _validar_dados(data):
    codigo = (data.get("codigo") or "").strip().upper()
    if not codigo or len(codigo) > 50:
        return None, "Código do cupom é obrigatório (até 50 caracteres)."
    if " " in codigo:
        return None, "O código não pode ter espaços."
    tipo = data.get("tipo")
    if tipo not in ("percentual", "fixo"):
        return None, "Tipo deve ser 'percentual' ou 'fixo'."
    try:
        valor = float(data.get("valor"))
    except (TypeError, ValueError):
        return None, "Valor do desconto inválido."
    if valor <= 0:
        return None, "O valor do desconto deve ser maior que zero."
    if tipo == "percentual" and valor > 100:
        return None, "Desconto percentual não pode passar de 100%."

    validade = data.get("validade") or None
    if validade:  # 'YYYY-MM-DDTHH:MM' (datetime-local) -> 'YYYY-MM-DD HH:MM:SS'
        validade = validade.replace("T", " ")
        if len(validade) == 16:
            validade += ":00"
    uso_maximo = data.get("uso_maximo")
    uso_maximo = int(uso_maximo) if uso_maximo not in (None, "", 0, "0") else None
    valor_minimo = data.get("valor_minimo")
    try:
        valor_minimo = float(valor_minimo) if valor_minimo not in (None, "") else 0
    except (TypeError, ValueError):
        valor_minimo = 0
    return {"codigo": codigo, "tipo": tipo, "valor": valor, "validade": validade,
            "uso_maximo": uso_maximo, "valor_minimo": valor_minimo}, None


def criar_cupom(data):
    base, err = _validar_dados(data)
    if err:
        return None, err
    conn = get_connection()
    if not conn:
        return None, "Erro de conexão com o banco."
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO cupons (codigo, tipo, valor, validade, uso_maximo, valor_minimo, ativo) "
            "VALUES (%s, %s, %s, %s, %s, %s, 1)",
            (base["codigo"], base["tipo"], base["valor"], base["validade"],
             base["uso_maximo"], base["valor_minimo"]))
        conn.commit()
        return cur.lastrowid, None
    except IntegrityError:
        conn.rollback()
        return None, "Já existe um cupom com esse código."
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao criar cupom: {e}")
        return None, "Não foi possível criar o cupom."
    finally:
        cur.close()
        conn.close()


def definir_ativo(cupom_id, ativo):
    """Ativa/desativa um cupom (ação principal do painel)."""
    conn = get_connection()
    if not conn:
        return False
    cur = conn.cursor()
    try:
        cur.execute("UPDATE cupons SET ativo = %s WHERE id = %s", (1 if ativo else 0, cupom_id))
        conn.commit()
        return cur.rowcount > 0
    finally:
        cur.close()
        conn.close()


def excluir_cupom(cupom_id):
    conn = get_connection()
    if not conn:
        return False
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM cupons WHERE id = %s", (cupom_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        cur.close()
        conn.close()


def validar_cupom(codigo, subtotal):
    """Valida um cupom contra o subtotal e calcula o desconto. NÃO consome o uso."""
    codigo = (codigo or "").strip().upper()
    if not codigo:
        return {"valido": False, "mensagem": "Informe um código de cupom."}
    try:
        subtotal = float(subtotal)
    except (TypeError, ValueError):
        subtotal = 0.0

    conn = get_connection()
    if not conn:
        return {"valido": False, "mensagem": "Erro de conexão."}
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM cupons WHERE codigo = %s", (codigo,))
    c = cur.fetchone()
    cur.close()
    conn.close()

    if not c:
        return {"valido": False, "mensagem": "Cupom não encontrado."}
    if not c["ativo"]:
        return {"valido": False, "mensagem": "Este cupom não está mais ativo."}
    if c["validade"] and c["validade"] < datetime.datetime.now():
        return {"valido": False, "mensagem": "Este cupom expirou."}
    if c["uso_maximo"] is not None and c["usos"] >= c["uso_maximo"]:
        return {"valido": False, "mensagem": "Este cupom atingiu o limite de usos."}
    minimo = float(c["valor_minimo"] or 0)
    if subtotal < minimo:
        return {"valido": False,
                "mensagem": f"Este cupom exige um pedido mínimo de R$ {minimo:.2f}."}

    if c["tipo"] == "percentual":
        desconto = subtotal * float(c["valor"]) / 100.0
    else:
        desconto = float(c["valor"])
    desconto = round(min(desconto, subtotal), 2)
    return {
        "valido": True, "codigo": codigo, "tipo": c["tipo"], "valor": float(c["valor"]),
        "desconto": desconto, "total": round(subtotal - desconto, 2),
        "mensagem": "Cupom aplicado!"
    }


def registrar_uso(codigo):
    """Incrementa o contador de usos (chamado após o pedido ser concluído)."""
    codigo = (codigo or "").strip().upper()
    if not codigo:
        return
    conn = get_connection()
    if not conn:
        return
    cur = conn.cursor()
    try:
        cur.execute("UPDATE cupons SET usos = usos + 1 WHERE codigo = %s", (codigo,))
        conn.commit()
    except Exception as e:
        logger.error(f"Erro ao registrar uso do cupom {codigo}: {e}")
    finally:
        cur.close()
        conn.close()
