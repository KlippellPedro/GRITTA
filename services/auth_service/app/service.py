from .database import get_connection
from .validator import validate_email, validate_password, hash_password, check_password, validate_cpf, validate_phone
from mysql.connector import IntegrityError
import jwt
import datetime
import os
import secrets
import logging
import requests
from html import escape as html_escape

NOTIFICATION_URL = os.environ.get("NOTIFICATION_URL", "http://127.0.0.1:5007/api/notificar/email")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("ERRO CRÍTICO: A variável de ambiente SECRET_KEY não foi configurada no Auth Service.")

# Configuração do Logger para Autenticação
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)


def _token_servico():
    """Token curto, assinado com a SECRET_KEY compartilhada, só pra autorizar
    a chamada interna ao notification_service (o reset acontece sem login)."""
    payload = {
        "sys": True,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def _email_html_codigo(nome, codigo):
    """Corpo HTML (dark, branded) do e-mail de código — layout em tabela pra
    compatibilidade com clientes de e-mail; nome escapado contra injeção."""
    nome_safe = html_escape(nome or "")
    return f"""\
<!doctype html>
<html lang="pt-br">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b141a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b141a;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#16252f;border:1px solid #243a47;border-top:3px solid #2aabb0;">
        <tr><td style="padding:38px 40px 6px;text-align:center;">
          <div style="font-size:30px;font-weight:900;letter-spacing:6px;color:#ffffff;">GR<span style="color:#2aabb0;">!</span>TTA</div>
          <div style="font-size:10px;letter-spacing:3px;color:#5b7180;text-transform:uppercase;margin-top:8px;">Redefinição de senha</div>
        </td></tr>
        <tr><td style="padding:26px 40px 4px;">
          <p style="color:#e3eaef;font-size:15px;line-height:1.6;margin:0 0 16px;">Oi, <strong style="color:#ffffff;">{nome_safe}</strong>!</p>
          <p style="color:#9fb1bd;font-size:14px;line-height:1.6;margin:0 0 22px;">Recebemos um pedido pra redefinir a senha da sua conta. Use o código abaixo pra continuar:</p>
        </td></tr>
        <tr><td style="padding:0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1c25;border:1px solid #2aabb0;">
            <tr><td style="padding:22px;text-align:center;">
              <div style="font-size:40px;font-weight:700;letter-spacing:16px;color:#2aabb0;font-family:'Courier New',Courier,monospace;">{codigo}</div>
            </td></tr>
          </table>
          <p style="color:#5b7180;font-size:12px;text-align:center;margin:14px 0 0;">Vale por <strong style="color:#9fb1bd;">15 minutos</strong> &middot; uso &uacute;nico</p>
        </td></tr>
        <tr><td style="padding:28px 40px 0;"><div style="height:1px;background:#243a47;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
        <tr><td style="padding:18px 40px 36px;">
          <p style="color:#6b8190;font-size:12px;line-height:1.6;margin:0;">Se n&atilde;o foi voc&ecirc; que pediu, &eacute; s&oacute; ignorar este e-mail &mdash; sua senha continua a mesma e ningu&eacute;m tem acesso &agrave; sua conta.</p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="padding:18px 40px;text-align:center;">
          <p style="color:#3f5765;font-size:11px;line-height:1.7;margin:0;">GR!TTA &middot; Streetwear<br>E-mail autom&aacute;tico, n&atilde;o responda.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _enviar_codigo_email(email, nome, codigo):
    assunto = "GR!TTA — Seu código de redefinição de senha"
    mensagem = (
        f"Oi, {nome}!\n\n"
        f"Seu código pra redefinir a senha é: {codigo}\n\n"
        f"Ele vale por 15 minutos e só pode ser usado uma vez.\n"
        f"Se não foi você que pediu, é só ignorar este e-mail — sua senha continua a mesma.\n\n"
        f"— GR!TTA"
    )
    html = _email_html_codigo(nome, codigo)
    try:
        requests.post(
            NOTIFICATION_URL,
            json={"email": email, "assunto": assunto, "mensagem": mensagem, "html": html},
            headers={"Authorization": "Bearer " + _token_servico()},
            timeout=8
        )
    except Exception as e:
        logger.error(f"Falha ao enviar e-mail de código: {e}")


def _emitir_tokens(user):
    """Gera access + refresh token pra um usuário (reaproveitado pelo login normal e Google)."""
    access_payload = {
        "id": user["id"], "email": user["email"], "nome": user["nome"], "tipo": user["tipo"],
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    }
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm="HS256")
    refresh_token = secrets.token_urlsafe(64)
    refresh_exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO refresh_tokens (usuario_id, token, expiracao) VALUES (%s, %s, %s)",
        (user["id"], refresh_token, refresh_exp)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {
        "success": True, "access_token": access_token, "refresh_token": refresh_token,
        "user_id": user["id"], "tipo": user["tipo"], "message": "Login bem-sucedido"
    }, 200


def login_with_google(token_google):
    """Verifica o ID token do Google no servidor (nunca confia no front),
    acha ou cria o usuário e emite nossos tokens."""
    if not token_google:
        return {"message": "Token do Google ausente."}, 400
    if not GOOGLE_CLIENT_ID:
        return {"message": "Login com Google não está configurado no servidor."}, 503

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        return {"message": "Biblioteca google-auth não instalada no servidor."}, 503

    try:
        info = google_id_token.verify_oauth2_token(token_google, google_requests.Request(), GOOGLE_CLIENT_ID)
    except Exception as e:
        logger.warning(f"Token Google inválido: {e}")
        return {"message": "Não foi possível validar sua conta Google."}, 401

    if not info.get('email_verified'):
        return {"message": "O e-mail dessa conta Google não está verificado."}, 401

    google_sub = info.get('sub')
    email = info.get('email')
    nome = info.get('name') or (email.split('@')[0] if email else 'Cliente')

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, nome, email, tipo, ativo FROM usuarios WHERE google_id = %s OR email = %s LIMIT 1",
        (google_sub, email)
    )
    user = cursor.fetchone()

    try:
        if not user:
            cursor.execute(
                "INSERT INTO usuarios (nome, email, tipo, provider, google_id) VALUES (%s, %s, 'cliente', 'google', %s)",
                (nome, email, google_sub)
            )
            conn.commit()
            user = {"id": cursor.lastrowid, "nome": nome, "email": email, "tipo": "cliente"}
            logger.info(f"Novo usuário via Google: {email}")
        elif user.get('ativo') == 0:
            return {"message": "Conta desativada."}, 403
        else:
            # vincula o google_id a uma conta que já existia por e-mail
            cursor.execute("UPDATE usuarios SET google_id = %s WHERE id = %s AND google_id IS NULL", (google_sub, user['id']))
            conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao criar/vincular conta Google: {e}")
        return {"message": "Erro ao entrar com Google."}, 500
    finally:
        cursor.close()
        conn.close()

    return _emitir_tokens(user)

def register_user(data):
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    cpf = data.get('cpf')
    telefone = data.get('telefone') # Adicionado para consistência com o frontend

    email_valid, msg = validate_email(email)
    if not email_valid:
        return None, msg
    password_valid, msg = validate_password(senha)
    if not password_valid:
        return None, msg
    cpf_valid, msg = validate_cpf(cpf)
    if not cpf_valid:
        return None, msg
    phone_valid, msg = validate_phone(telefone)
    if not phone_valid:
        return None, msg

    conn = get_connection()
    if conn is None:
        return None, "Não foi possível conectar ao banco de dados."
        
    cursor = conn.cursor()
    try:
        hashed_password = hash_password(senha)
        cursor.execute(
            "INSERT INTO usuarios (nome, email, senha_hash, cpf, telefone) VALUES (%s, %s, %s, %s, %s)",
            (nome, email, hashed_password, cpf, telefone)
        )
        conn.commit()
        user_id = cursor.lastrowid
        logger.info(f"Novo usuário registrado: {email} (ID: {user_id})")
        return user_id, None
    except IntegrityError as e:
        conn.rollback()
        if "email" in str(e):
            return None, "E-mail já cadastrado."
        if "cpf" in str(e):
            return None, "CPF já cadastrado."
        return None, "Erro ao registrar usuário."
    except Exception as e:
        conn.rollback()
        return None, str(e)
    finally:
        cursor.close()
        conn.close()

def login_user(data):
    email = data.get("email")
    senha = data.get("senha")

    conn = get_connection()
    if not conn:
        return {"message": "Erro de conexão com o banco de dados"}, 500
        
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nome, email, senha_hash, tipo FROM usuarios WHERE email=%s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and check_password(senha, user["senha_hash"]):
        # 1. Access Token (Curto - 15 min)
        access_payload = {
            "id": user["id"], 
            "email": user["email"], 
            "nome": user["nome"],
            "tipo": user["tipo"],
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        }
        access_token = jwt.encode(access_payload, SECRET_KEY, algorithm="HS256")

        # 2. Refresh Token (Longo - 7 dias)
        refresh_token = secrets.token_urlsafe(64)
        refresh_exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)

        # Salvar Refresh Token no Banco
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO refresh_tokens (usuario_id, token, expiracao) VALUES (%s, %s, %s)",
            (user["id"], refresh_token, refresh_exp)
        )
        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Login realizado: {email}")
        return {
            "success": True, 
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "user_id": user["id"], 
            "tipo": user["tipo"],
            "message": "Login bem-sucedido"
        }, 200
    logger.warning(f"Tentativa de login falhou para: {email}")
    return {"message": "E-mail ou senha inválidos"}, 401

def refresh_access_token(token_cliente):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Verifica se o token existe e não expirou
    cursor.execute(
        "SELECT r.*, u.email, u.tipo, u.nome FROM refresh_tokens r JOIN usuarios u ON r.usuario_id = u.id WHERE r.token = %s AND r.expiracao > NOW()", 
        (token_cliente,)
    )
    refresh_data = cursor.fetchone()

    if not refresh_data:
        logger.warning("Tentativa de refresh com token inválido ou expirado.")
        return {"message": "Sessão expirada. Faça login novamente."}, 401

    # Gera novo Access Token
    new_access_payload = {
        "id": refresh_data["usuario_id"],
        "email": refresh_data["email"],
        "nome": refresh_data["nome"],
        "tipo": refresh_data["tipo"],
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    }
    new_access_token = jwt.encode(new_access_payload, SECRET_KEY, algorithm="HS256")
    
    cursor.close()
    conn.close()
    return {"success": True, "access_token": new_access_token}, 200

def request_password_reset(email):
    """Gera um código de 6 dígitos, guarda só o HASH dele e manda por e-mail.
    Responde sempre igual (sem enumeração de usuário)."""
    resposta = {"success": True, "message": "Se o e-mail estiver cadastrado, enviamos um código."}

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nome FROM usuarios WHERE email = %s AND ativo = 1", (email,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return resposta, 200

    codigo = "{:06d}".format(secrets.randbelow(1000000))   # 000000–999999
    codigo_hash = hash_password(codigo)                    # só o hash vai pro banco
    expiracao = datetime.datetime.now() + datetime.timedelta(minutes=15)

    try:
        # Invalida códigos anteriores ainda válidos desse usuário
        cursor.execute("UPDATE password_resets SET usado = 1 WHERE usuario_id = %s AND usado = 0", (user['id'],))
        cursor.execute(
            "INSERT INTO password_resets (usuario_id, token, expiracao, usado, tentativas) VALUES (%s, %s, %s, 0, 0)",
            (user['id'], codigo_hash, expiracao)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao gerar código de reset: {e}")
        cursor.close()
        conn.close()
        return resposta, 200   # mesmo em erro, não vaza nada
    finally:
        cursor.close()
        conn.close()

    _enviar_codigo_email(email, user['nome'], codigo)
    logger.info(f"Código de reset gerado para {email}")
    return resposta, 200

def verify_reset_code(email, codigo):
    """Confere o código SEM trocar a senha nem consumi-lo (etapa dedicada do fluxo
    profissional: e-mail → código → nova senha). Conta tentativas contra brute force,
    mas mantém o código válido pro passo final (reset_password)."""
    if not email or not codigo:
        return {"message": "E-mail e código são obrigatórios."}, 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT pr.id, pr.token, pr.tentativas
        FROM password_resets pr
        JOIN usuarios u ON pr.usuario_id = u.id
        WHERE u.email = %s AND pr.usado = 0 AND pr.expiracao > NOW()
        ORDER BY pr.id DESC LIMIT 1
    """, (email,))
    reset_data = cursor.fetchone()

    if not reset_data:
        cursor.close()
        conn.close()
        return {"message": "Código inválido ou expirado. Solicite um novo."}, 400

    if reset_data['tentativas'] >= 5:
        cursor.execute("UPDATE password_resets SET usado = 1 WHERE id = %s", (reset_data['id'],))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Muitas tentativas erradas. Solicite um novo código."}, 429

    if not check_password(str(codigo), reset_data['token']):
        cursor.execute("UPDATE password_resets SET tentativas = tentativas + 1 WHERE id = %s", (reset_data['id'],))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Código incorreto."}, 400

    cursor.close()
    conn.close()
    return {"success": True, "message": "Código verificado."}, 200


def reset_password(email, codigo, nova_senha):
    """Confere o código (6 díg) do e-mail e troca a senha.
    Código com hash no banco, uso único, expira em 15 min, máx 5 tentativas."""
    if not email or not codigo:
        return {"message": "E-mail e código são obrigatórios."}, 400
    valid, msg = validate_password(nova_senha)
    if not valid:
        return {"message": msg}, 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Pega o código mais recente válido desse e-mail
    cursor.execute("""
        SELECT pr.id, pr.token, pr.tentativas, pr.usuario_id
        FROM password_resets pr
        JOIN usuarios u ON pr.usuario_id = u.id
        WHERE u.email = %s AND pr.usado = 0 AND pr.expiracao > NOW()
        ORDER BY pr.id DESC LIMIT 1
    """, (email,))
    reset_data = cursor.fetchone()

    if not reset_data:
        cursor.close()
        conn.close()
        return {"message": "Código inválido ou expirado. Solicite um novo."}, 400

    # Limite de tentativas
    if reset_data['tentativas'] >= 5:
        cursor.execute("UPDATE password_resets SET usado = 1 WHERE id = %s", (reset_data['id'],))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Muitas tentativas erradas. Solicite um novo código."}, 429

    # Confere o código (hash)
    if not check_password(str(codigo), reset_data['token']):
        cursor.execute("UPDATE password_resets SET tentativas = tentativas + 1 WHERE id = %s", (reset_data['id'],))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Código incorreto."}, 400

    try:
        hashed_pw = hash_password(nova_senha)
        cursor.execute("UPDATE usuarios SET senha_hash = %s WHERE id = %s", (hashed_pw, reset_data['usuario_id']))
        cursor.execute("UPDATE password_resets SET usado = 1 WHERE id = %s", (reset_data['id'],))
        conn.commit()
        return {"success": True, "message": "Senha atualizada! Já pode entrar com a nova senha."}, 200
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao atualizar senha: {e}")
        return {"message": "Erro ao atualizar senha."}, 500
    finally:
        cursor.close()
        conn.close()