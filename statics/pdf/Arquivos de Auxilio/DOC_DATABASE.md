# DOC_DATABASE — GR!TTA Persistência de Dados

> Documentação técnica da camada de dados do e-commerce GR!TTA.  
> Cobre o banco relacional MariaDB 10.4 (`gritta_db`) e os arquivos JSON de configuração de drops.

---

## 1. Arquitetura de Persistência

O sistema usa **duas camadas de persistência** com responsabilidades distintas:

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Banco relacional | MariaDB 10.4 · `charset utf8mb4` | Usuários, produtos, pedidos, carrinho, favoritos, avaliações |
| Arquivos JSON | `drops/*.json` na raiz do projeto | Configuração de drops, estado da loja, imagens de categoria |

A separação é intencional: o catálogo de peças vive no banco (dados mutáveis e relacionais), enquanto o "estado editorial" da loja (qual drop está ativo, quais textos e banners aparecem no hero) vive em arquivos JSON que o admin edita sem tocar em SQL.

---

## 2. Estrutura das Tabelas

### 2.1 `produtos`

Tabela central do catálogo. Cada linha é uma peça de roupa.

```sql
CREATE TABLE produtos (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  nome       VARCHAR(150) NOT NULL,
  slug       VARCHAR(150) NOT NULL UNIQUE,   -- URL-friendly, único
  descricao  TEXT         DEFAULT NULL,
  preco_base DECIMAL(10,2) NOT NULL,
  tipo       ENUM('moletom','calca','acessorio','camisa','tenis','jaqueta'),
  ativo      TINYINT(1)   DEFAULT 1,         -- soft delete
  drop_nome  VARCHAR(100) DEFAULT NULL,      -- FK lógica para o drop (não FK real)
  is_special TINYINT(1)   DEFAULT 0,         -- produto em destaque na vitrine
  criado_em  DATETIME     DEFAULT CURRENT_TIMESTAMP
)
```

**Pontos-chave:**
- `ativo = 0` é o **soft delete**: o produto desaparece da loja mas permanece no banco para preservar referências históricas em `itens_pedido`.
- `slug` é o identificador público de URL (`/produto/camiseta-oversized-angel`). A query `get_product_by_slug` aceita tanto slug quanto `id` para retrocompatibilidade.
- `drop_nome` é uma **FK lógica** (string, não constraint): associa a peça a um drop pelo campo `drop_nome` do JSON correspondente. Permite que a mesma peça apareça na página do drop sem precisar de uma tabela pivot.
- `is_special = 1` marca produtos que aparecem nos carrosséis de destaque. Filtrado via `?special=true`.
- `tipo` é um `ENUM` fechado — o admin_service valida contra `TIPOS_VALIDOS` antes de persistir.

---

### 2.2 `imagens_produto`

Armazena N imagens por produto. É a tabela que viabiliza o efeito de crossfade.

```sql
CREATE TABLE imagens_produto (
  id              INT          PRIMARY KEY AUTO_INCREMENT,
  produto_id      INT          NOT NULL,  -- FK → produtos.id
  caminho_imagem  VARCHAR(255) NOT NULL,  -- caminho relativo a /statics/
  ordem_exibicao  INT          DEFAULT 0  -- 0 = principal, 1 = crossfade, 2+ = galeria
)
```

**A regra do `ordem_exibicao`:**

| Valor | Papel |
|---|---|
| `0` | Imagem principal — exibida em todas as listagens (vitrine, categoria, wishlist) |
| `1` | Imagem de crossfade — revelada no hover do card de produto |
| `2`+ | Imagens extras da galeria — visíveis apenas na página de detalhe do produto |

O campo permite que cada produto tenha de 1 a N imagens (o admin pode adicionar quantas quiser via painel). A query de listagem usa `LEFT JOIN` duas vezes na mesma tabela — uma para `ordem_exibicao = 0` e outra para `= 1` — para buscar ambas em uma única query, sem subqueries ou chamadas extras. Veja a Seção 4.

---

### 2.3 `variacoes`

Cada produto tem N variações (tamanho × estoque).

```sql
CREATE TABLE variacoes (
  id         INT         PRIMARY KEY AUTO_INCREMENT,
  produto_id INT         NOT NULL,        -- FK → produtos.id
  tamanho    VARCHAR(10) NOT NULL,        -- "P", "M", "G", "GG", "38", "39" etc.
  sku        VARCHAR(50) NOT NULL UNIQUE, -- código de estoque gerado: SLUG-TAM
  estoque    INT         DEFAULT 0
)
```

**Pontos-chave:**
- Variações **nunca sofrem hard delete** enquanto houver pedidos: `itens_pedido.variacao_id` aponta para cá. Para "remover" um tamanho, o admin zera o estoque.
- O SKU é gerado automaticamente pelo `admin_service.py` no padrão `BASE-TAM` (ex: `MOL-NGT-M`).
- O filtro de tamanho disponível (`?tamanho=M`) usa subquery correlacionada: `p.id IN (SELECT produto_id FROM variacoes WHERE tamanho = %s AND estoque > 0)`.

---

### 2.4 `usuarios`

```sql
CREATE TABLE usuarios (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  nome        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  cpf         VARCHAR(14)  UNIQUE,
  telefone    VARCHAR(30),
  tipo        ENUM('cliente','funcionario','admin') DEFAULT 'cliente',
  senha_hash  VARCHAR(255),               -- bcrypt via passlib
  ativo       TINYINT(1)   DEFAULT 1,
  provider    VARCHAR(20)  DEFAULT 'local', -- 'local' ou 'google'
  google_id   VARCHAR(50),                 -- preenchido só em login OAuth
  criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP
)
```

**Pontos-chave:**
- `senha_hash` usa bcrypt (`$2b$12$...`). Usuários que entraram via Google OAuth têm `senha_hash = NULL` e `provider = 'google'`.
- `tipo = 'admin'` é a única flag que abre o painel administrativo — o backend verifica no JWT a cada requisição protegida.
- `ativo` permite suspender contas sem deletar histórico de pedidos.

---

### 2.5 `pedidos` + `itens_pedido`

```sql
CREATE TABLE pedidos (
  id                   INT           PRIMARY KEY AUTO_INCREMENT,
  usuario_id           INT           NOT NULL,   -- FK → usuarios.id
  endereco_entrega_id  INT           NOT NULL,   -- FK → enderecos.id
  codigo_rastreio      VARCHAR(100),
  status               ENUM('Aguardando Pagamento','Pago','Em Separação',
                            'Enviado','Entregue','Cancelado') DEFAULT 'Aguardando Pagamento',
  total_pedido         DECIMAL(10,2) NOT NULL,
  criado_em            DATETIME      DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE itens_pedido (
  id             INT           PRIMARY KEY AUTO_INCREMENT,
  pedido_id      INT           NOT NULL,   -- FK → pedidos.id
  variacao_id    INT           NOT NULL,   -- FK → variacoes.id
  quantidade     INT           NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL    -- preço no momento da compra (snapshot)
)
```

**Pontos-chave:**
- `preco_unitario` é um **snapshot**: grava o preço pago na época, independente de mudanças futuras em `produtos.preco_base`. Isso é crítico para histórico financeiro correto.
- A cadeia de FKs `itens_pedido → variacoes → produtos` é o motivo pelo qual produtos com pedidos só podem ser desativados (soft delete), nunca excluídos. O `excluir_produto_hard()` bloqueia se `COUNT(*) FROM itens_pedido JOIN variacoes WHERE variacoes.produto_id = ?` > 0.

---

### 2.6 `carrinhos`

```sql
CREATE TABLE carrinhos (
  id          INT      PRIMARY KEY AUTO_INCREMENT,
  usuario_id  INT      NOT NULL,  -- FK → usuarios.id
  variacao_id INT      NOT NULL,  -- FK → variacoes.id
  quantidade  INT      NOT NULL DEFAULT 1,
  criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (usuario_id, variacao_id)  -- impede duplicatas
)
```

O `UNIQUE KEY (usuario_id, variacao_id)` é a regra de negócio: ao adicionar um item que já está no carrinho, o front faz `PUT` atualizando `quantidade` em vez de `POST`.

---

### 2.7 `favoritos`

```sql
CREATE TABLE favoritos (
  id          INT      PRIMARY KEY AUTO_INCREMENT,
  usuario_id  INT      NOT NULL,  -- FK → usuarios.id
  produto_id  INT      NOT NULL,  -- FK → produtos.id
  criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (usuario_id, produto_id)
)
```

O `UNIQUE KEY` garante que a operação de "adicionar aos favoritos" falha silenciosamente com `IntegrityError` se o produto já estiver salvo — o wishlist_service trata isso como erro 400 com mensagem amigável.

---

### 2.8 `avaliacoes`

```sql
CREATE TABLE avaliacoes (
  id          INT      PRIMARY KEY AUTO_INCREMENT,
  produto_id  INT      NOT NULL,        -- FK → produtos.id
  usuario_id  INT      NOT NULL,        -- FK → usuarios.id
  nota        TINYINT  NOT NULL,        -- 1 a 5
  comentario  TEXT,
  criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_prod (produto_id, usuario_id)
)
```

O `UNIQUE KEY (produto_id, usuario_id)` impõe a regra de **1 avaliação por usuário por produto**. A inserção usa `INSERT ... ON DUPLICATE KEY UPDATE` para permitir edição sem precisar de `SELECT` + `UPDATE` separados.

---

### 2.9 `cupons`

```sql
CREATE TABLE cupons (
  id           INT            PRIMARY KEY AUTO_INCREMENT,
  codigo       VARCHAR(50)    NOT NULL UNIQUE,
  tipo         ENUM('percentual','fixo') DEFAULT 'percentual',
  valor        DECIMAL(10,2)  NOT NULL,
  ativo        TINYINT(1)     DEFAULT 1,
  validade     DATETIME,
  uso_maximo   INT,            -- NULL = sem limite
  usos         INT            DEFAULT 0,
  valor_minimo DECIMAL(10,2)  DEFAULT 0.00,
  criado_em    DATETIME       DEFAULT CURRENT_TIMESTAMP
)
```

---

### 2.10 `enderecos`

```sql
CREATE TABLE enderecos (
  id              INT    PRIMARY KEY AUTO_INCREMENT,
  usuario_id      INT    NOT NULL,  -- FK → usuarios.id
  cep             VARCHAR(9),
  rua             VARCHAR(200),
  numero          VARCHAR(20),
  complemento     VARCHAR(100),
  bairro          VARCHAR(100),
  cidade          VARCHAR(100),
  estado          CHAR(2),
  tipo_endereco   ENUM('Entrega','Cobranca') DEFAULT 'Entrega'
)
```

---

### 2.11 `password_resets`

```sql
CREATE TABLE password_resets (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT          NOT NULL,        -- FK → usuarios.id
  token      VARCHAR(255) NOT NULL UNIQUE, -- token URL-safe gerado com secrets.token_urlsafe
  expiracao  DATETIME     NOT NULL,        -- 30 min a partir da criação
  usado      TINYINT(1)   DEFAULT 0,
  tentativas INT          DEFAULT 0        -- bloqueia brute force no código de 6 dígitos
)
```

O fluxo de redefinição de senha gera um código numérico de 6 dígitos enviado por e-mail. O campo `token` armazena o hash bcrypt do código ou o código em si dependendo do modo. `tentativas` limita tentativas por token.

---

### 2.12 `notificacoes` + `refresh_tokens`

```sql
-- Notificações in-app (sino no header)
CREATE TABLE notificacoes (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT          NOT NULL,
  titulo     VARCHAR(150) NOT NULL,
  mensagem   TEXT,
  link       VARCHAR(255),
  lida       TINYINT(1)   DEFAULT 0,
  criado_em  DATETIME     DEFAULT CURRENT_TIMESTAMP
)

-- Tokens de refresh JWT (rotação por sessão)
CREATE TABLE refresh_tokens (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT          NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expiracao  DATETIME     NOT NULL
)
```

---

## 3. Mapa de Relacionamentos

```
usuarios (1) ──────────────────────────── (N) enderecos
usuarios (1) ──────────────────────────── (N) pedidos
usuarios (1) ──────────────────────────── (N) carrinhos
usuarios (1) ──────────────────────────── (N) favoritos
usuarios (1) ──────────────────────────── (N) avaliacoes
usuarios (1) ──────────────────────────── (N) notificacoes
usuarios (1) ──────────────────────────── (N) refresh_tokens
usuarios (1) ──────────────────────────── (N) password_resets

produtos (1) ──────────────────────────── (N) imagens_produto   [cascade lógico]
produtos (1) ──────────────────────────── (N) variacoes         [cascade lógico]
produtos (1) ──────────────────────────── (N) favoritos
produtos (1) ──────────────────────────── (N) avaliacoes

variacoes (1) ─────────────────────────── (N) itens_pedido
variacoes (1) ─────────────────────────── (N) carrinhos

pedidos (1) ───────────────────────────── (N) itens_pedido
enderecos (1) ──────────────────────────── (N) pedidos
```

**FKs declaradas no schema (todas presentes):**

| Tabela filho | Coluna | Referencia |
|---|---|---|
| `avaliacoes` | `produto_id` | `produtos.id` |
| `avaliacoes` | `usuario_id` | `usuarios.id` |
| `carrinhos` | `usuario_id` | `usuarios.id` |
| `carrinhos` | `variacao_id` | `variacoes.id` |
| `enderecos` | `usuario_id` | `usuarios.id` |
| `favoritos` | `usuario_id` | `usuarios.id` |
| `favoritos` | `produto_id` | `produtos.id` |
| `imagens_produto` | `produto_id` | `produtos.id` |
| `itens_pedido` | `pedido_id` | `pedidos.id` |
| `itens_pedido` | `variacao_id` | `variacoes.id` |
| `notificacoes` | `usuario_id` | `usuarios.id` |
| `password_resets` | `usuario_id` | `usuarios.id` |
| `pedidos` | `usuario_id` | `usuarios.id` |
| `pedidos` | `endereco_entrega_id` | `enderecos.id` |
| `refresh_tokens` | `usuario_id` | `usuarios.id` |
| `variacoes` | `produto_id` | `produtos.id` |

Não há FKs soltas — todas as relações declaradas têm constraint correspondente.

---

## 4. Queries Estratégicas

### 4.1 Query da Vitrine (duplo LEFT JOIN para crossfade)

Usada em `GET /products` e `GET /products?tipo=...&drop=...` — a query mais executada do sistema.

```sql
SELECT
    p.*,
    i.caminho_imagem  AS imagem,    -- ordem_exibicao = 0 → imagem principal
    i2.caminho_imagem AS imagem_2,  -- ordem_exibicao = 1 → imagem de crossfade
    SUM(v.estoque)    AS total_estoque,
    GROUP_CONCAT(DISTINCT v.tamanho)  AS tamanhos_disponiveis,
    GROUP_CONCAT(CONCAT(v.id,':',v.tamanho,':',v.estoque)) AS variacoes
FROM produtos p
    LEFT JOIN imagens_produto i  ON p.id = i.produto_id  AND i.ordem_exibicao  = 0
    LEFT JOIN imagens_produto i2 ON p.id = i2.produto_id AND i2.ordem_exibicao = 1
    LEFT JOIN variacoes v ON p.id = v.produto_id
WHERE p.ativo = 1
  [AND p.tipo = ?]       -- filtro de categoria
  [AND p.drop_nome = ?]  -- filtro de drop
  [AND p.is_special = 1] -- filtro de destaques
  [AND p.preco_base BETWEEN ? AND ?]
  [AND p.id IN (SELECT produto_id FROM variacoes WHERE tamanho = ? AND estoque > 0)]
GROUP BY p.id
[ORDER BY preco_asc | preco_desc | recentes | nome]
```

**Por que dois LEFT JOINs na mesma tabela?**  
Um único JOIN traria múltiplas linhas por produto (uma para cada imagem). A técnica de fazer `JOIN ... AND ordem_exibicao = 0` e `JOIN ... AND ordem_exibicao = 1` simultaneamente retorna exatamente uma linha por produto com as duas imagens já resolvidas. O front lê `imagem` para o estado padrão do card e `imagem_2` para o hover — é o que habilita o efeito de crossfade no CSS sem nenhuma chamada extra ao servidor.

**`GROUP_CONCAT` de variações:**  
O campo `variacoes` retorna uma string no formato `"id:tamanho:estoque,id:tamanho:estoque"`. O front deserializa no JavaScript e constrói o seletor de tamanhos dinamicamente, sem precisar de uma rota separada para buscar variações.

---

### 4.2 Query da Wishlist (mesmo padrão, contexto diferente)

Usada em `GET /favoritos` no wishlist_service — idêntica em estrutura ao duplo JOIN da vitrine:

```sql
SELECT
    f.id,
    p.id          AS produto_id,
    p.nome,
    p.preco_base  AS preco,
    p.slug,
    i.caminho_imagem  AS imagem,    -- principal
    i2.caminho_imagem AS imagem_2   -- crossfade
FROM favoritos f
    JOIN produtos p ON f.produto_id = p.id
    LEFT JOIN imagens_produto i  ON p.id = i.produto_id  AND i.ordem_exibicao  = 0
    LEFT JOIN imagens_produto i2 ON p.id = i2.produto_id AND i2.ordem_exibicao = 1
WHERE f.usuario_id = ?
```

O `JOIN` (não `LEFT JOIN`) em `produtos` é intencional: se um produto for excluído do banco, ele desaparece automaticamente dos favoritos sem deixar fantasmas na lista.

---

### 4.3 Query de Detalhe do Produto (`GROUP_CONCAT` com `SUBSTRING_INDEX`)

Usada em `GET /products/<slug>` — precisa de todas as imagens, não só as duas primeiras:

```sql
SELECT
    p.*,
    SUBSTRING_INDEX(
        GROUP_CONCAT(ia.caminho_imagem ORDER BY ia.ordem_exibicao SEPARATOR '|'),
        '|', 1
    ) AS imagem,
    GROUP_CONCAT(ia.caminho_imagem ORDER BY ia.ordem_exibicao SEPARATOR '|') AS todas_imagens,
    GROUP_CONCAT(DISTINCT CONCAT(v.id,':',v.tamanho,':',v.estoque)) AS variacoes
FROM produtos p
    LEFT JOIN imagens_produto ia ON p.id = ia.produto_id
    LEFT JOIN variacoes v ON p.id = v.produto_id
WHERE (p.slug = ? OR p.id = ?)
  AND p.ativo = 1
GROUP BY p.id
LIMIT 1
```

**Por que `SUBSTRING_INDEX` aqui e não duplo JOIN?**  
Na página de detalhe precisamos de *todas* as imagens em ordem (`0, 1, 2, 3...`), não só as duas primeiras. `GROUP_CONCAT ... ORDER BY ordem_exibicao SEPARATOR '|'` serializa a galeria completa em uma string. `SUBSTRING_INDEX(..., '|', 1)` extrai só a primeira sem pós-processamento no Python — o campo `imagem` é compatível com o que o front espera da mesma API.

O `WHERE p.slug = ? OR p.id = ?` permite resolver pelo slug (uso normal) ou pelo ID numérico (retrocompatibilidade de links antigos).

---

### 4.4 Query de Produtos Relacionados (subquery correlacionada)

Usada no carrossel "Você também pode gostar" na página de detalhe:

```sql
SELECT p.*, i.caminho_imagem AS imagem
FROM produtos p
    LEFT JOIN imagens_produto i ON p.id = i.produto_id AND i.ordem_exibicao = 0
WHERE p.id != ?
  AND p.tipo = (SELECT tipo FROM produtos WHERE id = ?)
  AND p.ativo = 1
LIMIT ?
```

A subquery correlacionada `(SELECT tipo FROM produtos WHERE id = ?)` busca o tipo do produto atual para filtrar produtos do mesmo tipo sem precisar de um JOIN adicional ou de passar o tipo como parâmetro extra para a rota.

---

### 4.5 Query do Admin — Listagem com Agregação e Filtro de Status

Usada em `GET /admin/produtos?status=ativas|desativadas`:

```sql
SELECT
    p.id, p.nome, p.slug, p.preco_base, p.tipo, p.ativo, p.drop_nome, p.is_special,
    i.caminho_imagem      AS imagem,
    COALESCE(SUM(v.estoque), 0) AS total_estoque,
    COUNT(DISTINCT v.id)        AS num_variacoes
FROM produtos p
    LEFT JOIN imagens_produto i ON p.id = i.produto_id AND i.ordem_exibicao = 0
    LEFT JOIN variacoes v ON p.id = v.produto_id
WHERE p.ativo = ?           -- 1 para ativas, 0 para desativadas
GROUP BY p.id
ORDER BY p.id DESC
```

`COALESCE(SUM(v.estoque), 0)` trata produtos sem variações (estoque `NULL` quando não há registros na tabela filho). `COUNT(DISTINCT v.id)` conta quantas variações existem — útil para o admin identificar produtos incompletos.

---

### 4.6 `INSERT ... ON DUPLICATE KEY UPDATE` (Avaliações)

```sql
INSERT INTO avaliacoes (produto_id, usuario_id, nota, comentario)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    nota       = VALUES(nota),
    comentario = VALUES(comentario),
    criado_em  = NOW()
```

Explora o `UNIQUE KEY uniq_user_prod (produto_id, usuario_id)` para fazer upsert em uma única instrução. Se o usuário já avaliou o produto, atualiza sem precisar de `SELECT` + `IF` no Python.

---

## 5. Controle de Status dos Drops (JSON + Banco)

### 5.1 Arquitetura dos Arquivos

```
drops/
├── _estado.json          ← ponteiro: qual drop está ativo agora
├── _categorias.json      ← imagens do bloco "Explore por Categoria"
├── normal.json           ← configuração da loja no modo padrão
└── winter-is-coming.json ← drop de inverno (trancado, com senha)
```

Arquivos com prefixo `_` são internos e invisíveis para a listagem pública. Novos drops são criados adicionando um arquivo `<id>.json` — sem migrations, sem ALTER TABLE.

---

### 5.2 `_estado.json` — Ponteiro Global

```json
{ "modo": "normal", "ativo": "normal" }
```

`ativo` aponta para o `id` do drop ativo (nome do arquivo sem `.json`). O `modo` é derivado: `"normal"` se `ativo == "normal"`, senão `"drop"`. O front lê `GET /storefront` e aplica o estado via `applyStorefront()` em `components.js`.

---

### 5.3 Os Três Estados de um Drop

| Estado | `trancado` | `arquivado` | `senha_hash` | Visibilidade |
|---|---|---|---|---|
| **Público** | `false` | `false` | ausente | Acessível a qualquer visitante |
| **Secreto** | `true` | `false` | SHA-256 da senha | Exige senha para acessar o conteúdo |
| **Arquivado** | `false` (forçado) | `true` | removido | Invisível na loja, preservado para histórico |

**Exclusão mútua:** `arquivado: true` força `trancado: false` e remove o `senha_hash`. Implementado em `salvar_drop()`:

```python
if config.get('arquivado'):
    config['trancado'] = False
    config.pop('senha_hash', None)
```

---

### 5.4 Validação da Senha do Drop

```python
# Na rota POST /drops/<id>/acesso
senha_digitada = data.get('senha')
hash_armazenado = config.get('senha_hash')
hash_calculado  = hashlib.sha256(senha.encode('utf-8')).hexdigest()

if hash_calculado != hash_armazenado:
    return {"ok": False, "erro": "SENHA INCORRETA"}, 401
```

A senha nunca é armazenada em plain text — apenas o SHA-256. O admin digita a senha no painel e `salvar_drop()` grava o hash. Em edições subsequentes sem nova senha, o hash existente é preservado.

**Exemplo real (`winter-is-coming.json`):**
```json
{
  "trancado": true,
  "senha_hash": "46f22df8a191d766d4e1590485268ef0e22924f3286eadfd67bbcb5cd76ae2f0"
}
```

---

### 5.5 `_categorias.json` — Imagens das Categorias

```json
{
  "moletons":   "img/uploads/...",
  "camisas":    "img/uploads/...",
  "calcas":     "img/roupas/calcas/...",
  "tenis":      "img/uploads/...",
  "acessorios": "img/uploads/..."
}
```

Fonte de verdade para o bloco "Explore por Categoria" na home. Lido via `GET /categories` (público) e atualizado via `PUT /admin/categories/<tipo>` (admin). Tem fallback para imagens hardcoded em `storefront.py` caso o arquivo não exista.

---

## 6. Auditoria de Índices

### 6.1 Índices Existentes

| Tabela | Índices |
|---|---|
| `avaliacoes` | PK `id`, UNIQUE `(produto_id, usuario_id)`, KEY `produto_id`, KEY `usuario_id` |
| `carrinhos` | PK `id`, UNIQUE `(usuario_id, variacao_id)`, KEY `variacao_id` |
| `cupons` | PK `id`, UNIQUE `codigo` |
| `enderecos` | PK `id`, KEY `usuario_id` |
| `favoritos` | PK `id`, UNIQUE `(usuario_id, produto_id)`, KEY `produto_id` |
| `imagens_produto` | PK `id`, KEY `produto_id` |
| `itens_pedido` | PK `id`, KEY `pedido_id`, KEY `variacao_id` |
| `notificacoes` | PK `id`, KEY `usuario_id` |
| `password_resets` | PK `id`, UNIQUE `token`, KEY `usuario_id` |
| `pedidos` | PK `id`, KEY `usuario_id`, KEY `endereco_entrega_id` |
| `produtos` | PK `id`, UNIQUE `slug` |
| `refresh_tokens` | PK `id`, UNIQUE `token`, KEY `usuario_id` |
| `usuarios` | PK `id`, UNIQUE `email`, UNIQUE `cpf` |
| `variacoes` | PK `id`, UNIQUE `sku`, KEY `produto_id` |

### 6.2 Gaps Identificados — Campos Consultados sem Índice

Os campos abaixo aparecem em cláusulas `WHERE` ou `JOIN ON` em todas as queries públicas mas não têm índice dedicado:

| Tabela | Campo | Frequência de uso | Impacto estimado |
|---|---|---|---|
| `produtos` | `ativo` | Toda query pública filtra `WHERE p.ativo = 1` | Alto — full scan na tabela inteira sem índice |
| `produtos` | `tipo` | Toda página de categoria filtra `AND tipo = ?` | Alto — filtro principal de navegação |
| `produtos` | `drop_nome` | Toda query de drop filtra `AND drop_nome = ?` | Médio — usado ao ativar um drop |
| `imagens_produto` | `ordem_exibicao` | Todos os JOINs de imagem usam `AND i.ordem_exibicao = 0` | Médio — o `KEY produto_id` já reduz o escopo, mas composto seria melhor |

### 6.3 Scripts de Correção Recomendados

Adicionar ao banco ou incluir em uma futura migration:

```sql
-- Índices de alta prioridade para a tabela produtos
ALTER TABLE `produtos`
  ADD INDEX `idx_ativo`     (`ativo`),
  ADD INDEX `idx_tipo`      (`tipo`),
  ADD INDEX `idx_drop_nome` (`drop_nome`),
  ADD INDEX `idx_is_special`(`is_special`);

-- Índice composto em imagens_produto para otimizar o duplo LEFT JOIN
-- (produto_id já existe, substituir por composto)
ALTER TABLE `imagens_produto`
  ADD INDEX `idx_produto_ordem` (`produto_id`, `ordem_exibicao`);
```

O índice composto `(produto_id, ordem_exibicao)` em `imagens_produto` é o mais impactante: o duplo LEFT JOIN da query de vitrine executa duas varreduras na tabela de imagens por produto, e o índice composto permite que o MySQL resolva ambas com index-only lookups.

### 6.4 Nota sobre Encoding

O banco está definido como `utf8mb4` (linha `SET NAMES utf8mb4` no dump) e as tabelas usam `CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`. O problema de caracteres quebrados (`T??nis`, `Pel??cia`) que aparece em alguns `INSERT` do dump era causado exclusivamente pela camada de conexão Python, que não especificava `charset='utf8mb4'` ao criar o conector. **Corrigido em `database.py`** adicionando `charset='utf8mb4', use_unicode=True` ao `mysql.connector.connect()`. O schema em si está correto.

---

## 7. Diagrama de Dependências de Exclusão

Antes de excluir qualquer entidade, respeitar esta ordem para não violar FKs:

```
Para excluir um PRODUTO (hard delete):
  1. DELETE FROM imagens_produto WHERE produto_id = ?
  2. DELETE FROM favoritos     WHERE produto_id = ?   (try/ignore se FK externa)
  3. DELETE FROM variacoes     WHERE produto_id = ?   ← BLOQUEADO se itens_pedido existir
  4. DELETE FROM produtos      WHERE id = ?

Para excluir um USUÁRIO:
  1. DELETE FROM refresh_tokens  WHERE usuario_id = ?
  2. DELETE FROM password_resets WHERE usuario_id = ?
  3. DELETE FROM notificacoes    WHERE usuario_id = ?
  4. DELETE FROM favoritos       WHERE usuario_id = ?
  5. DELETE FROM carrinhos       WHERE usuario_id = ?
  6. DELETE FROM enderecos       WHERE usuario_id = ?  ← BLOQUEADO se pedidos existir
  7. DELETE FROM usuarios        WHERE id = ?
```

Produtos com pedidos associados não podem ser hard-deletados — somente desativados (`ativo = 0`). Esta regra está implementada e enforçada em `excluir_produto_hard()` no `admin_service.py`.
