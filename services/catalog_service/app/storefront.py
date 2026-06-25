"""
Estado da loja / drops — lê e grava as configurações de drop em arquivos JSON.
Cada drop é um arquivo em /drops; o drop ativo é apontado por /drops/_estado.json.
Assim, ativar/trocar um drop não exige tocar no código.
"""
import os
import json

# /drops na raiz do projeto (3 níveis acima de services/catalog_service/app/)
DROPS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', '..', 'drops')
)
ESTADO_PATH = os.path.join(DROPS_DIR, '_estado.json')


def _read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def _safe_id(drop_id):
    """Só aceita ids simples (sem path traversal)."""
    if not drop_id or not isinstance(drop_id, str):
        return None
    if not all(c.isalnum() or c in '-_' for c in drop_id):
        return None
    return drop_id


def _load_drop(drop_id):
    drop_id = _safe_id(drop_id)
    if not drop_id:
        return None
    path = os.path.join(DROPS_DIR, drop_id + '.json')
    if not os.path.isfile(path):
        return None
    try:
        return _read_json(path)
    except Exception:
        return None


def get_estado():
    """Retorna { modo, ativo, drop } — o drop é a config completa já parseada."""
    try:
        estado = _read_json(ESTADO_PATH)
    except Exception:
        estado = {"modo": "normal", "ativo": "normal"}

    modo = estado.get('modo', 'normal')
    ativo = estado.get('ativo') or 'normal'
    drop = _load_drop(ativo)

    # Se o arquivo do drop sumiu, cai pra loja normal
    if drop is None:
        drop = _load_drop('normal')
        modo, ativo = 'normal', 'normal'

    return {"modo": modo, "ativo": ativo, "drop": drop}


def list_drops():
    """Lista as configs disponíveis (ignora arquivos que começam com _)."""
    out = []
    if not os.path.isdir(DROPS_DIR):
        return out
    for fname in sorted(os.listdir(DROPS_DIR)):
        if not fname.endswith('.json') or fname.startswith('_'):
            continue
        try:
            cfg = _read_json(os.path.join(DROPS_DIR, fname))
        except Exception:
            continue
        out.append({
            "id": cfg.get('id', fname[:-5]),
            "nome": cfg.get('nome', fname[:-5]),
        })
    return out


def set_estado(ativo):
    """Grava o estado. modo é derivado: 'normal' se ativo == 'normal', senão 'drop'."""
    if _load_drop(ativo) is None:
        return None, "Configuração inexistente."
    modo = 'normal' if ativo == 'normal' else 'drop'
    estado = {"modo": modo, "ativo": ativo}
    with open(ESTADO_PATH, 'w', encoding='utf-8') as f:
        json.dump(estado, f, ensure_ascii=False, indent=2)
    return estado, None
