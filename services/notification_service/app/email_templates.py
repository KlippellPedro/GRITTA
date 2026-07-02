"""
GR!TTA — Templates de e-mail profissionais (HTML brutal branded).
Cada serviço chama POST /api/notificar/email/template com {tipo, email, dados};
aqui montamos assunto + corpo (texto + HTML), renderizando os arquivos
em /templates/emails via Jinja2 (autoescape liga pra todo dado do usuário).
"""
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

_EMAILS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "templates", "emails"))
_env = Environment(loader=FileSystemLoader(_EMAILS_DIR), autoescape=select_autoescape(["html"]))

LOJA_URL = "http://127.0.0.1:5599/templates/index.html"
PEDIDOS_URL = "http://127.0.0.1:5599/templates/usuario/pedidos.html"
CARRINHO_URL = "http://127.0.0.1:5599/templates/usuario/carrinho.html"
RESET_URL = "http://127.0.0.1:5599/templates/usuario/recuperar-senha.html"


def _render(template_name, **ctx):
    return _env.get_template(template_name).render(**ctx)


def _primeiro_nome(dados, fallback="cliente"):
    nome = (dados.get("nome") or "").strip().split(" ")[0]
    return nome or fallback


def boas_vindas(dados):
    nome = _primeiro_nome(dados, "bem-vindo(a)")
    assunto = "Bem-vindo(a) à GR!TTA"
    html = _render("boas_vindas.html", nome=nome, loja_url=LOJA_URL)
    texto = (f"Oi, {nome}! Sua conta na GR!TTA foi criada com sucesso. "
             f"Bem-vindo(a) à cena. Acesse a loja em {LOJA_URL} — GR!TTA")
    return assunto, texto, html


def pedido_confirmado(dados):
    nome = _primeiro_nome(dados)
    pedido_id = str(dados.get("pedido_id") or "")
    total = dados.get("total")
    total_fmt = ("R$ " + ("%.2f" % float(total)).replace(".", ",")) if total not in (None, "") else ""
    assunto = f"Pedido #{pedido_id} confirmado — GR!TTA"
    html = _render("pedido_confirmado.html", nome=nome, pedido_id=pedido_id, total_fmt=total_fmt, pedidos_url=PEDIDOS_URL)
    texto = (f"Oi, {nome}! Seu pedido #{pedido_id} foi confirmado. "
             f"{('Total: ' + total_fmt + '. ') if total_fmt else ''}Acompanhe em {PEDIDOS_URL} — GR!TTA")
    return assunto, texto, html


def newsletter(dados):
    nome = (dados.get("nome") or "").strip().split(" ")[0]
    saudacao = f"Oi, {nome}!" if nome else "Oi!"
    assunto = "Você está na lista VIP da GR!TTA"
    html = _render("newsletter.html", saudacao=saudacao, loja_url=LOJA_URL)
    texto = f"{saudacao} Você entrou na lista VIP da GR!TTA — drops e ofertas antes de todo mundo. — GR!TTA"
    return assunto, texto, html


def recuperar_senha(dados):
    """Código de redefinição de senha (6 dígitos). Antes vivia hardcoded em
    auth_service/app/service.py — agora é só mais um tipo de template aqui."""
    nome = _primeiro_nome(dados)
    codigo = str(dados.get("codigo") or "")
    assunto = "GR!TTA — Seu código de redefinição de senha"
    html = _render("recuperar_senha.html", nome=nome, codigo=codigo)
    texto = (f"Oi, {nome}!\n\n"
             f"Seu código pra redefinir a senha é: {codigo}\n\n"
             f"Ele vale por 15 minutos e só pode ser usado uma vez.\n"
             f"Se não foi você que pediu, é só ignorar este e-mail — sua senha continua a mesma.\n\n"
             f"— GR!TTA")
    return assunto, texto, html


def senha_alterada(dados):
    nome = _primeiro_nome(dados)
    data_hora = dados.get("data_hora") or ""
    assunto = "Sua senha foi alterada — GR!TTA"
    html = _render("senha_alterada.html", nome=nome, data_hora=data_hora)
    texto = (f"Oi, {nome}! Sua senha foi alterada com sucesso"
             f"{(' em ' + data_hora) if data_hora else ''}. Se não foi você, fale com a gente. — GR!TTA")
    return assunto, texto, html


def alerta_login(dados):
    nome = _primeiro_nome(dados)
    dispositivo = dados.get("dispositivo") or ""
    local = dados.get("local") or ""
    data_hora = dados.get("data_hora") or ""
    assunto = "Novo acesso à sua conta — GR!TTA"
    html = _render("alerta_login.html", nome=nome, dispositivo=dispositivo, local=local,
                   data_hora=data_hora, reset_url=RESET_URL)
    texto = (f"Oi, {nome}! Detectamos um novo login na sua conta"
             f"{(' (' + dispositivo + ')') if dispositivo else ''}. "
             f"Se não foi você, troque sua senha em {RESET_URL} — GR!TTA")
    return assunto, texto, html


def carrinho_abandonado(dados):
    nome = _primeiro_nome(dados)
    qtd_itens = dados.get("qtd_itens") or ""
    cupom = dados.get("cupom") or ""
    assunto = "Você esqueceu umas peças no carrinho — GR!TTA"
    html = _render("carrinho_abandonado.html", nome=nome, qtd_itens=qtd_itens, cupom=cupom, carrinho_url=CARRINHO_URL)
    texto = (f"Oi, {nome}! Você deixou peças na sacola da GR!TTA. "
             f"{('Use o cupom ' + cupom + '. ') if cupom else ''}Volte em {CARRINHO_URL} — GR!TTA")
    return assunto, texto, html


TEMPLATES = {
    "boas_vindas": boas_vindas,
    "pedido_confirmado": pedido_confirmado,
    "newsletter": newsletter,
    "recuperar_senha": recuperar_senha,
    "senha_alterada": senha_alterada,
    "alerta_login": alerta_login,
    "carrinho_abandonado": carrinho_abandonado,
}


def montar(tipo, dados):
    """Retorna (assunto, texto, html) para o tipo de e-mail, ou None se o tipo for inválido."""
    builder = TEMPLATES.get(tipo)
    if not builder:
        return None
    return builder(dados or {})
