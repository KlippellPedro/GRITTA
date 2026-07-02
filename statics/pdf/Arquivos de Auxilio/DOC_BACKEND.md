# DOC_BACKEND — GR!TTA: Arquitetura, Fluxos e Auditoria de Segurança

> Gerado com as skills **security-best-practices** (guia Flask) e **systematic-debug**.
> Serve como guia de defesa técnica para apresentação de banca.

---

## 1. Visão Geral da Arquitetura

A GR!TTA adota uma arquitetura de **microsserviços em Python/Flask**. Cada domínio de negócio roda como um processo independente, comunicando-se via HTTP interno (localhost). O frontend estático (Vanilla JS) consome as APIs via `fetch()` com tokens JWT no header `Authorization: Bearer <token>`.

```
┌──────────────────── Frontend Estático (porta 5599) ─────────────────────┐
│  Vanilla JS · Web Components · CSS Design System                         │
└─────────────┬───────────────────────────────────────┬────────────────────┘
              │ fetch() + JWT                          │
              ▼                                        ▼
   ┌──────────────────┐              ┌──────────────────────────┐
   │  auth_service    │              │   catalog_service         │
   │  Porta 5005      │              │   Porta 5003              │
   │  /api/auth/*     │              │   /products/* /drops/*    │
   │  JWT · bcrypt    │              │   /storefront/* /admin/*  │
   └──────────────────┘              └──────────────────────────┘
              │                                        │
   ┌──────────┴───────────┐          ┌─────────────────┴──────────────────┐
   ▼                      ▼          ▼                                     ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐
│ order_service│  │  user_service  │  │inventory_service │  │notification │
│  Porta 5002  │  │  Porta 5008    │  │  Porta 5004      │  │  Porta 5007 │
│  Checkout    │  │  Perfil/Endereç│  │  Estoque/Baixa   │  │  E-mails    │
└──────────────┘  └────────────────┘  └──────────────────┘  └─────────────┘
       │
┌──────┴────────┐
│payment_service│
│  Porta 5006   │
│  PIX/Cartão   │
└───────────────┘
```

### Padrões adotados globalmente

| Padrão | Implementação |
|---|---|
| **Autenticação** | JWT HS256 — Bearer token no header `Authorization` |
| **Autorização** | Decoradores `@token_required` / `@admin_required` em cada rota |
| **SQL** | Queries parametrizadas com `%s` (mysql-connector-python); nunca f-string em queries |
| **Senhas** | bcrypt via `bcrypt.hashpw()` — fator de custo padrão (~13) |
| **Blueprint** | Cada serviço registra um único Blueprint `main` com url_prefix |
| **Config** | `SECRET_KEY` obrigatória via variável de ambiente; `raise ValueError` se ausente |
| **Uploads** | Allowlist de extensão + `secure_filename` + UUID + checagem de path traversal |
| **Rate Limiting** | Implementado em memória no auth_service por IP + endpoint |

---

## 2. Serviço de Autenticação (`auth_service` · porta 5005)

### Fluxo A — Registro de Usuário

**Rota e Endpoint**
```
POST /api/auth/register
```

**Arquivos e Funções**
- `services/auth_service/app/routes.py` → `register()` (linha 32)
- `services/auth_service/app/service.py` → `register_user(data)` (linha 153)
- `services/auth_service/app/validator.py` → `validate_email`, `validate_password`, `validate_cpf`, `validate_phone`, `hash_password`

**Como Funciona por Trás dos Panos**

1. O decorator `@rate_limit(max_calls=5, window=60)` verifica o IP via `X-Forwarded-For` e bloqueia (HTTP 429) se houver mais de 5 requisições em 60s.
2. `register_user(data)` valida e-mail, senha (min. 6 chars, letra + número), CPF (11 dígitos numéricos) e telefone antes de qualquer acesso ao banco.
3. A senha é hasheada com **bcrypt** (`bcrypt.hashpw(password.encode(), bcrypt.gensalt())`) — nunca armazenada em plain text.
4. O INSERT usa query parametrizada; em caso de `IntegrityError` distingue `email` de `cpf` já cadastrados.
5. Um e-mail de boas-vindas é disparado de forma **assíncrona** via `threading.Thread` — não bloqueia a resposta HTTP.

**Argumento para a Banca**

> "Separamos validação de negócio (validator.py) da persistência (service.py) e da rota HTTP (routes.py) — respeito ao SRP. O bcrypt adiciona salt automático e é resistente a ataques de dicionário, ao contrário de MD5 ou SHA-256 puro. O rate limiting por IP em memória é suficiente para um ambiente single-instance de MVP e pode ser substituído por Redis em produção sem alterar a lógica de negócio."

---

### Fluxo B — Login e Emissão de Tokens JWT

**Rota e Endpoint**
```
POST /api/auth/login
```

**Arquivos e Funções**
- `services/auth_service/app/routes.py` → `login()` (linha 41)
- `services/auth_service/app/service.py` → `login_user(data)` (linha 203), `_emitir_tokens(user)` (linha 67)

**Como Funciona por Trás dos Panos**

1. O e-mail é buscado no banco com query parametrizada; a senha é conferida com `bcrypt.checkpw()`.
2. Em caso de falha, a resposta é sempre `"E-mail ou senha inválidos"` — sem distinguir qual campo errou (anti-user-enumeration).
3. Dois tokens são gerados:
   - **Access Token**: JWT HS256 com `exp` de 1 hora. Payload: `{id, email, nome, tipo}`.
   - **Refresh Token**: `secrets.token_urlsafe(64)` (opaco, 64 bytes de entropia) armazenado na tabela `refresh_tokens` com `exp` de 30 dias.
4. O refresh token é opaco e persistido no banco — isso permite **revogação** individual (não é possível com JWT puro).

**Argumento para a Banca**

> "Adotamos o padrão Access + Refresh Token: o access token é curto e stateless (ideal para microsserviços); o refresh token é opaco e server-side, o que permite invalidar sessões específicas sem exigir blacklisting de JWT. A combinação evita tanto o custo de consulta ao banco em cada request quanto a impossibilidade de logout forçado."

---

### Fluxo C — Login com Google (OAuth 2.0 / OIDC)

**Rota e Endpoint**
```
POST /api/auth/google
```

**Arquivos e Funções**
- `services/auth_service/app/routes.py` → `google_login()` (linha 48)
- `services/auth_service/app/service.py` → `login_with_google(token_google)` (linha 92)

**Como Funciona por Trás dos Panos**

1. O frontend usa a **Google Identity Services (GIS)** para obter um `credential` (ID Token JWT assinado pela Google).
2. O backend usa `google.oauth2.id_token.verify_oauth2_token()` para validar a assinatura junto ao endpoint público da Google — **nunca confia no front**.
3. Verifica `email_verified == True` antes de criar ou vincular a conta.
4. Faz upsert: cria conta nova se não existe, vincula `google_id` se o e-mail já existia com cadastro tradicional.
5. Emite os mesmos access + refresh tokens do fluxo normal via `_emitir_tokens()`.

**Argumento para a Banca**

> "A validação do token Google é feita server-side com a biblioteca oficial `google-auth` — isso previne que um atacante forje um token falsificado no front e ganhe acesso. O fluxo de vinculação de conta (email existente + google_id NULL) é tratado com UPDATE condicional para evitar duplicatas."

---

### Fluxo D — Reset de Senha por Código de 6 Dígitos

**Rota e Endpoint**
```
POST /api/auth/forgot-password       ← solicita o código
POST /api/auth/verify-reset-code     ← valida o código (sem consumir)
POST /api/auth/reset-password        ← troca a senha e invalida o código
```

**Arquivos e Funções**
- `services/auth_service/app/service.py` → `request_password_reset()` (linha 283), `verify_reset_code()` (linha 324), `reset_password()` (linha 366)

**Como Funciona por Trás dos Panos**

1. **`forgot-password`**: Gera código com `secrets.randbelow(1_000_000)` (criptograficamente seguro). Armazena apenas o **hash bcrypt** do código na tabela `password_resets` — nunca o dígito em plain text. Invalida códigos anteriores não usados. A resposta é **sempre a mesma** independente de o e-mail existir ou não (anti-user-enumeration).
2. **`verify-reset-code`**: Confere o hash sem consumir o código. Conta tentativas com `tentativas++`. Após 5 tentativas erradas, marca o código como `usado = 1` (queima o código).
3. **`reset-password`**: Reutiliza a mesma lógica de verificação + troca a senha com novo hash bcrypt + marca código como `usado = 1`. Tudo em transação atômica.
4. O código expira em **15 minutos** por `expiracao > NOW()` no SQL.
5. O e-mail com o código é enviado via notification_service usando um token de serviço interno de 1 minuto de vida.

**Argumento para a Banca**

> "O fluxo de 3 etapas (solicitar → verificar → resetar) é o padrão de mercado — evita que o código seja consumido prematuramente durante a digitação. Armazenar apenas o hash bcrypt do código garante que, mesmo com vazamento do banco, os códigos não sirvam para acesso. O token de serviço interno limita a janela de ataque de SSRF entre microsserviços."

---

## 3. Serviço de Catálogo (`catalog_service` · porta 5003)

### Fluxo E — Gate do Drop Secreto (SHA-256)

**Rota e Endpoint**
```
GET  /drops                          ← público: lista drops (sem senha_hash)
GET  /drops/<drop_id>/info           ← público: metadados (id, nome, trancado)
POST /drops/<drop_id>/acesso         ← público: valida a senha do drop
```

**Arquivos e Funções**
- `services/catalog_service/app/routes.py` → `drop_acesso()` (linha 118)
- `services/catalog_service/app/storefront.py` → `_safe_id()` (linha 22), `_load_drop()` (linha 31), `salvar_drop()` (linha 100)
- `drops/winter-is-coming.json` — arquivo de configuração do drop

**Como Funciona por Trás dos Panos**

1. Ao criar/salvar um drop com senha no painel admin, o `salvar_drop()` converte a senha em `SHA-256` e armazena apenas `senha_hash` no JSON — nunca a senha em plain text.
2. O endpoint `GET /drops` retorna a lista de drops mas **nunca expõe `senha_hash`** (filtrado manualmente).
3. O endpoint `GET /drops/<id>/info` retorna apenas `{id, nome, drop_nome, trancado}` — sem `senha_hash`.
4. Na validação (`POST /drops/<id>/acesso`), o backend recalcula `hashlib.sha256(senha.encode()).hexdigest()` e compara com o hash armazenado.
5. O front-end, ao receber `{"ok": true}`, salva um token no `sessionStorage` (`gritta_unlock_<slug>`). Se o usuário tentar acessar `drop.html?slug=<slug>` sem esse token, é redirecionado para `drop-senha.html`.
6. `_safe_id()` previne path traversal nos IDs de drop: aceita apenas `[a-zA-Z0-9-_]`.

**Argumento para a Banca**

> "O gate de drop não é um sistema de autenticação de usuário — é um controle de acesso a conteúdo editorial. SHA-256 é adequado para esse contexto (a senha é de conhecimento compartilhado entre comunidade VIP, não um segredo pessoal). A decisão foi pragmática: se fosse senha de usuário, usaríamos bcrypt. O arquivo JSON de configuração desacopla o drop do código — qualquer alteração de status não exige deploy."

---

### Fluxo F — Proteção de Rotas Admin com Blueprint + JWT

**Rota e Endpoint**
```
GET    /admin/produtos               ← lista peças
POST   /admin/produtos               ← cria peça
GET    /admin/produtos/<id>          ← detalhe da peça
PUT    /admin/produtos/<id>          ← atualiza peça
DELETE /admin/produtos/<id>          ← soft delete
POST   /admin/upload                 ← upload de imagem
PUT    /storefront                   ← define drop ativo
POST   /storefront/drops             ← salva config de drop
DELETE /storefront/drops/<id>        ← exclui drop
```

**Arquivos e Funções**
- `services/catalog_service/app/auth.py` → `admin_required` (linha 27)
- `services/catalog_service/app/admin_service.py` → todas as funções CRUD
- `services/catalog_service/app/routes.py` → rotas `@admin_required`

**Como Funciona por Trás dos Panos**

1. O decorator `@admin_required` intercepta a requisição antes do handler da rota.
2. Extrai o header `Authorization: Bearer <token>`, decodifica com `jwt.decode(token, SECRET_KEY, algorithms=["HS256"])`.
3. Verifica `payload.get("tipo") == "admin"` — esse campo foi incluído no JWT no momento do login.
4. Se não for admin: `jsonify({"error": "Acesso restrito a administradores"}), 403`.
5. O JWT é **stateless** — o serviço de catálogo não consulta o banco do auth_service; a assinatura criptográfica do token (HMAC-SHA256 com `SECRET_KEY` compartilhada) garante autenticidade.
6. O Blueprint registra as rotas sob `/` (sem prefixo adicional) — o `url_prefix` está no `run.py`.

**Argumento para a Banca**

> "A proteção é feita em cada rota individualmente via decorator — padrão Flask explícito sobre implícito. A `SECRET_KEY` compartilhada entre serviços é carregada de variável de ambiente e nunca hardcoded. A checagem de `tipo == 'admin'` no payload JWT elimina a necessidade de consulta inter-serviço a cada request: qualquer microsserviço que conhece a SECRET_KEY pode validar autonomamente o nível de acesso."

---

### Fluxo G — CRUD de Produtos com Segurança de Upload

**Rota e Endpoint**
```
POST /admin/upload
```

**Arquivos e Funções**
- `services/catalog_service/app/admin_service.py` → `salvar_upload()` (linha 310), `_img_segura()` (linha 63)

**Como Funciona por Trás dos Panos**

1. Allowlist de extensão: `{'.webp', '.jpg', '.jpeg', '.png'}` — só imagens.
2. Lê o stream sem carregar em memória (`seek(0, SEEK_END)`) para verificar tamanho máximo de **5 MB**.
3. Usa `werkzeug.utils.secure_filename()` para sanitizar o nome original, então gera um nome único com `uuid.uuid4().hex[:8]` — o nome do arquivo nunca é controlado pelo usuário.
4. Calcula `dest_path = os.path.abspath(os.path.join(dest_dir, nome_final))` e verifica `dest_path.startswith(STATIC_IMG_DIR + os.sep)` — **defesa contra path traversal** explícita.
5. `_img_segura()` também valida caminhos de imagem vindos do payload JSON: rejeita `..`, exige prefixo `img/`, valida extensão.

**Argumento para a Banca**

> "Seguimos o checklist OWASP File Upload: allowlist (não blocklist) de extensões, limite de tamanho, geração de nome server-side (sem confiar no filename do cliente), armazenamento fora da raiz web quando possível, e dupla verificação de path traversal. O `secure_filename` do Werkzeug remove barras e sequências `..` — mas combinado com a verificação de `startswith(STATIC_IMG_DIR)`, garantimos dupla proteção."

---

## 4. Serviço de Pedidos (`order_service` · porta 5002)

### Fluxo H — Pipeline de Checkout Multi-Serviço

**Rota e Endpoint**
```
POST /api/checkout
```

**Arquivos e Funções**
- `services/order_service/app/routes.py` → `checkout()` (linha 32)
- `services/order_service/app/service.py` → `create_order()`, `get_user_cart()`
- `services/order_service/app/cupom_service.py` → `validar_cupom()`, `registrar_uso()`
- `services/order_service/app/frete_service.py` → `calcular_frete()`, `get_endereco_cep()`

**Como Funciona por Trás dos Panos**

O checkout é uma **saga distribuída** com rollback:

```
1. Autenticação (@token_required)
2. Busca carrinho do usuário
3. Validação de preço server-side (compara com catalog_service) ← NUNCA confia no front
4. Para cada item: reserva estoque no inventory_service (POST /baixa)
   └── Se algum falhar: estorno de todos os já reservados (POST /devolver)
5. Revalida cupom server-side (nunca confia no desconto enviado pelo front)
6. Recalcula frete server-side pelo CEP do endereço do usuário
7. Processa pagamento no payment_service com total final
   └── Se recusar: estorno total de estoque
8. Cria pedido no banco (apenas se pagamento aprovado)
9. Consome 1 uso do cupom (após pedido confirmado)
10. Notificação in-app + e-mail assíncrono
```

**Argumento para a Banca**

> "O checkout implementa o padrão Saga Coreografada com compensação manual. A validação dupla de preço e frete no servidor previne a vulnerabilidade clássica de 'price manipulation' — onde um usuário modifica o payload com preço menor. O rollback de estoque garante consistência eventual mesmo sem transação distribuída formal (Two-Phase Commit)."

---

### Fluxo I — Cupons de Desconto

**Rota e Endpoint**
```
POST /api/cupons/validar      ← cliente: verifica (sem consumir uso)
GET  /api/cupons              ← admin: lista
POST /api/cupons              ← admin: cria
PUT  /api/cupons/<id>         ← admin: ativa/desativa
DELETE /api/cupons/<id>       ← admin: exclui
```

**Arquivos e Funções**
- `services/order_service/app/cupom_service.py` → `validar_cupom()`, `criar_cupom()`, `registrar_uso()`

**Como Funciona por Trás dos Panos**

1. `validar_cupom(codigo, subtotal)` busca o cupom no banco e checa: `ativo=1`, dentro do período de validade, abaixo do `limite_usos`. Calcula o desconto com base em `tipo` (percentual ou fixo) e `valor_minimo`.
2. O endpoint de validação por cliente **não consome** o uso — apenas retorna `{valido, desconto, total}` para preview no checkout.
3. O uso real é registrado via `registrar_uso()` apenas após o pedido confirmado no banco (etapa 9 do checkout).
4. No checkout, o cupom é **revalidado server-side** mesmo que o front já tenha feito o preview.

**Argumento para a Banca**

> "A separação entre 'validar' (preview, não consome) e 'registrar_uso' (após pedido confirmado) segue o princípio da responsabilidade única e previne race conditions onde o uso seria registrado antes da confirmação do pagamento. A revalidação no checkout é uma camada de defesa extra que torna impossível usar um cupom desativado durante o processo."

---

### Fluxo J — Cálculo de Frete

**Rota e Endpoint**
```
POST /api/frete               ← cliente: preview do frete por CEP
```

**Arquivos e Funções**
- `services/order_service/app/frete_service.py` → `calcular_frete()`, `get_endereco_cep()`

**Como Funciona por Trás dos Panos**

1. Recebe o CEP e o subtotal.
2. Consulta a API dos Correios (ViaCEP ou similar) para validar o CEP e obter UF.
3. Aplica tabela de frete por região com regra de **frete grátis** acima de um subtotal mínimo.
4. No checkout, o CEP é buscado diretamente do endereço do usuário no banco (`get_endereco_cep(endereco_id, user_id)`) — nunca do front.

**Argumento para a Banca**

> "O frete é calculado server-side usando o CEP salvo no perfil do usuário — não o CEP enviado pelo front no momento do checkout. Isso impede que um usuário declare um CEP falso (mais barato) no payload e pague menos frete. A regra de frete grátis usa o subtotal anterior ao desconto do cupom, evitando uso combinado abusivo."

---

## 5. Serviço de Inventário (`inventory_service` · porta 5004)

**Rotas e Endpoints**
```
GET  /api/estoque/<variacao_id>    ← público: consulta estoque de uma variação
POST /api/estoque/baixa            ← interno: deduz estoque
POST /api/estoque/devolver         ← interno: estorna estoque
PUT  /api/estoque/atualizar        ← admin: ajuste manual
```

**Arquivos e Funções**
- `services/inventory_service/app/routes.py` → todas as funções

**Como Funciona por Trás dos Panos**

- `/baixa` usa query atômica: `UPDATE variacoes SET estoque = estoque - %s WHERE id = %s AND estoque >= %s` — o `AND estoque >= qtd` previne estoque negativo sem transação adicional.
- `/devolver` é o rollback chamado pelo order_service quando pagamento falha.
- `/atualizar` (gestão manual) exige `@token_required` + `@admin_or_employee_required`.

---

## 6. Serviço de Pagamento (`payment_service` · porta 5006)

**Rotas e Endpoints**
```
POST /api/pagamento/processar    ← processa PIX, cartão ou boleto
GET  /api/pagamento/parcelas     ← retorna opções de parcelamento
```

**Arquivos e Funções**
- `services/payment_service/app/gateway.py` → `processar()`, `validar_cartao()`, `_luhn()`

**Como Funciona por Trás dos Panos**

1. Valida método (`pix`, `cartao`, `boleto`), valor (`> 0`).
2. Para cartão: validação de número com **algoritmo de Luhn**, validade (MM/AA), CVV, nome, detecção de bandeira por BIN.
3. Retorna dados específicos por método: `pix_copia_cola` (PIX payload BR Code), `boleto_linha`, ou `{bandeira, ultimos4, parcelas}` para cartão.
4. Em modo simulação (sem `GATEWAY_API_KEY`), aprova toda transação. Quando a chave for configurada, a integração com provedor real (Mercado Pago/Stripe/Pagar.me) é plugada no ponto `# TODO` no gateway.

**Argumento para a Banca**

> "O gateway foi projetado para substituição zero-refactor: a função `processar()` é o único ponto de integração, e a lógica de negócio (validação de método, parcelas, rollback) está no order_service, não no payment_service. Isso separa preocupações: o payment_service pode ser substituído por uma integração real sem tocar no fluxo de checkout."

---

## 7. Serviço de Notificação (`notification_service` · porta 5007)

**Rotas e Endpoints**
```
POST /api/notificar/email           ← token_required: e-mail avulso
POST /api/notificar/email/template  ← token_required: e-mail por template
POST /api/notificar/newsletter      ← público: inscrição na lista VIP
```

**Arquivos e Funções**
- `services/notification_service/app/routes.py`
- `services/notification_service/app/email_templates.py` → `montar(tipo, dados)`
- `services/notification_service/app/email_service.py` → `processar_envio_email()`

**Como Funciona por Trás dos Panos**

1. O endpoint de template recebe `{email, tipo, dados}` e delega para `montar(tipo, dados)` que retorna `(assunto, texto_plano, html)`.
2. `montar()` usa um dicionário de templates fixos — **nunca renderiza conteúdo arbitrário do request** como template (sem SSTI).
3. A rota de newsletter é pública mas valida o e-mail com regex antes de processar, e envia apenas o template fixo `newsletter` — não permite injeção de conteúdo.
4. A comunicação interna (auth → notification) usa um token de serviço JWT com `exp` de 1 minuto, validado pelo `@token_required` do notification_service.

**Argumento para a Banca**

> "A separação do serviço de e-mail em microsserviço próprio isola a dependência de SMTP/SES — se o provedor de e-mail mudar, só esse serviço é alterado. O uso de templates fixos no servidor elimina o risco de SSTI (Server-Side Template Injection): nunca há interpolação de conteúdo do usuário em templates Jinja."

---

## 8. Serviço de Usuário (`user_service` · porta 5008)

**Rotas e Endpoints**
```
GET  /api/users/<id>                 ← perfil (só o dono)
PUT  /api/users/<id>                 ← atualiza perfil (só o dono)
GET  /api/users/<id>/addresses       ← lista endereços (só o dono)
POST /api/users/<id>/addresses       ← cria endereço
DELETE /api/users/<id>/addresses/<id> ← remove endereço
GET  /api/favoritos                  ← lista favoritos do usuário logado
POST /api/favoritos                  ← adiciona favorito
DELETE /api/favoritos/<id>           ← remove (só o dono via WHERE user_id=%s)
GET  /api/notificacoes               ← notificações in-app
PUT  /api/notificacoes/<id>/lida     ← marca como lida
PUT  /api/notificacoes/lidas         ← marca todas como lidas
```

**Arquivos e Funções**
- `services/user_service/app/routes.py`
- `services/user_service/app/service.py`

**Como Funciona por Trás dos Panos**

- Proteção IDOR (Insecure Direct Object Reference): `_eh_dono(user_id)` compara `user_id` da URL com `request.user.get('id')` do JWT — garante que cada usuário só acesse o próprio perfil.
- Favoritos: o `user_id` vem sempre do token (não da URL), e o delete usa `WHERE id=%s AND usuario_id=%s` — seguro por design.
- Notificações: filtradas sempre por `user_id` do token.

**Argumento para a Banca**

> "O check de `_eh_dono()` é a defesa contra IDOR: mesmo que um usuário descubra o ID de outro e faça `GET /users/42`, o servidor compara com o ID no JWT e retorna 403. Os favoritos usam um padrão ainda mais seguro: o user_id nunca vem da URL — vem exclusivamente do payload do token, impossibilitando que um usuário manipule favoritos de outro."

---

## 9. Auditoria de Segurança — Findings

> Metodologia: varredura sistemática conforme guia **python-flask-web-server-security.md**, priorizando as regras FLASK-CORS-001, FLASK-DEPLOY-002, autenticação de rotas, injection, path traversal e SSRF.
> **Status**: SEC-01, SEC-02, SEC-03 e SEC-04 foram corrigidos após a auditoria (2026-07-01).

---

### ~~SEC-01~~ — ✅ CORRIGIDO: Rotas de Estoque Sem Autenticação

| Campo | Detalhe |
|---|---|
| **Regra** | FLASK-AUTH (customizada) |
| **Severidade** | ~~Crítico~~ → **Corrigido** |
| **Arquivo** | `services/inventory_service/app/routes.py` |

**Problema original**: `/baixa` e `/devolver` não tinham nenhum decorator de autenticação — qualquer requisição poderia manipular estoques.

**Correção aplicada**:
```python
# ANTES
@main.route('/baixa', methods=['POST'])
def dar_baixa():          # sem proteção

@main.route('/devolver', methods=['POST'])
def devolver_estoque():   # sem proteção

# DEPOIS
@main.route('/baixa', methods=['POST'])
@token_required           # JWT válido obrigatório
def dar_baixa():

@main.route('/devolver', methods=['POST'])
@token_required           # JWT válido obrigatório
def devolver_estoque():
```

**Padrão de referência**: idêntico ao `@token_required` definido em `inventory_service/app/auth.py` — mesma verificação de `Authorization: Bearer`, decode HS256, retorna 401 para token ausente/expirado/inválido.

---

### ~~SEC-02~~ — ✅ CORRIGIDO: Rota de Processamento de Pagamento Sem Autenticação

| Campo | Detalhe |
|---|---|
| **Regra** | FLASK-AUTH (customizada) |
| **Severidade** | ~~Alto~~ → **Corrigido** |
| **Arquivo** | `services/payment_service/app/routes.py` |

**Problema original**: `/processar` aceitava requisições sem autenticação. Com gateway real (chave configurada), qualquer um poderia disparar transações.

**Correção aplicada**:
```python
# ANTES
from flask import Blueprint, request, jsonify
from .gateway import processar, MAX_PARCELAS

@main.route('/processar', methods=['POST'])
def processar_pagamento():   # sem proteção

# DEPOIS
from flask import Blueprint, request, jsonify
from .gateway import processar, MAX_PARCELAS
from .auth import token_required           # ← import adicionado

@main.route('/processar', methods=['POST'])
@token_required                            # ← decorator adicionado
def processar_pagamento():
```

**Padrão de referência**: `payment_service/app/auth.py` já tinha o decorator correto — bastou importar e aplicar.

---

### ~~SEC-03~~ — ✅ CORRIGIDO: IDOR em Rotas de Usuário (wishlist_service)

| Campo | Detalhe |
|---|---|
| **Regra** | FLASK-AUTH + OWASP IDOR |
| **Severidade** | ~~Alto~~ → **Corrigido** |
| **Arquivo** | `services/wishlist_service/app/routes.py` |

**Problema original**: `GET/PUT/DELETE /users/<id>` verificavam apenas que o usuário estava logado, mas não que o `user_id` da URL pertencia ao usuário logado — IDOR clássico.

**Correção aplicada**:
```python
# ANTES
@main.route("/users/<int:user_id>", methods=["PUT"])
@token_required
def route_update_user(user_id):
    data = request.get_json()
    update_user(user_id, data)   # qualquer user_id da URL era aceito

# DEPOIS — helper adicionado ao topo do arquivo
def _eh_dono(user_id):
    """True se o id da URL bate com o usuário autenticado (anti-IDOR)."""
    return user_id == request.user.get('id')

@main.route("/users/<int:user_id>", methods=["GET"])
@token_required
def route_get_user(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    ...

@main.route("/users/<int:user_id>", methods=["PUT"])
@token_required
def route_update_user(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    ...

@main.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
def route_delete_user(user_id):
    if not _eh_dono(user_id):
        return jsonify({"error": "Acesso negado"}), 403
    ...
```

**Padrão de referência**: idêntico ao `_eh_dono()` de `user_service/app/routes.py` linha 11 — mesma lógica, mesmo nome de função, consistência total entre serviços.

---

### ~~SEC-04~~ — ✅ CORRIGIDO: `admin_or_employee_required` Sem Tratamento de Exceção

| Campo | Detalhe |
|---|---|
| **Regra** | Robustez (systematic-debug) |
| **Severidade** | ~~Médio~~ → **Corrigido** |
| **Arquivo** | `services/inventory_service/app/auth.py` |

**Problema original**: `admin_or_employee_required` fazia `auth_header.split()` sem checar se o header existia e `jwt.decode()` sem try/except — qualquer request malformado causava HTTP 500.

**Correção aplicada**:
```python
# ANTES
def admin_or_employee_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1]   # NullPointerError se header None
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])  # sem try/except
        ...

# DEPOIS
def admin_or_employee_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Token ausente"}), 401
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except Exception:
            return jsonify({"error": "Token inválido"}), 401
        if payload.get('tipo') not in ['admin', 'funcionario']:
            return jsonify({"error": "Acesso negado. Apenas administradores ou funcionários."}), 403
        return f(*args, **kwargs)
    return decorated
```

**Padrão de referência**: alinhado ao `token_required` de `catalog_service/app/auth.py` e `auth_service/app/auth.py` — tratamento diferenciado de `ExpiredSignatureError` vs exceção genérica, resposta sempre 401/403.

---

### SEC-05 — MÉDIO: CORS Wildcard em Todos os Serviços

| Campo | Detalhe |
|---|---|
| **Regra** | FLASK-CORS-001 |
| **Severidade** | Médio |
| **Arquivo** | Todos os `run.py` (ex.: `services/auth_service/run.py` linha 17) |

**Evidência**
```python
CORS(app, resources={r"/*": {"origins": "*"}})
```

**Impacto**: Qualquer origem pode fazer requisições CORS. O risco é mitigado pelo uso de JWT em `Authorization` header (não cookies — sem risco de CSRF), mas ainda expõe endpoints a origens não autorizadas.

**Fix recomendado** (produção):
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5599").split(",")
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})
```

---

### SEC-06 — MÉDIO: Debug Mode em Todos os `run.py`

| Campo | Detalhe |
|---|---|
| **Regra** | FLASK-DEPLOY-002 |
| **Severidade** | Médio (Crítico se chegasse a produção) |
| **Arquivo** | Todos os `run.py` (ex.: `services/auth_service/run.py` linha 20) |

**Evidência**
```python
if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5005, debug=True)
```

**Impacto**: O Werkzeug interactive debugger com `debug=True` equivale a Remote Code Execution (RCE) se exposto publicamente. Em ambiente local (dev) é aceitável; em produção é crítico.

**Fix recomendado**: Configurar via variável de ambiente e usar gunicorn em produção:
```python
debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
app.run(host='127.0.0.1', port=5005, debug=debug)
# Produção: gunicorn -w 4 run:app
```

---

### SEC-07 — BAIXO/MÉDIO: SHA-256 para Senha do Drop Gate (não é KDF)

| Campo | Detalhe |
|---|---|
| **Regra** | Criptografia de passwords |
| **Severidade** | Baixo/Médio |
| **Arquivo** | `services/catalog_service/app/storefront.py` linha 120; `routes.py` linha 131 |

**Evidência**
```python
config['senha_hash'] = hashlib.sha256(senha.encode('utf-8')).hexdigest()
# ...
hash_enviado = hashlib.sha256(senha.encode('utf-8')).hexdigest()
if hash_enviado != hash_stored: ...
```

**Impacto**: SHA-256 é uma função de hash criptográfico, não uma Key Derivation Function (KDF). É ordens de magnitude mais rápido que bcrypt, facilitando ataques de dicionário. Mitigado pelo contexto: é uma senha de acesso editorial compartilhada (não credencial de usuário), e o endpoint não tem rate limiting explícito.

**Recomendação**: Adicionar `@rate_limit` em `drop_acesso()`. Para produção com senhas sensíveis, migrar para bcrypt (já disponível no projeto via `validator.py`).

---

### SEC-08 — BAIXO: Rate Limiting em Memória (Não Persistente)

| Campo | Detalhe |
|---|---|
| **Regra** | Resiliência de produção |
| **Severidade** | Baixo |
| **Arquivo** | `services/auth_service/app/routes.py` linha 13 |

**Evidência**
```python
_tentativas = defaultdict(list)   # ← reset no restart do processo
```

**Impacto**: O rate limiting reseta sempre que o serviço reinicia. Em ataque de brute force, reiniciar o processo elimina o bloqueio. Em deployment multi-instância (ex.: múltiplos workers Gunicorn), o contador é por processo.

**Recomendação** (produção): Usar Redis via `flask-limiter` com storage Redis.

---

### SEC-09 — BAIXO: Ausência de Security Headers

| Campo | Detalhe |
|---|---|
| **Regra** | FLASK-HEADERS-001 |
| **Severidade** | Baixo |

**Impacto**: Sem `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`. Mitigado pelo fato de ser uma API JSON (não renderiza HTML diretamente) e o frontend ser servido por servidor estático separado.

**Recomendação**: Adicionar `after_request` hook ou Flask-Talisman nos serviços que servem o frontend.

---

### SEC-10 — MÉDIO: `wishlist_service` com Fallback Hardcoded para `SECRET_KEY`

| Campo | Detalhe |
|---|---|
| **Regra** | Segredo de aplicação — consistência com demais serviços |
| **Severidade** | Médio |
| **Arquivo** | `services/wishlist_service/app/auth.py` linha 5 |

**Evidência**
```python
SECRET_KEY = os.getenv("SECRET_KEY", "gritta_melhor_loja")  # ← fallback hardcoded
```

**Impacto**: Se a variável de ambiente `SECRET_KEY` não estiver configurada, o serviço inicializa silenciosamente com o segredo `"gritta_melhor_loja"`. Um atacante que conheça esse valor pode forjar tokens JWT válidos para qualquer usuário — incluindo admins. Todos os outros 6 serviços levantam `ValueError` imediatamente, impedindo o boot sem a variável configurada.

**Fix recomendado** (2 linhas — igual ao padrão dos demais serviços):
```python
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("ERRO CRÍTICO: SECRET_KEY não configurada.")
```

**Status**: Aberto — aguarda correção.

---

## 10. Resumo dos Findings

| ID | Severidade | Arquivo | Problema | Status |
|---|---|---|---|---|
| SEC-01 | 🔴 Crítico | `inventory_service/routes.py:30,53` | `/baixa` e `/devolver` sem auth | ✅ **Corrigido** |
| SEC-02 | 🟠 Alto | `payment_service/routes.py:7` | `/processar` sem auth | ✅ **Corrigido** |
| SEC-03 | 🟠 Alto | `wishlist_service/routes.py:30-41` | IDOR em update/delete de usuário | ✅ **Corrigido** |
| SEC-04 | 🟡 Médio | `inventory_service/auth.py:27-33` | `admin_or_employee_required` sem try/except | ✅ **Corrigido** |
| SEC-05 | 🟡 Médio | Todos os `run.py:17` | CORS wildcard `*` | ⚠️ Aberto |
| SEC-06 | 🟡 Médio | Todos os `run.py:20` | `debug=True` (crítico em produção) | ⚠️ Aberto |
| SEC-07 | 🟡 Médio | `storefront.py:120`, `routes.py:131` | SHA-256 em vez de bcrypt para drop gate | ⚠️ Aberto |
| SEC-08 | 🔵 Baixo | `auth_service/routes.py:13` | Rate limit em memória | ⚠️ Aberto |
| SEC-09 | 🔵 Baixo | Todos os serviços | Sem security headers | ⚠️ Aberto |
| SEC-10 | 🟡 Médio | `wishlist_service/auth.py:5` | Fallback hardcoded `SECRET_KEY` | ⚠️ Aberto |

**Resumo**: 4 de 10 findings corrigidos (1 Crítico + 1 Alto + 1 Alto + 1 Médio eliminados). 6 findings remanescentes — todos de severidade Médio ou Baixo.

---

## 11. O que Está Bem — Pontos Fortes

| Área | Implementação |
|---|---|
| **Senhas de usuário** | bcrypt com salt automático (`validator.py:22`) |
| **SQL injection** | 100% das queries usam `%s` parametrizado — nenhum f-string em queries |
| **Segredo do JWT** | `SECRET_KEY` obrigatória via env; `raise ValueError` se ausente em 6 dos 7 serviços (SEC-10 aberto) |
| **Reset de senha** | Fluxo 3 etapas, código com hash bcrypt, expiração, máx. 5 tentativas, anti-enumeration |
| **Google OAuth** | Validação server-side com `google-auth`; nunca confia no front |
| **Path traversal** | `_safe_id()` + verificação `startswith(STATIC_IMG_DIR)` no upload |
| **Upload** | Allowlist de extensão, limite de 5 MB, nome gerado server-side com UUID |
| **IDOR** | `_eh_dono()` em todos os endpoints de perfil/endereço (`user_service` + `wishlist_service` — após correção SEC-03) |
| **Checkout** | Preço, cupom e frete revalidados server-side — nunca confia no payload do front |
| **Estoque** | Query atômica `AND estoque >= qtd` previne estoque negativo; rotas protegidas com `@token_required` (após correção SEC-01) |
| **Soft delete** | Produtos não são hard-deleted (preserva histórico de pedidos e FKs) |
| **Pagamento** | `/processar` exige JWT válido (após correção SEC-02); gateway isolado em módulo separado |

---

*Documento gerado em 2026-07-01 · GR!TTA Backend Audit v1.0 · Atualizado com correções SEC-01 a SEC-04*
