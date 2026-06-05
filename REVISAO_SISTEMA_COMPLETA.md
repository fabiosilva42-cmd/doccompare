# Revisão Completa do Sistema — DocCompare v2.0

## 1. ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOC COMPARE v2.0                                   │
│              React 19 + Vite (frontend) | Hono + tRPC + Drizzle (backend)   │
│                        MySQL 8.0 Docker | Kimi k2.5 (IA)                    │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND (src/)
├── App.tsx — rotas (login, dashboard, nova-comparacao, resultado, historico...)
├── pages/
│   ├── NovaComparacao.tsx — wizard 3 passos (upload → tipo → executar)
│   ├── Resultado.tsx — resultado da IA, workflow, aprova/reprova, PDF
│   ├── Dashboard.tsx — stats, gráficos, pedidos recentes
│   ├── Historico.tsx — lista de pedidos
│   └── ... (login, notificações, AQL, admin)
├── components/ — shadcn/ui + custom (Sidebar, AppLayout, NotificationBell)
├── hooks/ — useAuth, useToast
└── providers/ — tRPC + React Query

BACKEND (api/)
├── boot.ts — Hono server, CORS, tRPC handler
├── router.ts — 14 routers (auth, prompt, pedido, comparacao, documento,
│              upload, setup, usuario, pdf, metricas, divergencia, workflow,
│              notificacao, aql, ocrTest)
├── middleware.ts — JWT auth, roles (user/admin), departamentos
├── context.ts — contexto tRPC com usuário
├── comparacao-router.ts — ⭐ CORE: chama Kimi k2.5, processa JSON
├── upload-router.ts — recebe base64, extrai texto, salva documento
├── pdf-generator.ts — Playwright (chromium) gera PDF de HTML
├── extrator-texto.ts — híbrido: pdf-parse → Mistral OCR → Tesseract.js
├── lib/mistral-ocr.ts — Mistral OCR 3 API
├── templates/relatorio-template.ts — HTML para PDF
└── setup-router.ts — seed de 5 prompts no DB

BANCO DE DADOS (db/schema.ts)
├── users — id, name, email, password, role (user/admin), departamento,
│           isSupervisor, createdAt
├── pedidos — id, codigoPedido, nome, statusGeral, faseAtual, userId,
│             dadosCliente (JSON), createdAt
├── prompts — id, slug, nome, descricao, departamento, tipoEmbalagem,
│             promptSistema, promptUsuario, modeloOutput, ativo, versao
├── comparacoes — id, uuid, pedidoId, versao, departamento, promptId,
│                 status, tokens, tempoProcessamento
├── comparacaoItens — id, comparacaoId, tipoEmbalagem, status,
│                     resumoExecutivo, secoes (JSON), tabelaComparativa (JSON)
├── analiseItens — id, comparacaoItemId, campo, valorEsperado,
│                  valorEncontrado, status, observacao
├── documentos — id, pedidoId, tipoDocumento, tipoEmbalagem, nomeOriginal,
│                conteudoExtraido, conteudoOcr, ordem
├── divergencias — IA vs humano (falso positivo/negativo)
├── revisoesAql — amostragem de qualidade (20% dos itens aprovados)
└── notificacoes — push notifications por usuário
```

---

## 2. FLUXO ATUAL DE FUNCIONAMENTO

### Fase Atendimento (hoje):
```
1. Usuário vai em "Nova Comparação"
2. Arrasta arquivos (PDF, XLSX, etc.) — TODOS vão como tipo "outro"!
3. Seleciona o prompt "Validação Inicial do Pedido"
4. Preenche código/nome do pedido
5. Clica "Executar Comparação"

Backend faz:
  a. Cria pedido no DB
  b. Faz upload de cada arquivo (base64 → extrai texto → salva documento)
  c. Cria comparação vinculada ao prompt
  d. Monta mensagem para Kimi:
     - Order Details como "BASE DE COMPARAÇÃO"
     - Outros documentos como "DOCUMENTOS A COMPARAR"
  e. Chama Kimi k2.5 com temperature=1 (CRIATIVO!)
  f. Parseia JSON com 3 embalagens (barcode_label, color_box, master_carton)
  g. Salva resultado em comparacaoItens + analiseItens
  h. Designa 20% para revisão AQL

Resultado:
  - Usuário vê resumo, seções, tabela comparativa
  - Pode aprovar/reprovar item por item
  - Pode gerar PDF do relatório
  - Se todos aprovados, pode "Avançar Fase"
```

---

## 3. PROMPTS ATUAIS NO BANCO (5 prompts)

| # | Slug | Departamento | Descrição |
|---|------|-------------|-----------|
| 1 | `atendimento-validacao-inicial` | atendimento | Valida se documentos iniciais estão completos e consistentes |
| 2 | `design-artwork-barcode` | design | Compara artwork com contraprova de Barcode Label |
| 3 | `design-artwork-colorbox` | design | Compara artwork com contraprova de Color Box |
| 4 | `design-artwork-mastercarton` | design | Compara artwork com contraprova de Master Carton |
| 5 | `cq-inspecao-final` | cq | Compara relatório de inspeção com especificação técnica |

**Problema:** O prompt de atendimento é GENÉRICO. Não menciona:
- Ordem de Compra (PO)
- Foto do produto como referência visual
- Relatório de inspeção passada
- Regra de prioridade: PO > OD
- Regra do QR Code (lateral vs topo)

---

## 4. PROBLEMAS IDENTIFICADOS NO SISTEMA ATUAL

### 🚨 CRÍTICO — Upload sem classificação de documento
**Arquivo:** `src/pages/NovaComparacao.tsx` linha 182
```typescript
files: [{ nomeOriginal: f.nome, mimeType: f.tipo, tamanhoBytes: f.tamanho,
          base64: f.base64, tipoDocumento: "outro" as const,      // ← SEMPRE "outro"!
          tipoEmbalagem: "nao_aplicavel" as const }]
```
**Impacto:** Todos os documentos são salvos como `tipoDocumento = "outro"`. A IA não sabe distinguir Order Details de Die Cut de Foto.

### 🚨 CRÍTICO — Temperature=1 na análise
**Arquivo:** `api/comparacao-router.ts` linha 263
```typescript
temperature: 1,  // ← CRIATIVO! Pode inventar coisas em validação!
```
**Impacto:** A IA pode alucinar e inventar contradições ou ignorar contradições reais.

### ⚠️ IMPORTANTE — Prompt de atendimento não é multimodal
O prompt atual (`atendimento-validacao-inicial`) apenas verifica "completude dos documentos". Não faz comparação cruzada entre OD × PO × Die Cut × Foto.

### ⚠️ IMPORTANTE — Sem validação programática
Não existe validação de CNPJ, EAN-13, DUN-14, NCM antes da chamada de IA. Se a OD tiver DUN-14 errado (como encontramos no SAT12052-26-1), a IA pode não notar.

### ⚠️ IMPORTANTE — Sem bloqueio automático na Fase 1
O workflow permite avançar de fase se TODOS os itens estiverem aprovados. Mas se o atendente aprovou itens que têm contradições reais, o pedido avança para Design com informação errada.

### ℹ️ MENOR — PDF é por embalagem, não por pedido
O relatório PDF atual é gerado por `comparacaoItemId` (uma embalagem por vez). Não existe um "Resumo Executivo do Pedido" consolidado.

---

## 5. O QUE FUNCIONA BEM HOJE

| Feature | Status | Detalhes |
|---------|--------|----------|
| Auth JWT | ✅ | Login, registro, recuperação de senha |
| Upload base64 | ✅ | Múltiplos arquivos, extração automática |
| OCR híbrido | ✅ | pdf-parse → Mistral OCR → Tesseract.js |
| Comparação IA | ✅ | Kimi k2.5, JSON estruturado |
| Workflow Kanban | ✅ | 5 fases com aprovação/reprovação |
| Notificações | ✅ | Push por departamento |
| AQL | ✅ | 20% amostragem aleatória |
| PDF Playwright | ✅ | Geração via HTML→PDF |
| Admin | ✅ | Prompts, usuários, divergências |
| Métricas | ✅ | Dashboard com gráficos |

---

## 6. COMPARATIVO: VISÃO DO SISTEMA ATUAL vs. VISÃO DESEJADA

| Aspecto | Sistema Hoje | Sistema Desejado |
|---------|-------------|------------------|
| **Upload Fase 1** | Usuário arrasta arquivos genéricos | Usuário classifica cada arquivo (OD, Die Cut, Foto, PO, Relatório) |
| **Validação pré-IA** | Nenhuma | Validação programática: CNPJ, EAN, DUN, NCM |
| **Prompt Fase 1** | Genérico, verifica "completude" | Multimodal, cruza OD × PO × Die Cut × Foto × Relatório |
| **Temperature** | 1 (criativo) | 0 (determinístico) para validação |
| **Bloqueio** | Somente workflow manual | Bloqueio automático se contradições encontradas |
| **Saída Fase 1** | JSON com 3 embalagens | Resumo Executivo em PDF (1 página) |
| **Avanço Fase** | Atendente clica "Avançar" | Só avança se validação programática + IA OK |

---

*Revisão gerada em 24/05/2026*
*Baseado em análise de 20+ arquivos de código*
