-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 19/04/2026 às 21:57
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `gritta_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `carrinhos`
--

CREATE TABLE `carrinhos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `variacao_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `enderecos`
--

CREATE TABLE `enderecos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `cep` varchar(9) NOT NULL,
  `rua` varchar(200) NOT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` char(2) DEFAULT NULL,
  `tipo_endereco` enum('Entrega','Cobranca') DEFAULT 'Entrega'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `enderecos`
--

INSERT INTO `enderecos` (`id`, `usuario_id`, `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `tipo_endereco`) VALUES
(5, 1, '91350130', 'Rua Bezerra de Menezes', '333', NULL, 'Passo da Areia', 'Porto Alegre', 'RS', 'Entrega');

-- --------------------------------------------------------

--
-- Estrutura para tabela `favoritos`
--

CREATE TABLE `favoritos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `imagens_produto`
--

CREATE TABLE `imagens_produto` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `caminho_imagem` varchar(255) NOT NULL,
  `ordem_exibicao` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `imagens_produto`
--

INSERT INTO `imagens_produto` (`id`, `produto_id`, `caminho_imagem`, `ordem_exibicao`) VALUES
(9, 9, 'statics/img/roupas/camisas/oversized-angel.webp', 0),
(10, 10, 'statics/img/roupas/camisas/oversized-archangel.webp', 0),
(11, 11, 'statics/img/roupas/camisas/oversized-fallen.webp', 0),
(12, 12, 'statics/img/roupas/camisas/oversized-myth.webp', 0),
(13, 13, 'statics/img/roupas/camisas/oversized-tdah.webp', 0),
(14, 14, 'statics/img/roupas/calcas/calca-reta-jeans-medio.webp', 0),
(15, 15, 'statics/img/roupas/calcas/calca-moletom-esportiva-listra.webp', 0),
(16, 16, 'statics/img/roupas/calcas/calca-oversized-cargo-em-jeans.webp', 0),
(17, 17, 'statics/img/roupas/calcas/calca-sarja-baggy-cargo-camuflada.webp', 0),
(18, 18, 'statics/img/roupas/calcas/calca-sarja-oversized-cargo.webp', 0),
(19, 19, 'statics/img/roupas/moletons/jaqueta-acolchoada-estilo-camisa.webp', 0),
(20, 20, 'statics/img/roupas/moletons/jaqueta-box-corta-vento-esportiva.webp', 0),
(21, 21, 'statics/img/roupas/moletons/jaqueta-box-puffer-preta-gola-alta.webp', 0),
(22, 22, 'statics/img/roupas/moletons/jaqueta-preta-poliuretano-capuz-moletom.webp', 0),
(23, 23, 'statics/img/roupas/moletons/moletom-boxy-gaming-squad.webp', 0),
(24, 24, 'statics/img/roupas/tenis/qix-90s-preto-e-branco.webp', 0),
(25, 25, 'statics/img/roupas/tenis/qix-trek-urban-hiking-branco.webp', 0),
(26, 26, 'statics/img/roupas/tenis/qix-park-preto.webp', 0),
(27, 27, 'statics/img/roupas/tenis/qix-and-kings-trek-galeria.webp', 0),
(28, 28, 'statics/img/roupas/tenis/qix-90s-pro-series-william-damascena-branco.webp', 0),
(41, 43, 'statics/img/roupas/acessorios/bone-chumbo-play.webp', 0),
(42, 44, 'statics/img/roupas/acessorios/bone-jeans-destroyed-ilhoses.webp', 0),
(43, 45, 'statics/img/roupas/acessorios/bone-qix-lords-preto.webp', 0),
(44, 46, 'statics/img/roupas/acessorios/bone-chorao-sunset-purple.webp', 0),
(45, 47, 'statics/img/roupas/acessorios/bone-cbjr-logo-preto.webp', 0),
(46, 48, 'statics/img/roupas/acessorios/conjunto-prateado-coracao.webp', 0),
(47, 49, 'statics/img/roupas/acessorios/kit-brincos-cruz.webp', 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `itens_pedido`
--

CREATE TABLE `itens_pedido` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `variacao_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiracao` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `password_resets`
--

INSERT INTO `password_resets` (`id`, `usuario_id`, `token`, `expiracao`, `usado`) VALUES
(1, 1, 'DW1JAnD3F8olXwTVuxe3juROyLir0thq8R7XWb0ilqo', '2026-04-17 19:04:32', 0),
(2, 1, 'vPfGn89XOOgd7cL5pQj_DHkeoEl89WD6Eil4xhCYzEg', '2026-04-17 23:16:45', 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `endereco_entrega_id` int(11) NOT NULL,
  `codigo_rastreio` varchar(100) DEFAULT NULL,
  `status` enum('Aguardando Pagamento','Pago','Em Separação','Enviado','Entregue','Cancelado') DEFAULT 'Aguardando Pagamento',
  `total_pedido` decimal(10,2) NOT NULL,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `preco_base` decimal(10,2) NOT NULL,
  `tipo` enum('moletom','calca','acessorio','camisa','tenis') DEFAULT 'camisa',
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` datetime DEFAULT current_timestamp(),
  `drop_nome` varchar(100) DEFAULT NULL,
  `is_special` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `nome`, `slug`, `descricao`, `preco_base`, `tipo`, `ativo`, `criado_em`, `drop_nome`, `is_special`) VALUES
(9, 'Camiseta Oversized Angel', 'camiseta-oversized-angel', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(10, 'Camiseta Oversized Archangel', 'camiseta-oversized-archangel', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 1),
(11, 'Camiseta Oversized Fallen', 'camiseta-oversized-fallen', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(12, 'Camiseta Oversized Myth', 'camiseta-oversized-myth', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(13, 'Camiseta Oversized TDAH', 'camiseta-oversized-tdah', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(14, 'Calça Reta Jeans Médio', 'calca-reta-jeans-medio', 'calça em jeans médio com modelagem reta, sendo estilosa e versátil. com fechamento em zíper + botão, com bolsos.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Urbana', 0),
(15, 'Calça Moletom Esportiva Listrada', 'calca-moletom-esportiva-listrada', 'calça em moletom preto, no estilo esportivo, com listra branca nas laterais, cós com elástico e amarração, caimento larguinho e bolsos laterais e traseiro.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 0),
(16, 'Calça Oversize Cargo Em Jeans', 'calca-oversize-cargo-em-jeans', 'calça jeans com bolsos cargo e modelagem oversized, ficando com caimento amplo nas pernas. em jeans com desfiados nos acabamentos e lavagem \"dirty\", que traz uma tonalidade vintage pra peça.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 0),
(17, 'Calça Sarja Baggy Cargo Camuflado', 'calca-serja-baggy-cargo-camuflado', 'calça em sarja camuflada com bolsos cargo nas laterais e modelagem baggy, que começa mais soltinha nas pernas e vai se ajustando na barra.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 1),
(18, 'Calça Sarja Oversized Cargo', 'calca-sarja-oversized-cargo', 'calça em sarja preta com quatro bolsos cargo grandes, dois deles com zíper. modelagem oversized, ficando com caimento amplo nas pernas.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 0),
(19, 'Jaqueta Acolchoada Estilo Camisa', 'jaqueta-acolchoada-estilo-camisa', 'jaqueta marrom acolchoada, com bolsos frontais e fechamento em botões de pressão. modelo overshirt, tendo o fit parecido com o de uma camisa.', 219.90, 'moletom', 1, '2026-04-19 15:51:52', 'Coleção Urbana', 0),
(20, 'Jaqueta Box Corta Vento Esportiva', 'jaqueta-box-corta-vento', 'jaqueta preta estilo corta vento, com mangas e laterais em branco, estampa esportiva, fechamento em zíper e gola alta. na modelagem box, que tem o caimento mais \"quadrado\".', 219.90, 'moletom', 1, '2026-04-19 15:51:52', 'Coleção Inverno', 0),
(21, 'Jaqueta Box Puffer Preta Gola Alta', 'jaqueta-box-puffer-preta', 'jaqueta puffer em poliuretano, com \"gomos\" acolchoados, ribana nos pulsos e barra e modelagem box.', 349.90, 'moletom', 1, '2026-04-19 15:51:52', 'Coleção Inverno', 0),
(22, 'Jaqueta Preta Poliuretano Capuz Moletom', 'jaqueta-preta-poliuretano-capuz', 'jaqueta estilo bomber, na modelagem box, que fica com o caimento mais quadrado. em poliuretano preto, tecido sintético que lembra couro, com capuz em moletom, barra e pulsos ajustados.', 289.90, 'moletom', 1, '2026-04-19 15:51:52', 'Coleção Inverno', 0),
(23, 'Moletom Boxy Gaming Squad', 'moletom-boxy-gaming-squad', 'Hoodie oversized com estampa digital futurista nas costas. Conforto pesado com caimento estruturado e urbano.', 219.90, 'moletom', 1, '2026-04-19 15:51:52', 'Coleção Inverno', 0),
(24, 'Qix 90s - Preto e Branco', 'tenis-qix-90s-preto-branco', 'Aqui, o que importa não é aparência perfeita, é identidade. É rua, é estilo próprio, é viver do seu jeito. Um verdadeiro tênis pra quem carrega a essência do skate no dia a dia.', 299.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Urbana', 0),
(25, 'Qix And Kings Trek Galeria', 'tenis-qix-kings-trek-galeria', 'Mais do que um tênis, é uma afirmação de estilo pra quem vive a rua intensamente. O Galeria reforça essa união com atitude, identidade e um visual que não passa despercebido nesta edição exclusiva e limitada.', 349.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Inverno', 1),
(26, 'Qix Park - Preto', 'tenis-qix-park-preto', 'Se você cresceu ouvindo Charlie Brown Jr., sabe que cada letra tinha peso, verdade e rua. Esse tênis segue a mesma linha. É sobre expressão, liberdade e identidade no lifestyle urbano.', 279.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Inverno', 0),
(27, 'Qix Trek Urban Hiking - Branco', 'tenis-qix-trek-urban-hiking-branco', 'Com design robusto e moderno, ele é feito pra quem vive o corre diário e quer um calçado que acompanhe do rolê ao lifestyle, sempre com conforto e autenticidade. Um tênis pensado pra quem vive sem rótulos.', 329.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Inverno', 1),
(28, 'Qix 90s Pro Series William Damascena - Branco', 'tenis-qix-90s-pro-william-damascena', 'O Tênis Qix 90\'s Pro Series William Damascena - Branco, com o estilo dos pisantes clássicos dos anos 90, reforçando o que Qix faz de melhor, ele une estilo e resistência para todos os momentos. Apresenta o logotipo da marca na lateral, calcanhar e palmilha.', 389.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Inverno', 0),
(43, 'Boné Chumbo Play - Estilo Câmera', 'bone-chumbo-play-camera', 'Boné em tom chumbo com bordados inspirados em interface de gravação de vídeo.', 89.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(44, 'Boné Jeans Destroyed com Ilhoses', 'bone-jeans-destroyed-ilhoses', 'Boné em jeans com lavagem estonada, detalhes desfiados e ilhoses metálicos.', 99.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(45, 'Boné Qix Aba Reta The Lords Skateboarding', 'bone-qix-the-lords-preto', 'O clássico aba reta da Qix, com bordado cursivo The Lords Skateboarding.', 119.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Inverno', 0),
(46, 'Boné Snapback Chorão Sunset House - Roxo', 'bone-snapback-chorao-sunset-purple', 'Homenagem ao ícone Chorão, modelo Sunset House na cor roxa com bordados especiais.', 129.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Especial', 1),
(47, 'Boné Snapback Charlie Brown Jr. Logo', 'bone-snapback-charlie-brown-jr-preto', 'Boné oficial Charlie Brown Jr. com o clássico logo bordado em branco.', 129.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Especial', 0),
(48, 'Conjunto Corrente e Pulseira Prateado', 'conjunto-colar-pulseira-prateado', 'Kit de acessórios em banho prateado com elos trabalhados e pingente de coração.', 79.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(49, 'Kit 3 Brincos Argola e Cruz', 'kit-3-brincos-argola-cruz', 'Mix de brincos prateados contendo argolas lisas e pingente de cruz.', 49.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiracao` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `usuario_id`, `token`, `expiracao`) VALUES
(1, 1, '4Swa19DzcVifySrprjEdYOh7domi22OxoXIyflrvB3yAMsbUzP-XC6XijUnS-yVhBaSV9ScQqD7Rj1EBIkGjcQ', '2026-04-25 00:15:20'),
(2, 1, 'WnUPGSWS6UnvS0s9XhyeEbyqUPUPtAyK8cUe5tIh2N5PLz8SMiJX2kiYxDg0kRBEJlb_9nHQs4mqtzunnab9uw', '2026-04-25 00:15:45'),
(3, 1, 'jXdtiwrMri4EQC3i7HFFPxlrlZiEgVXAxTTmX5_Feum6RtU1x2dI_NXLSj7B_P67zsBTuH_tqQ1jEM-6J5aZKw', '2026-04-25 00:17:56'),
(4, 1, 'TlVTpXlu1LerExB06jW2AY0x0khpsiWuBFqmXLArMY7wEIOV1zCvFxXNhVGmk3cXq1ygnzvs-sEBf9R8QUVWbw', '2026-04-25 00:46:05'),
(5, 1, 'jQcK3W9a90SLVK9LeaaIdtRnBzZOC4ehRtSIahWbM_-4LLd4wDthUTRKAS3a6FBQpxxFNKVZC8vGvecp80aEuw', '2026-04-25 00:46:21'),
(6, 1, 'c9MupE59pP0Tn9ObpRbo5TT8EkIPPPoL-BNnkyAU0U4_LA2w8AzZuzTr2brEMnDGWH3mZck2RA_EQ5NvJlzy6w', '2026-04-25 01:16:30'),
(7, 1, 'cMTQ2iNbn9HnlaL_v5LvpFvMT4rpY12oDRClrzH5nOh0YsDSiBbbizv-Inou6UfbmF6rGdk7HJsysY9Y8u44iQ', '2026-04-25 17:59:10'),
(8, 1, '0U2UTeaFbSLEyzTmfXQeoQDCx-ulxNRijk_ma3Wve9AOFRYUV1Vyuru2DnmqVS9qcZFNaRypBM1vwA8vc6E_zg', '2026-04-25 18:27:30'),
(9, 1, '8VuIcjxw_0q4P6uhZBT2kysUbH2blLWnEJIJXpTLqsuEhtHJrD1e09ncDVcitA-1HGcLWfSKc2uvRGZWRvhseA', '2026-04-25 18:44:04'),
(10, 1, 'lVDi0IG0lhQg61YfnxKOnzTNiMUaIz0p2wsXdCqZFxVb9hnZ2i6D8nibbm8SKESZgZZoJtZzg-3MFYTrApaCOg', '2026-04-25 19:10:30'),
(11, 1, 'gpRl5s4r65WOjzcIs9J5hyP7WP3KF14JM7p3p_JChrA9atU4NCv81sbtmZi0-4ncVGDVT4c2JBPVnnW_kQUp2A', '2026-04-25 19:26:07'),
(12, 1, 'Otcv-s3SdCSLwTXYj_fQqt-f6gpuBa0Ik88Tjp5qOMXglfQJwJm-rR9hXqMbHx-jc4TKqgS5ShJd4XIQ_AHCsw', '2026-05-18 19:58:17'),
(13, 1, 'y0Oe3-tGzdegUKTRkKN82RRV9ZpKexLOsLzEU3vJA_PQ5CLHgxj31wH9VP3jeiWyh0IupXnQMc-1txjpEid8cg', '2026-05-18 21:00:28'),
(14, 1, '07SUHVIV9zLewbtMrrmR_WOHfQ79KwI5FQDPMGTeJgd0H-iiG-HM4OgxGK0SEtLbDf-7BuNFEZrfUi-t9FJpLw', '2026-05-18 22:45:37'),
(15, 1, 'AI1J1osd30-7m1jIKu7YmdDMXXeHDTfCzcgiZkGpjGrURCusreda1Tei4s8DYPapZoaY0O0KIKCvuRpJ9-y3og', '2026-05-18 23:55:20'),
(16, 1, '86_wQbQXHiHlewHmQC2Zsa8f1JFyJu_69hJoqRe7Uwc7kirQgUBkktOoimYuUfrwdleVhobEMx_X_sRGGA-pBQ', '2026-05-19 00:37:13'),
(17, 1, '_NdLjoA84BRm6tt22fGlKLoQrK4gLuejMVIxihjlU5e9fhqdIWhElexAq8y2jzv5-Agse41ZSNo0UnJiW0xpXw', '2026-05-19 01:45:36'),
(18, 1, 'oLIh4XSYY6rCOMk9cc6tQKBBXQDroACclfgPTwhx_N2eEDGusBc9sNVxqGuk5MIWIcd6f8OxW7oYKGLe4DFJfA', '2026-05-19 01:54:49'),
(19, 1, 'Cx_9sO8Ovn0CAu9deXtl6h0O0RixfEhjzmmnujjxJTcRTauXJePu1g-uOCgOt4sWBmZo5RfczrGZmAl-Rud4GA', '2026-05-19 02:40:05'),
(20, 1, 'LiPC6UwU8bRwtlY--PJ0qUsAIOO_JJVGc19WmtwkAkQKFGvonYnl4Y2AtAw4GlBhnB_19cDoH2Lwh753N7QLCA', '2026-05-19 03:17:49'),
(21, 1, 'hoXHsFEoDu7bzpKfHgQkMgNUIxsm7szTmp_PnqpdHLLrP5yd7yWERJ9RbHqkwxRJw8PxOfQ5kVZyMhgXzqqHzQ', '2026-05-19 03:26:41'),
(22, 1, 'QMYXSTrupkQ8fn5uIh4u2Y3K2xNGw7X8JZjWPe2EzQIs__tCKyjQb4fSWoDwceqFkoYWrQmgJRteeUPghAblFQ', '2026-05-19 03:57:04'),
(23, 3, 'DSiq35JZdAxWKD6dHCmiMi-r9ehB-bZ6BTsCwJMqkK7kMwcxYE1IOjWmXYdqZIcQ6qLpCYmkhxxK7dYzEaAhQA', '2026-05-19 04:03:31'),
(24, 1, '8auOBzZaWWmVIO7UkikYQsnKmFx4CIr6lJ1xelPB48pw2pMoTlJ7Vs1wBU8ATtuIm7iyI4tsnx68-WFphwYLVw', '2026-05-19 04:27:08'),
(25, 1, 'PPLJPGxRqaPDeH6ASeIKu8TDol2i-AMHeLtgr-5_nxtmrzRkeQfFm815VezmInmxcmXvrYqF8IFcbwbGGnIy9Q', '2026-05-19 15:25:06'),
(26, 1, 'NEuT_up9brhAkwWPgP_9RP-qMieObyCdxUxDK52rv0xyYnSnarsI8W8VKbhh4qiQxE9JI4OwV6B52XH1s2Z5SQ', '2026-05-19 15:28:00'),
(27, 1, '1ub6qMamQJdHYGSM9Omyx2Q-pvKTD8gGi8AB9DBF3b__4027FGjbwbkf1l4nuu_DLKMkCcaW2sFoMzrCaQGJQQ', '2026-05-19 15:28:12'),
(28, 1, 'sx-kyrE6A3kmQqHn0mTpnbcB4E5pAXeZgTtMCF2-lh9lIOGLKJJskJ4LL25ypn7hSmkKgBkXNfiYbJncXhi-Rw', '2026-05-19 15:31:43'),
(29, 1, 'KnvR4BT_A8H45vIsVk36W-Mkl1fe3ok98pw6-_DRRwtN966XAegg8lhG8SY7T7gMC7pnnWRo-4Dqc07tuojm9Q', '2026-05-19 17:01:11');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefone` varchar(30) NOT NULL,
  `tipo` enum('cliente','funcionario','admin') DEFAULT 'cliente',
  `senha_hash` varchar(255) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `telefone`, `tipo`, `senha_hash`, `cpf`, `ativo`, `criado_em`) VALUES
(1, 'Pedro Nadalon Klippel', 'pnklippel@gmail.com', '(51) 99749-1810', 'admin', '$2b$12$jkj0xLkcicapMEyBNoNCYudMXz.8boYqnXXiKtzVrFKEm.5zfZH2S', '045.665.810-63', 1, '2026-04-17 16:51:57'),
(2, 'David Beta', 'david@gmail.com', '(19) 69696-9696', 'cliente', '$2b$12$Uzp4V/pyxrqm0ce6lqKrpu5aqioi8zro3V2Oyt1dRCRA9GT.WuQQK', '676.767.676-76', 1, '2026-04-19 00:59:51'),
(3, 'Livia Beta Alpha', 'livia@outlook.com', '(19) 12345-6789', 'cliente', '$2b$12$LFqcvhzTynIO4Z6JJKSKqO/54v7CCFiOOZ8MOO8fFs7MhFP9JhXNO', '414.141.414-14', 1, '2026-04-19 01:02:55'),
(4, 'Maruan Beta ', 'gragas.agiota@gmail.com', '(11) 11111-1111', 'cliente', '$2b$12$ip/JRCj1Qj3u8ylme/H5UeYWrd5DaBC05pHzeZMOuiyCpV3regs4W', '696.969.696-67', 1, '2026-04-19 01:32:10');

-- --------------------------------------------------------

--
-- Estrutura para tabela `variacoes`
--

CREATE TABLE `variacoes` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `tamanho` varchar(10) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `estoque` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `variacoes`
--

INSERT INTO `variacoes` (`id`, `produto_id`, `tamanho`, `sku`, `estoque`) VALUES
(18, 9, 'P', 'ANG-CAM-P', 10),
(19, 9, 'M', 'ANG-CAM-M', 15),
(20, 9, 'G', 'ANG-CAM-G', 4),
(21, 10, 'P', 'ARC-CAM-P', 10),
(22, 10, 'M', 'ARC-CAM-M', 15),
(23, 10, 'G', 'ARC-CAM-G', 4),
(24, 11, 'P', 'FAL-CAM-P', 10),
(25, 11, 'M', 'FAL-CAM-M', 15),
(26, 11, 'G', 'FAL-CAM-G', 4),
(27, 12, 'P', 'MYT-CAM-P', 10),
(28, 12, 'M', 'MYT-CAM-M', 15),
(29, 12, 'G', 'MYT-CAM-G', 4),
(30, 13, 'P', 'TDA-CAM-P', 10),
(31, 13, 'M', 'TDA-CAM-M', 15),
(32, 13, 'G', 'TDA-CAM-G', 4),
(33, 14, 'P', 'CJP-CAL-P', 8),
(34, 14, 'M', 'CJP-CAL-M', 12),
(35, 14, 'G', 'CJP-CAL-G', 3),
(36, 14, 'GG', 'CJP-CAL-GG', 0),
(37, 15, 'P', 'CJP-LIS-P', 8),
(38, 15, 'M', 'CJP-LIS-M', 12),
(39, 15, 'G', 'CJP-LIS-G', 3),
(40, 15, 'GG', 'CJP-LIS-GG', 0),
(41, 16, 'P', 'CJP-JEN-P', 8),
(42, 16, 'M', 'CJP-JEN-M', 12),
(43, 16, 'G', 'CJP-JEN-G', 3),
(44, 16, 'GG', 'CJP-JEN-GG', 0),
(45, 17, 'P', 'CJP-CAM-P', 8),
(46, 17, 'M', 'CJP-CAM-M', 12),
(47, 17, 'G', 'CJP-CAM-G', 3),
(48, 17, 'GG', 'CJP-CAM-GG', 0),
(49, 18, 'P', 'CJP-OVE-P', 8),
(50, 18, 'M', 'CJP-OVE-M', 12),
(51, 18, 'G', 'CJP-OVE-G', 3),
(52, 18, 'GG', 'CJP-OVE-GG', 0),
(53, 19, 'P', 'JKT-ACO-P', 8),
(54, 19, 'M', 'JKT-ACO-M', 12),
(55, 19, 'G', 'JKT-ACO-G', 3),
(56, 19, 'GG', 'JKT-ACO-GG', 0),
(57, 20, 'P', 'JKT-CV-P', 8),
(58, 20, 'M', 'JKT-CV-M', 12),
(59, 20, 'G', 'JKT-CV-G', 3),
(60, 20, 'GG', 'JKT-CV-GG', 0),
(61, 21, 'P', 'JKT-PUF-P', 5),
(62, 21, 'M', 'JKT-PUF-M', 8),
(63, 21, 'G', 'JKT-PUF-G', 10),
(64, 21, 'GG', 'JKT-PUF-GG', 2),
(65, 22, 'P', 'JKT-POL-P', 4),
(66, 22, 'M', 'JKT-POL-M', 6),
(67, 22, 'G', 'JKT-POL-G', 6),
(68, 22, 'GG', 'JKT-POL-GG', 3),
(69, 23, 'P', 'MOL-GAM-P', 10),
(70, 23, 'M', 'MOL-GAM-M', 15),
(71, 23, 'G', 'MOL-GAM-G', 10),
(72, 23, 'GG', 'MOL-GAM-GG', 5),
(73, 24, '39', 'TEN-QIX90-39', 5),
(74, 24, '40', 'TEN-QIX90-40', 8),
(75, 24, '41', 'TEN-QIX90-41', 10),
(76, 24, '42', 'TEN-QIX90-42', 4),
(77, 25, '38', 'TEN-TREK-38', 3),
(78, 25, '40', 'TEN-TREK-40', 6),
(79, 25, '42', 'TEN-TREK-42', 5),
(80, 25, '43', 'TEN-TREK-43', 2),
(81, 26, '39', 'TEN-PARK-39', 10),
(82, 26, '40', 'TEN-PARK-40', 12),
(83, 26, '41', 'TEN-PARK-41', 8),
(84, 26, '42', 'TEN-PARK-42', 5),
(85, 27, '38', 'TEN-TREK-BR-38', 4),
(86, 27, '40', 'TEN-TREK-BR-40', 7),
(87, 27, '41', 'TEN-TREK-BR-41', 6),
(88, 27, '42', 'TEN-TREK-BR-42', 3),
(89, 28, '39', 'TEN-QIXPRO-39', 4),
(90, 28, '40', 'TEN-QIXPRO-40', 5),
(91, 28, '41', 'TEN-QIXPRO-41', 5),
(92, 28, '42', 'TEN-QIXPRO-42', 2),
(105, 43, 'Único', 'BONE-PLAY-CH', 15),
(106, 44, 'Único', 'BONE-JEANS-DET', 10),
(107, 45, 'Único', 'BONE-QIX-LORD', 20),
(108, 46, 'Único', 'BONE-SUNSET-PURP', 12),
(109, 47, 'Único', 'BONE-CBJR-PRE', 25),
(110, 48, 'Único', 'KIT-PRATA-COR', 8),
(111, 49, 'Único', 'KIT-BRINCO-CRUZ', 30);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `carrinhos`
--
ALTER TABLE `carrinhos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`variacao_id`),
  ADD KEY `variacao_id` (`variacao_id`);

--
-- Índices de tabela `enderecos`
--
ALTER TABLE `enderecos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `favoritos`
--
ALTER TABLE `favoritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`produto_id`),
  ADD KEY `produto_id` (`produto_id`);

--
-- Índices de tabela `imagens_produto`
--
ALTER TABLE `imagens_produto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`);

--
-- Índices de tabela `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_id` (`pedido_id`),
  ADD KEY `variacao_id` (`variacao_id`);

--
-- Índices de tabela `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `endereco_entrega_id` (`endereco_entrega_id`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Índices de tabela `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices de tabela `variacoes`
--
ALTER TABLE `variacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `produto_id` (`produto_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `carrinhos`
--
ALTER TABLE `carrinhos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de tabela `enderecos`
--
ALTER TABLE `enderecos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `favoritos`
--
ALTER TABLE `favoritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de tabela `imagens_produto`
--
ALTER TABLE `imagens_produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT de tabela `itens_pedido`
--
ALTER TABLE `itens_pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de tabela `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `variacoes`
--
ALTER TABLE `variacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `carrinhos`
--
ALTER TABLE `carrinhos`
  ADD CONSTRAINT `carrinhos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `carrinhos_ibfk_2` FOREIGN KEY (`variacao_id`) REFERENCES `variacoes` (`id`);

--
-- Restrições para tabelas `enderecos`
--
ALTER TABLE `enderecos`
  ADD CONSTRAINT `enderecos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `favoritos`
--
ALTER TABLE `favoritos`
  ADD CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`);

--
-- Restrições para tabelas `imagens_produto`
--
ALTER TABLE `imagens_produto`
  ADD CONSTRAINT `imagens_produto_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`);

--
-- Restrições para tabelas `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD CONSTRAINT `itens_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  ADD CONSTRAINT `itens_pedido_ibfk_2` FOREIGN KEY (`variacao_id`) REFERENCES `variacoes` (`id`);

--
-- Restrições para tabelas `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`endereco_entrega_id`) REFERENCES `enderecos` (`id`);

--
-- Restrições para tabelas `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `variacoes`
--
ALTER TABLE `variacoes`
  ADD CONSTRAINT `variacoes_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
