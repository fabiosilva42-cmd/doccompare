
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `analise_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analise_itens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comparacao_item_id` bigint unsigned NOT NULL,
  `campo` varchar(255) NOT NULL,
  `valor_esperado` text,
  `valor_encontrado` text,
  `status` enum('ok','warning','critical','nao_verificavel') NOT NULL DEFAULT 'ok',
  `observacao` text,
  `thumbnail_url` text,
  `aprovado_por` bigint unsigned DEFAULT NULL,
  `aprovado_em` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `analise_itens_comparacao_item_id_comparacao_itens_id_fk` (`comparacao_item_id`),
  CONSTRAINT `analise_itens_comparacao_item_id_comparacao_itens_id_fk` FOREIGN KEY (`comparacao_item_id`) REFERENCES `comparacao_itens` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `comparacao_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comparacao_itens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comparacao_id` bigint unsigned NOT NULL,
  `tipo_embalagem` enum('barcode_label','color_box','master_carton') NOT NULL,
  `status` enum('pendente','aprovado','reprovado','parcial') NOT NULL DEFAULT 'pendente',
  `resumo_executivo` text,
  `secoes` json DEFAULT NULL,
  `tabela_comparativa` json DEFAULT NULL,
  `tokens_entrada` int DEFAULT NULL,
  `tokens_saida` int DEFAULT NULL,
  `tempo_processamento` int DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `aprovado_por` bigint unsigned DEFAULT NULL,
  `aprovado_em` timestamp NULL DEFAULT NULL,
  `observacao_aprovacao` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `comparacao_itens_comparacao_id_comparacoes_id_fk` (`comparacao_id`),
  CONSTRAINT `comparacao_itens_comparacao_id_comparacoes_id_fk` FOREIGN KEY (`comparacao_id`) REFERENCES `comparacoes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `comparacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comparacoes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `pedido_id` bigint unsigned NOT NULL,
  `versao` int NOT NULL DEFAULT '1',
  `departamento` enum('atendimento','design','cq') NOT NULL,
  `prompt_id` bigint unsigned NOT NULL,
  `status` enum('pendente','processando','concluido','erro') NOT NULL DEFAULT 'pendente',
  `mensagem_erro` text,
  `tokens_entrada` int DEFAULT NULL,
  `tokens_saida` int DEFAULT NULL,
  `tempo_processamento` int DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `comparacoes_uuid_unique` (`uuid`),
  KEY `comparacoes_pedido_id_pedidos_id_fk` (`pedido_id`),
  KEY `comparacoes_prompt_id_prompts_id_fk` (`prompt_id`),
  CONSTRAINT `comparacoes_pedido_id_pedidos_id_fk` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `comparacoes_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `divergencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `divergencias` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comparacao_item_id` bigint unsigned NOT NULL,
  `tipo` enum('falso_positivo','falso_negativo') NOT NULL,
  `descricao_humano` text NOT NULL,
  `descricao_ia` text,
  `campo_afetado` varchar(255) DEFAULT NULL,
  `resolvido` tinyint(1) NOT NULL DEFAULT '0',
  `resolvido_por` bigint unsigned DEFAULT NULL,
  `resolvido_em` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `divergencias_comparacao_item_id_comparacao_itens_id_fk` (`comparacao_item_id`),
  CONSTRAINT `divergencias_comparacao_item_id_comparacao_itens_id_fk` FOREIGN KEY (`comparacao_item_id`) REFERENCES `comparacao_itens` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint unsigned NOT NULL,
  `comparacao_id` bigint unsigned DEFAULT NULL,
  `tipo_documento` enum('order_details','foto','die_cut','briefing','artwork','contraprova','relatorio_inspecao','packing_list','commercial_invoice','bill_of_lading','outro') NOT NULL DEFAULT 'outro',
  `tipo_embalagem` enum('barcode_label','color_box','master_carton','nao_aplicavel') NOT NULL DEFAULT 'nao_aplicavel',
  `nome_original` varchar(255) NOT NULL,
  `nome_armazenado` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `tamanho_bytes` bigint NOT NULL,
  `conteudo_extraido` text,
  `conteudo_ocr` text,
  `ordem` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `s3_key` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `documentos_pedido_id_pedidos_id_fk` (`pedido_id`),
  CONSTRAINT `documentos_pedido_id_pedidos_id_fk` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notificacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacoes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `tipo` enum('comparacao_concluida','comparacao_reprovada','proxima_fase','revisao_aql','sistema') NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensagem` text NOT NULL,
  `referencia_id` bigint unsigned DEFAULT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  `lida` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `notificacoes_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `notificacoes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `codigo_pedido` varchar(100) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `status_geral` enum('pendente','em_andamento','concluido','arquivado','cancelado') NOT NULL DEFAULT 'pendente',
  `fase_atual` enum('atendimento','design','cq','concluido','arquivado') NOT NULL DEFAULT 'atendimento',
  `user_id` bigint unsigned NOT NULL,
  `dados_cliente` json DEFAULT NULL,
  `arquivado_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `pedidos_codigo_pedido_unique` (`codigo_pedido`),
  KEY `pedidos_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `pedidos_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `prompts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prompts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `departamento` enum('atendimento','design','cq') NOT NULL,
  `tipo_embalagem` enum('barcode_label','color_box','master_carton','todos') NOT NULL DEFAULT 'todos',
  `prompt_sistema` text NOT NULL,
  `prompt_usuario` text,
  `modelo_output` text,
  `variaveis` json DEFAULT NULL,
  `icone` varchar(50) NOT NULL DEFAULT 'FileText',
  `badge` varchar(20) NOT NULL DEFAULT 'BASICO',
  `ordem` int NOT NULL DEFAULT '0',
  `ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
  `versao` int NOT NULL DEFAULT '1',
  `prompt_pai_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `prompts_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `revisoes_aql`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `revisoes_aql` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comparacao_item_id` bigint unsigned NOT NULL,
  `designado_para` bigint unsigned NOT NULL,
  `designado_em` timestamp NOT NULL DEFAULT (now()),
  `status` enum('pendente','em_revisao','concluido') NOT NULL DEFAULT 'pendente',
  `resultado` enum('aprovado','reprovado','divergencia') DEFAULT NULL,
  `observacao` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `revisoes_aql_comparacao_item_id_comparacao_itens_id_fk` (`comparacao_item_id`),
  KEY `revisoes_aql_designado_para_users_id_fk` (`designado_para`),
  CONSTRAINT `revisoes_aql_comparacao_item_id_comparacao_itens_id_fk` FOREIGN KEY (`comparacao_item_id`) REFERENCES `comparacao_itens` (`id`),
  CONSTRAINT `revisoes_aql_designado_para_users_id_fk` FOREIGN KEY (`designado_para`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unionId` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `avatar` text,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `departamento` enum('atendimento','design','cq','supervisor','admin') DEFAULT NULL,
  `is_supervisor` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  `lastSignInAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

