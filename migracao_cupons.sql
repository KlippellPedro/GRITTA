-- Migração: tabela de cupons de desconto (GR!TTA)
-- Rode uma vez num banco gritta_db já existente.

USE gritta_db;

CREATE TABLE IF NOT EXISTS `cupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `tipo` enum('percentual','fixo') NOT NULL DEFAULT 'percentual',
  `valor` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `validade` datetime DEFAULT NULL,
  `uso_maximo` int(11) DEFAULT NULL,
  `usos` int(11) DEFAULT 0,
  `valor_minimo` decimal(10,2) DEFAULT 0,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
