# Instruções de Deploy — DocCompare v2.0

## Passo 1: No servidor, fazer backup e parar PM2

```bash
cd /var/www/doccompare
pm2 stop doccompare
cp -r dist dist-backup-$(date +%Y%m%d-%H%M%S)
```

## Passo 2: Atualizar código fonte

Os arquivos abaixo precisam ser atualizados. Para cada arquivo, execute o comando `cat > caminho << 'ENDOFFILE'`, cole o conteúdo, e digite `ENDOFFILE` no final.

### Arquivos a atualizar:
1. `api/lib/validador-cnpj.ts` (NOVO)
2. `api/lib/validador-ean.ts` (NOVO)
3. `api/lib/validador-ncm.ts` (NOVO)
4. `api/lib/validador-programatico.ts` (NOVO)
5. `api/setup-router.ts` (MODIFICADO)
6. `api/comparacao-router.ts` (MODIFICADO)
7. `api/pdf-router.ts` (MODIFICADO)
8. `api/templates/resumo-executivo-atendimento.ts` (NOVO)
9. `src/pages/NovaComparacao.tsx` (MODIFICADO)

## Passo 3: Build e restart

```bash
cd /var/www/doccompare
npm run build
pm2 restart ecosystem.config.cjs
pm2 status
```

## Passo 4: Atualizar prompts no banco

```bash
curl "http://108.174.150.102:3000/api/trpc/setup.seed?input=%7B%22confirm%22%3A%22doccompare-setup-2025%22%7D"
```

## Passo 5: Verificar

Acesse http://108.174.150.102:3000 e teste a nova comparação.
