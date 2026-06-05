-- ============================================================
-- MIGRAÇÃO: Remover departamento "comex" do banco de dados
-- Data: 2026-05-31
-- Backup obrigatório antes de executar!
-- ============================================================

USE doccompare;

-- 1. Listar pedidos na fase "comex" (para auditoria)
SELECT id, codigo_pedido, nome, fase_atual, status_geral
FROM pedidos
WHERE fase_atual = 'comex';

-- 2. Migrar pedidos da fase "comex" para "concluido"
UPDATE pedidos
SET fase_atual = 'concluido',
    status_geral = 'concluido'
WHERE fase_atual = 'comex';

-- 3. Listar usuários do departamento "comex" (para auditoria)
SELECT id, name, email, departamento
FROM users
WHERE departamento = 'comex';

-- 4. Remover departamento "comex" dos usuários (setar para NULL)
UPDATE users
SET departamento = NULL
WHERE departamento = 'comex';

-- 5. Desativar prompts do departamento "comex"
UPDATE prompts
SET ativo = 'nao'
WHERE departamento = 'comex';

-- 6. Listar comparações do departamento "comex" (para auditoria)
SELECT c.id, c.uuid, c.pedido_id, c.departamento, p.codigo_pedido
FROM comparacoes c
JOIN pedidos p ON c.pedido_id = p.id
WHERE c.departamento = 'comex';

-- 7. Verificar se ainda há referências a "comex"
SELECT 'pedidos' AS tabela, COUNT(*) AS count FROM pedidos WHERE fase_atual = 'comex'
UNION ALL
SELECT 'users' AS tabela, COUNT(*) AS count FROM users WHERE departamento = 'comex'
UNION ALL
SELECT 'prompts' AS tabela, COUNT(*) AS count FROM prompts WHERE departamento = 'comex'
UNION ALL
SELECT 'comparacoes' AS tabela, COUNT(*) AS count FROM comparacoes WHERE departamento = 'comex';
