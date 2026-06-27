-- ════════════════════════════════════════════════════════════
--  GR!TTA — Migração: Login com Google + Redefinição por código
--  Rode UMA vez no banco existente:
--    mysql -u root -p gritta_db < migracao_auth.sql
-- ════════════════════════════════════════════════════════════

-- usuarios: contas Google não têm senha nem (necessariamente) telefone
ALTER TABLE `usuarios` MODIFY `senha_hash` varchar(255) NULL;
ALTER TABLE `usuarios` MODIFY `telefone` varchar(30) NULL;
ALTER TABLE `usuarios` ADD COLUMN `provider` varchar(20) DEFAULT 'local';
ALTER TABLE `usuarios` ADD COLUMN `google_id` varchar(50) DEFAULT NULL;
ALTER TABLE `usuarios` ADD UNIQUE KEY `uniq_google_id` (`google_id`);

-- usuários que já existem são contas locais
UPDATE `usuarios` SET `provider` = 'local' WHERE `provider` IS NULL;

-- password_resets: limita tentativas do código (anti brute force)
ALTER TABLE `password_resets` ADD COLUMN `tentativas` int(11) DEFAULT 0;
