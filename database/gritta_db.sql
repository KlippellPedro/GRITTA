-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 02/07/2026 às 16:50
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
-- Estrutura para tabela `avaliacoes`
--

CREATE TABLE `avaliacoes` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nota` tinyint(4) NOT NULL,
  `comentario` text DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Estrutura para tabela `cupons`
--

CREATE TABLE `cupons` (
  `id` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `tipo` enum('percentual','fixo') NOT NULL DEFAULT 'percentual',
  `valor` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `validade` datetime DEFAULT NULL,
  `uso_maximo` int(11) DEFAULT NULL,
  `usos` int(11) DEFAULT 0,
  `valor_minimo` decimal(10,2) DEFAULT 0.00,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `cupons`
--

INSERT INTO `cupons` (`id`, `codigo`, `tipo`, `valor`, `ativo`, `validade`, `uso_maximo`, `usos`, `valor_minimo`, `criado_em`) VALUES
(1, 'ESTEREGG', 'percentual', 100.00, 1, '2030-01-17 12:00:00', 1, 0, 100.00, '2026-07-02 00:22:41'),
(2, 'BEMVINDO10', 'percentual', 10.00, 1, '2027-01-01 00:00:00', 1000, 0, 1000.00, '2026-07-02 00:23:36');

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
(5, 1, '91350130', 'Rua Bezerra de Menezes', '333', NULL, 'Passo da Areia', 'Porto Alegre', 'RS', 'Entrega'),
(6, 5, '123456789', 'casa do carai', '123', NULL, 'lá', 'aqui', 'kd', 'Entrega');

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
(11, 11, 'statics/img/roupas/camisas/oversized-fallen.webp', 0),
(12, 12, 'statics/img/roupas/camisas/oversized-myth.webp', 0),
(13, 13, 'statics/img/roupas/camisas/oversized-tdah.webp', 0),
(14, 14, 'statics/img/roupas/calcas/calca-reta-jeans-medio.webp', 0),
(15, 15, 'statics/img/roupas/calcas/calca-moletom-esportiva-listra.webp', 0),
(16, 16, 'statics/img/roupas/calcas/calca-oversized-cargo-em-jeans.webp', 0),
(19, 19, 'statics/img/roupas/moletons/jaqueta-acolchoada-estilo-camisa.webp', 0),
(21, 21, 'statics/img/roupas/moletons/jaqueta-box-puffer-preta-gola-alta.webp', 0),
(22, 22, 'statics/img/roupas/moletons/jaqueta-preta-poliuretano-capuz-moletom.webp', 0),
(23, 23, 'statics/img/roupas/moletons/moletom-boxy-gaming-squad.webp', 0),
(24, 24, 'statics/img/roupas/tenis/qix-90s-preto-e-branco.webp', 0),
(26, 26, 'statics/img/roupas/tenis/qix-park-preto.webp', 0),
(28, 28, 'statics/img/roupas/tenis/qix-90s-pro-series-william-damascena-branco.webp', 0),
(41, 43, 'statics/img/roupas/acessorios/bone-chumbo-play.webp', 0),
(42, 44, 'statics/img/roupas/acessorios/bone-jeans-destroyed-ilhoses.webp', 0),
(43, 45, 'statics/img/roupas/acessorios/bone-qix-lords-preto.webp', 0),
(45, 47, 'statics/img/roupas/acessorios/bone-cbjr-logo-preto.webp', 0),
(46, 48, 'statics/img/roupas/acessorios/conjunto-prateado-coracao.webp', 0),
(47, 49, 'statics/img/roupas/acessorios/kit-brincos-cruz.webp', 0),
(72, 74, 'statics/img/roupas/moletons/moletom-voidwalker-capuz.jpg', 0),
(73, 75, 'statics/img/roupas/moletons/moletom-deeptown-gola-polo.jpg', 0),
(74, 76, 'statics/img/roupas/moletons/moletom-sparkles-capuz.jpg', 0),
(75, 77, 'statics/img/roupas/moletons/casaco-americano-rift.jpg', 0),
(77, 79, 'statics/img/roupas/moletons/casaco-edge-gola-alta.jpg', 0),
(78, 80, 'statics/img/roupas/moletons/jaqueta-broid-peluciada-gola-alta.jpg', 0),
(79, 81, 'statics/img/roupas/moletons/jaqueta-young-you-puffer-capuz.jpg', 0),
(80, 82, 'statics/img/roupas/moletons/jaqueta-boston-veludo-gola-alta.jpg', 0),
(81, 83, 'statics/img/roupas/calcas/calca-baggy-fracture.jpg', 0),
(82, 84, 'statics/img/roupas/calcas/calca-baggy-jeans-blackform.jpg', 0),
(84, 86, 'statics/img/roupas/calcas/calca-cargo-jeans-details.jpg', 0),
(110, 98, 'statics/img/roupas/camisas/camiseta-feminina-oversized-made.webp', 0),
(111, 98, 'statics/img/roupas/camisas/camiseta-feminina-oversized-made-2.webp', 1),
(112, 99, 'statics/img/roupas/camisas/camiseta-masculina-oversized-smell.webp', 0),
(113, 99, 'statics/img/roupas/camisas/camiseta-masculina-oversized-smell-2.webp', 1),
(114, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto.webp', 0),
(115, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-2.webp', 1),
(116, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-3.webp', 2),
(117, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-4.webp', 3),
(118, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-5.webp', 4),
(119, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-6.webp', 5),
(120, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-7.webp', 6),
(121, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-8.webp', 7),
(135, 98, 'statics/img/roupas/camisas/camiseta-feminina-oversized-made.webp', 0),
(136, 98, 'statics/img/roupas/camisas/camiseta-feminina-oversized-made-2.webp', 1),
(137, 99, 'statics/img/roupas/camisas/camiseta-masculina-oversized-smell.webp', 0),
(138, 99, 'statics/img/roupas/camisas/camiseta-masculina-oversized-smell-2.webp', 1),
(139, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto.webp', 0),
(140, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-2.webp', 1),
(141, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-3.webp', 2),
(142, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-4.webp', 3),
(143, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-5.webp', 4),
(144, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-6.webp', 5),
(145, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-7.webp', 6),
(146, 100, 'statics/img/roupas/moletons/jaqueta-asteric-peluciado-gola-alta-preto-8.webp', 7),
(160, 46, 'img/roupas/acessorios/bone-chorao-sunset-purple.webp', 0),
(161, 25, 'img/roupas/tenis/qix-trek-urban-hiking-branco.webp', 0),
(163, 17, 'img/roupas/calcas/calca-sarja-baggy-cargo-camuflada.webp', 0),
(164, 10, 'img/roupas/camisas/oversized-archangel.webp', 0),
(165, 73, 'img/roupas/moletons/moletom-nightfall-capuz.jpg', 0),
(166, 78, 'img/roupas/moletons/casaco-houndrise-capuz.jpg', 0),
(167, 85, 'img/roupas/calcas/calca-reta-spider-web.jpg', 0),
(168, 102, 'img/roupas/tenis/tenis-sneaker-haze-poom.webp', 0),
(169, 102, 'img/roupas/tenis/tenis-sneaker-haze-poom-2.webp', 1),
(170, 102, 'img/roupas/tenis/tenis-sneaker-haze-poom-3.webp', 2),
(171, 101, 'img/roupas/moletons/jaqueta-zipada-knight.webp', 0),
(172, 101, 'img/roupas/moletons/jaqueta-zipada-knight.webp', 1),
(173, 101, 'img/roupas/moletons/jaqueta-zipada-knight-2.webp', 2),
(174, 101, 'img/roupas/moletons/jaqueta-zipada-knight-2.webp', 3),
(179, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire.webp', 0),
(180, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire.webp', 1),
(181, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire-2.webp', 2),
(182, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire-2.webp', 3),
(183, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire-3.webp', 4),
(184, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire-3.webp', 5),
(185, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire-4.webp', 6),
(186, 103, 'img/roupas/tenis/tenis-sneaker-preto-dark-fire-4.webp', 7),
(187, 27, 'img/roupas/tenis/qix-and-kings-trek-galeria.webp', 0),
(188, 20, 'img/roupas/moletons/jaqueta-box-corta-vento-esportiva.webp', 0),
(189, 18, 'img/roupas/calcas/calca-sarja-oversized-cargo.webp', 0),
(194, 111, 'img/roupas/tenis/tenis-sneaker-bradok-fitch.webp', 0),
(195, 111, 'img/roupas/tenis/tenis-sneaker-bradok-fitch-2.webp', 1),
(196, 111, 'img/roupas/tenis/tenis-sneaker-bradok-fitch-3.webp', 2),
(197, 111, 'img/roupas/tenis/tenis-sneaker-bradok-fitch-4.webp', 3);

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

--
-- Despejando dados para a tabela `itens_pedido`
--

INSERT INTO `itens_pedido` (`id`, `pedido_id`, `variacao_id`, `quantidade`, `preco_unitario`) VALUES
(10, 9, 77, 1, 349.90),
(11, 10, 51, 1, 219.90),
(12, 11, 86, 1, 329.90);

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes`
--

CREATE TABLE `notificacoes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensagem` text DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `lida` tinyint(1) DEFAULT 0,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `notificacoes`
--

INSERT INTO `notificacoes` (`id`, `usuario_id`, `titulo`, `mensagem`, `link`, `lida`, `criado_em`) VALUES
(1, 1, 'Pedido confirmado!', 'Seu pedido #9 foi confirmado e já está sendo preparado. Acompanhe em Meus Pedidos.', 'pedidos.html', 1, '2026-07-01 09:45:22'),
(2, 5, 'Pedido confirmado!', 'Seu pedido #10 foi confirmado e já está sendo preparado. Acompanhe em Meus Pedidos.', 'pedidos.html', 0, '2026-07-02 11:15:29'),
(3, 1, 'Pedido confirmado!', 'Seu pedido #11 foi confirmado e já está sendo preparado. Acompanhe em Meus Pedidos.', 'pedidos.html', 1, '2026-07-02 11:16:17');

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiracao` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `tentativas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `password_resets`
--

INSERT INTO `password_resets` (`id`, `usuario_id`, `token`, `expiracao`, `usado`, `tentativas`) VALUES
(1, 1, 'DW1JAnD3F8olXwTVuxe3juROyLir0thq8R7XWb0ilqo', '2026-04-17 19:04:32', 1, 0),
(2, 1, 'vPfGn89XOOgd7cL5pQj_DHkeoEl89WD6Eil4xhCYzEg', '2026-04-17 23:16:45', 1, 0),
(3, 1, '$2b$12$LWkWfuwz64dUAFJmVhcpx.gL2yyM/2J8RKgbOlJeWTDlwq8sD4aF6', '2026-07-01 09:13:37', 1, 0);

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

--
-- Despejando dados para a tabela `pedidos`
--

INSERT INTO `pedidos` (`id`, `usuario_id`, `endereco_entrega_id`, `codigo_rastreio`, `status`, `total_pedido`, `criado_em`) VALUES
(9, 1, 5, NULL, 'Pago', 371.80, '2026-07-01 09:45:22'),
(10, 5, 6, NULL, 'Pago', 219.90, '2026-07-02 11:15:29'),
(11, 1, 5, NULL, 'Pago', 351.80, '2026-07-02 11:16:17');

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
  `tipo` enum('moletom','calca','acessorio','camisa','tenis','jaqueta') DEFAULT 'camisa',
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
(10, 'Camiseta Oversized Archangel', 'camiseta-oversized-archangel', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(11, 'Camiseta Oversized Fallen', 'camiseta-oversized-fallen', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(12, 'Camiseta Oversized Myth', 'camiseta-oversized-myth', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(13, 'Camiseta Oversized TDAH', 'camiseta-oversized-tdah', 'Estampa exclusiva em silk screen, 100% algodão premium.', 99.90, 'camisa', 1, '2026-04-19 15:09:13', 'Coleção Oversized', 0),
(14, 'Calça Reta Jeans Médio', 'calca-reta-jeans-medio', 'calça em jeans médio com modelagem reta, sendo estilosa e versátil. com fechamento em zíper + botão, com bolsos.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Urbana', 0),
(15, 'Calça Moletom Esportiva Listrada', 'calca-moletom-esportiva-listrada', 'calça em moletom preto, no estilo esportivo, com listra branca nas laterais, cós com elástico e amarração, caimento larguinho e bolsos laterais e traseiro.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção de Inverno', 0),
(16, 'Calça Oversize Cargo Em Jeans', 'calca-oversize-cargo-em-jeans', 'calça jeans com bolsos cargo e modelagem oversized, ficando com caimento amplo nas pernas. em jeans com desfiados nos acabamentos e lavagem \"dirty\", que traz uma tonalidade vintage pra peça.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 0),
(17, 'Calça Sarja Baggy Cargo Camuflado', 'calca-serja-baggy-cargo-camuflado', 'calça em sarja camuflada com bolsos cargo nas laterais e modelagem baggy, que começa mais soltinha nas pernas e vai se ajustando na barra.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 0),
(18, 'Calça Sarja Oversized Cargo', 'calca-sarja-oversized-cargo', 'calça em sarja preta com quatro bolsos cargo grandes, dois deles com zíper. modelagem oversized, ficando com caimento amplo nas pernas.', 219.90, 'calca', 1, '2026-04-19 15:29:00', 'Coleção Inverno', 1),
(19, 'Jaqueta Acolchoada Estilo Camisa', 'jaqueta-acolchoada-estilo-camisa', 'jaqueta marrom acolchoada, com bolsos frontais e fechamento em botões de pressão. modelo overshirt, tendo o fit parecido com o de uma camisa.', 219.90, 'jaqueta', 1, '2026-04-19 15:51:52', 'Coleção de Inverno', 0),
(20, 'Jaqueta Box Corta Vento Esportiva', 'jaqueta-box-corta-vento', 'jaqueta preta estilo corta vento, com mangas e laterais em branco, estampa esportiva, fechamento em zíper e gola alta. na modelagem box, que tem o caimento mais \"quadrado\".', 219.90, 'jaqueta', 1, '2026-04-19 15:51:52', 'Coleção de Inverno', 1),
(21, 'Jaqueta Box Puffer Preta Gola Alta', 'jaqueta-box-puffer-preta', 'jaqueta puffer em poliuretano, com \"gomos\" acolchoados, ribana nos pulsos e barra e modelagem box.', 349.90, 'jaqueta', 1, '2026-04-19 15:51:52', 'Coleção de Inverno', 0),
(22, 'Jaqueta Preta Poliuretano Capuz Moletom', 'jaqueta-preta-poliuretano-capuz', 'jaqueta estilo bomber, na modelagem box, que fica com o caimento mais quadrado. em poliuretano preto, tecido sintético que lembra couro, com capuz em moletom, barra e pulsos ajustados.', 289.90, 'jaqueta', 1, '2026-04-19 15:51:52', 'Coleção Inverno', 0),
(23, 'Moletom Boxy Gaming Squad', 'moletom-boxy-gaming-squad', 'Hoodie oversized com estampa digital futurista nas costas. Conforto pesado com caimento estruturado e urbano.', 219.90, 'moletom', 1, '2026-04-19 15:51:52', 'Coleção Inverno', 0),
(24, 'Qix 90s - Preto e Branco', 'tenis-qix-90s-preto-branco', 'Aqui, o que importa não é aparência perfeita, é identidade. É rua, é estilo próprio, é viver do seu jeito. Um verdadeiro tênis pra quem carrega a essência do skate no dia a dia.', 299.90, 'tenis', 0, '2026-04-19 16:06:04', 'Coleção Urbana', 0),
(25, 'Qix And Kings Trek Galeria', 'tenis-qix-kings-trek-galeria', 'Mais do que um tênis, é uma afirmação de estilo pra quem vive a rua intensamente. O Galeria reforça essa união com atitude, identidade e um visual que não passa despercebido nesta edição exclusiva e limitada.', 349.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Inverno', 0),
(26, 'Qix Park - Preto', 'tenis-qix-park-preto', 'Se você cresceu ouvindo Charlie Brown Jr., sabe que cada letra tinha peso, verdade e rua. Esse tênis segue a mesma linha. É sobre expressão, liberdade e identidade no lifestyle urbano.', 279.90, 'tenis', 0, '2026-04-19 16:06:04', 'Coleção Inverno', 0),
(27, 'Qix Trek Urban Hiking - Branco', 'tenis-qix-trek-urban-hiking-branco', 'Com design robusto e moderno, ele é feito pra quem vive o corre diário e quer um calçado que acompanhe do rolê ao lifestyle, sempre com conforto e autenticidade. Um tênis pensado pra quem vive sem rótulos.', 329.90, 'tenis', 1, '2026-04-19 16:06:04', 'Coleção Inverno', 1),
(28, 'Qix 90s Pro Series William Damascena - Branco', 'tenis-qix-90s-pro-william-damascena', 'O Tênis Qix 90s Pro Series William Damascena - Branco, com o estilo dos pisantes clássicos dos anos 90, reforçando o que Qix faz de melhor, ele une estilo e resistência para todos os momentos. Apresenta o logotipo da marca na lateral, calcanhar e palmilha.', 389.90, 'tenis', 0, '2026-04-19 16:06:04', 'Coleção Inverno', 0),
(43, 'Boné Chumbo Play - Estilo Câmera', 'bone-chumbo-play-camera', 'Boné em tom chumbo com bordados inspirados em interface de gravação de vídeo.', 89.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(44, 'Boné Jeans Destroyed com Ilhoses', 'bone-jeans-destroyed-ilhoses', 'Boné em jeans com lavagem estonada, detalhes desfiados e ilhoses metálicos.', 99.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(45, 'Boné Qix Aba Reta The Lords Skateboarding', 'bone-qix-the-lords-preto', 'O clássico aba reta da Qix, com bordado cursivo The Lords Skateboarding.', 119.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Inverno', 0),
(46, 'Boné Snapback Chorão Sunset House - Roxo', 'bone-snapback-chorao-sunset-purple', 'Homenagem ao ícone Chorão, modelo Sunset House na cor roxa com bordados especiais.', 129.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Especial', 0),
(47, 'Boné Snapback Charlie Brown Jr. Logo', 'bone-snapback-charlie-brown-jr-preto', 'Boné oficial Charlie Brown Jr. com o clássico logo bordado em branco.', 129.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Especial', 0),
(48, 'Conjunto Corrente e Pulseira Prateado', 'conjunto-colar-pulseira-prateado', 'Kit de acessórios em banho prateado com elos trabalhados e pingente de coração.', 79.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(49, 'Kit 3 Brincos Argola e Cruz', 'kit-3-brincos-argola-cruz', 'Mix de brincos prateados contendo argolas lisas e pingente de cruz.', 49.90, 'acessorio', 1, '2026-04-19 16:26:33', 'Coleção Urbana', 0),
(73, 'Moletom Nightfall com Capuz', 'moletom-nightfall-capuz', 'Frio vira inimigo. Capuz largo, costuras reforçadas, tecido pesado que não pede desculpa. Preto absoluto do gola à barra.', 249.90, 'moletom', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(74, 'Moletom Voidwalker com Capuz', 'moletom-voidwalker-capuz', 'Caimento oversize que some no próprio peso. Fit amplo nas costas, ribana ajustada nos pulsos. Você some no tecido, mas não passa despercebido.', 249.90, 'moletom', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(75, 'Moletom Deeptown Gola Polo', 'moletom-deeptown-gola-polo', 'Gola polo em moletom: quente onde precisa, sem abrir mão do look. Fit estruturado, cor única, sem bordado.', 239.90, 'moletom', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(76, 'Moletom Sparkles com Capuz', 'moletom-sparkles-capuz', 'Off-white sujo com textura tonal no tecido. Pesado, fluído, vira peça-chave em qualquer combinação escura.', 259.90, 'moletom', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(77, 'Casaco Americano Rift', 'casaco-americano-rift', 'Corte varsity desconstruído. Listras laterais sem cor, detalhes rasgados nos punhos. Escola americana nunca pareceu tão sombria.', 349.90, 'jaqueta', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(78, 'Casaco Houndrise com Capuz', 'casaco-houndrise-capuz', 'Casaco de pluma leve com capuz ajustável. Silhueta oversized que mantém o calor sem travar o movimento. Black on black, sem logo visível.', 399.90, 'jaqueta', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(79, 'Casaco Edge Gola Alta', 'casaco-edge-gola-alta', 'Gola alta que esconde o queixo. Tecido rígido, quase couro — mas respira. Aberto revela a camada de dentro. Fechado some na cidade.', 329.90, 'jaqueta', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(80, 'Jaqueta Broid Peluciada Gola Alta', 'jaqueta-broid-peluciada-gola-alta', 'Pelúcia técnica no lado de dentro, exterior com textura agressiva. Gola alta que cobre o pescoço inteiro. Bordado interno na etiqueta. Só isso.', 449.90, 'jaqueta', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(81, 'Jaqueta Young You Puffer com Capuz', 'jaqueta-young-you-puffer-capuz', 'Gomos acolchoados que pesam menos do que parecem. Capuz removível, fecho central, sem reflexo. Silhueta puffer sem o volume exagerado dos anos 2000.', 389.90, 'jaqueta', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(82, 'Jaqueta Boston Veludo Gola Alta', 'jaqueta-boston-veludo-gola-alta', 'Veludo técnico que escurece com o toque. Gola alta estruturada, manga longa com ribana fina. Peça que só melhora com o uso.', 369.90, 'jaqueta', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(83, 'Calça Baggy Fracture', 'calca-baggy-fracture', 'Couro sintético preto, corte baggy com leve afunilamento na barra. Quatro bolsos, fechamento oculto. Não é pra sentar confortável — é pra ser visto de longe.', 299.90, 'calca', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(84, 'Calça Baggy Jeans Blackform', 'calca-baggy-jeans-blackform', 'Jeans overdye escuro quase preto. Baggy com queda natural no joelho, levemente afunilado no tornozelo. Lavagem discreta que some na escuridão.', 259.90, 'calca', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(85, 'Calça Reta Spider Web', 'calca-reta-spider-web', 'Jeans preto reta com bordado de teia na lateral esquerda. Sem rasgado, sem desgaste — o detalhe faz tudo.', 249.90, 'calca', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(86, 'Calça Cargo Jeans Details', 'calca-cargo-jeans-details', 'Cargo em jeans azul-escuro lavagem vintage. Quatro bolsos laterais, dois com zíper oculto. Baggy sem ser frouxo — cada volume tem razão de ser.', 279.90, 'calca', 0, '2026-07-01 04:02:13', 'Winter is Coming', 0),
(98, 'Camiseta Feminina Oversized Made', 'camiseta-feminina-oversized-made', 'Camiseta oversized feminina com modelagem ampla e caimento perfeito. Algod??o premium.', 99.90, 'camisa', 1, '2026-07-01 20:34:50', NULL, 0),
(99, 'Camiseta Masculina Oversized Smell', 'camiseta-masculina-oversized-smell', 'Camiseta oversized masculina streetwear. Tecido pesado, caimento relaxado.', 99.90, 'camisa', 1, '2026-07-01 20:34:50', NULL, 0),
(100, 'Jaqueta Asteric Pel??cia Gola Alta Preto', 'jaqueta-asteric-peluciado-gola-alta-preto', 'Jaqueta de pel??cia felpuda com gola alta estruturada. Bordado Asteric. Quente e brutal.', 299.90, 'jaqueta', 1, '2026-07-01 20:34:50', 'Coleção de Inverno', 0),
(101, 'Jaqueta Zipada Knight', 'jaqueta-zipada-knight', 'Jaqueta com z??per frontal full-length e identidade Knight. Acabamento t??tico.', 249.90, 'jaqueta', 1, '2026-07-01 20:34:50', 'Coleção de Inverno', 1),
(102, 'T??nis Sneaker Haze Poom', 'tenis-sneaker-haze-poom', 'Sneaker chunky com solado thick e paleta nebulosa. Edi????o Haze ?? Poom.', 199.90, 'tenis', 1, '2026-07-01 20:34:50', NULL, 1),
(103, 'T??nis Sneaker Preto Dark Fire', 'tenis-sneaker-preto-dark-fire', 'Sneaker all-black com detalhes em chamas. Solado robusto, visual noturno.', 199.90, 'tenis', 1, '2026-07-01 20:34:50', NULL, 1),
(111, 'Ténis Sneaker Bradok Fitch', 'tenis-sneaker-bradok-fitch', 'Sneaker Bradok série Fitch. Construção robusta, visual clean-minimal.', 219.90, 'tenis', 1, '2026-07-01 21:04:37', 'Coleção de Inverno', 1);

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
(29, 1, 'KnvR4BT_A8H45vIsVk36W-Mkl1fe3ok98pw6-_DRRwtN966XAegg8lhG8SY7T7gMC7pnnWRo-4Dqc07tuojm9Q', '2026-05-19 17:01:11'),
(30, 1, 'njkQ7Xo4qALpGrYitCI3zgpY5acGKGRLpdrbXyw0qwYNapFBNkhu-o7H3O5yIyny5fAGJRq3F7hp3yHFKnQFeA', '2026-07-31 11:59:12'),
(31, 1, 'gqAbJoOGLLcUAQCPiAxDgtdVJkX2pUD5p9zpEikwd4NFtuNCLJZkE6Kd7rTNpo2db6TkLRNBxgFv24nm9ew7Hg', '2026-07-31 23:37:31'),
(32, 1, 'Q7fjgj9YCPeHGjVEY9imH1s9rDJ-VDz88YvqmID0GPWJkG18w_E3eSAbhU5fT-oet1VjxGU6jXjuZEciBzIqpw', '2026-08-01 02:52:58'),
(33, 1, 'Ys0rFKRA1f512lGedji3EU5-9FMyXV1e88kKEQBrns_RRBePaq8tEdREO73DTTsX_IuaBmuUHYWbLMVd_abStw', '2026-08-01 12:48:17'),
(34, 1, 'B2Hd7KhHUOu9QCpQhe0iEaEq6cmfDtjkqCs0POSVYp2sAeptswTS6QTdedOepaDgV2XQiTXRevCZt3pJ4aLC5g', '2026-08-01 14:07:18'),
(35, 5, 'ctGXiAbj4QmPW73wtlVQttHmMrRGU5N59i8RULRQwZhFslZMvnmL9jTQNaEPrDJAscenv6WwtnoQeDYGZ53VPg', '2026-08-01 14:10:44'),
(36, 1, 'YiBZb-I5hjTPfS_c69dnWK4BW6Eu_lsdooWUvoY6I6W70Z4VMLF9wAn_4syj1WsdZtwQrMuxBetF58t2B-R6pQ', '2026-08-01 14:16:02');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `tipo` enum('cliente','funcionario','admin') DEFAULT 'cliente',
  `senha_hash` varchar(255) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `provider` varchar(20) DEFAULT 'local',
  `google_id` varchar(50) DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `telefone`, `tipo`, `senha_hash`, `cpf`, `ativo`, `provider`, `google_id`, `criado_em`) VALUES
(1, 'Pedro Nadalon Klippel', 'pnklippel@gmail.com', '(51) 99749-1810', 'admin', '$2b$12$PeDMMHW6KxucrMKfRMsFJ.fZ1f.ehHkAEpOJwySFOx/vDFFmOQdBK', '045.665.810-63', 1, 'local', NULL, '2026-04-17 16:51:57'),
(2, 'David Beta', 'david@gmail.com', '(19) 69696-9696', 'cliente', '$2b$12$Uzp4V/pyxrqm0ce6lqKrpu5aqioi8zro3V2Oyt1dRCRA9GT.WuQQK', '676.767.676-76', 1, 'local', NULL, '2026-04-19 00:59:51'),
(3, 'Livia Beta Alpha', 'livia@outlook.com', '(19) 12345-6789', 'cliente', '$2b$12$LFqcvhzTynIO4Z6JJKSKqO/54v7CCFiOOZ8MOO8fFs7MhFP9JhXNO', '414.141.414-14', 1, 'local', NULL, '2026-04-19 01:02:55'),
(4, 'Maruan Beta ', 'gragas.agiota@gmail.com', '(11) 11111-1111', 'cliente', '$2b$12$ip/JRCj1Qj3u8ylme/H5UeYWrd5DaBC05pHzeZMOuiyCpV3regs4W', '696.969.696-67', 1, 'local', NULL, '2026-04-19 01:32:10'),
(5, 'o cara', 'nigger@gmail.com', '(51) 4002-8922', 'cliente', '$2b$12$CB5aK9WMMasq37u5qDcpV.UEfWpHqig.NiTyZn8BpysXrrw3livaG', '999.999.999-99', 1, 'local', NULL, '2026-07-02 11:10:23');

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
(51, 18, 'G', 'CJP-OVE-G', 2),
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
(77, 25, '38', 'TEN-TREK-38', 2),
(78, 25, '40', 'TEN-TREK-40', 6),
(79, 25, '42', 'TEN-TREK-42', 5),
(80, 25, '43', 'TEN-TREK-43', 2),
(81, 26, '39', 'TEN-PARK-39', 10),
(82, 26, '40', 'TEN-PARK-40', 12),
(83, 26, '41', 'TEN-PARK-41', 8),
(84, 26, '42', 'TEN-PARK-42', 5),
(85, 27, '38', 'TEN-TREK-BR-38', 4),
(86, 27, '40', 'TEN-TREK-BR-40', 6),
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
(111, 49, 'Único', 'KIT-BRINCO-CRUZ', 30),
(217, 73, 'P', 'MOL-NGT-P', 8),
(218, 73, 'M', 'MOL-NGT-M', 12),
(219, 73, 'G', 'MOL-NGT-G', 10),
(220, 73, 'GG', 'MOL-NGT-GG', 4),
(221, 74, 'P', 'MOL-VWK-P', 8),
(222, 74, 'M', 'MOL-VWK-M', 12),
(223, 74, 'G', 'MOL-VWK-G', 8),
(224, 74, 'GG', 'MOL-VWK-GG', 4),
(225, 75, 'P', 'MOL-DPT-P', 6),
(226, 75, 'M', 'MOL-DPT-M', 10),
(227, 75, 'G', 'MOL-DPT-G', 8),
(228, 75, 'GG', 'MOL-DPT-GG', 3),
(229, 76, 'P', 'MOL-SPK-P', 5),
(230, 76, 'M', 'MOL-SPK-M', 8),
(231, 76, 'G', 'MOL-SPK-G', 6),
(232, 76, 'GG', 'MOL-SPK-GG', 2),
(233, 77, 'P', 'CSC-RFT-P', 5),
(234, 77, 'M', 'CSC-RFT-M', 8),
(235, 77, 'G', 'CSC-RFT-G', 8),
(236, 77, 'GG', 'CSC-RFT-GG', 3),
(237, 78, 'P', 'CSC-HRS-P', 4),
(238, 78, 'M', 'CSC-HRS-M', 6),
(239, 78, 'G', 'CSC-HRS-G', 6),
(240, 78, 'GG', 'CSC-HRS-GG', 2),
(241, 79, 'P', 'CSC-EDG-P', 5),
(242, 79, 'M', 'CSC-EDG-M', 8),
(243, 79, 'G', 'CSC-EDG-G', 7),
(244, 79, 'GG', 'CSC-EDG-GG', 3),
(245, 80, 'P', 'JKT-BRD-P', 3),
(246, 80, 'M', 'JKT-BRD-M', 6),
(247, 80, 'G', 'JKT-BRD-G', 5),
(248, 80, 'GG', 'JKT-BRD-GG', 2),
(249, 81, 'P', 'JKT-YYU-P', 4),
(250, 81, 'M', 'JKT-YYU-M', 7),
(251, 81, 'G', 'JKT-YYU-G', 6),
(252, 81, 'GG', 'JKT-YYU-GG', 2),
(253, 82, 'P', 'JKT-BST-P', 4),
(254, 82, 'M', 'JKT-BST-M', 6),
(255, 82, 'G', 'JKT-BST-G', 5),
(256, 82, 'GG', 'JKT-BST-GG', 2),
(257, 83, 'P', 'CAL-FRC-P', 5),
(258, 83, 'M', 'CAL-FRC-M', 8),
(259, 83, 'G', 'CAL-FRC-G', 6),
(260, 83, 'GG', 'CAL-FRC-GG', 2),
(261, 84, 'P', 'CAL-BLK-P', 6),
(262, 84, 'M', 'CAL-BLK-M', 10),
(263, 84, 'G', 'CAL-BLK-G', 8),
(264, 84, 'GG', 'CAL-BLK-GG', 3),
(265, 85, 'P', 'CAL-SPW-P', 5),
(266, 85, 'M', 'CAL-SPW-M', 8),
(267, 85, 'G', 'CAL-SPW-G', 7),
(268, 85, 'GG', 'CAL-SPW-GG', 2),
(269, 86, 'P', 'CAL-DET-P', 5),
(270, 86, 'M', 'CAL-DET-M', 8),
(271, 86, 'G', 'CAL-DET-G', 7),
(272, 86, 'GG', 'CAL-DET-GG', 3),
(321, 98, 'P', 'CAM-FMADE-P', 15),
(322, 98, 'M', 'CAM-FMADE-M', 20),
(323, 98, 'G', 'CAM-FMADE-G', 15),
(324, 98, 'GG', 'CAM-FMADE-GG', 10),
(325, 99, 'P', 'CAM-MSMELL-P', 10),
(326, 99, 'M', 'CAM-MSMELL-M', 20),
(327, 99, 'G', 'CAM-MSMELL-G', 20),
(328, 99, 'GG', 'CAM-MSMELL-GG', 10),
(329, 100, 'P', 'MOL-ASTERIC-P', 8),
(330, 100, 'M', 'MOL-ASTERIC-M', 12),
(331, 100, 'G', 'MOL-ASTERIC-G', 12),
(332, 100, 'GG', 'MOL-ASTERIC-GG', 8),
(333, 101, 'P', 'MOL-KNIGHT-P', 10),
(334, 101, 'M', 'MOL-KNIGHT-M', 15),
(335, 101, 'G', 'MOL-KNIGHT-G', 15),
(336, 101, 'GG', 'MOL-KNIGHT-GG', 10),
(337, 102, '38', 'TEN-HAZE-38', 6),
(338, 102, '39', 'TEN-HAZE-39', 8),
(339, 102, '40', 'TEN-HAZE-40', 10),
(340, 102, '41', 'TEN-HAZE-41', 10),
(341, 102, '42', 'TEN-HAZE-42', 8),
(342, 102, '43', 'TEN-HAZE-43', 6),
(343, 103, '38', 'TEN-DFIRE-38', 5),
(344, 103, '39', 'TEN-DFIRE-39', 8),
(345, 103, '40', 'TEN-DFIRE-40', 10),
(346, 103, '41', 'TEN-DFIRE-41', 10),
(347, 103, '42', 'TEN-DFIRE-42', 8),
(348, 103, '43', 'TEN-DFIRE-43', 5),
(383, 111, '38', 'TEN-FITCH-38', 6),
(384, 111, '39', 'TEN-FITCH-39', 8),
(385, 111, '40', 'TEN-FITCH-40', 10),
(386, 111, '41', 'TEN-FITCH-41', 10),
(387, 111, '42', 'TEN-FITCH-42', 8),
(388, 111, '43', 'TEN-FITCH-43', 6);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_prod` (`produto_id`,`usuario_id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `carrinhos`
--
ALTER TABLE `carrinhos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`variacao_id`),
  ADD KEY `variacao_id` (`variacao_id`);

--
-- Índices de tabela `cupons`
--
ALTER TABLE `cupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

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
-- Índices de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

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
-- AUTO_INCREMENT de tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `carrinhos`
--
ALTER TABLE `carrinhos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de tabela `cupons`
--
ALTER TABLE `cupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `enderecos`
--
ALTER TABLE `enderecos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `favoritos`
--
ALTER TABLE `favoritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de tabela `imagens_produto`
--
ALTER TABLE `imagens_produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=198;

--
-- AUTO_INCREMENT de tabela `itens_pedido`
--
ALTER TABLE `itens_pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- AUTO_INCREMENT de tabela `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `variacoes`
--
ALTER TABLE `variacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=389;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `avaliacoes`
--
ALTER TABLE `avaliacoes`
  ADD CONSTRAINT `avaliacoes_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`),
  ADD CONSTRAINT `avaliacoes_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

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
-- Restrições para tabelas `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD CONSTRAINT `notificacoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

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
