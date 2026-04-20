from flask_mail import Message
from .extensions import mail

def processar_envio_email(destinatario, assunto, mensagem):
    """
    Lógica para disparar e-mails reais usando Flask-Mail.
    """
    if not destinatario or not assunto or not mensagem:
        return False, "Dados insuficientes para envio."
    
    try:
        msg = Message(assunto, recipients=[destinatario])
        msg.body = mensagem
        # Você também pode usar msg.html = "<b>...</b>" para e-mails formatados
        mail.send(msg)
        return True, "E-mail enviado com sucesso."
    except Exception as e:
        print(f"[ERRO SMTP] {str(e)}")
        return False, f"Falha no envio: {str(e)}"