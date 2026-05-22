# GR!TTA | High-End Streetwear E-commerce

![Status](https://img.shields.io/badge/Status-Desenvolvimento-orange)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![License](https://img.shields.io/badge/License-MIT-green)

A **GR!TTA** é uma plataforma de e-commerce de alta performance focada na estética _streetwear oversized_. O ecossistema foi projetado sob uma arquitetura de **Microsserviços**, priorizando escalabilidade horizontal, resiliência e independência de deploy para cada domínio de negócio.

## Arquitetura do Sistema

O sistema é orquestrado através de sete microsserviços especializados que se comunicam via protocolos HTTP/REST:

- **Auth Service (Port: 5005)**: Autoridade central de segurança. Gerencia sessões via `JWT` (Access/Refresh Tokens) e proteção de dados com `Bcrypt`.
- **User Service (Port: 5001)**: Gestão de perfis, endereços (integração ViaCEP) e listas de desejos.
- **Order Service (Port: 5002)**: Core do checkout. Orquestra a criação de pedidos, lógica de carrinho persistente e integração com estoque/pagamento.
- **Catalog Service (Port: 5003)**: Engine de busca e exibição. Gerencia produtos, categorias e metadados técnicos.
- **Inventory Service (Port: 5004)**: Controle transacional de estoque por SKU, garantindo integridade durante picos de venda.
- **Payment Service (Port: 5006)**: Gateway de integração para processamento de transações financeiras.
- **Notification Service (Port: 5007)**: Serviço de mensageria para e-mails transacionais e status de pedido.

## Diferenciais Técnicos

- **Comunicação Inter-serviços**: Implementação de lógica de rollback manual para transações distribuídas (Saga Pattern simplificado) no fluxo de checkout.
- **Segurança Stateless**: Autenticação baseada em tokens JWT, eliminando a necessidade de sessões no servidor e facilitando a escalabilidade.
- **Frontend Modular**: Interface construída em Vanilla JS com manipulação assíncrona do DOM, garantindo performance excepcional sem o overhead de frameworks pesados.

## Tecnologias Utilizadas

### **Backend (Python & Flask)**

- **Flask**: Micro-framework para construção de APIs RESTful.
- **PyJWT**: Segurança e integridade na troca de informações.
- **Bcrypt**: Hashing seguro de credenciais.
- **MySQL Connector**: Comunicação otimizada com a camada de persistência.
- **Requests**: Orquestração de chamadas entre serviços.

### **Frontend (Modern Vanilla)**

- **ES6+ JavaScript**: Lógica assíncrona e modular.
- **Modern CSS**: Grid Layout, Flexbox e variáveis CSS para temas.
- **Glassmorphism UI**: Estética premium com desfoque de fundo e transparências.

### **Banco de Dados (MySQL)**

- Modelagem Relacional (3NF).
- Integridade referencial estrita.

## Estrutura do Projeto

```text
GRITTA/
├── services/                # Backend Microservices
│   ├── auth_service/        # Identity Provider
│   ├── user_service/        # User Data & Wishlists
│   ├── order_service/       # Order Management
│   ├── catalog_service/     # Product Discovery
│   ├── inventory_service/   # Stock Control
│   ├── payment_service/     # Finance Processing
│   └── notification_service/ # Mailer System
├── statics/                 # Frontend Assets (CSS, JS, Images)
├── templates/               # UI Layer (HTML)
├── db_gritta.sql            # Database Schema
├── requirements.txt         # Project Dependencies
└── run_all_services.bat     # Service Orchestrator
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
