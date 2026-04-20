import os
from flask import Flask
from app.routes import main  
from app.extensions import mail
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Configurações do Servidor de E-mail
#app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
#app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
#app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
#app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
#app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
#app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail.init_app(app)

app.register_blueprint(main, url_prefix="/api/notificar")  
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("ERRO CRÍTICO: SECRET_KEY não configurada.")

app.config['SECRET_KEY'] = SECRET_KEY
CORS(app, resources={r"/*": {"origins": "*"}})

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5007, debug=True)