import threading
import requests
import os

NOTIFICATION_URL = "http://127.0.0.1:5007/api/notificar/email"

def send_notification_async(token, email, assunto, mensagem):
    """
    Envia uma notificação em uma thread separada para não bloquear o fluxo principal.
    """
    def task(auth_token, target_email, subject, content):
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "email": target_email,
            "assunto": subject,
            "mensagem": content
        }
        try:
            # Timeout longo o suficiente para o SMTP, mas não infinito
            requests.post(NOTIFICATION_URL, json=payload, headers=headers, timeout=15)
        except Exception as e:
            print(f"[ASYNC NOTIFY ERROR] Falha ao contatar Notification Service: {e}")

    thread = threading.Thread(target=task, args=(token, email, assunto, mensagem))
    thread.start()