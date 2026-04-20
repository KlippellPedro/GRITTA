from .database import get_connection

def get_all_products(tipo=None, special=None, drop=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Iniciamos a query básica
    query = """
        SELECT p.*, i.caminho_imagem as imagem, SUM(v.estoque) as total_estoque,
               GROUP_CONCAT(DISTINCT v.tamanho) as tamanhos_disponiveis
        FROM produtos p 
        LEFT JOIN imagens_produto i ON p.id = i.produto_id AND i.ordem_exibicao = 0 
        LEFT JOIN variacoes v ON p.id = v.produto_id 
        WHERE p.ativo = 1"""
    params = []

    # Se o frontend mandou ?tipo=camisa
    if tipo:
        # Mapeamento para converter o plural da URL para o singular do ENUM no Banco
        mapping = {
            'camisetas': 'camisa',
            'moletons': 'moletom',
            'calcas': 'calca',
            'tenis': 'tenis',
            'acessorios': 'acessorio'
        }
        tipo_filtrado = mapping.get(tipo.lower(), tipo)
        query += " AND tipo = %s"
        params.append(tipo_filtrado)

    # Se o frontend mandou ?special=true
    if special == 'true':
        query += " AND is_special = 1"

    # Se o frontend mandou ?drop=Verao2026
    if drop:
        query += " AND drop_nome = %s"
        params.append(drop)

    # O agrupamento DEVE vir depois de todos os filtros WHERE
    query += " GROUP BY p.id"

    cursor.execute(query, params)
    produtos = cursor.fetchall()

    cursor.close()
    conn.close()
    
    return produtos

def get_product_by_slug(slug):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Buscamos o produto e suas variações (tamanhos) em uma única query
    query = """
        SELECT p.*, i.caminho_imagem as imagem,
               GROUP_CONCAT(CONCAT(v.id, ':', v.tamanho, ':', v.estoque)) as variacoes
        FROM produtos p
        LEFT JOIN imagens_produto i ON p.id = i.produto_id AND i.ordem_exibicao = 0
        LEFT JOIN variacoes v ON p.id = v.produto_id
        WHERE (p.slug = %s OR p.id = %s) 
        AND p.ativo = 1
        GROUP BY p.id
        LIMIT 1
    """
    
    cursor.execute(query, (slug, slug))
    produto = cursor.fetchone()
    
    cursor.close()
    conn.close()
    return produto

def get_related_products(exclude_id, limit=4):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Sugere produtos do mesmo tipo (categoria), excluindo o que o usuário já está vendo
    query = """
        SELECT p.*, i.caminho_imagem as imagem 
        FROM produtos p
        LEFT JOIN imagens_produto i ON p.id = i.produto_id AND i.ordem_exibicao = 0
        WHERE p.id != %s 
        AND p.tipo = (SELECT tipo FROM produtos WHERE id = %s)
        AND p.ativo = 1
        LIMIT %s
    """
    
    cursor.execute(query, (exclude_id, exclude_id, limit))
    produtos = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return produtos