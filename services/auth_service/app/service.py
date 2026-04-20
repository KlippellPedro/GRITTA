from .database import get_connection
from .validator import validate_email, validate_password, hash_password, check_password, validate_cpf, validate_phone
from mysql.connector import IntegrityError
import jwt
import datetime
import os
import secrets
import logging

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
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Verificar se o usuário existe
    cursor.execute("SELECT id, nome FROM usuarios WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if not user:
        # Por segurança, retornamos sucesso mesmo se o email não existir (evita enumeração de usuários)
        return {"message": "Se este e-mail estiver cadastrado, você receberá um link de recuperação."}, 200

    # 2. Gerar token único e expiração (1 hora)
    token = secrets.token_urlsafe(32)
    expiracao = datetime.datetime.now() + datetime.timedelta(hours=1)
    
    try:
        cursor.execute(
            "INSERT INTO password_resets (usuario_id, token, expiracao) VALUES (%s, %s, %s)",
            (user['id'], token, expiracao)
        )
        conn.commit()
        
        # 3. Integração com Notification Service (Simulado via log)
        # Aqui você dispararia uma requisição para o notification_service enviar o e-mail real
        print(f"[EMAIL LOG] Para: {email} | Link: http://localhost:5500/templates/usuario/resetar-senha.html?token={token}")
        
        return {"success": True, "message": "E-mail de recuperação enviado."}, 200
    except Exception as e:
        conn.rollback()
        return {"message": "Erro interno ao processar recuperação."}, 500
    finally:
        cursor.close()
        conn.close()

def reset_password(token, nova_senha):
    valid, msg = validate_password(nova_senha)
    if not valid:
        return {"message": msg}, 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Validar o token (existe, não expirou e não foi usado)
    query = "SELECT usuario_id FROM password_resets WHERE token = %s AND expiracao > NOW() AND usado = FALSE"
    cursor.execute(query, (token,))
    reset_data = cursor.fetchone()
    
    if not reset_data:
        return {"message": "Token inválido ou expirado."}, 400

    try:
        # 2. Atualizar senha e invalidar o token usado
        hashed_pw = hash_password(nova_senha)
        cursor.execute("UPDATE usuarios SET senha_hash = %s WHERE id = %s", (hashed_pw, reset_data['usuario_id']))
        cursor.execute("UPDATE password_resets SET usado = TRUE WHERE token = %s", (token,))
        conn.commit()
        return {"success": True, "message": "Senha atualizada com sucesso!"}, 200
    except Exception as e:
        conn.rollback()
        return {"message": "Erro ao atualizar senha."}, 500
    finally:
        cursor.close()
        conn.close()