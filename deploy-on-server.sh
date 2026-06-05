#!/bin/bash
set -e

echo "=== DEPLOY DOC COMPARE v2.0 ==="
echo "Data: $(date)"

APP_DIR="/var/www/doccompare"
cd "$APP_DIR"

echo "1. Parando PM2..."
pm2 stop doccompare || true

echo "2. Backup do dist atual..."
cp -r dist "dist-backup-$(date +%Y%m%d-%H%M%S)"

echo "3. Backup do código fonte..."
cp -r api api-backup-$(date +%Y%m%d-%H%M%S)
cp -r src src-backup-$(date +%Y%m%d-%H%M%S)

echo "4. Atualizando arquivos..."

# Criar diretórios se não existiren
mkdir -p api/lib api/templates

# Os arquivos serão criados via cat << 'EOF'
# (serão substituídos pelo conteúdo real)

echo "5. Instalando dependências..."
npm install --silent 2>/dev/null || true

echo "6. Build..."
npm run build

echo "7. Restartando PM2..."
pm2 restart ecosystem.config.cjs || pm2 start dist/boot.js --name "doccompare"

echo "8. Status:"
pm2 status

echo ""
echo "=== DEPLOY CONCLUÍDO ==="
echo "Acesse: http://108.174.150.102:3000"
