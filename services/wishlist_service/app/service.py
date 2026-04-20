from .database import get_connection
from .validators import hash_password, check_password, validate_email, validate_password, validate_cpf
from mysql.connector import IntegrityError


def list_users():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nome, cpf, email, ativo FROM usuarios")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return users

def get_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nome, cpf, email, ativo FROM usuarios WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def create_user(data):
    email_valid, msg = validate_email(data.get("email"))
    if not email_valid:
        return None, msg
    password_valid, msg = validate_password(data.get("senha"))
    if not password_valid:
        return None, msg
    cpf_valid, msg = validate_cpf(data.get("cpf"))
    if not cpf_valid:
        return None, msg

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO usuarios (nome, cpf, email, senha_hash) VALUES (%s,%s,%s,%s)",
            (data['nome'], data['cpf'], data['email'], hash_password(data['senha']))
        )
        conn.commit()
        user_id = cursor.lastrowid
    except IntegrityError as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return None, "Email ou CPF já cadastrado"
    cursor.close()
    conn.close()
    return user_id, None

def update_user(user_id, data):
    conn = get_connection()
    cursor = conn.cursor()
    set_clause = []
    values = []

    for key in ["nome", "cpf", "email", "senha"]:
        if key in data:
            if key == "senha":
                values.append(hash_password(data[key]))
                set_clause.append("senha_hash=%s")
            else:
                values.append(data[key])
                set_clause.append(f"{key}=%s")

    query = f"UPDATE usuarios SET {', '.join(set_clause)} WHERE id=%s"
    cursor.execute(query, values + [user_id])
    conn.commit()
    cursor.close()
    conn.close()

def delete_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM usuarios WHERE id=%s", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()

# --- LÓGICA DE FAVORITOS ---

def list_favorites(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Join para pegar dados do produto e a imagem principal
    query = """
        SELECT f.id, p.id as produto_id, p.nome, p.preco_base as preco, i.caminho_imagem as imagem
        FROM favoritos f
        JOIN produtos p ON f.produto_id = p.id
        LEFT JOIN imagens_produto i ON p.id = i.produto_id AND i.ordem_exibicao = 0
        WHERE f.usuario_id = %s
    """
    cursor.execute(query, (user_id,))
    favs = cursor.fetchall()
    cursor.close()
    conn.close()
    return favs

def add_favorite(user_id, produto_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO favoritos (usuario_id, produto_id) VALUES (%s, %s)",
            (user_id, produto_id)
        )
        conn.commit()
        fav_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return fav_id, None
    except IntegrityError:
        conn.rollback()
        cursor.close()
        conn.close()
        return None, "Produto já está nos favoritos"
    except Exception as e:
        return None, str(e)

def remove_favorite(user_id, fav_id):
    conn = get_connection()
    cursor = conn.cursor()
    # Garante que o usuário só remove o próprio favorito
    cursor.execute("DELETE FROM favoritos WHERE id=%s AND usuario_id=%s", (fav_id, user_id))
    conn.commit()
    cursor.close()
    conn.close()