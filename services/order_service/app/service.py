from .database import get_connection
from mysql.connector import IntegrityError
import logging

# Configuração do Logger para o Service
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

def get_user_cart(user_id):
    conn = get_connection()
    if not conn: return {"itens": [], "total_itens": 0}
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            c.id, c.variacao_id, c.quantidade,
            p.id as produto_id, p.nome, p.preco_base as preco, p.slug,
            ip.caminho_imagem as imagem,
            v.tamanho, v.estoque
        FROM carrinhos c
        JOIN variacoes v ON c.variacao_id = v.id
        JOIN produtos p ON v.produto_id = p.id
        LEFT JOIN imagens_produto ip ON p.id = ip.produto_id AND ip.ordem_exibicao = 0
        WHERE c.usuario_id = %s
    """
    cursor.execute(query, (user_id,))
    itens = cursor.fetchall()
    cursor.close()
    conn.close()
    
    total_itens = sum(item['quantidade'] for item in itens)
    total_venda = sum(float(item['preco']) * item['quantidade'] for item in itens)
    return {"itens": itens, "total_itens": total_itens, "total_venda": total_venda}

def add_to_cart(user_id, dados):
    conn = get_connection()
    if not conn: return False
    cursor = conn.cursor()
    
    variacao_id = dados.get("variacao_id") # Agora esperamos o ID da variação
    quantidade = dados.get("quantidade", 1)

    try:
        # Tenta inserir. Se já existir (UNIQUE(usuario_id, variacao_id)), atualiza a quantidade
        cursor.execute(
            "INSERT INTO carrinhos (usuario_id, variacao_id, quantidade) VALUES (%s, %s, %s) "
            "ON DUPLICATE KEY UPDATE quantidade = quantidade + %s",
            (user_id, variacao_id, quantidade, quantidade)
        )
        conn.commit()
        return True
    except IntegrityError as e:
        conn.rollback()
        logger.error(f"Erro de integridade ao adicionar ao carrinho: {e}")
        return False
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao adicionar ao carrinho: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def update_cart_item(user_id, carrinho_item_id, nova_quantidade):
    conn = get_connection()
    if not conn: return False
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE carrinhos SET quantidade = %s WHERE id = %s AND usuario_id = %s",
            (nova_quantidade, carrinho_item_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0 # Retorna True se alguma linha foi afetada
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao atualizar item do carrinho: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def remove_from_cart(user_id, carrinho_item_id):
    conn = get_connection()
    if not conn: return False
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "DELETE FROM carrinhos WHERE id = %s AND usuario_id = %s",
            (carrinho_item_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0 # Retorna True se alguma linha foi afetada
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao remover item do carrinho: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def get_user_orders(user_id):
    conn = get_connection()
    if not conn: return []
    cursor = conn.cursor(dictionary=True)
    
    # Busca o resumo dos pedidos do usuário
    query = "SELECT id, total_pedido, status, codigo_rastreio, criado_em FROM pedidos WHERE usuario_id = %s ORDER BY criado_em DESC"
    cursor.execute(query, (user_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return orders

def get_order_items(user_id, pedido_id):
    conn = get_connection()
    if not conn: return []
    cursor = conn.cursor(dictionary=True)
    
    # Busca os itens do pedido garantindo que o pedido pertence ao usuário logado
    query = """
        SELECT ip.quantidade, ip.preco_unitario, p.nome, v.tamanho, img.caminho_imagem as imagem
        FROM itens_pedido ip
        JOIN variacoes v ON ip.variacao_id = v.id
        JOIN produtos p ON v.produto_id = p.id
        LEFT JOIN imagens_produto img ON p.id = img.produto_id AND img.ordem_exibicao = 0
        JOIN pedidos ped ON ip.pedido_id = ped.id
        WHERE ip.pedido_id = %s AND ped.usuario_id = %s
    """
    cursor.execute(query, (pedido_id, user_id))
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return items

def get_order_info(user_id, pedido_id):
    conn = get_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    
    query = "SELECT id, total_pedido, criado_em FROM pedidos WHERE id = %s AND usuario_id = %s"
    cursor.execute(query, (pedido_id, user_id))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    return order

def get_cart_item_details(user_id, carrinho_item_id):
    conn = get_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT c.variacao_id, c.quantidade
        FROM carrinhos c
        WHERE c.id = %s AND c.usuario_id = %s
    """
    cursor.execute(query, (carrinho_item_id, user_id))
    item = cursor.fetchone()
    cursor.close()
    conn.close()
    return item

def create_order(user_id, endereco_id, total, itens):
    """
    Registra o pedido, seus itens e limpa o carrinho em uma única transação.
    """
    conn = get_connection()
    if not conn: return None
    cursor = conn.cursor()
    
    try:
        # 1. Inserir o Pedido (Header)
        cursor.execute(
            "INSERT INTO pedidos (usuario_id, endereco_entrega_id, total_pedido, status) VALUES (%s, %s, %s, %s)",
            (user_id, endereco_id, total, 'Pago')
        )
        pedido_id = cursor.lastrowid

        # 2. Inserir os Itens do Pedido
        for item in itens:
            cursor.execute(
                "INSERT INTO itens_pedido (pedido_id, variacao_id, quantidade, preco_unitario) VALUES (%s, %s, %s, %s)",
                (pedido_id, item['variacao_id'], item['quantidade'], item['preco'])
            )

        # 3. Limpar o Carrinho do Usuário
        cursor.execute("DELETE FROM carrinhos WHERE usuario_id = %s", (user_id,))

        conn.commit()
        return pedido_id
    except Exception as e:
        conn.rollback()
        logger.error(f"[ERRO CREATE ORDER] {e}")
        return None
    finally:
        cursor.close()
        conn.close()