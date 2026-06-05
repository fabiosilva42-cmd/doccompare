# DocCompare — Auditoria Documental com IA

Plataforma de comparação documental para importação de brinquedos e produtos infantis. Utiliza IA (Kimi k2.5) para validar embalagens em 3 fases sequenciais: **Atendimento → Design → CQ**.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Hono + tRPC + Drizzle ORM + MySQL 8.0 (Docker) |
| AI | Kimi k2.5 (Moonshot AI) |
| OCR | pdf-parse → Mistral OCR 3 → Tesseract.js fallback |
| Deploy | VPS Ubuntu 22.04 + PM2 |

## Workflow de 3 Fases

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Atendimento │ → │   Design    │ → │     CQ      │
│   (Fase 1)  │    │   (Fase 2)  │    │   (Fase 3)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Fase 1 — Validação Inicial (Atendimento)
- **Objetivo:** Blindar o designer contra informações erradas antes do artwork.
- **Documentos:** Order Details, Ordem de Compra, Die Cut, Foto do Produto, Relatório de Inspeção (opcional).
- **Validação Programática:** CNPJ, EAN-13, DUN-14, NCM, campos obrigatórios.
- **IA:** Temperatura `0.3` — análise determinística com baixa criatividade.
- **Output:** PDF Resumo Executivo + apontamentos para o Design corrigir.

### Fase 2 — Revisão de Embalagens (Design)
- **Objetivo:** Validar artwork desenvolvido contra Order Details.
- **Documentos:** Order Details, Artwork, PDF de apontamentos da Fase 1.
- **Regras:** QR Code na face lateral (altura > largura) ou superior (largura > altura).

### Fase 3 — Revisão Sketch (CQ)
- **Objetivo:** Validar contraprova do fornecedor contra artwork aprovado.
- **Documentos:** Order Details, Artwork Aprovado, Sketch/Contraprova, Fotos do Produto Real.

## Validação Programática (Fase 1)

Arquivos em `api/lib/`:

| Validador | O que verifica |
|---|---|
| `validador-cnpj.ts` | Algoritmo módulo 11, dígitos repetidos, extração de texto |
| `validador-ean.ts` | DV GS1 para EAN-13; DV + prefixo inner(1)/master(2) para DUN-14 |
| `validador-ncm.ts` | Formato 8 dígitos + inconsistência com descrição do produto |
| `validador-programatico.ts` | Orquestrador — extrai e valida tudo, detecta campos obrigatórios |

**Fluxo:** Order Details → extração de texto → validação programática → resultado JSON injetado no prompt da IA via `{resultado_validacao_programatica}`.

## Prompts

Os prompts são seedados via endpoint `/api/trpc/setup.seed` e armazenados no banco. Substituição de 5 prompts antigos por 3 novos:

| Slug | Departamento | Badge | Descrição |
|---|---|---|---|
| `briefing-validacao-inicial` | atendimento | BÁSICO | Valida OD × PO × Die Cut × Foto. Emite apontamentos para Design. |
| `revisao-embalagens` | design | BÁSICO | Artwork vs OD. Valida textos, códigos, dimensões, QR Code. |
| `revisao-sketch` | cq | PRO | Contraprova vs artwork aprovado. Conformidade visual e dimensional. |

## Estrutura de Pastas

```
├── api/                    # Backend tRPC/Hono
│   ├── lib/                # Validadores, OCR, PDF
│   ├── queries/            # Conexão DB
│   ├── templates/          # Templates HTML para PDF
│   └── *.ts                # Routers (comparacao, pedido, upload, etc.)
├── contracts/              # Tipos compartilhados, erros, constantes
├── db/                     # Schema Drizzle, migrations, seed
│   ├── schema.ts           # Tabelas: users, pedidos, prompts, comparacoes, etc.
│   └── relations.ts        # Relações entre tabelas
├── src/                    # Frontend React
│   ├── components/ui/      # shadcn/ui components
│   ├── pages/              # Páginas (NovaComparacao, Resultado, etc.)
│   ├── hooks/              # Custom hooks
│   └── providers/          # Context providers (tRPC, tema)
├── dist/                   # Build output
└── ecosystem.config.cjs    # PM2 config
```

## Variáveis de Ambiente

Crie `.env` na raiz:

```bash
# Database
DATABASE_URL="mysql://doccompare:DocCompareDB@2026@localhost:3306/doccompare"

# AI
KIMI_API_KEY="sk-..."

# OCR (Mistral)
MISTRAL_API_KEY="..."

# AWS S3 (opcional, para storage de arquivos)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="doccompare-uploads"
```

## Comandos

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev          # Frontend Vite
npm run dev:server   # Backend Hono

# Build completo
npm run build        # Frontend + Backend

# Banco de dados
npm run db:migrate   # Executar migrations
npm run db:seed      # Seed de prompts

# Deploy
pm2 start ecosystem.config.cjs
pm2 restart ecosystem.config.cjs
pm2 logs
```

## Seed de Prompts

Após deploy ou atualização de prompts:

```bash
curl "http://localhost:3000/api/trpc/setup.seed?input=%7B%22json%22%3A%7B%22confirm%22%3A%22doccompare-setup-2025%22%7D%7D"
```

## Regras de Negócio Importantes

1. **Ordem de Compra > Order Details** — a vontade do cliente tem prioridade.
2. **Relatório de Inspeção é opcional** — obrigatório apenas para reembarques/repetições.
3. **Validação não bloqueia** — emite PDF para Design corrigir, não impede o fluxo.
4. **3 embalagens avaliadas** — barcode_label, color_box, master_carton.
5. **QR Code** — altura > largura → face lateral; largura > altura → face superior.
6. **Temperatura Fase 1 = 0.3** — máxima precisão, mínima alucinação.

## Histórico de Mudanças

### Fase 0 — Remoção Comex
- Removido departamento Comex de 19 arquivos.
- DB migrado (coluna `departamento` atualizada).
- Build limpo.

### Fase 1 — IA Validator
- 4 validadores programáticos criados (CNPJ, EAN, DUN, NCM).
- 3 prompts novos substituindo 5 antigos.
- Integração validação programática no `comparacao-router.ts`.
- PDF Resumo Executivo da Fase 1.
- Classificação de documentos por arquivo no upload.
- Temperatura `0.3` para Fase 1.
