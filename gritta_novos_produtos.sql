-- ============================================================
--  GR!TTA — Inserção de novos produtos
--  Execute no phpMyAdmin ou MySQL CLI
--  Gerado automaticamente — Pedro Nadalon Klippel / 2026
-- ============================================================

USE gritta_db;

-- ============================================================
--  PRODUTOS
-- ============================================================
INSERT INTO produtos (id, nome, slug, descricao, preco_base, tipo, ativo, is_special, drop_nome) VALUES

-- ── CAMISAS ────────────────────────────────────────────────
(50, 'Camiseta Grunge Oversized Branca',   'camiseta-grunge-oversized-branca',
 'Fit oversized com estampa grungecore. 100% algodão premium. Modelagem ampla com barra desfiada.',
 109.90, 'camisa', 1, 1, 'Coleção Oversized'),

(51, 'Camiseta Urban Style com Boné',       'camiseta-urban-style-azul',
 'Look completo streetwear: camiseta azul marinho manga curta, oversized. Tecido macio e resistente.',
 99.90, 'camisa', 1, 0, 'Coleção Oversized'),

(52, 'Camiseta Minimal Preta Oversized',    'camiseta-minimal-preta-oversized',
 'A camisa que fala por si. Preta, sem estampa, modelagem oversized—o basic mais streetwear do guarda-roupa.',
 89.90, 'camisa', 1, 0, 'Coleção Oversized'),

(53, 'Camiseta Graphic Verde e Preta',      'camiseta-graphic-verde-preto',
 'Estampa gráfica exclusiva em silk screen, verde militar e preto. Algodão 100% penteado.',
 119.90, 'camisa', 1, 1, 'Coleção Oversized'),

(54, 'Camiseta Logo Solar Preta',           'camiseta-logo-solar-preta',
 'Camiseta preta com logo solar bordado no peito. Tecido pesado gramatura 220g. Fit relaxed.',
 129.90, 'camisa', 1, 0, 'Coleção Oversized'),

-- ── MOLETONS ───────────────────────────────────────────────
(55, 'Moletom Oversized Feminino Branco',   'moletom-oversized-feminino-branco',
 'Moletom branco oversized feminino com capuz largo. Fleece interno macio. Ideal para looks minimalistas.',
 279.90, 'moletom', 1, 1, 'Coleção Inverno 26'),

(56, 'Moletom Puffer Corredor Preto',       'moletom-puffer-corredor-preto',
 'Jaqueta puffer estilo corredor com detalhes refletivos. Enchimento em fibra leve. Resistente ao vento.',
 399.90, 'moletom', 1, 1, 'Coleção Inverno 26'),

(57, 'Moletom Hoodie Bicolor Preto e Branco','moletom-hoodie-bicolor-preto-branco',
 'Hoodie dividido em dois blocos de cor: preto e branco. Bolso canguru duplo. Cadarço tonal.',
 319.90, 'moletom', 1, 0, 'Coleção Inverno 26'),

(58, 'Moletom Skull Preto Street',          'moletom-skull-preto-street',
 'Hoodie preto com estampa de caveira em silk no peito. Tecido french terry pesado, 320g.',
 299.90, 'moletom', 1, 1, 'Coleção Inverno 26'),

-- ── CALÇAS ─────────────────────────────────────────────────
(59, 'Calça Cargo Utility Preta',           'calca-cargo-utility-preta',
 'Cargo tática com 6 bolsos, fivela lateral e cós elástico. Tecido ripstop leve. Perfil wide leg.',
 249.90, 'calca', 1, 1, 'Coleção Oversized'),

(60, 'Calça Barrel Leg Bege',               'calca-barrel-leg-bege',
 'Modelo barrel leg em sarja bege. Caimento único com volume na coxa e afunilamento no tornozelo.',
 229.90, 'calca', 1, 0, 'Coleção Oversized'),

(61, 'Calça Baggy Jogger Preta',            'calca-baggy-jogger-preta',
 'Jogger em moletinho leve com elástico na cintura e barra. Silhueta solta e confortável.',
 199.90, 'calca', 1, 0, 'Coleção Oversized'),

(62, 'Calça Wide Leg Jeans Feminino',       'calca-wide-leg-jeans-feminino',
 'Wide leg em jeans lavagem clara. Cintura alta, corte reto largo. Bolsos profundos.',
 219.90, 'calca', 1, 1, 'Coleção Oversized'),

(63, 'Calça Baggy Jeans com Chaveiro',      'calca-baggy-jeans-chaveiro',
 'Baggy jeans com corrente de chaveiro fixada no cós. Lavagem escura, barra aberta. Estilo Y2K.',
 239.90, 'calca', 1, 0, 'Coleção Oversized'),

-- ── TÊNIS ──────────────────────────────────────────────────
(64, 'Tênis Low Preto e Branco Street',     'tenis-low-preto-branco-street',
 'Tênis low top bicolor preto e branco. Sola vulcanizada, palmilha macia. Ideal para uso diário.',
 349.90, 'tenis', 1, 1, 'Coleção Inverno 26'),

(65, 'Tênis Air Force Style Branco',        'tenis-air-force-style-branco',
 'Inspirado no clássico court shoe, branco total. Couro sintético premium, cano médio.',
 399.90, 'tenis', 1, 0, 'Coleção Inverno 26'),

(66, 'Tênis Chunky Preto Mesh',             'tenis-chunky-preto-mesh',
 'Tênis chunky com cabedal em mesh respirável e sobreposições em preto. Sola dentada alta.',
 449.90, 'tenis', 1, 1, 'Coleção Inverno 26'),

(67, 'Tênis Runner Vermelho e Branco',      'tenis-runner-vermelho-branco',
 'Runner bicolor com detalhes em vermelho. Amortecimento EVA, palmilha removível.',
 379.90, 'tenis', 1, 0, 'Coleção Inverno 26'),

(68, 'Tênis Platform Branco Clean',         'tenis-platform-branco-clean',
 'Platform branco totalwhite com sola tratorada de 4cm. Visual minimalista e impacto máximo.',
 429.90, 'tenis', 1, 1, 'Coleção Inverno 26'),

-- ── ACESSÓRIOS ─────────────────────────────────────────────
(69, 'Gorro Amarelo Streetwear',            'gorro-amarelo-streetwear',
 'Gorro de tricô amarelo vivo, dobra dupla. 100% acrílico macio. Proteção ao vento.',
 79.90, 'acessorio', 1, 0, 'Coleção Inverno 26'),

(70, 'Pack Gorros Coloridos (3 un.)',        'pack-gorros-coloridos-3un',
 'Pack com 3 gorros em cores diferentes — vermelho, azul e verde. Ribana de tricô. Presente perfeito.',
 149.90, 'acessorio', 1, 1, 'Coleção Inverno 26'),

(71, 'Gorro Vermelho Inverno',              'gorro-vermelho-inverno',
 'Gorro clássico em vermelho escuro. Borda dobrada com logo bordado. Acrílico premium antifriz.',
 89.90, 'acessorio', 1, 0, 'Coleção Inverno 26'),

(72, 'Boné Preto Casual Streetwear',        'bone-preto-casual-streetwear',
 'Boné 5 panels preto com aba curva e logo bordado frontal. Fecho traseiro snapback.',
 99.90, 'acessorio', 1, 1, 'Coleção Inverno 26');


-- ============================================================
--  IMAGENS
-- ============================================================
INSERT INTO imagens_produto (produto_id, caminho_imagem, ordem_exibicao) VALUES
-- Camisas
(50, 'statics/img/roupas/camisas/camiseta-grunge-oversized-branca.jpg',  0),
(51, 'statics/img/roupas/camisas/camiseta-urban-azul-boné.jpg',          0),
(52, 'statics/img/roupas/camisas/camiseta-minimal-preta-oversized.jpg',  0),
(53, 'statics/img/roupas/camisas/camiseta-graphic-verde-preto.jpg',      0),
(54, 'statics/img/roupas/camisas/camiseta-logo-preta-sol.jpg',           0),
-- Moletons
(55, 'statics/img/roupas/moletons/moletom-oversized-feminino-branco.jpg',0),
(56, 'statics/img/roupas/moletons/moletom-puffer-corredor-preto.jpg',    0),
(57, 'statics/img/roupas/moletons/moletom-hoodie-bicolor-bw.jpg',        0),
(58, 'statics/img/roupas/moletons/moletom-skull-preto-street.jpg',       0),
-- Calças
(59, 'statics/img/roupas/calcas/calca-cargo-utility-preto.jpg',          0),
(60, 'statics/img/roupas/calcas/calca-barrel-bege-wide.jpg',             0),
(61, 'statics/img/roupas/calcas/calca-baggy-jogger-preta.jpg',           0),
(62, 'statics/img/roupas/calcas/calca-wide-jeans-feminino.jpg',          0),
(63, 'statics/img/roupas/calcas/calca-baggy-jeans-com-chaveiro.webp',    0),
-- Tênis
(64, 'statics/img/roupas/tenis/tenis-low-preto-branco-street.jpg',       0),
(65, 'statics/img/roupas/tenis/tenis-air-force-branco.jpg',              0),
(66, 'statics/img/roupas/tenis/tenis-chunky-preto-mesh.jpg',             0),
(67, 'statics/img/roupas/tenis/tenis-runner-vermelho-branco.jpg',        0),
(68, 'statics/img/roupas/tenis/tenis-platform-branco.jpg',               0),
-- Acessórios
(69, 'statics/img/roupas/acessorios/gorro-amarelo-streetwear.jpg',       0),
(70, 'statics/img/roupas/acessorios/gorros-pack-coloridos.jpg',          0),
(71, 'statics/img/roupas/acessorios/gorro-vermelho-inverno.jpg',         0),
(72, 'statics/img/roupas/acessorios/bone-preto-casual-streetwear.jpg',   0);


-- ============================================================
--  VARIAÇÕES (tamanhos + estoque)
-- ============================================================

-- ── Camisas (PP, P, M, G, GG, XGG) ────────────────────────
INSERT INTO variacoes (produto_id, tamanho, sku, estoque) VALUES
-- Produto 50 - Grunge Branca
(50,'PP','GRU-CAM-PP',8),(50,'P','GRU-CAM-P',15),(50,'M','GRU-CAM-M',20),
(50,'G','GRU-CAM-G',18),(50,'GG','GRU-CAM-GG',10),(50,'XGG','GRU-CAM-XGG',5),
-- Produto 51 - Urban Azul
(51,'PP','URB-CAM-PP',6),(51,'P','URB-CAM-P',12),(51,'M','URB-CAM-M',18),
(51,'G','URB-CAM-G',16),(51,'GG','URB-CAM-GG',8),(51,'XGG','URB-CAM-XGG',3),
-- Produto 52 - Minimal Preta
(52,'PP','MIN-CAM-PP',10),(52,'P','MIN-CAM-P',20),(52,'M','MIN-CAM-M',25),
(52,'G','MIN-CAM-G',22),(52,'GG','MIN-CAM-GG',12),(52,'XGG','MIN-CAM-XGG',6),
-- Produto 53 - Graphic Verde
(53,'PP','GRF-CAM-PP',7),(53,'P','GRF-CAM-P',14),(53,'M','GRF-CAM-M',19),
(53,'G','GRF-CAM-G',17),(53,'GG','GRF-CAM-GG',9),(53,'XGG','GRF-CAM-XGG',4),
-- Produto 54 - Logo Solar
(54,'PP','LOG-CAM-PP',5),(54,'P','LOG-CAM-P',11),(54,'M','LOG-CAM-M',16),
(54,'G','LOG-CAM-G',14),(54,'GG','LOG-CAM-GG',7),(54,'XGG','LOG-CAM-XGG',2),

-- ── Moletons (P, M, G, GG) ─────────────────────────────────
-- Produto 55 - Oversized Feminino
(55,'P','OVF-MOL-P',10),(55,'M','OVF-MOL-M',15),(55,'G','OVF-MOL-G',12),(55,'GG','OVF-MOL-GG',6),
-- Produto 56 - Puffer Corredor
(56,'P','PUF-MOL-P',8),(56,'M','PUF-MOL-M',12),(56,'G','PUF-MOL-G',10),(56,'GG','PUF-MOL-GG',5),
-- Produto 57 - Bicolor BW
(57,'P','BIC-MOL-P',9),(57,'M','BIC-MOL-M',14),(57,'G','BIC-MOL-G',11),(57,'GG','BIC-MOL-GG',4),
-- Produto 58 - Skull
(58,'P','SKU-MOL-P',7),(58,'M','SKU-MOL-M',11),(58,'G','SKU-MOL-G',9),(58,'GG','SKU-MOL-GG',3),

-- ── Calças (36, 38, 40, 42, 44) ────────────────────────────
-- Produto 59 - Cargo Utility
(59,'36','CGO-CAL-36',6),(59,'38','CGO-CAL-38',12),(59,'40','CGO-CAL-40',15),
(59,'42','CGO-CAL-42',10),(59,'44','CGO-CAL-44',5),
-- Produto 60 - Barrel Bege
(60,'36','BBG-CAL-36',5),(60,'38','BBG-CAL-38',10),(60,'40','BBG-CAL-40',14),
(60,'42','BBG-CAL-42',9),(60,'44','BBG-CAL-44',4),
-- Produto 61 - Baggy Jogger
(61,'36','BJG-CAL-36',8),(61,'38','BJG-CAL-38',14),(61,'40','BJG-CAL-40',18),
(61,'42','BJG-CAL-42',13),(61,'44','BJG-CAL-44',6),
-- Produto 62 - Wide Leg Feminino
(62,'36','WJF-CAL-36',7),(62,'38','WJF-CAL-38',13),(62,'40','WJF-CAL-40',17),
(62,'42','WJF-CAL-42',12),(62,'44','WJF-CAL-44',5),
-- Produto 63 - Baggy Chaveiro
(63,'36','BCH-CAL-36',6),(63,'38','BCH-CAL-38',11),(63,'40','BCH-CAL-40',15),
(63,'42','BCH-CAL-42',10),(63,'44','BCH-CAL-44',4),

-- ── Tênis (38, 39, 40, 41, 42, 43) ─────────────────────────
-- Produto 64 - Low PB
(64,'38','LPB-TEN-38',5),(64,'39','LPB-TEN-39',8),(64,'40','LPB-TEN-40',12),
(64,'41','LPB-TEN-41',10),(64,'42','LPB-TEN-42',7),(64,'43','LPB-TEN-43',3),
-- Produto 65 - Air Force
(65,'38','AFB-TEN-38',6),(65,'39','AFB-TEN-39',9),(65,'40','AFB-TEN-40',13),
(65,'41','AFB-TEN-41',11),(65,'42','AFB-TEN-42',8),(65,'43','AFB-TEN-43',4),
-- Produto 66 - Chunky
(66,'38','CPM-TEN-38',4),(66,'39','CPM-TEN-39',7),(66,'40','CPM-TEN-40',11),
(66,'41','CPM-TEN-41',9),(66,'42','CPM-TEN-42',6),(66,'43','CPM-TEN-43',2),
-- Produto 67 - Runner Vermelho
(67,'38','RVB-TEN-38',6),(67,'39','RVB-TEN-39',10),(67,'40','RVB-TEN-40',14),
(67,'41','RVB-TEN-41',12),(67,'42','RVB-TEN-42',8),(67,'43','RVB-TEN-43',3),
-- Produto 68 - Platform
(68,'38','PFB-TEN-38',5),(68,'39','PFB-TEN-39',8),(68,'40','PFB-TEN-40',12),
(68,'41','PFB-TEN-41',10),(68,'42','PFB-TEN-42',6),(68,'43','PFB-TEN-43',2),

-- ── Acessórios (ÚNICO) ──────────────────────────────────────
(69,'ÚNICO','GAM-ACE-U',30),
(70,'ÚNICO','GPC-ACE-U',20),
(71,'ÚNICO','GVI-ACE-U',25),
(72,'ÚNICO','BPC-ACE-U',35);


-- ============================================================
--  VERIFICAÇÃO FINAL
-- ============================================================
SELECT tipo, COUNT(*) as total_produtos
FROM produtos
GROUP BY tipo
ORDER BY tipo;
