"""
GR!TTA — Templates de e-mail profissionais (HTML dark branded).
Cada serviço chama POST /api/notificar/email/template com {tipo, email, dados};
aqui montamos assunto + corpo (texto + HTML). Dados do usuário são escapados.
"""
from html import escape

ACCENT = "#2aabb0"
LOJA_URL = "http://127.0.0.1:5599/templates/index.html"
PEDIDOS_URL = "http://127.0.0.1:5599/templates/usuario/pedidos.html"


def _wrap(eyebrow, corpo_html, cta_text=None, cta_link=None):
    cta = ""
    if cta_text and cta_link:
        cta = (f'<tr><td style="padding:8px 40px 0;">'
               f'<table role="presentation" cellpadding="0" cellspacing="0"><tr>'
               f'<td style="background:{ACCENT};">'
               f'<a href="{cta_link}" style="display:inline-block;padding:13px 30px;color:#0b141a;'
               f'font-size:13px;font-weight:700;letter-spacing:1px;text-decoration:none;'
               f'text-transform:uppercase;">{escape(cta_text)}</a></td></tr></table></td></tr>')
    return f"""<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b141a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b141a;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#16252f;border:1px solid #243a47;border-top:3px solid {ACCENT};">
        <tr><td style="padding:38px 40px 6px;text-align:center;">
          <div style="font-size:30px;font-weight:900;letter-spacing:6px;color:#ffffff;">GR<span style="color:{ACCENT};">!</span>TTA</div>
          <div style="font-size:10px;letter-spacing:3px;color:#5b7180;text-transform:uppercase;margin-top:8px;">{escape(eyebrow)}</div>
        </td></tr>
        <tr><td style="padding:24px 40px 4px;">{corpo_html}</td></tr>
        {cta}
        <tr><td style="padding:26px 40px 34px;"></td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="padding:18px 40px;text-align:center;">
          <p style="color:#3f5765;font-size:11px;line-height:1.7;margin:0;">GR!TTA &middot; Streetwear<br>E-mail autom&aacute;tico, n&atilde;o responda.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def _p(texto, cor="#9fb1bd", size=14):
    return f'<p style="color:{cor};font-size:{size}px;line-height:1.6;margin:0 0 16px;">{texto}</p>'


def _primeiro_nome(dados, fallback="cliente"):
    nome = (dados.get("nome") or "").strip().split(" ")[0]
    return escape(nome) if nome else fallback


def boas_vindas(dados):
    nome = _primeiro_nome(dados, "bem-vindo(a)")
    assunto = "Bem-vindo(a) à GR!TTA"
    corpo = (
        _p(f'Oi, <strong style="color:#fff;">{nome}</strong>!', "#e3eaef", 15) +
        _p("Sua conta na GR!TTA foi criada com sucesso. Agora você faz parte da cena — "
           "streetwear oversized, drops limitados e peças feitas pra rua.") +
        _p("Dá uma olhada nas novidades e monta seu look. Sem firula, sem concessão.")
    )
    texto = (f"Oi, {nome}! Sua conta na GR!TTA foi criada com sucesso. "
             f"Bem-vindo(a) à cena. Acesse a loja em {LOJA_URL} — GR!TTA")
    return assunto, texto, _wrap("Boas-vindas", corpo, "Ver a loja", LOJA_URL)


def pedido_confirmado(dados):
    nome = _primeiro_nome(dados)
    pedido_id = escape(str(dados.get("pedido_id") or ""))
    total = dados.get("total")
    total_fmt = ("R$ " + ("%.2f" % float(total)).replace(".", ",")) if total not in (None, "") else ""
    assunto = f"Pedido #{pedido_id} confirmado — GR!TTA"
    corpo = (
        _p(f'Oi, <strong style="color:#fff;">{nome}</strong>!', "#e3eaef", 15) +
        _p(f'Recebemos o pagamento do seu pedido '
           f'<strong style="color:{ACCENT};">#{pedido_id}</strong>. Já estamos preparando tudo.') +
        (_p(f'Total do pedido: <strong style="color:#fff;">{total_fmt}</strong>') if total_fmt else "") +
        _p("Acompanhe o status em Meus Pedidos. Seu estilo está a caminho!")
    )
    texto = (f"Oi, {nome}! Seu pedido #{pedido_id} foi confirmado. "
             f"{('Total: ' + total_fmt + '. ') if total_fmt else ''}Acompanhe em {PEDIDOS_URL} — GR!TTA")
    return assunto, texto, _wrap("Pedido confirmado", corpo, "Acompanhar pedido", PEDIDOS_URL)


def newsletter(dados):
    nome = (dados.get("nome") or "").strip().split(" ")[0]
    saud = f"Oi, {escape(nome)}!" if nome else "Oi!"
    assunto = "Você está na lista VIP da GR!TTA"
    corpo = (
        _p(f'<strong style="color:#fff;">{saud}</strong>', "#e3eaef", 15) +
        _p("Boa — você entrou na lista VIP. A partir de agora recebe os drops antes de todo mundo, "
           "ofertas exclusivas e acesso antecipado às coleções limitadas.") +
        _p("Fica de olho na caixa de entrada. O próximo drop não espera.")
    )
    texto = f"{saud} Você entrou na lista VIP da GR!TTA — drops e ofertas antes de todo mundo. — GR!TTA"
    return assunto, texto, _wrap("Lista VIP", corpo, "Conhecer os drops", LOJA_URL)


TEMPLATES = {
    "boas_vindas": boas_vindas,
    "pedido_confirmado": pedido_confirmado,
    "newsletter": newsletter,
}


def montar(tipo, dados):
    """Retorna (assunto, texto, html) para o tipo de e-mail, ou None se o tipo for inválido."""
    builder = TEMPLATES.get(tipo)
    if not builder:
        return None
    return builder(dados or {})
