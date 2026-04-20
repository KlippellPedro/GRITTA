# GR!TTA | Premium Streetwear E-commerce

A **GR!TTA** é uma plataforma de e-commerce de alta performance focada na estética streetwear oversized. O sistema foi desenvolvido utilizando uma arquitetura moderna de **Microsserviços**, garantindo escalabilidade, segurança e independência entre os módulos de negócio.

## Arquitetura do Sistema

O projeto é composto por sete microsserviços independentes que se comunicam via APIs RESTful:

1.  **Auth Service (Porta 5005)**: Gerencia o controle de acesso, registro de usuários, hash de senhas com `bcrypt` e emissão de `Access Tokens` (JWT) e `Refresh Tokens`.
2.  **User Service (Porta 5001)**: Responsável pela gestão de dados cadastrais, favoritos (Wishlist) e endereços (integrado com a API ViaCEP).
3.  **Order Service (Porta 5002)**: O "coração" do fluxo de compra. Gerencia itens no carrinho (com persistência em banco), cálculo de frete e histórico de pedidos.
4.  **Catalog Service (Porta 5003)**: Serve a vitrine dinâmica de produtos, filtragem por categorias e detalhes técnicos dos itens.
5.  **Inventory Service (Porta 5004)**: Controle rigoroso de estoque por SKU e baixa automatizada.
6.  **Payment Service (Porta 5006)**: Interface de pagamentos externa (Stripe/Pix).
7.  **Notification Service (Porta 5007)**: Gerenciamento de e-mails transacionais.

## Tecnologias Utilizadas

### **Backend (Python & Flask)**

- **Flask & Flask-CORS**: Framework ágil para criação de APIs seguras.
- **PyJWT**: Implementação de JSON Web Tokens para autenticação stateless.
- **Bcrypt**: Criptografia de nível militar para armazenamento de senhas.
- **MySQL Connector**: Interface robusta para persistência de dados.

### **Frontend (Vanilla Stack)**

- **JavaScript (ES6+)**: Lógica reativa, manipulação dinâmica do DOM e integração assíncrona (Fetch API).
- **CSS3 Moderno**: Efeitos de _Glassmorphism_, transições suaves, variáveis CSS e layouts responsivos (Grid/Flexbox).
- **HTML5**: Estrutura semântica focada em SEO e acessibilidade.

### **Banco de Dados (MySQL)**

- Modelagem relacional normalizada.
- Integridade referencial via chaves estrangeiras (FKs).
- Gestão de tokens de expiração para segurança de sessão.

## Estrutura do Projeto

```text
GRITTA/
├── services/               # Microsserviços Python
│   ├── auth_service/       # Autenticação e Segurança
│   ├── user_service/       # Perfil e Favoritos
│   ├── order_service/      # Carrinho e Pedidos
│   ├── catalog_service/    # Vitrine e Produtos
│   ├── inventory_service/  # Gestão de Estoque e SKUs
│   ├── payment_service/    # Processamento de Pagamentos
│   └── notification_service/ # Disparo de E-mails Transacionais
├── statics/                # Ativos Estáticos
│   ├── css/                # Folhas de estilo modulares
│   ├── img/                # Assets e Galeria de Produtos
│   └── js/                 # Lógica de negócio Frontend
├── templates/              # Views (HTML) do sistema
├── db_gritta.sql           # Schema completo do Banco de Dados
└── run_all.bat             # Orquestrador de inicialização
```

## Instalação e Configuração

### 1. Requisitos Próvios

- Python 3.8+
- MySQL Server (ou XAMPP/MariaDB)
- Navegador moderno (Chrome/Edge recomendado)

### 2. Configuração do Ambiente

Instale as dependências necessárias em seu ambiente Python:

```bash
pip install flask flask-cors mysql-connector-python PyJWT bcrypt python-dotenv
```

### 3. Banco de Dados

Importe o arquivo `db_gritta.sql` no seu servidor MySQL. Certifique-se de que os arquivos `.env` dentro de cada pasta em `services/` possuam as credenciais corretas:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=suasenha
DB_NAME=gritta_db
SECRET_KEY=gritta_melhor_loja
```

## Como Executar

Para subir todo o ecossistema da GR!TTA simultaneamente, utilize o orquestrador Batch fornecido na raiz:

1.  Abra o terminal na raiz do projeto.
2.  Execute: `run_all.bat`
3.  Acesse o site através do seu servidor local (ex: Live Server) no arquivo `templates/index.html`.

## Segurança Implementada

- **JWT Protection**: Todas as rotas sensíveis (carrinho, favoritos, perfil) exigem um token válido.
- **Persistence Integrity**: Endereços vinculados a pedidos não podem ser excluídos, garantindo a rastreabilidade.
- **Refresh Tokens**: Sistema de renovação de sessão automático para melhorar a experiência do usuário sem comprometer a segurança.

---

desenvolvido por **Pedro Nadalon Klippel** | 2026

```

```
