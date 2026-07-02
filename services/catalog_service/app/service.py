from .database import get_connection

ORDENS = {
    'preco_asc': 'p.preco_base ASC',
    'preco_desc': 'p.preco_base DESC',
    'recentes': 'p.criado_em DESC',
    'nome': 'p.nome ASC',
}

def get_all_products(tipo=None, special=None, drop=None, q=None,
                     preco_min=None, preco_max=None, tamanho=None, ordem=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Iniciamos a query básica
    query = """
        SELECT p.*, i.caminho_imagem as imagem, i2.caminho_imagem as imagem_2,
               SUM(v.estoque) as total_estoque,
               GROUP_CONCAT(DISTINCT v.tamanho) as tamanhos_disponiveis,
               GROUP_CONCAT(CONCAT(v.id, ':', v.tamanho, ':', v.estoque)) as variacoes
        FROM produtos p
        LEFT JOIN imagens_produto i  ON p.id = i.produto_id  AND i.ordem_exibicao  = 0
        LEFT JOIN imagens_produto i2 ON p.id = i2.produto_id AND i2.ordem_exibicao = 1
        LEFT JOIN variacoes v ON p.id = v.produto_id
        WHERE p.ativo = 1"""
    params = []

    # Busca por texto (?q=...) — casa por nome
    if q:
        termo = q.strip()
        if termo:
            query += " AND p.nome LIKE %s"
            params.append(f"%{termo}%")

    # Se o frontend mandou ?tipo=camisa
    if tipo:
        # Mapeamento para converter slugs de URL para o ENUM do banco
        mapping = {
            # slugs legados (mantidos para não quebrar links antigos)
            'camisas':           'camisa',
            'camisetas':         'camisa',
            'moletons':          'moletom',
            'calcas':            'calca',
            'tenis':             'tenis',
            'acessorios':        'acessorio',
            # novos slugs unificados da taxonomia 2026
            'camisa-e-t-shirt':  'camisa',
            'casacos-e-jaqueta': 'jaqueta',
            # singulares passados diretamente
            'camisa':    'camisa',
            'moletom':   'moletom',
            'calca':     'calca',
            'acessorio': 'acessorio',
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

    # Filtro de preço (?preco_min / ?preco_max)
    if preco_min not in (None, ''):
        try:
            query += " AND p.preco_base >= %s"; params.append(float(preco_min))
        except (TypeError, ValueError):
            pass
    if preco_max not in (None, ''):
        try:
            query += " AND p.preco_base <= %s"; params.append(float(preco_max))
        except (TypeError, ValueError):
            pass

    # Filtro por tamanho disponível em estoque (?tamanho=M)
    if tamanho:
        query += " AND p.id IN (SELECT produto_id FROM variacoes WHERE tamanho = %s AND estoque > 0)"
        params.append(tamanho.strip())

    # O agrupamento DEVE vir depois de todos os filtros WHERE
    query += " GROUP BY p.id"

    # Ordenação (?ordem=preco_asc|preco_desc|recentes|nome)
    if ordem in ORDENS:
        query += " ORDER BY " + ORDENS[ordem]

    cursor.execute(query, params)
    produtos = cursor.fetchall()

    cursor.close()
    conn.close()
    
    return produtos

def get_product_by_slug(slug):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT p.*,
               SUBSTRING_INDEX(
                 GROUP_CONCAT(ia.caminho_imagem ORDER BY ia.ordem_exibicao SEPARATOR '|'), '|', 1
               ) as imagem,
               GROUP_CONCAT(ia.caminho_imagem ORDER BY ia.ordem_exibicao SEPARATOR '|') as todas_imagens,
               GROUP_CONCAT(DISTINCT CONCAT(v.id, ':', v.tamanho, ':', v.estoque)) as variacoes
        FROM produtos p
        LEFT JOIN imagens_produto ia ON p.id = ia.produto_id
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