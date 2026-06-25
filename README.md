# GR!TTA | High-End Streetwear E-commerce

![Status](https://img.shields.io/badge/Status-Desenvolvimento-orange)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Design](https://img.shields.io/badge/Design-System_v2-teal)

A **GR!TTA** é uma plataforma de e-commerce de alta performance focada na estética _streetwear oversized_. O ecossistema foi projetado sob uma arquitetura de **Microsserviços**, priorizando escalabilidade horizontal, resiliência e independência de deploy para cada domínio de negócio.

---

## Arquitetura do Sistema

O sistema é orquestrado através de oito microsserviços especializados que se comunicam via HTTP/REST:

| Serviço                  | Porta | Responsabilidade                                                      |
| ------------------------ | ----- | --------------------------------------------------------------------- |
| **Auth Service**         | 5005  | Autoridade central de segurança — JWT (Access/Refresh Tokens), Bcrypt |
| **User Service**         | 5001  | Perfis de usuário, endereços (ViaCEP), lista de favoritos             |
| **Order Service**        | 5002  | Core do checkout — carrinho persistente, Saga Pattern de rollback     |
| **Catalog Service**      | 5003  | Engine de catálogo — produtos, categorias, filtros por tipo           |
| **Inventory Service**    | 5004  | Controle transacional de estoque por SKU                              |
| **Payment Service**      | 5006  | Gateway de integração para transações financeiras                     |
| **Notification Service** | 5007  | E-mails transacionais e atualizações de status do pedido              |
| **Wishlist Service**     | 5008  | Gerenciamento de lista de desejos desacoplada                         |

---

## Design System v2

O frontend passou por um redesign completo em 2026, implementando um **Design System** consistente em todas as páginas:

### Paleta de Cores

```css
--bg: #0f1c25 /* Fundo global escuro */ --surface: #162530 /* Cor primária da marca — superfícies */ --surface-2: #1a2e3d /* Superfície secundária */
  --accent: #2aabb0 /* Teal — highlights, links, CTAs */ --text: #f0ece4 /* Texto principal */ --muted: #6e8fa0 /* Texto secundário */
  --danger: #e84545 /* Erros e alertas */ --success: #1a9e5a /* Confirmações */;
```

### Funcionalidades Únicas do Frontend

- **Cursor personalizado** — dot + ring animado com `mix-blend-mode: difference`
- **Grain overlay animado** — textura analógica de 32ms para estética premium
- **Marquee infinito** — ticker com pause-on-hover
- **Countdown ao vivo** — contagem regressiva para lançamentos
- **Cards com hover 3D** — elevação e zoom de imagem
- **Scroll Reveal** — `IntersectionObserver` com delays escalonados
- **Parallax no hero** — grid de fundo com deslocamento suave

### Web Components

Header e footer são injetados via **Custom Elements** (`<gritta-header>`, `<gritta-footer>`), centralizando toda manutenção em `components.js`. O cursor também é injetado globalmente pelo componente.

---

## Catálogo de Produtos

O banco conta com **50 produtos ativos** distribuídos em 5 categorias:

| Categoria  | Qtd | Tamanhos | Preço médio |
| ---------- | --- | -------- | ----------- |
| Camisas    | 10  | PP → XGG | R$ 99–130   |
| Moletons   | 9   | P → GG   | R$ 280–400  |
| Calças     | 10  | 36 → 44  | R$ 200–250  |
| Tênis      | 10  | 38 → 43  | R$ 350–450  |
| Acessórios | 11  | ÚNICO    | R$ 50–150   |

Todas as imagens dos produtos são `.webp` ou `.jpg` armazenadas localmente em `statics/img/roupas/`.

---

## Tecnologias Utilizadas

### Backend (Python & Flask)

- **Flask** — Micro-framework para APIs RESTful
- **PyJWT** — Segurança e integridade na troca de tokens
- **Bcrypt** — Hashing seguro de credenciais
- **MySQL Connector** — Comunicação com a camada de persistência
- **Requests** — Orquestração de chamadas inter-serviços

### Frontend (Vanilla JS Moderno)

- **ES6+ JavaScript** — Lógica assíncrona, módulos, Web Components
- **CSS3 Moderno** — Grid, Flexbox, Custom Properties, animações
- **Dark Theme Industrial** — Glassmorphism escuro em formulários, cards brancos em conteúdo
- **Bebas Neue + Montserrat** — Tipografia com personalidade

### Banco de Dados (MySQL)

- Modelagem relacional em 3NF
- Integridade referencial estrita com Foreign Keys
- Estoque por SKU via tabela `variacoes`

---

## Estrutura do Projeto

```text
GRITTA/
├── services/
│   ├── auth_service/           # JWT · Bcrypt · :5005
│   ├── user_service/           # Perfis · ViaCEP · :5001
│   ├── order_service/          # Checkout · Saga · :5002
│   ├── catalog_service/        # Catálogo · Filtros · :5003
│   ├── inventory_service/      # Estoque por SKU · :5004
│   ├── payment_service/        # Gateway · :5006
│   ├── notification_service/   # Mailer · :5007
│   └── wishlist_service/       # Favoritos · :5008
│
├── statics/
│   ├── css/
│   │   ├── global.css          # Design System — tokens, cursor, grain, utilitários
│   │   ├── menu.css            # Header e Footer
│   │   ├── index.css           # Home — hero, vitrine, categorias, drop
│   │   ├── pages/              # CSS por categoria (drop, camisas, moletons…)
│   │   └── usuario/            # CSS por página de usuário
│   ├── js/
│   │   ├── components.js       # Web Components — header, footer, cursor, marquee
│   │   ├── config.js           # URLs dos microsserviços
│   │   ├── menu.js             # JWT refresh, badges, hambúrguer
│   │   ├── index.js            # Home — vitrine, filtros, countdown, offline fallback
│   │   ├── pages/              # JS por página de categoria
│   │   └── usuario/            # JS por página de usuário
│   └── img/
│       ├── banners/            # banner_inverno.jpg · banner_drop.jpg
│       ├── categorias/         # Thumbnails de categoria
│       ├── icons/              # sacola · coracao · usuario · instagram…
│       └── roupas/             # camisas · moletons · calcas · tenis · acessorios
│
├── templates/
│   ├── index.html              # Home — hero, vitrine, countdown, categorias
│   ├── pages/
│   │   ├── categoria.html      # Listagem dinâmica por tipo
│   │   └── drop.html           # Página de lançamentos
│   └── usuario/
│       ├── login.html          # Autenticação
│       ├── cadastro.html       # Registro
│       ├── perfil.html         # Conta do usuário
│       ├── carrinho.html       # Carrinho de compras
│       ├── favoritos.html      # Lista de desejos
│       ├── pedidos.html        # Histórico de pedidos
│       ├── checkout.html       # Finalização de compra
│       ├── sucesso.html        # Confirmação de pedido
│       ├── produto.html        # Detalhe do produto
│       ├── recuperar-senha.html
│       └── resetar-senha.html
│
├── .claude/
│   └── launch.json             # Configurações de dev servers (Claude Code)
│
├── gritta_db.sql               # Schema completo do banco
├── gritta_novos_produtos.sql   # Script de 23 novos produtos (Jun/2026)
├── requirements.txt
└── run_all_services.bat        # Orquestrador de todos os serviços
```

---

## Instalação e Configuração

### 1. Pré-requisitos

- Python 3.8+
- MySQL 8.0+ (ou XAMPP/MariaDB)
- Navegador moderno
- Live Server (VS Code) ou equivalente para servir os arquivos HTML

### 2. Dependências Python

```bash
pip install flask flask-cors mysql-connector-python PyJWT bcrypt python-dotenv requests
```

### 3. Banco de Dados

Importe o schema no MySQL e, em seguida, os produtos iniciais:

```bash
mysql -u root -p < gritta_db.sql
mysql -u root -p gritta_db < gritta_novos_produtos.sql
```

Configure os arquivos `.env` dentro de cada `services/*/`:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=suasenha
DB_NAME=gritta_db
SECRET_KEY=gritta_melhor_loja
```

### 4. Executar

```bash
# Sobe todos os microsserviços simultaneamente
run_all_services.bat

# Acesse via Live Server em:
templates/index.html
```

---

## Funcionalidades Implementadas

### Core

- [x] Autenticação JWT com refresh automático de token
- [x] Carrinho persistente por usuário (banco de dados)
- [x] Filtro de produtos por categoria no frontend e na API
- [x] Checkout com validação de preço em tempo real
- [x] Saga Pattern simplificado para rollback de estoque
- [x] Controle de estoque por SKU (variação + tamanho)
- [x] Favoritos com sincronização de badge no menu
- [x] Histórico de pedidos com modal de detalhes e imagens

### Frontend & UX

- [x] Design System v2 — paleta escura, tipografia, tokens CSS
- [x] Cursor personalizado com efeito magnético
- [x] Hero de inverno com parallax e countdown ao vivo
- [x] Vitrine com filtros de categoria e fallback offline
- [x] Cards de categoria com fotos reais dos produtos
- [x] Modo offline — detecta falha da API e exibe produtos mock
- [x] Header Web Component com badges dinâmicos e dropdown de usuário
- [x] Redesign completo das páginas de usuário (login, perfil, carrinho, pedidos…)

### Segurança

- [x] JWT em todas as rotas protegidas
- [x] Endereços vinculados a pedidos não podem ser excluídos
- [x] Refresh tokens com expiração de 30 dias
- [x] Validação de preço no checkout (anti-tampering)

---

Desenvolvido por **Pedro Nadalon Klippel** | 2026
