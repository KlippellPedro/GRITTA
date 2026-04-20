import os
from flask import Flask
from app.routes import main  
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.register_blueprint(main)  
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "gritta_melhor_loja")
CORS(app, resources={r"/*": {"origins": "*"}})

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 5004)), debug=True)
