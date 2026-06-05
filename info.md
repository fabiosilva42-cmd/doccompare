# DocCompare — Informações do Projeto

## Ambiente
- Node.js 20
- Tailwind CSS v3.4.19
- Vite v7.2.4
- React 19

## Setup Inicial
```
Setup complete: /mnt/agents/output/app
```

## Componentes shadcn/ui (40+)
accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb,
button-group, button, calendar, card, carousel, chart, checkbox, collapsible,
command, context-menu, dialog, drawer, dropdown-menu, empty, field, form,
hover-card, input-group, input-otp, input, item, kbd, label, menubar,
navigation-menu, pagination, popover, progress, radio-group, resizable,
scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip

## Estrutura
```
src/sections/        Page sections
src/hooks/           Custom hooks (useAuth, etc.)
src/pages/           Páginas principais
  NovaComparacao.tsx   Wizard de upload com classificação de documentos
  Resultado.tsx        Visualização de resultados por embalagem
src/providers/       Context providers (tRPC, theme)
src/App.tsx          Root React component
src/main.tsx         Entry point
api/                 Backend tRPC/Hono
  lib/                 Validadores, OCR, PDF generator
  queries/             Conexão DB (getDb)
  templates/           Templates HTML para PDF
  middleware.ts        Auth middleware (authedQuery, adminQuery, etc.)
  comparacao-router.ts  Execução de comparações com IA
  upload-router.ts      Upload de documentos
  pdf-router.ts         Geração de PDFs
  setup-router.ts       Seed de prompts
db/                  Schema Drizzle + migrations
```

## Fases do Workflow
1. **Atendimento** — Validação inicial (OD × PO × Die Cut × Foto)
2. **Design** — Revisão de artwork
3. **CQ** — Revisão de contraprova

## Validação Programática (Fase 1)
Arquivos em `api/lib/`:
- `validador-cnpj.ts` — Algoritmo módulo 11
- `validador-ean.ts` — DV GS1 + prefixo DUN-14
- `validador-ncm.ts` — Formato + consistência com descrição
- `validador-programatico.ts` — Orquestrador

## Prompts Ativos (3)
- `briefing-validacao-inicial` — Atendimento
- `revisao-embalagens` — Design
- `revisao-sketch` — CQ

## Seed de Prompts
```bash
curl "http://localhost:3000/api/trpc/setup.seed?input=%7B%22json%22%3A%7B%22confirm%22%3A%22doccompare-setup-2025%22%7D%7D"
```

## Deploy
```bash
npm run build
pm2 restart ecosystem.config.cjs
```
