# DOC_FRONTEND.md — GR!TTA Design System
## Guia Técnico de Defesa — Brutal Minimalist Darkwear

> Auditoria gerada com as skills **core-web-vitals** e **accessibility** (WCAG 2.2).
> Arquitetura: HTML estático servido na porta 5599 · Flask microservices como API pura · Web Components para header/footer.

---

## Sumário

1. [Design Tokens](#1-design-tokens)
2. [Cursor Global Turbinado](#2-cursor-global-turbinado)
3. [Page Transition — Cortina Branded](#3-page-transition--cortina-branded)
4. [Snow — Neve Animada](#4-snow--neve-animada)
5. [Mega Menu Desktop](#5-mega-menu-desktop)
6. [Web Components — Header e Footer](#6-web-components--header-e-footer)
7. [Hero Editorial (Type-First + Ken Burns)](#7-hero-editorial-type-first--ken-burns)
8. [Grid Assimétrica da Vitrine](#8-grid-assimétrica-da-vitrine)
9. [Crossfade CSS (2ª Imagem no Hover)](#9-crossfade-css-2ª-imagem-no-hover)
10. [Cards de Drop — 3 Estados](#10-cards-de-drop--3-estados)
11. [Storefront Config-Driven](#11-storefront-config-driven)
12. [Grain Overlay + prefers-reduced-motion](#12-grain-overlay--prefers-reduced-motion)
13. [Mini-Cart Drawer](#13-mini-cart-drawer)
14. [Auditoria Core Web Vitals (CWV)](#14-auditoria-core-web-vitals-cwv)
15. [Auditoria de Acessibilidade (WCAG 2.2)](#15-auditoria-de-acessibilidade-wcag-22)
16. [Redundâncias e Bugs CSS/JS](#16-redundâncias-e-bugs-cssjs)

---

## 1. Design Tokens

### Elemento / Objetivo
Sistema central de variáveis CSS que governa toda a paleta, tipografia e espaçamento do Design System. Garante consistência visual sem hardcode de valores espalhados.

### Arquivos Envolvidos
- [`statics/css/global.css:8–27`](statics/css/global.css) — bloco `:root` com todos os tokens
- [`statics/css/global.css:5`](statics/css/global.css) — `@import` Google Fonts (Archivo Black, Roboto Mono, Montserrat, Bebas Neue)

### Lógica Técnica
```css
:root {
  --bg:          #0A0A0A;   /* preto absoluto */
  --surface:     #141414;   /* carvão */
  --surface-2:   #1A1A1A;   /* carvão 2 */
  --steel:       #2A2A2A;   /* bordas duras */
  --accent:      #3A7D59;   /* verde pop */
  --accent-deep: #1F3D2E;   /* fundo sólido de CTAs */
  --accent-hover:#2C5A40;   /* hover de CTAs */
  --alert-deep:  #7A1F1F;   /* últimas unidades */
  --font-display:"Archivo Black", "Bebas Neue", sans-serif;
  --font-mono:   "Roboto Mono", "Fira Code", monospace;
  --ease-brutal: cubic-bezier(.5, -.5, .5, 1.55);
  --nav-h:       130px;
}
```
Todos os arquivos de página (`pages/*.css`, `usuario/*.css`) consomem `var(--bg)`, `var(--accent)` etc. — mudar um token re-pinta o site inteiro sem tocar em cada arquivo.

### Argumento para a Banca
O uso de CSS Custom Properties como Design System é a prática moderna equivalente ao que frameworks como Tailwind fazem via `theme.config` — só que sem dependência de build. A hierarquia de 3 camadas de superfície (`--bg → --surface → --surface-2`) resolve o problema de profundidade em UIs escuras sem precisar de SCSS ou pré-processador.

---

## 2. Cursor Global Turbinado

### Elemento / Objetivo
Substitui o cursor padrão do navegador por um sistema de dois elementos com física de easing — um ponto central que segue o mouse instantaneamente e um anel que acompanha com lag (`lerp = 0.16`). Possui 3 estados semânticos baseados no tipo de alvo.

### Arquivos Envolvidos
- [`statics/js/components.js:11–52`](statics/js/components.js) — `injectCursor()` e loop RAF
- [`statics/css/global.css:63–113`](statics/css/global.css) — `#cursor`, `#cursor-ring`, `.cursor-hover`, `.cursor-view`, `.cursor-down`

### Lógica Técnica
```js
// Ponto central: posição exata (sem lag)
document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px'; cur.style.top = my + 'px';
});

// Anel: interpolação linear (easing) via RAF
(function loop() {
    rx += (mx - rx) * .16;   // lerp factor = 0.16 → lag suave
    ry += (my - ry) * .16;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
})();
```

**Delegação de evento por tipo de alvo** — um único `mouseover` no `document` classifica o alvo:

| Classe no `body`  | Alvo detectado                         | Visual do anel         |
|-------------------|----------------------------------------|------------------------|
| `.cursor-hover`   | `a`, `button`, `.chip`, `.logo`        | Anel 62px, verde sólido|
| `.cursor-view`    | `.produto-card`, `.cat-card`, `.drop-card` | Anel 88px + label "VER"|
| `.cursor-down`    | mousedown                              | Anel 30px, branco      |

Mix-blend-mode `difference` no ponto central cria inversão de cor automática sobre qualquer fundo.

Só é injetado em dispositivos com mouse real:
```js
if (!window.matchMedia('(pointer: fine)').matches) return;
```

### Argumento para a Banca
O cursor customizado é um elemento de branding de nível premium (usado por marcas como Represent Clothing, Jacquemus, A-Cold-Wall*). A implementação em RAF puro sem bibliotecas externas demonstra conhecimento de animation loop, interpolação linear e event delegation — três conceitos de JavaScript performático. O guard `pointer: fine` garante que dispositivos touch não recebam o código inútil.

---

## 3. Page Transition — Cortina Branded

### Elemento / Objetivo
Cortina animada que cobre a tela ao sair de uma página e revela ao chegar, criando continuidade visual entre navegações internas. O elemento exibe o logotipo "GR!TTA" com animação de entrada.

### Arquivos Envolvidos
- [`statics/js/components.js:59–115`](statics/js/components.js) — `initPageTransition()` e `window.grittaGo()`
- [`statics/css/global.css:459–484`](statics/css/global.css) — `#page-transition`, `.pt-anim`, `.pt-cover`, `.pt-up`, `.pt-bar`

### Lógica Técnica
Máquina de estados via classes CSS:

```
Estado 1 — SAÍDA (ao clicar num link):
  1. sessionStorage.setItem('gritta-pt', '1')
  2. Adiciona .pt-anim + .pt-cover → cortina sobe de baixo (translateY: 100% → 0)
  3. Após 600ms → window.location.href = url

Estado 2 — CHEGADA (na nova página):
  1. sessionStorage tem 'gritta-pt' → remove a chave
  2. Adiciona .pt-cover imediatamente (cobre sem animação)
  3. force-reflow: void ov.offsetWidth  (garante que o browser "veja" o estado)
  4. Adiciona .pt-anim + .pt-up → cortina sobe e sai pelo topo
  5. transitionend remove todas as classes
```

Intercepta cliques em `<a>` internos via event delegation — ignora: `#hash`, `mailto:`, `tel:`, `target=_blank`, links externos e modificadores (Ctrl/Meta/Shift).

`bfcache` tratado: `window.addEventListener('pageshow', e => { if (e.persisted) remove classes })`.

`prefers-reduced-motion`: pula toda a animação e faz navegação direta.

### Argumento para a Banca
Transição de página é uma das interações mais difíceis de implementar corretamente sem framework (Next.js, Astro) porque exige sincronismo entre navegação do browser e animações CSS. A solução aqui usa apenas `sessionStorage` como ponte entre páginas, `transitionend` para cleanup preciso e tratamento de `bfcache` — caso de uso avançado que a maioria das implementações simplistas ignora.

---

## 4. Snow — Neve Animada

### Elemento / Objetivo
Camada de flocos de neve animados injetada em containers específicos (ex: seção `.drop-section` na home). Cada floco tem física única (tamanho, velocidade, drift lateral, opacidade) gerada aleatoriamente. Parte da identidade visual do Drop "Winter is Coming".

### Arquivos Envolvidos
- [`statics/js/components.js:120–141`](statics/js/components.js) — `window.initSnow()`
- [`statics/css/global.css:489–504`](statics/css/global.css) — `.snow-layer`, `.snowflake`, `@keyframes snowfall`
- [`templates/index.html:99`](templates/index.html) — `data-snow="28"` no `.drop-section`
- [`drops/winter-is-coming.json`](drops/winter-is-coming.json) — `"snow": true/false` controla liga/desliga via storefront

### Lógica Técnica
Cada floco é um `<span>` com propriedades inline geradas por `Math.random()`:
```js
const size  = (Math.random() * 4 + 2).toFixed(1);    // 2–6px
const dur   = (Math.random() * 8 + 6).toFixed(1);    // 6–14s por ciclo
const delay = (Math.random() * -14).toFixed(1);       // delay negativo → começa já em curso
const drift = (Math.random() * 60 - 30).toFixed(0);  // -30..30px deriva lateral
```

Animação CSS pura (`@keyframes snowfall`) usa `translateY` + `translateX(var(--drift))` — composited na GPU, sem impacto de layout.

Guard de `prefers-reduced-motion`: `initSnow()` aborta se a mídia query estiver ativa.

O storefront pode desligar dinamicamente via `d.snow === false` → remove todos os `.snow-layer` do DOM.

### Argumento para a Banca
Neve implementada em CSS puro (sem Canvas, sem WebGL, sem biblioteca de partículas) demonstra uso criativo de CSS Custom Properties por elemento (`--drift`) e de delays negativos para criar a ilusão de flocos já caindo desde antes da página carregar. O guard de `prefers-reduced-motion` respeita a preferência do usuário (WCAG 2.3.3).

---

## 5. Mega Menu Desktop

### Elemento / Objetivo
Menu dropdown de dois níveis ao hover sobre "COLEÇÃO" e "DROPS" — exibe grid de links com imagem editorial em coluna lateral. Fecha automaticamente ao mover o cursor para fora, com debounce de 120ms para evitar fechamento acidental.

### Arquivos Envolvidos
- [`statics/js/components.js:213–310`](statics/js/components.js) — markup dos `.mega-panel` (HTML)
- [`statics/js/menu.js:106–141`](statics/js/menu.js) — `setupMegaMenu()`
- [`statics/css/menu.css:307–441`](statics/css/menu.css) — `.mega-panel`, `.mega-inner`, `.mega-link`, `.mega-col-visual`

### Lógica Técnica
**Posicionamento:** `.mega-panel` tem `position: absolute; top: 100%; left: 0; right: 0` dentro de `.header { position: fixed }` — o painel se ancora no bottom do header e estica de borda a borda da viewport.

**Animação de entrada/saída:**
```css
/* OCULTO */
.mega-panel {
  opacity: 0; visibility: hidden; transform: translateY(-8px);
  transition: opacity .4s cubic-bezier(.19,1,.22,1),
              transform .4s cubic-bezier(.19,1,.22,1),
              visibility .4s;
  pointer-events: none;
}
/* ATIVO */
.mega-panel.active {
  opacity: 1; visibility: visible;
  transform: translateY(0); pointer-events: auto;
}
```

**Debounce 120ms** — evita que o painel feche ao passar do trigger para o painel:
```js
const scheduleClose = () => { timer = setTimeout(closeAll, 120); };

item.addEventListener('mouseenter', () => { clearTimeout(timer); ... });
item.addEventListener('mouseleave', scheduleClose);
panel.addEventListener('mouseenter', () => clearTimeout(timer));
panel.addEventListener('mouseleave', scheduleClose);
```

**Imagem com Ken Burns invertido:** ao ativar o painel, `.mega-col-visual img` sai de `scale(1.04)` para `scale(1)` — revela a imagem "entrando" no enquadramento.

**Mobile:** `@media (max-width: 1024px) { .mega-panel { display: none !important } }` — links navegam diretamente sem submenus.

### Argumento para a Banca
A solução resolve o problema clássico de "mouse-out prematuro" (quando o cursor cruza 1px de gap entre o trigger e o painel) sem recorrer a bibliotecas. O uso de `visibility` junto com `opacity` (em vez de só `opacity`) garante que o painel seja invisível para o tab-order e leitores de tela quando fechado — prática recomendada pela WCAG 4.1.2.

---

## 6. Web Components — Header e Footer

### Elemento / Objetivo
Header e footer encapsulados como Web Components nativos (`<gritta-header>`, `<gritta-footer>`). Uma única definição em `components.js` propaga para todas as páginas do site — mudança no componente atualiza cabeçalho e rodapé em 30+ templates de uma vez.

### Arquivos Envolvidos
- [`statics/js/components.js:190–443`](statics/js/components.js) — `GrittaHeader`, `GrittaFooter`, `customElements.define()`
- [`statics/css/menu.css`](statics/css/menu.css) — todos os estilos de `.header`, `.footer-gritta`
- Qualquer `templates/**/*.html` que contenha `<gritta-header></gritta-header>`

### Lógica Técnica
```js
class GrittaHeader extends HTMLElement {
    connectedCallback() {
        const isSub = window.location.pathname.includes('/pages/')
                   || window.location.pathname.includes('/usuario/');
        const root   = isSub ? '../' : './';
        const assets = isSub ? '../../statics/' : '../statics/';
        this.innerHTML = `<header class="header" ...> ... </header>`;
        requestAnimationFrame(() => { injectCursor(); initReveal(); });
    }
}
customElements.define('gritta-header', GrittaHeader);
```

Cálculo dinâmico de `root` e `assets` resolve o problema de caminhos relativos em páginas em subdiretórios (`/pages/`, `/usuario/`) sem precisar de template engine ou bundler.

`connectedCallback()` é o hook do ciclo de vida do Custom Element — executado quando o elemento é inserido no DOM, não antes. `requestAnimationFrame()` garante que o cursor e os reveals só iniciem após o primeiro paint do header.

O footer inclui: newsletter inline com integração à API de notificações, 4 colunas de links, chips de formas de pagamento e bloco de segurança SSL.

### Argumento para a Banca
Web Components são a API nativa do browser para componentização sem framework (sem React, sem Vue). A escolha evita um bundle JS pesado e garante que o site funcione com JavaScript parcialmente desabilitado (o HTML estático ainda existe). É a mesma API usada por sistemas de design corporativos como Adobe Spectrum e GitHub Primer.

---

## 7. Hero Editorial (Type-First + Ken Burns)

### Elemento / Objetivo
Hero de página inicial com tipografia como protagonista — texto animado palavra a palavra, foto cinematográfica sangrando à direita com máscara de gradiente, overlay duotone verde e animação Ken Burns perpétua.

### Arquivos Envolvidos
- [`templates/index.html:24–52`](templates/index.html) — markup do `.hero`
- [`statics/css/index.css:6–144`](statics/css/index.css) — `.hero`, `.hero-photo`, `.hero-title .word`, `@keyframes heroWordIn`, `@keyframes kenburns`
- [`statics/js/components.js:466–520`](statics/js/components.js) — `buildHeadline()` e `applyStorefront()` para textos config-driven

### Lógica Técnica
**Ken Burns** na foto de fundo:
```css
@keyframes kenburns {
  from { transform: scale(1) translate(0,0) }
  to   { transform: scale(1.1) translate(-2%,-1.5%) }
}
/* 20s · ease-in-out · infinite alternate — imperceptível, nunca "reinicia" bruscamente */
```

**Máscara de gradiente** funde a foto no fundo preto pelo lado esquerdo:
```css
-webkit-mask-image: linear-gradient(to right, transparent 0%, #000 26%);
```

**Duotone verde sutil** (overlay com `mix-blend-mode: overlay`) casa a foto com a paleta `--accent` sem pós-produção.

**Animação de palavras** — cada `<span class="word">` tem `--i: N` (índice) calculado no markup:
```css
.hero-title .word {
  transform: translateY(108%);   /* parte de baixo da linha (overflow: hidden) */
  animation: heroWordIn .9s cubic-bezier(.16,1,.3,1) both;
  animation-delay: calc(var(--i, 0) * 70ms + .15s);
}
@keyframes heroWordIn { to { transform: translateY(0) } }
```
`overflow: hidden` em `.hero-title .line` cria o efeito "surgindo de baixo da linha" sem que os elementos "fantasmas" sejam visíveis.

O conteúdo do hero (título, subtítulo, imagem) é 100% substituível via `applyStorefront()` com dados de `drops/*.json` — sem redeployar código.

### Argumento para a Banca
A animação de palavras sem biblioteca (sem GSAP, sem anime.js) usa apenas CSS `animation-delay` com Custom Property `--i` gerado no markup. O `calc()` dentro do `animation-delay` é suporte nativo desde 2019 e elimina a necessidade de JavaScript para sequenciar as entradas. O clip via `overflow: hidden` na linha é a técnica clássica de "máscara de texto" usada por sites de agências de design de alto nível.

---

## 8. Grid Assimétrica da Vitrine

### Elemento / Objetivo
Grade de produtos com dois tamanhos de card: padrão (1/4 da linha) e especial (2/4 da linha). Cria ritmo visual editorial que diferencia itens em destaque sem precisar de HTML diferente por posição.

### Arquivos Envolvidos
- [`statics/css/index.css:237–265`](statics/css/index.css) — `.vitrine`, `.produto-card`, `.is-special`, `nth-child(7n)`
- [`statics/js/index.js`](statics/js/index.js) — injeta classe `is-special` baseada no campo `is_special` do produto
- [`statics/js/pages/drop.js:79`](statics/js/pages/drop.js) — mesma lógica na vitrine do drop

### Lógica Técnica
```css
/* Grade base: 4 colunas iguais */
.vitrine {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* Card padrão: ocupa 1 coluna */
.vitrine > .produto-card { grid-column: span 1 }

/* Card especial: ocupa 2 colunas + proporção cinematográfica */
.vitrine > .produto-card.is-special {
  grid-column: span 2;
  border-color: var(--accent);
}
.vitrine > .produto-card.is-special .produto-imagem img { aspect-ratio: 3/2 }

/* Ritmo nth-child: a cada 7 cards normais, proporção quadrada */
.vitrine > .produto-card:not(.is-special):nth-child(7n) .produto-imagem img {
  aspect-ratio: 1/1;
}
```

**Breakpoints responsivos:**
- `≤900px`: 2 colunas; `is-special` ocupa as 2
- `≤480px`: 1 coluna; todos os cards têm span 1

As proporções são declaradas em CSS via `aspect-ratio` — o navegador reserva o espaço antes da imagem carregar, eliminando CLS.

### Argumento para a Banca
Layouts de revista/editorial (como os do NY Times, Wallpaper*, Highsnobiety) usam variação de tamanho para criar hierarquia visual sem precisar de título. A implementação com CSS Grid e `grid-column: span` é a forma semanticamente correta — sem floats, sem posicionamento absoluto, sem JavaScript de layout. O `nth-child(7n)` cria um ritmo quasi-irregular que evita a monotonia de grades uniformes.

---

## 9. Crossfade CSS (2ª Imagem no Hover)

### Elemento / Objetivo
Ao passar o mouse sobre um card de produto que possui segunda imagem (foto de costas, detalhe, styling), a imagem secundária aparece com transição suave (`opacity` crossfade). A imagem primária some simultaneamente.

### Arquivos Envolvidos
- [`statics/css/global.css:231–241`](statics/css/global.css) — `.img-primary`, `.img-secondary`, `.has-2nd`
- [`statics/js/index.js`](statics/js/index.js) / [`statics/js/pages/drop.js:79`](statics/js/pages/drop.js) — adiciona classe `has-2nd` se `p.imagem_2` existir

### Lógica Técnica
```css
/* Imagem primária: filtro levemente dessaturado em repouso */
.produto-imagem .img-primary {
  filter: grayscale(.3) brightness(.9);
  transition: filter .25s, opacity .55s cubic-bezier(.19,1,.22,1);
}
/* Primária some no hover (só se .has-2nd) */
.produto-card.has-2nd:hover .img-primary { opacity: 0 }

/* Imagem secundária: posição absoluta, invisível */
.produto-imagem .img-secondary {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  opacity: 0;
  transition: opacity .55s cubic-bezier(.19,1,.22,1), transform .7s cubic-bezier(.19,1,.22,1);
}
/* Secundária aparece no hover */
.produto-card.has-2nd:hover .img-secondary { opacity: 1 }
```

A classe `.has-2nd` no card é o gate — cards sem segunda imagem simplesmente não têm a classe e o CSS não dispara.

`loading="lazy"` na `img-secondary` — não carrega até o scroll, economizando banda.

### Argumento para a Banca
O crossfade via `opacity` em dois `<img>` sobrepostos (absolute sobre relativo) é a técnica de performance correta — `opacity` é uma propriedade composite-only, animada na GPU sem causar reflow ou repaint. Comparado com JavaScript (trocar `src`), elimina o flash de "sem imagem" e é 0 bytes de código extra.

---

## 10. Cards de Drop — 3 Estados

### Elemento / Objetivo
A listagem de drops (`/pages/drops.html`) exibe cards em três estados visuais que comunicam a disponibilidade da coleção: **público** (comprável), **arquivado** (encerrada) e **secreto** (trancado com senha — identidade neon terminal).

### Arquivos Envolvidos
- [`statics/css/pages/drops.css`](statics/css/pages/drops.css) — todos os 3 estados
- [`statics/js/pages/drops.js:54–108`](statics/js/pages/drops.js) — `renderCard()` com 3 caminhos
- [`services/catalog_service/app/routes.py`](services/catalog_service/app/routes.py) — endpoint `GET /drops` (retorna `trancado`, `arquivado`, `thumb`, `ativo`)

### Lógica Técnica

**Estado 1 — Público/Ativo:**
Card normal com `aspect-ratio: 3/4`, imagem de fundo com Ken Burns no hover, overlay gradiente que aprofunda no hover, `.dc-desc` e `.dc-cta` que revelam com `opacity: 0 → 1`.

**Estado 2 — Arquivado:**
```css
.drop-card.arquivado {
  opacity: .42;
  filter: grayscale(.9) brightness(.55) contrast(1.1);
  cursor: not-allowed;
  transform: none !important;  /* sem hover lift */
  border-color: var(--steel) !important;
}
```
Visualmente "morto" mas ainda clicável para ver os produtos. Communicação clara de "encerrado" sem remover o card.

**Estado 3 — Secreto (Neon Terminal):**
```css
/* Borda neon com pulso animado */
@keyframes border-neon-pulse {
  0%, 100% { border-color: #00ff7a; box-shadow: 0 0 16px rgba(0,255,122,.28) }
  50%       { border-color: rgba(0,255,122,.5); box-shadow: 0 0 8px rgba(0,255,122,.12) }
}

/* Ícone de cadeado pulsando */
@keyframes lock-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(0,255,122,.5)) }
  50%       { filter: drop-shadow(0 0 12px rgba(0,255,122,.9)) }
}

/* Texto piscando no estilo terminal */
@keyframes neon-blink {
  0%, 90%, 100% { opacity: 1 }
  95%            { opacity: 0 }
}
```

**Scan-lines** via pseudo-elemento `::before`:
```css
.drop-card-secreto-overlay::before {
  background: repeating-linear-gradient(
    0deg,
    transparent, transparent 3px,
    rgba(0,255,122,.03) 3px, rgba(0,255,122,.03) 4px
  );
}
```

**Troca de estado no hover** — `.secreto-status-idle` (texto `[ STATUS: RESTRICTED ]`) some e `.secreto-status-hover` (`CLIQUE PARA INSERIR A SENHA`) aparece.

Gate de segurança no backend: `salvar_drop()` em `storefront.py` converte senha em SHA-256 — plain text nunca persiste em disco.

### Argumento para a Banca
Os 3 estados não são apenas visuais — são semânticos. O state machine `{ trancado, arquivado }` no JSON do drop é derivado no frontend para 3 caminhos de UX distintos: compra direta, bloqueio por senha, e arquivo histórico. O efeito terminal neon (CRT scan-lines + blink assíncrono) usa apenas CSS puro — sem Canvas, sem WebGL — e comunica o conceito "acesso restrito" de forma imersiva e alinhada com a identidade "Brutal Minimalist Darkwear".

---

## 11. Storefront Config-Driven

### Elemento / Objetivo
Todo o conteúdo editorial do site (textos do hero, marquee, contagem regressiva, imagem do banner, cor de destaque) é configurado por arquivo JSON em `/drops/*.json`. Trocar de drop = trocar um campo em `_estado.json`. Zero redeploy, zero código novo.

### Arquivos Envolvidos
- [`drops/winter-is-coming.json`](drops/winter-is-coming.json) — configuração do drop ativo
- [`drops/_estado.json`](drops/_estado.json) — aponta qual drop está ativo
- [`services/catalog_service/app/storefront.py`](services/catalog_service/app/storefront.py) — `get_estado()`, `list_drops()`, `salvar_drop()`
- [`statics/js/components.js:459–576`](statics/js/components.js) — `applyStorefront()` e `initStorefront()`

### Lógica Técnica
```
/drops/_estado.json → { "modo": "drop", "ativo": "winter-is-coming" }
                         ↓ storefront.py lê
/drops/winter-is-coming.json → { hero: { headline, banner, cta... }, marquee: [...], snow: true, ... }
                         ↓ GET /estado retorna ao frontend
applyStorefront(state) → atualiza DOM via setText(), buildHeadline(), img.style.background
```

`buildHeadline(lines)` transforma `{ }` em `<span class="accent">` — destaque inline sem HTML no JSON.

Abort controller com timeout de 4s: se o backend cair, o site continua com os defaults do HTML estático — sem tela em branco.

Painel admin (`/admin/painel.html`) cria/edita/deleta drops via CRUD completo, com senhas convertidas para SHA-256 no backend e exclusão mútua automática `arquivado ↔ trancado`.

### Argumento para a Banca
É o mesmo padrão de "feature flags" usado em sistemas de produção de alto tráfego (LaunchDarkly, Unleash) — separação entre código e configuração. Para um e-commerce de drops, onde cada coleção tem identidade visual distinta, poder trocar hero, cor de destaque, marquee e countdown sem mexer em HTML ou CSS é uma necessidade de negócio real, não over-engineering.

---

## 12. Grain Overlay + prefers-reduced-motion

### Elemento / Objetivo
Textura de filme granulado animada cobrindo toda a tela via `body::before` + SVG inline de ruído fractal. Cria sensação de profundidade e materialidade em telas planas. Completamente desativável por preferência do sistema operacional.

### Arquivos Envolvidos
- [`statics/css/global.css:44–60`](statics/css/global.css) — `body::before`, `@keyframes grain`
- [`statics/css/global.css:633–648`](statics/css/global.css) — bloco `@media (prefers-reduced-motion: reduce)`

### Lógica Técnica
```css
body::before {
  content: "";
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml, ... feTurbulence baseFrequency='0.75' numOctaves='4' ...");
  opacity: .025;       /* quase invisível — sutil */
  pointer-events: none;
  z-index: 9997;
  animation: grain .5s steps(1) infinite;   /* troca de posição em steps → granulado, não fluido */
}
@keyframes grain {
  0%  { transform: translate(0,0) }
  20% { transform: translate(-2px,3px) }
  ...
}
```

SVG `feTurbulence` gerado como Data URI elimina requisição HTTP para textura de ruído.

**`prefers-reduced-motion`** desativa em bloco:
- `.snow-layer`, `.hero-grid-overlay`, `body::before` → `display: none !important`
- `.marquee-inner`, `@keyframes kenburns`, `@keyframes heroWordIn` → `animation: none !important`
- `#page-transition` → `transition: none !important`
- `.reveal` → `opacity: 1 !important; transform: none !important`

### Argumento para a Banca
`feTurbulence` é um filtro SVG nativo do browser — nenhum arquivo de textura é baixado. O ruído fractal com `baseFrequency: 0.75` e `numOctaves: 4` imita grão de película de forma matematicamente correta. O bloco `prefers-reduced-motion` é conformidade com WCAG 2.3.3 (AAA) — usuários com epilepsia fotossensível ou vertigem de movimento podem suprimir todas as animações pelo próprio sistema operacional.

---

## 13. Mini-Cart Drawer

### Elemento / Objetivo
Gaveta lateral que abre ao clicar no ícone de sacola — exibe itens, quantidade, subtotal, barra de progresso para frete grátis e botão de checkout. Estado global via `localStorage` + API do `order_service`.

### Arquivos Envolvidos
- [`statics/js/components.js:582–737`](statics/js/components.js) — `injectMiniCart()`, `renderMiniCart()`, `mcUpdateQty()`, `mcRemove()`
- [`statics/css/global.css:508–573`](statics/css/global.css) — `#minicart`, `#minicart-overlay`, `.mc-*`

### Lógica Técnica
Intercepta o clique no `.cart-icon-container` em fase de **captura** (`addEventListener(..., true)`) — garante que o handler rode antes da transição de página que também está no `document`.

Barra de frete grátis com largura CSS dinâmica:
```js
fill.style.width = Math.min(100, (subtotal / FRETE) * 100) + '%';
```

O drawer usa `transform: translateX(100%)` em repouso e `translateX(0)` ativo — propriedade composite-only, sem reflow.

`aria-label="Sua sacola"` no `<aside>` e `aria-label` nos botões de +/- quantidade.

Fecha via: botão ×, click no overlay, tecla Escape.

### Argumento para a Banca
O mini-cart implementa o padrão "side-sheet" do Material Design / ARIA Authoring Practices (drawer com overlay) sem nenhuma dependência de UI library. A intercepção em capture phase é uma técnica avançada de JavaScript que resolve a condição de corrida entre dois listeners no mesmo elemento.

---

## 14. Auditoria Core Web Vitals (CWV)

### LCP — Largest Contentful Paint

**Elemento LCP atual:** `.hero-photo-img` (background-image CSS) ou o `<h1 class="hero-title">`.

| Item | Status | Detalhe |
|------|--------|---------|
| Font display swap | ✅ | `display=swap` no Google Fonts — texto visível durante carregamento |
| Hero image em CSS background | ⚠️ | Background-image não é detectado pelo LCP scanner de preload do browser — sem `<link rel="preload">`, a imagem é descoberta tarde |
| Sem `fetchpriority="high"` | ⚠️ | Nenhuma imagem above-the-fold tem prioridade explícita |
| Animações na GPU | ✅ | `transform`, `opacity` — sem reflow |
| Ken Burns usa `transform` | ✅ | Composite-only, sem layout impact |
| TTFB do servidor estático | ✅ | Arquivo servido localmente na 5599 — sub-10ms |
| Speculation Rules API | ❌ Ausente | Pré-renderização de páginas adjacentes poderia trazer LCP a 0ms |

**Recomendação LCP:** Converter o hero de `background-image` CSS para `<img fetchpriority="high" loading="eager">` com `object-fit: cover` no container. Ganho estimado: 200–600ms no LCP em conexões lentas.

### INP — Interaction to Next Paint

| Interação | Handler | Risco |
|-----------|---------|-------|
| Click em chip de filtro (vitrine) | Filtra array em memória | ✅ Leve |
| Click em "Adicionar ao carrinho" | `fetch()` assíncrono | ✅ Não bloqueia |
| Mega menu `mouseenter` | `closeAll()` + `classList.add('active')` | ✅ Leve |
| Scroll reveal `IntersectionObserver` | `classList.add('visible')` | ✅ Leve |
| Loop RAF do cursor | Leitura + escrita de `style.left/top` | ⚠️ Grava no DOM a 60fps — monitorar em CPUs lentas |
| `carregarNotificacoes()` no load | Fetch + renderização HTML | ✅ Assíncrono, não bloqueia interação |

**Recomendação INP:** O loop RAF do cursor escreve `left`/`top` a cada frame. Em dispositivos lentos, isso pode contribuir para frames longos. Alternativa: usar `transform: translate(x, y)` em vez de `left/top` — property composite-only.

### CLS — Cumulative Layout Shift

| Causa potencial | Status | Detalhe |
|----------------|--------|---------|
| Imagens sem `width/height` no HTML | ⚠️ | Cards de produto usam `aspect-ratio: 3/4` no CSS — espaço reservado ✅ |
| Fontes Google causando FOUT | ⚠️ | `font-display: swap` pode causar shift se fallback tiver métricas diferentes de Archivo Black |
| Injeção de mini-cart/overlay | ✅ | Injetado com `transform` → não empurra layout |
| Header fixo (não reserva espaço) | ✅ | `padding-top: var(--nav-h)` em todas as `<main>` compensa |
| Grid layout shift ao carregar produtos | ⚠️ | Grid começa vazio e preenche com JS — pode causar shift se a seção não tiver altura mínima reservada |
| Snow layer (`position: absolute`) | ✅ | Não afeta flow do documento |

**Recomendação CLS:** Adicionar `min-height` ao `#vitrine-container` enquanto os produtos carregam para reservar espaço e evitar shift.

---

## 15. Auditoria de Acessibilidade (WCAG 2.2)

### ✅ Implementado Corretamente

| Critério | Local | Implementação |
|----------|-------|---------------|
| `lang="pt-br"` | `<html>` de todos os templates | WCAG 3.1.1 ✅ |
| `aria-hidden="true"` na cortina | `#page-transition` | Correto — elemento decorativo |
| `role="search"` no formulário de busca | `templates/index.html:76` e `#search-overlay` | WCAG 4.1.2 ✅ |
| `aria-label` nos ícones do header | Busca, Favoritos, Carrinho, Notificações | WCAG 1.1.1 ✅ |
| `aria-label` nos botões do mini-cart | `aria-label="Diminuir"` / `aria-label="Aumentar"` | WCAG 1.1.1 ✅ |
| `role="dialog" aria-label` no modal newsletter | `#news-modal` | WCAG 4.1.2 ✅ |
| `aria-label` nos cards de drop (secreto/arquivado) | `drops.js:64,83,97` | WCAG 1.1.1 ✅ |
| `role="button" tabindex="0"` nos drop cards | `drops.js` | WCAG 2.1.1 ✅ |
| `aria-label="Fechar menu"` no botão mobile | `components.js:211` | WCAG 1.1.1 ✅ |
| `role="region" aria-label` nos mega-panels | `components.js:263,297` | WCAG 4.1.2 ✅ |
| `prefers-reduced-motion` | `global.css:633–648` | WCAG 2.3.3 ✅ |
| `pointer: fine` guard no cursor | `components.js:14` | Não atrapalha touch ✅ |
| Formulário de newsletter: `aria-label` no input | `components.js:354` | WCAG 3.3.2 ✅ |
| `escapeHtml()` em todos os renderizadores dinâmicos | `drops.js`, `drop.js`, `menu.js` | XSS prevention ✅ |
| `:focus-visible` global | `global.css:651–655` | WCAG 2.4.7 ✅ |
| Imagens decorativas no hero com `aria-hidden="true"` | `templates/index.html:26` | WCAG 1.1.1 ✅ |

### ⚠️ Problemas Encontrados

#### P1 — Contraste insuficiente (AA) — `.section-label` e textos `--muted`
**Critério:** WCAG 1.4.3 (AA)

`color: var(--muted)` = `#6B6B6B` sobre `background: var(--bg)` = `#0A0A0A`.
Contraste calculado: **~4.0:1** — abaixo do mínimo de 4.5:1 para texto normal (< 18px).

Afeta: `.section-label` (`.58rem`), `.hero-meta-label`, `.drop-text`, `.busca-info`, `.mc-freebar p`, `.fn-desc`.

**Correção:** Clarear `--muted` de `#6B6B6B` para `#787878` (~4.6:1) ou usar `--muted` apenas em textos grandes (≥ 18px ou ≥ 14px bold).

---

#### P2 — Cards de produto usam `<div onclick>` sem suporte de teclado
**Critério:** WCAG 2.1.1 (A) — Teclado

```html
<!-- Em drop.js:87 — não acessível por teclado -->
<div class="produto-card" onclick="window.grittaGo('../usuario/produto.html?slug=...')">
```

O `<div>` não é focusável por tab e não responde a Enter/Space. Usuários de teclado não conseguem acessar produtos.

**Correção:** Adicionar `role="button" tabindex="0"` e handler de teclado, ou usar `<a href="...">` envolvendo o card.

---

#### P3 — Drop cards em `drops.js` têm `role="button"` mas sem handler de teclado
**Critério:** WCAG 2.1.1 (A)

Os cards têm `role="button" tabindex="0"` (focusável) mas o evento `click` é adicionado por `addEventListener('click', ...)` — o browser não dispara `click` em `div[role=button]` ao pressionar Enter/Space.

**Correção:**
```js
card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
});
```

---

#### P4 — Cursor `none` para todos os usuários
**Critério:** WCAG 1.4.11 (AA) — Contraste de Componentes

`body { cursor: none }` e `a, button { cursor: none }` removem o cursor para 100% dos usuários — incluindo quem usa modos de alto contraste do Windows, quem tem deficiência motora e usa cursor ampliado, ou quem usa Linux com cursor personalizado.

O guard `pointer: fine` protege touch, mas não protege usuários com cursor ampliado ou alto contraste.

**Mitigação:** O cursor customizado é visível (11px ponto branco + anel 46px) e funciona. O risco principal é usuários que desabilitam JS — sem JS, o cursor desaparece. Adicionar `body { cursor: auto }` como fallback no CSS e sobreescrever via JS após injetCursor() é a solução robusta.

---

#### P5 — Modal newsletter sem focus trap e sem `aria-modal`
**Critério:** WCAG 2.1.2 (A) — Sem Armadilha de Teclado (inverso: o foco DEVE ficar preso dentro de modais)

O `#news-modal` não retém o foco dentro de si mesmo — Tab pode sair para o fundo da página. Também não tem `aria-modal="true"` que sinaliza para leitores de tela que o contexto está confinado.

**Correção:**
```js
// No open do modal: armazenar elemento anterior com foco, focar o primeiro elemento do modal
// No close: restaurar foco
// Adicionar ao <div role="dialog">: aria-modal="true"
```

---

#### P6 — Skip link ausente
**Critério:** WCAG 2.4.1 (A) — Desviar Blocos

Nenhuma página tem um link "Pular para o conteúdo principal" acessível por teclado antes do header.

**Correção:**
```html
<!-- Primeiro filho do <body>, visualmente oculto mas focusável -->
<a href="#vitrine" class="skip-link">Pular para o conteúdo</a>
```

---

#### P7 — Mega menu sem `aria-expanded` no trigger
**Critério:** WCAG 4.1.2 (AA) — Nome, Papel, Valor

Os `.mega-trigger` não comunicam o estado aberto/fechado para leitores de tela:
```html
<!-- Atual — sem informação de estado -->
<a href="..." class="mega-trigger">COLEÇÃO</a>

<!-- Correto -->
<button class="mega-trigger" aria-expanded="false" aria-controls="mega-colecao">COLEÇÃO</button>
```

---

### Resumo de Prioridade

| # | Problema | Critério | Severidade |
|---|----------|----------|------------|
| P1 | Contraste `--muted` insuficiente | WCAG 1.4.3 AA | 🔴 Sério |
| P2 | `<div onclick>` nos produto-cards | WCAG 2.1.1 A | 🔴 Sério |
| P3 | Drop cards sem handler de teclado | WCAG 2.1.1 A | 🔴 Sério |
| P4 | Cursor `none` sem fallback JS-off | WCAG 1.4.11 AA | 🟡 Moderado |
| P5 | Modal sem focus trap + `aria-modal` | WCAG 2.1.2 A | 🟡 Moderado |
| P6 | Skip link ausente | WCAG 2.4.1 A | 🟡 Moderado |
| P7 | Mega menu sem `aria-expanded` | WCAG 4.1.2 AA | 🟡 Moderado |

---

## 16. Redundâncias e Bugs CSS/JS

### Bug 1 — `drop.css` com estilos do tema claro (inconsistência visual)

**Arquivo:** [`statics/css/pages/drop.css:56–109`](statics/css/pages/drop.css)

As classes `.drop-card`, `.drop-card-imagem`, `.drop-card-info h3` e `.drop-card-preco` neste arquivo usam `background: #fff`, `color: #111`, `color: #888` — resquícios de uma versão anterior com fundo branco. O arquivo `drops.css` (listagem) tem o tema escuro correto, mas `drop.css` (página individual) mistura os dois temas.

```css
/* Bug: fundo branco num site dark */
.drop-card { background: #fff; }
.drop-card-info h3 { color: #111; }
.drop-card-preco { color: #888; }
```

**Solução:** Trocar por `background: var(--surface)`, `color: var(--text)`, `color: var(--muted)`.

---

### Bug 2 — `drop.js` usa `onclick` inline em `<div>` (não acessível)

**Arquivo:** [`statics/js/pages/drop.js:87`](statics/js/pages/drop.js)

```js
return `<div class="${classes}" onclick="window.grittaGo('../usuario/produto.html?slug=${p.slug || p.id}')">`;
```

O `onclick` inline em `<div>` não é acionado por teclado e não é acessível por leitores de tela. A função `window.grittaGo()` também é chamada como string inline — mistura de HTML e JS.

**Solução:** Renderizar como `<a href="..." class="${classes}">` ou adicionar `role="button" tabindex="0"` e handler de evento externo.

---

### Redundância 1 — `cursor: none` duplicado

**Arquivo:** [`statics/css/global.css:39`](statics/css/global.css) e [`statics/css/global.css:112`](statics/css/global.css)

```css
body { cursor: none }           /* linha 39 */
a, button { cursor: none }      /* linha 112 */
```

`body { cursor: none }` já hereda para todos os filhos. A regra específica em `a, button` só é necessária para sobrescrever `cursor: pointer` de user-agent stylesheet — mas a herança de `body` já faz isso. Manter apenas a regra específica é semanticamente mais claro.

---

### Redundância 2 — `buildMarquee()` chamado duas vezes em algumas páginas

**Arquivos:** [`statics/js/pages/drop.js:2`](statics/js/pages/drop.js) e [`statics/js/pages/drops.js:2`](statics/js/pages/drops.js)

```js
if (typeof buildMarquee === 'function') buildMarquee('marquee-inner');
```

Ambas as páginas chamam `buildMarquee` mas o `initStorefront()` em `components.js` também chama `buildMarquee` via `applyStorefront()` se `d.marquee` existir. Em páginas com storefront ativo, o marquee pode ser renderizado duas vezes (segundo call sobrescreve o primeiro). O guard `if (typeof buildMarquee === 'function')` é correto, mas o timing pode causar flash de conteúdo incorreto.

---

### Redundância 3 — Font Bebas Neue carregada mas praticamente não usada

**Arquivo:** [`statics/css/global.css:5`](statics/css/global.css)

```css
@import url("...family=Bebas+Neue&...");
```

`--font-display: "Archivo Black", "Bebas Neue", sans-serif` — Bebas Neue é o fallback de Archivo Black. Se o Archivo Black carrega (CDN do Google Fonts, ~99% uptime), Bebas Neue nunca é usado. Considerar remover do `@import` para economizar uma requisição de fonte.

---

### Observação de Segurança — `escapeHtml()` consistente

Positivo: `escapeHtml()` é implementado e usado em todos os renderizadores dinâmicos (`drops.js`, `drop.js`, `menu.js`) para sanitizar dados vindos da API antes de inserir no DOM. Isso previne XSS por Content Injection. ✅

---

*Documento gerado em 2026-07-01 — GR!TTA Streetwear*
