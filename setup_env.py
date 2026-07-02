#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GR!TTA — setup_env.py
Clone and Run — configura o ambiente completo de desenvolvimento em 5 passos.

    python setup_env.py

Passos:
    1. Diagnóstico MySQL  — socket localhost:3306
    2. Banco de dados     — cria gritta_db + importa dump SQL
    3. Arquivos .env      — gera .env para cada microsserviço (nunca sobrescreve)
    4. venv + pip         — cria o ambiente virtual e instala dependências
    5. Orquestração       — lança os 8 serviços em paralelo com logs prefixados
"""

import ctypes
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path


# ═══════════════════════════════════════════════════════════════════════════════
#  CAMINHOS
# ═══════════════════════════════════════════════════════════════════════════════

ROOT     = Path(__file__).parent.resolve()
DUMP_SQL = ROOT / "database" / "gritta_db.sql"
VENV_DIR = ROOT / "venv"
IS_WIN   = sys.platform.startswith("win")

_VENV_BIN  = VENV_DIR / ("Scripts" if IS_WIN else "bin")
PYTHON_BIN = _VENV_BIN / ("python.exe" if IS_WIN else "python")


# ═══════════════════════════════════════════════════════════════════════════════
#  CORES ANSI
# ═══════════════════════════════════════════════════════════════════════════════

def _habilitar_ansi_win():
    """Habilita ANSI escape codes no console do Windows 10+."""
    if not IS_WIN:
        return
    try:
        kernel32 = ctypes.windll.kernel32
        handle   = kernel32.GetStdHandle(-11)   # STD_OUTPUT_HANDLE
        mode     = ctypes.c_ulong()
        kernel32.GetConsoleMode(handle, ctypes.byref(mode))
        kernel32.SetConsoleMode(handle, mode.value | 0x0004)  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
    except Exception:
        pass

_habilitar_ansi_win()

V  = "\033[92m"   # verde
A  = "\033[93m"   # amarelo
R  = "\033[91m"   # vermelho
C  = "\033[96m"   # ciano
G  = "\033[90m"   # cinza
B  = "\033[1m"    # bold
X  = "\033[0m"    # reset

# Cores distintas para cada serviço no painel de logs
_SVC_CORES = [
    "\033[94m",   # azul brilhante — user_service
    "\033[95m",   # magenta        — order_service
    "\033[96m",   # ciano brilhante — catalog_service
    "\033[92m",   # verde          — inventory_service
    "\033[93m",   # amarelo        — auth_service
    "\033[91m",   # vermelho       — payment_service
    "\033[97m",   # branco brilhante — notification_service
    "\033[36m",   # ciano escuro   — wishlist_service
]


# ═══════════════════════════════════════════════════════════════════════════════
#  FUNÇÕES DE LOG
# ═══════════════════════════════════════════════════════════════════════════════

def _ts():
    return f"{G}{datetime.now().strftime('%H:%M:%S')}{X}"

def _tag(cor, rotulo, msg=""):
    print(f"{_ts()} {cor}{B}[ {rotulo} ]{X} {msg}", flush=True)

def cfg(msg=""):   _tag(C, "CONFIGURANDO", msg)
def ok(msg=""):    _tag(V, "OK",           msg)
def aviso(msg=""): _tag(A, "AVISO",        msg)

def erro(msg=""):
    _tag(R, "ERRO", msg)
    sys.exit(1)

def _svc_log(nome, cor, linha):
    print(f"{cor}{B}[{nome}]{X} {linha}", flush=True)


# ═══════════════════════════════════════════════════════════════════════════════
#  REGISTRO DOS MICROSSERVIÇOS
# ═══════════════════════════════════════════════════════════════════════════════
#
# Cada entrada em "env" é:
#   ("CHAVE", "valor")  →  gera CHAVE=valor
#   ("# comentário",)   →  gera linha de comentário no .env
#
# Variáveis com valor "" ficam como CHAVE= e são destacadas no resumo final.
# ─────────────────────────────────────────────────────────────────────────────

_BASE = [
    ("DB_HOST",    "localhost"),
    ("DB_USER",    "root"),
    ("DB_PASS",    ""),         # padrão XAMPP sem senha
    ("DB_NAME",    "gritta_db"),
    ("SECRET_KEY", "gritta-dev-secret-2026"),
]

SERVICOS = [
    {
        "nome":  "user_service",
        "porta": 5001,
        "cor":   _SVC_CORES[0],
        "env":   _BASE,
    },
    {
        "nome":  "order_service",
        "porta": 5002,
        "cor":   _SVC_CORES[1],
        "env":   _BASE + [
            ("PORT", "5002"),
        ],
    },
    {
        "nome":  "catalog_service",
        "porta": 5003,
        "cor":   _SVC_CORES[2],
        "env":   _BASE + [
            ("# ADMIN_DELETE_SECRET — defina antes de usar o botão Excluir do painel",),
            ("ADMIN_DELETE_SECRET", ""),
        ],
    },
    {
        "nome":  "inventory_service",
        "porta": 5004,
        "cor":   _SVC_CORES[3],
        "env":   _BASE,
    },
    {
        "nome":  "auth_service",
        "porta": 5005,
        "cor":   _SVC_CORES[4],
        "env":   _BASE + [
            ("GOOGLE_CLIENT_ID", "88691933102-t7r3e389paq1mp8r09m2tgofgqpdkni2.apps.googleusercontent.com"),
        ],
    },
    {
        "nome":  "payment_service",
        "porta": 5006,
        "cor":   _SVC_CORES[5],
        "env":   _BASE + [
            ("# GATEWAY_PROVIDER / GATEWAY_API_KEY — preencha para sair do modo simulação",),
            ("GATEWAY_PROVIDER", "simulado"),
            ("GATEWAY_API_KEY",  ""),
        ],
    },
    {
        "nome":  "notification_service",
        "porta": 5007,
        "cor":   _SVC_CORES[6],
        "env":   _BASE + [
            ("MAIL_SERVER",         "smtp.gmail.com"),
            ("MAIL_PORT",           "587"),
            ("MAIL_USE_TLS",        "True"),
            ("# MAIL_USERNAME / MAIL_PASSWORD — e-mail + senha de app do Gmail",),
            ("MAIL_USERNAME",       ""),
            ("MAIL_PASSWORD",       ""),
            ("MAIL_DEFAULT_SENDER", ""),
        ],
    },
    {
        # inventory_service ocupa 5004 (hardcoded); wishlist recebe 5008 via .env
        "nome":  "wishlist_service",
        "porta": 5008,
        "cor":   _SVC_CORES[7],
        "env":   _BASE + [
            ("PORT", "5008"),
        ],
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
#  FASE 1 — DIAGNÓSTICO MYSQL
# ═══════════════════════════════════════════════════════════════════════════════

def fase1_mysql():
    print()
    cfg("Fase 1 · Diagnóstico MySQL ─────────────────────────────────")
    cfg("Verificando MySQL em localhost:3306 ...")
    try:
        s = socket.create_connection(("localhost", 3306), timeout=3)
        s.close()
    except (ConnectionRefusedError, OSError, TimeoutError):
        print()
        _tag(R, "ERRO", "MySQL não está respondendo em localhost:3306.")
        print()
        print(f"  {A}Parece que o MySQL/MariaDB não está rodando.{X}")
        print(f"  {G}  Para XAMPP:{X}")
        print(f"  {G}    1. Abra o XAMPP Control Panel{X}")
        print(f"  {G}    2. Clique em [ Start ] ao lado de MySQL{X}")
        print(f"  {G}    3. Aguarde o status verde e rode o script novamente{X}")
        print()
        sys.exit(1)
    ok("MySQL respondendo em localhost:3306")


# ═══════════════════════════════════════════════════════════════════════════════
#  FASE 2 — BANCO DE DADOS
# ═══════════════════════════════════════════════════════════════════════════════

def _encontrar_mysql_bin():
    """Procura o executável 'mysql' no PATH e nos caminhos comuns do XAMPP/WAMP/Laragon."""
    via_path = shutil.which("mysql")
    if via_path:
        return Path(via_path)
    candidatos = [
        Path(r"C:\xampp\mysql\bin\mysql.exe"),
        Path(r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"),
        Path(r"C:\wamp64\bin\mysql\mysql8.1.0\bin\mysql.exe"),
        Path(r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"),
        Path(r"C:\laragon\bin\mysql\mysql-8.1.0-winx64\bin\mysql.exe"),
    ]
    for c in candidatos:
        if c.exists():
            return c
    return None


def _importar_sql_cli(mysql_bin, dump_path):
    """Importa o dump via mysql CLI. Retorna (True, None) ou (False, mensagem_de_erro)."""
    try:
        with open(dump_path, "r", encoding="utf-8", errors="replace") as f:
            result = subprocess.run(
                [str(mysql_bin), "-u", "root", "gritta_db"],
                stdin=f,
                capture_output=True,
                text=True,
                timeout=180,
            )
        if result.returncode == 0:
            return True, None
        stderr = result.stderr.strip()
        # Exit code 1 com apenas aviso de senha é inofensivo
        if result.returncode == 1 and "Using a password" in stderr:
            return True, None
        return False, stderr[:200]
    except subprocess.TimeoutExpired:
        return False, "Timeout ao importar (> 180 s)."
    except Exception as e:
        return False, str(e)


def _garantir_connector():
    """Garante que mysql-connector-python está instalado no Python atual (para o setup)."""
    try:
        import mysql.connector  # noqa: F401
        return
    except ImportError:
        pass
    aviso("mysql-connector-python não encontrado; instalando para o setup ...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "mysql-connector-python", "--quiet"],
        check=True,
    )


def _importar_sql_connector(dump_path):
    """Importa o dump via mysql-connector-python (fallback sem CLI).

    Strips only -- line comments to preserve /*!...*/  conditional comments
    that MySQL uses for charset/mode configuration in dumps.
    """
    import mysql.connector  # noqa: F401

    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="gritta_db",
        charset="utf8mb4",
        use_unicode=True,
    )
    conn.autocommit = True
    cur = conn.cursor()

    sql = dump_path.read_text(encoding="utf-8", errors="replace")
    sql = re.sub(r"--[^\n]*", "", sql)   # strip single-line comments apenas

    for stmt in sql.split(";"):
        stmt = stmt.strip()
        if stmt:
            try:
                cur.execute(stmt)
            except Exception:
                pass  # IF NOT EXISTS, USE, charset conditionals etc.

    cur.close()
    conn.close()


def fase2_banco():
    print()
    cfg("Fase 2 · Banco de dados ────────────────────────────────────")

    mysql_bin = _encontrar_mysql_bin()
    if mysql_bin:
        cfg(f"mysql CLI encontrado em: {mysql_bin}")
    else:
        aviso("mysql CLI não encontrado — usando mysql-connector-python como fallback.")
        _garantir_connector()

    _garantir_connector()
    import mysql.connector  # noqa: F401

    cfg("Conectando ao MySQL ...")
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            charset="utf8mb4",
            use_unicode=True,
        )
    except Exception as e:
        erro(f"Não foi possível conectar ao MySQL: {e}")

    cur = conn.cursor()

    # Verifica se o banco já existe e tem tabelas
    cur.execute("SHOW DATABASES LIKE 'gritta_db'")
    banco_existe = cur.fetchone() is not None

    if banco_existe:
        cur.execute(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema = 'gritta_db'"
        )
        (n_tabelas,) = cur.fetchone()
        if n_tabelas > 0:
            aviso(
                f"gritta_db já existe com {n_tabelas} tabela(s) — "
                "pulando importação (dados preservados)."
            )
            cur.close()
            conn.close()
            return

    if not banco_existe:
        cfg("Criando banco gritta_db ...")
        cur.execute(
            "CREATE DATABASE gritta_db "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        ok("gritta_db criado")

    cur.close()
    conn.close()

    if not DUMP_SQL.exists():
        erro(f"Arquivo de dump não encontrado: {DUMP_SQL}")

    tamanho_kb = DUMP_SQL.stat().st_size // 1024
    cfg(f"Importando {DUMP_SQL.name} ({tamanho_kb} KB) ...")

    if mysql_bin:
        sucesso, err_cli = _importar_sql_cli(mysql_bin, DUMP_SQL)
        if sucesso:
            ok("gritta_db importado via mysql CLI")
            return
        aviso(f"mysql CLI falhou ({err_cli}) — tentando via connector ...")

    try:
        _importar_sql_connector(DUMP_SQL)
        ok("gritta_db importado via mysql-connector-python")
    except Exception as e:
        erro(f"Falha ao importar o dump: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
#  FASE 3 — ARQUIVOS .ENV
# ═══════════════════════════════════════════════════════════════════════════════

def _escrever_env(caminho, entradas):
    """Grava o arquivo .env.

    Formato das entradas:
      ("CHAVE", "valor")  →  CHAVE=valor
      ("# comentário",)   →  # comentário
    """
    linhas = [
        "# GR!TTA — gerado automaticamente por setup_env.py",
        "# Altere os valores conforme seu ambiente.",
        "",
    ]
    for entrada in entradas:
        if len(entrada) == 1:
            linhas.append(entrada[0])
        else:
            linhas.append(f"{entrada[0]}={entrada[1]}")
    caminho.write_text("\n".join(linhas) + "\n", encoding="utf-8")


_PENDENTES = [
    "DB_PASS",
    "ADMIN_DELETE_SECRET",
    "MAIL_USERNAME",
    "MAIL_PASSWORD",
    "MAIL_DEFAULT_SENDER",
    "GATEWAY_API_KEY",
]


def fase3_envs():
    print()
    cfg("Fase 3 · Arquivos .env ─────────────────────────────────────")
    criados, pulados = 0, 0

    for svc in SERVICOS:
        svc_dir  = ROOT / "services" / svc["nome"]
        env_file = svc_dir / ".env"

        if not svc_dir.exists():
            aviso(f"services/{svc['nome']} não encontrado (pulando)")
            continue

        if env_file.exists():
            aviso(f"services/{svc['nome']}/.env já existe — mantendo")
            pulados += 1
            continue

        _escrever_env(env_file, svc["env"])
        print(f"  {V}+{X} services/{svc['nome']}/.env")
        criados += 1

    print()
    ok(f"{criados} arquivo(s) criado(s), {pulados} já existiam")

    if criados > 0:
        print()
        print(f"  {A}{B}Variáveis que precisam de configuração manual:{X}")
        for p in _PENDENTES:
            print(f"  {G}  · {p}{X}")
        print()
        print(f"  {G}  Edite os .env de cada serviço antes de usar em produção.{X}")


# ═══════════════════════════════════════════════════════════════════════════════
#  FASE 4 — VENV + DEPENDÊNCIAS
# ═══════════════════════════════════════════════════════════════════════════════

def fase4_venv():
    print()
    cfg("Fase 4 · Ambiente virtual + dependências ───────────────────")

    if not VENV_DIR.exists():
        cfg("Criando venv/ ...")
        try:
            subprocess.run(
                [sys.executable, "-m", "venv", str(VENV_DIR)],
                check=True,
            )
            ok("venv/ criada")
        except subprocess.CalledProcessError as e:
            erro(f"Falha ao criar venv: {e}")
    else:
        aviso("venv/ já existe — reutilizando")

    if not PYTHON_BIN.exists():
        erro(f"Python do venv não encontrado em {PYTHON_BIN}")

    cfg("Atualizando pip ...")
    subprocess.run(
        [str(PYTHON_BIN), "-m", "pip", "install", "--upgrade", "pip", "--quiet"],
        check=True,
    )

    # Coleta todos os requirements.txt sem duplicatas (mesmo arquivo, caminhos resolvidos)
    reqs_vistos, reqs = set(), []
    for svc in SERVICOS:
        req = (ROOT / "services" / svc["nome"] / "requirements.txt").resolve()
        if req.exists() and str(req) not in reqs_vistos:
            reqs_vistos.add(str(req))
            reqs.append((svc["nome"], req))

    if not reqs:
        aviso("Nenhum requirements.txt encontrado.")
        return

    for svc_nome, req_path in reqs:
        cfg(f"Instalando {svc_nome} ...")
        result = subprocess.run(
            [str(PYTHON_BIN), "-m", "pip", "install", "-r", str(req_path), "--quiet"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            aviso(
                f"pip install falhou para {svc_nome}:\n"
                f"  {result.stderr.strip()[:200]}"
            )
        else:
            ok(svc_nome)

    ok("Todas as dependências instaladas")


# ═══════════════════════════════════════════════════════════════════════════════
#  FASE 5 — ORQUESTRAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

def _thread_log(nome, cor, proc):
    """Thread daemon: relê stdout/stderr do processo filho com prefixo colorido."""
    try:
        for linha in proc.stdout:
            linha = linha.rstrip("\n").rstrip("\r")
            if linha:
                _svc_log(nome, cor, linha)
    except Exception:
        pass


def _carregar_env_arquivo(env_file):
    """Lê .env e retorna dict. Ignora comentários e linhas sem '='."""
    env = {}
    try:
        for linha in env_file.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                k, _, v = linha.partition("=")
                env[k.strip()] = v.strip()
    except Exception:
        pass
    return env


def _banner_online():
    # Largura interna da caixa (espaço entre os caracteres de borda ║)
    # Cálculo: 2(pad) + 24(nome) + 5("  →  ") + 14("localhost:XXXX") + 2(pad) = 47
    IW    = 47
    NP    = 24   # padding do nome do serviço
    title = "[ SISTEMA ONLINE ]  —  GR!TTA"

    print()
    print(f"{V}{B}  ╔{'═' * IW}╗{X}")
    print(f"{V}{B}  ║{title:^{IW}}║{X}")
    print(f"{V}{B}  ╠{'═' * IW}╣{X}")

    for svc in SERVICOS:
        nome  = svc["nome"]
        porta = f"localhost:{svc['porta']}"
        cor   = svc["cor"]
        # Espaço restante à direita da porta para preencher até IW caracteres visíveis:
        # 2 + NP + 5 + len(porta) + pad_dir = IW
        pad_dir = IW - 2 - NP - 5 - len(porta)
        if pad_dir < 0:
            pad_dir = 0
        print(
            f"{V}{B}  ║{X}"
            f"  {cor}{B}{nome:<{NP}}{X}"
            f"{V}{B}  →  {porta}{' ' * pad_dir}║{X}"
        )

    print(f"{V}{B}  ╚{'═' * IW}╝{X}")
    print()


def fase5_orquestracao():
    print()
    cfg("Fase 5 · Orquestração ──────────────────────────────────────")

    if not PYTHON_BIN.exists():
        erro(
            f"Python do venv não encontrado: {PYTHON_BIN}\n"
            "  Execute a Fase 4 antes de rodar o sistema."
        )

    processos = []

    for i, svc in enumerate(SERVICOS):
        svc_dir = ROOT / "services" / svc["nome"]
        run_py  = svc_dir / "run.py"

        if not run_py.exists():
            aviso(f"run.py não encontrado em services/{svc['nome']} (pulando)")
            continue

        # Herda o ambiente do OS + injeta variáveis do .env do serviço
        env = os.environ.copy()
        env_file = svc_dir / ".env"
        if env_file.exists():
            env.update(_carregar_env_arquivo(env_file))

        proc = subprocess.Popen(
            [str(PYTHON_BIN), "run.py"],
            cwd=str(svc_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        processos.append((svc, proc))

        # Thread daemon para capturar e exibir os logs do processo
        t = threading.Thread(
            target=_thread_log,
            args=(svc["nome"], svc["cor"], proc),
            daemon=True,
        )
        t.start()

        print(
            f"  {svc['cor']}{B}[{svc['nome']:<24}]{X}"
            f"  porta {svc['porta']}  ·  PID {proc.pid}"
        )

        # Intervalo entre lançamentos para evitar storm de conexões ao MySQL
        if i < len(SERVICOS) - 1:
            time.sleep(1.5)

    _banner_online()
    print(f"  {G}Pressione Ctrl+C para encerrar todos os serviços.{X}")
    print()

    try:
        while True:
            vivos = [proc for _, proc in processos if proc.poll() is None]
            if not vivos:
                ok("Todos os serviços encerraram.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print()
        cfg("Encerrando serviços ...")
        for _, proc in processos:
            try:
                proc.terminate()
            except Exception:
                pass
        # Aguarda término gracioso antes de forçar
        deadline = time.time() + 3
        while time.time() < deadline:
            if all(proc.poll() is not None for _, proc in processos):
                break
            time.sleep(0.3)
        for _, proc in processos:
            try:
                if proc.poll() is None:
                    proc.kill()
            except Exception:
                pass
        print()
        ok("Todos os serviços encerrados. Até logo!")


# ═══════════════════════════════════════════════════════════════════════════════
#  PONTO DE ENTRADA
# ═══════════════════════════════════════════════════════════════════════════════

def _cabecalho():
    print()
    print(f"{C}{B}  ╔═══════════════════════════════════════════╗{X}")
    print(f"{C}{B}  ║       GR!TTA  ·  Clone and Run           ║{X}")
    print(f"{C}{B}  ╚═══════════════════════════════════════════╝{X}")
    print()
    print(f"  {G}Raiz do projeto: {ROOT}{X}")
    print()


if __name__ == "__main__":
    _cabecalho()
    fase1_mysql()
    fase2_banco()
    fase3_envs()
    fase4_venv()
    fase5_orquestracao()
