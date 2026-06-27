from flask import Blueprint, request, jsonify
from .service import get_all_products, get_product_by_slug, get_related_products
from .storefront import (
    get_estado, list_drops, set_estado,
    ler_drop, salvar_drop, excluir_drop
)
from .auth import admin_required, token_required
from .admin_service import (
    listar_produtos, obter_produto, criar_produto,
    atualizar_produto, desativar_produto, salvar_upload,
    atribuir_drop, ids_do_drop
)
from .avaliacao_service import listar_avaliacoes, criar_avaliacao

main = Blueprint('main', __name__)

@main.route('/products', methods=['GET'])
def list_products():
    # 1. Captura os parâmetros da URL (Query String)
    tipo = request.args.get('tipo')
    special = request.args.get('special') # Captura ?special=true
    drop = request.args.get('drop')       # Captura ?drop=NomeDoDrop
    q = request.args.get('q')             # Captura ?q=termo (busca por nome)

    # 2. Passa esses filtros para a camada de serviço
    produtos = get_all_products(tipo=tipo, special=special, drop=drop, q=q)
    return jsonify(produtos), 200

@main.route('/products/<string:slug>', methods=['GET'])
def get_product(slug):
    produto = get_product_by_slug(slug)
    if produto:
        return jsonify(produto), 200
    return jsonify({"error": "Produto não encontrado"}), 404

@main.route('/products/<int:product_id>/related', methods=['GET'])
def get_related(product_id):
    limit = request.args.get('limit', 4, type=int)
    # Busca produtos relacionados baseado no tipo do produto atual
    produtos = get_related_products(product_id, limit)
    return jsonify(produtos), 200


# ─────────────────────────────────────────────
#  AVALIAÇÕES (reviews) de produtos
# ─────────────────────────────────────────────
@main.route('/products/<string:slug>/avaliacoes', methods=['GET'])
def get_avaliacoes(slug):
    """Público: lista as avaliações de um produto + média e total."""
    return jsonify(listar_avaliacoes(slug)), 200


@main.route('/products/<int:product_id>/avaliacoes', methods=['POST'])
@token_required
def post_avaliacao(product_id):
    """Cliente logado: cria/atualiza sua avaliação (1 por produto)."""
    data = request.get_json(silent=True) or {}
    ok, err = criar_avaliacao(product_id, request.user.get('id'),
                              data.get('nota'), data.get('comentario'))
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"success": True}), 201


# ─────────────────────────────────────────────
#  STOREFRONT — estado da loja / drops ativos
# ─────────────────────────────────────────────
@main.route('/storefront', methods=['GET'])
def storefront_get():
    """Público: o front lê o estado ativo e aplica as personalizações."""
    return jsonify(get_estado()), 200


@main.route('/storefront/drops', methods=['GET'])
@admin_required
def storefront_list():
    """Admin: lista os drops/configs disponíveis."""
    return jsonify(list_drops()), 200


@main.route('/storefront/drops/<drop_id>', methods=['GET'])
@admin_required
def storefront_drop_get(drop_id):
    """Admin: carrega a config de um drop + quais peças estão nele (para editar)."""
    config = ler_drop(drop_id)
    if config is None:
        return jsonify({"error": "Drop não encontrado"}), 404
    return jsonify({"config": config, "produto_ids": ids_do_drop(config.get('drop_nome'))}), 200


@main.route('/storefront/drops', methods=['POST'])
@admin_required
def storefront_drop_save():
    """Admin: grava drops/<id>.json e atribui as peças selecionadas ao drop."""
    body = request.get_json(silent=True) or {}
    config = body.get('config') or {}
    drop_id, err = salvar_drop(config)
    if err:
        return jsonify({"error": err}), 400
    # Atribuição de peças depende do MySQL; se falhar, o drop já foi salvo
    try:
        atribuir_drop(config.get('drop_nome'), body.get('produto_ids') or [])
    except Exception as e:
        return jsonify({"success": True, "id": drop_id,
                        "aviso": "Drop salvo, mas falhou ao atribuir peças: {}".format(e)}), 200
    return jsonify({"success": True, "id": drop_id}), 201


@main.route('/storefront/drops/<drop_id>', methods=['DELETE'])
@admin_required
def storefront_drop_delete(drop_id):
    """Admin: exclui um drop (bloqueia 'normal' e o drop ativo)."""
    ok, err = excluir_drop(drop_id)
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"success": True}), 200


@main.route('/storefront', methods=['PUT'])
@admin_required
def storefront_set():
    """Admin: define o drop ativo (ou 'normal'). Grava em drops/_estado.json."""
    data = request.get_json(silent=True) or {}
    estado, err = set_estado(data.get('ativo'))
    if err:
        return jsonify({"error": err}), 400
    return jsonify(estado), 200


# ─────────────────────────────────────────────
#  ADMIN — CRUD de peças (tudo protegido)
# ─────────────────────────────────────────────
@main.route('/admin/produtos', methods=['GET'])
@admin_required
def admin_listar():
    return jsonify(listar_produtos()), 200


@main.route('/admin/produtos/<int:pid>', methods=['GET'])
@admin_required
def admin_obter(pid):
    produto = obter_produto(pid)
    if not produto:
        return jsonify({"error": "Peça não encontrada"}), 404
    return jsonify(produto), 200


@main.route('/admin/produtos', methods=['POST'])
@admin_required
def admin_criar():
    pid, err = criar_produto(request.get_json(silent=True) or {})
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"success": True, "id": pid}), 201


@main.route('/admin/produtos/<int:pid>', methods=['PUT'])
@admin_required
def admin_atualizar(pid):
    ok, err = atualizar_produto(pid, request.get_json(silent=True) or {})
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"success": True}), 200


@main.route('/admin/produtos/<int:pid>', methods=['DELETE'])
@admin_required
def admin_desativar(pid):
    if not desativar_produto(pid):
        return jsonify({"error": "Peça não encontrada"}), 404
    return jsonify({"success": True}), 200


@main.route('/admin/upload', methods=['POST'])
@admin_required
def admin_upload():
    arquivo = request.files.get('file')
    if not arquivo:
        return jsonify({"error": "Nenhum arquivo enviado."}), 400
    caminho, err = salvar_upload(arquivo)
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"success": True, "caminho": caminho}), 201