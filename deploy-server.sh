#!/bin/bash
# Script de deploy para o servidor DocCompare
# Executar no servidor quando o SSH estiver disponível

set -e

echo "=== DEPLOY DOC COMPARE ==="
echo "Data: $(date)"

# Diretório da aplicação
APP_DIR="/root/doccompare"
BACKUP_DIR="/root/doccompare-backup-$(date +%Y%m%d-%H%M%S)"

echo "1. Fazendo backup do dist atual..."
if [ -d "$APP_DIR/dist" ]; then
    cp -r "$APP_DIR/dist" "$BACKUP_DIR"
    echo "   Backup salvo em: $BACKUP_DIR"
fi

echo "2. Extraindo novo dist..."
cd "$APP_DIR"
if [ -f "dist-deploy.tar.gz" ]; then
    rm -rf dist
    tar -xzf dist-deploy.tar.gz
    echo "   Novo dist extraído com sucesso"
else
    echo "   ERRO: dist-deploy.tar.gz não encontrado!"
    exit 1
fi

echo "3. Atualizando código fonte (novos arquivos)..."
# Os novos arquivos de validação já estão no boot.js bundleado
# Mas precisamos garantir que o código fonte também está atualizado
# para futuros builds

echo "4. Restartando PM2..."
cd "$APP_DIR"
pm2 restart ecosystem.config.cjs || pm2 start dist/boot.js --name "doccompare"

echo "5. Verificando status..."
pm2 status

echo ""
echo "=== DEPLOY CONCLUÍDO ==="
echo "Acesse: http://108.174.150.102:3000"
echo "Backup em: $BACKUP_DIR"
