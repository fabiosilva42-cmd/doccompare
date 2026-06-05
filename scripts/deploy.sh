#!/bin/bash
# Script de deploy para produção
# Executar no servidor: bash /var/www/doccompare/scripts/deploy.sh

set -e

echo "=== DocCompare Deploy ==="
echo "Data: $(date)"

# 1. Backup do banco
echo "[1/5] Backup do banco de dados..."
docker exec doccompare-mysql mysqldump -u doccompare -p'DocCompareDB@2026' doccompare > /tmp/doccompare_backup_$(date +%Y%m%d_%H%M%S).sql
echo "Backup OK"

# 2. Aplicar migração de dados (remover comex)
echo "[2/5] Aplicando migração de dados..."
docker exec -i doccompare-mysql mysql -u doccompare -p'DocCompareDB@2026' doccompare < /var/www/doccompare/scripts/migrate-remove-comex.sql
echo "Migração OK"

# 3. Substituir arquivos
echo "[3/5] Copiando novo build..."
cd /var/www/doccompare
# Preservar ecosystem.config.js
cp ecosystem.config.js /tmp/ecosystem.config.js.bak
rm -rf dist/
# Aqui você deve extrair o novo tar.gz ou copiar os arquivos
echo "Build copiado (execute manualmente o scp/tar)"

# 4. Restaurar ecosystem.config.js
cp /tmp/ecosystem.config.js.bak ecosystem.config.js

# 5. Restart PM2
echo "[5/5] Restartando PM2..."
pm2 restart doccompare || pm2 start dist/boot.js --name doccompare
echo "Deploy concluído!"
