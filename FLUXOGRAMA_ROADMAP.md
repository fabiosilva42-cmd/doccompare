# DocCompare — Fluxograma Atual e Roadmap Futuro

## 🗺️ Visão Geral da Plataforma

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOCCOMPARE — PLATAFORMA DE AUDITORIA                │
│                    Embalagens: Barcode Label | Color Box | Master Carton    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FASE 0 (ATUAL)                                 │
│                         Desacoplamento do Comex ✓                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxograma Atual (Pós-Remoção Comex)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO DE PEDIDO                                │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │   CLIENTE    │
   │  (Solicita)  │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  1. ATENDIMENTO                                                          │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
   │  │ Order       │  │ Fotos       │  │ Die Cut     │  │ Briefing    │     │
   │  │ Details     │  │ (alta res)  │  │ (escala)    │  │ (completo)  │     │
   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
   │                                                                          │
   │  IA: Validacao Inicial (prompt atendimento-validacao-inicial)            │
   │  └── Verifica completude e consistencia dos documentos                   │
   └────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │     DOCUMENTOS VALIDOS?     │
                     └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              ┌──────────┐                   ┌──────────┐
              │   SIM    │                   │   NÃO    │
              └────┬─────┘                   └────┬─────┘
                   │                              │
                   ▼                              ▼
   ┌──────────────────────────┐       ┌──────────────────────────┐
   │  AVANÇA → DESIGN         │       │  RETORNA AO CLIENTE      │
   └──────────────────────────┘       └──────────────────────────┘
                   │
                   ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  2. DESIGN                                                               │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
   │  │ Artwork     │  │ Contra-     │  │ Especifica- │                      │
   │  │ (PDF/AI)    │  │ prova       │  │ ção Técnica │                      │
   │  └─────────────┘  └─────────────┘  └─────────────┘                      │
   │                                                                          │
   │  IA: Validacao de Artwork (prompts design-artwork-*)                     │
   │  └── Barcode Label | Color Box | Master Carton                           │
   │  └── Verifica: ortografia, código de barras, cores, fontes, logos        │
   └────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │     ARTWORK APROVADO?       │
                     └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              ┌──────────┐                   ┌──────────┐
              │   SIM    │                   │   NÃO    │
              └────┬─────┘                   └────┬─────┘
                   │                              │
                   ▼                              ▼
   ┌──────────────────────────┐       ┌──────────────────────────┐
   │  AVANÇA → CQ             │       │  CORREÇÃO PELO DESIGNER  │
   └──────────────────────────┘       └──────────────────────────┘
                   │
                   ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  3. CQ (CONTROLE DE QUALIDADE)                                          │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
   │  │ Relatório   │  │ Fotos do    │  │ Artwork     │                      │
   │  │ de Inspeção │  │ Produto     │  │ Aprovado    │                      │
   │  └─────────────┘  └─────────────┘  └─────────────┘                      │
   │                                                                          │
   │  IA: Inspeção Final (prompt cq-inspecao-final)                          │
   │  └── Verifica: conformidade visual, código de barras, dimensões,        │
   │      peso, material, acabamento, etiquetas                               │
   │                                                                          │
   │  HUMANO: Revisão AQL (20% dos itens designados para inspeção manual)    │
   └────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │     INSPEÇÃO APROVADA?      │
                     └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              ┌──────────┐                   ┌──────────┐
              │   SIM    │                   │   NÃO    │
              └────┬─────┘                   └────┬─────┘
                   │                              │
                   ▼                              ▼
   ┌──────────────────────────┐       ┌──────────────────────────┐
   │  AVANÇA → CONCLUÍDO      │       │  CORREÇÃO / REFAÇÃO      │
   └──────────────────────────┘       └──────────────────────────┘
                   │                              │
                   ▼                              │
   ┌──────────────────────────┐                  │
   │  4. CONCLUÍDO/ARQUIVADO  │◄─────────────────┘
   │  Pedido finalizado       │
   └──────────────────────────┘
```

---

## 🔮 Roadmap Futuro — As 3 Operações

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FASE 1: IA VALIDATOR                           │
│                         Semanas 3-6 | Operação #1                           │
│              "Pedidos chegam com dados errados/incompletos"                 │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────┐
   │  NOVO: VALIDAÇÃO NO MOMENTO DO CADASTRO                                │
   │                                                                          │
   │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
   │  │ Código      │     │ NCM         │     │ Tipo de     │               │
   │  │ Pedido      │────▶│ (novo)      │────▶│ Embalagem   │               │
   │  └─────────────┘     └─────────────┘     └─────────────┘               │
   │                            │                                           │
   │                            ▼                                           │
   │              ┌─────────────────────────────┐                           │
   │              │  🤖 KIMI K2.5 (temperature=0)│                           │
   │              │                              │                           │
   │              │  "Valide se o NCM [X]        │                           │
   │              │   corresponde à descrição    │                           │
   │              │   [Y]. Verifique campos SAT. │                           │
   │              └──────────────┬───────────────┘                           │
   │                             │                                          │
   │              ┌──────────────┴──────────────┐                           │
   │              │      VALIDAÇÃO PASSOU?      │                           │
   │              └──────────────┬──────────────┘                           │
   │                             │                                          │
   │              ┌──────────────┴──────────────┐                           │
   │              ▼                               ▼                           │
   │        ┌──────────┐                   ┌──────────┐                      │
   │        │   ✓ SIM  │                   │   ✗ NÃO  │                      │
   │        │  AVANÇA  │                   │ BLOQUEIA │                      │
   │        │  → DESIGN│                   │ mostra   │                      │
   │        └──────────┘                   │ erros +  │                      │
   │                                       │ sugestões│                      │
   │                                       └──────────┘                      │
   └─────────────────────────────────────────────────────────────────────────┘

   💡 IMPACTO ESPERADO:
   • Antes: 30% dos pedidos com dados errados no Design
   • Depois: < 5% de pedidos com dados errados
   • Tempo de validação: 45 min → < 5 segundos
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASE 2: ZXING + PREFLIGHT                           │
│                        Semanas 7-10 | Operação #3                           │
│                "CQ demora para aprovar / muitas refações"                   │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────┐
   │  NOVO: VERIFICAÇÃO TÉCNICA AUTOMÁTICA NO CANVAS                        │
   │                                                                          │
   │  ┌─────────────────────────────────────────────────────────────────┐    │
   │  │                    CANVAS INTERATIVO                             │    │
   │  │                                                                  │    │
   │  │    ┌─────────────────────────────────────────┐                  │    │
   │  │    │                                         │  ┌────────────┐  │    │
   │  │    │    [📷 Imagem do Artwork/Contraprova]   │  │ Bounding   │  │    │
   │  │    │                                         │  │ Box        │  │    │
   │  │    │         ┌─────────────┐                 │  │ Ajustável  │  │    │
   │  │    │         │  ▓▓▓▓▓▓▓   │ ← código de    │  └────────────┘  │    │
   │  │    │         │  ▓▓▓▓▓▓▓   │   barras       │                  │    │
   │  │    │         └─────────────┘                 │                  │    │
   │  │    │                                         │                  │    │
   │  │    └─────────────────────────────────────────┘                  │    │
   │  │                                                                  │    │
   │  │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
   │  │    │ 🔍 ZXing    │  │ 📊 Contraste│  │ 📋 Checklist│          │    │
   │  │    │ decode()    │  │ WCAG-like   │  │ Técnico     │          │    │
   │  │    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │    │
   │  │           │                │                │                  │    │
   │  │           ▼                ▼                ▼                  │    │
   │  │    ┌─────────────────────────────────────────────────┐        │    │
   │  │    │  RESULTADO:                                     │        │    │
   │  │    │  • EAN-13: 7891234567890  ✓                    │        │    │
   │  │    │  • Formato: EAN-13        ✓                    │        │    │
   │  │    │  • Contraste: 4.2:1       ⚠️ (mínimo 4.5)     │        │    │
   │  │    │  • Legibilidade: 95%      ✓                    │        │    │
   │  │    └─────────────────────────────────────────────────┘        │    │
   │  │                                                                  │    │
   │  │    [ ❌ BLOQUEAR APROVAÇÃO até checklist 100% ]                │    │
   │  └─────────────────────────────────────────────────────────────────┘    │
   └─────────────────────────────────────────────────────────────────────────┘

   💡 IMPACTO ESPERADO:
   • Antes: 30 min de inspeção CQ por pedido
   • Depois: < 5 min de inspeção técnica
   • Refações por erro técnico: reduzidas para zero
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASE 3: FEEDBACK INTERPRETER                        │
│                        Semanas 11-12 | Operação #2                          │
│              "Designers perdem tempo com tarefas repetitivas"               │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────┐
   │  NOVO: TRADUTOR DE FEEDBACK SUBJETIVO → DIRETRIZES TÉCNICAS           │
   │                                                                          │
   │  ┌─────────────────┐         ┌─────────────────┐         ┌───────────┐  │
   │  │ 👤 CLIENTE/CQ   │         │   🤖 KIMI K2.5  │         │ 👨‍🎨 DESIGNER│  │
   │  │                 │────────▶│                 │────────▶│           │  │
   │  │ "A embalagem    │         │ "Reduzir        │         │ [✓] Aplicar│  │
   │  │  ficou pesada"  │         │  contraste em   │         │ [ ] Aplicar│  │
   │  │                 │         │  15%"           │         │ [✓] Aplicar│  │
   │  └─────────────────┘         └─────────────────┘         └───────────┘  │
   │                                                                          │
   │  EXEMPLOS DE TRADUÇÃO:                                                  │
   │  ┌─────────────────────────────┬─────────────────────────────────────┐  │
   │  │ FEEDBACK SUBJETIVO          │ DIRETRIZ TÉCNICA                    │  │
   │  ├─────────────────────────────┼─────────────────────────────────────┤  │
   │  │ "Fontes muito agressivas"   │ → Sans-serif, peso regular          │  │
   │  │ "Poluído"                   │ → Reduzir densidade +10% leading    │  │
   │  │ "Cores apagadas"            │ → Aumentar saturação 20%            │  │
   │  │ "Texto difícil de ler"      │ → Aumentar fonte 2pt, contraste     │  │
   │  │ "Não parece premium"        │ → Laminação fosca, hot stamping     │  │
   │  └─────────────────────────────┴─────────────────────────────────────┘  │
   │                                                                          │
   │  ESTRUTURA JSON GERADA:                                                 │
   │  {                                                                        │
   │    "interpretacoes": [                                                    │
   │      { "categoria": "cor",       "elemento": "primária",                │
   │        "acao": "reduzir contraste", "parametro": "15%" },               │
   │      { "categoria": "layout",    "elemento": "whitespace",              │
   │        "acao": "aumentar",        "parametro": "20%" }                  │
   │    ]                                                                      │
   │  }                                                                        │
   └─────────────────────────────────────────────────────────────────────────┘

   💡 IMPACTO ESPERADO:
   • Ciclos de revisão: 3-4 → 1-2
   • Tempo de compreensão de feedback: minutos → segundos
   • Reuniões de alinhamento: reduzidas drasticamente
```

---

## 📅 Timeline Completo (12 Semanas)

```
    Semana:  1    2    3    4    5    6    7    8    9   10   11   12
             │    │    │    │    │    │    │    │    │    │    │    │
    ┌────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┐
    │                                                                 │
    │  ╔═══════════════════════════════════════════════════════════╗  │
    │  ║  FASE 0: ESTABILIZAÇÃO + REMOÇÃO COMEX                   ║  │
    │  ║  ✅ Remover código Comex do frontend/backend              ║  │
    │  ║  ✅ Migrar dados do banco (comex → concluído)            ║  │
    │  ║  ✅ Deploy em produção                                   ║  │
    │  ╚═══════════════════════════════════════════════════════════╝  │
    │              │    │                                              │
    │              ╔════╧════╧════╧════╧════╧════╗                     │
    │              ║  FASE 1: IA VALIDATOR        ║                     │
    │              ║  Operação #1 — Dados errados ║                     │
    │              ║  • Backend: mutation validar  ║                     │
    │              ║  • Frontend: campo NCM +      ║                     │
    │              ║    bloqueio + painel erros    ║                     │
    │              ╚════╤════╤════╤════╤════╤════╝                     │
    │                   ╔════╧════╧════╧════╧════╧════╧════╗          │
    │                   ║  FASE 2: ZXING + PREFLIGHT        ║          │
    │                   ║  Operação #3 — CQ demorado        ║          │
    │                   ║  • ZXing no canvas (barcodes)     ║          │
    │                   ║  • ContrastChecker (WCAG)         ║          │
    │                   ║  • Checklist técnico integrado    ║          │
    │                   ╚════╤════╤════╤════╤════╤════╤════╝          │
    │                        ╔════╧════╧════╗                         │
    │                        ║  FASE 3: FEEDBACK INTERPRETER ║         │
    │                        ║  Operação #2 — Tarefas repetitivas    │
    │                        ║  • Prompt engineering Kimi    ║         │
    │                        ║  • Cards de diretrizes técnicas       │
    │                        ║  • Tracker "Aplicado"         ║         │
    │                        ╚════════════════╝                         │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura Técnica (Atual + Futuro)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React 19 + Vite)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│   │ Dashboard   │  │ Nova Comp.  │  │ Resultado   │  │ Verificação CQ  │   │
│   │             │  │  + NCM      │  │ + Feedback  │  │ + ZXing Canvas  │   │
│   │             │  │  + Validator│  │  Interpreter│  │ + Contraste     │   │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
│          │                │                │                   │            │
│          └────────────────┴────────────────┴───────────────────┘            │
│                                     │                                       │
│                              tRPC (httpLink)                                │
│                              SuperJSON                                      │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                              ┌───────┴───────┐
                              │  CORS / Hono  │
                              └───────┬───────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                            BACKEND (Hono + tRPC)                            │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                                     │                                       │
│   ┌─────────────────────────────────┼───────────────────────────────────┐   │
│   │           ROUTERS               │                                   │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────┴─────┐ ┌─────────┐ ┌─────────┐   │   │
│   │  │ pedido  │ │ prompt  │ │ comparação│ │ qc (novo)│ │ feedback│   │   │
│   │  │ +validar│ │         │ │           │ │ +barcode │ │ +inter- │   │   │
│   │  │ Briefing│ │         │ │           │ │          │ │  pretar │   │   │
│   │  └─────────┘ └─────────┘ └───────────┘ └─────────┘ └─────────┘   │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│   ┌─────────────────────────────────┼───────────────────────────────────┐   │
│   │         SERVIÇOS EXTERNOS       │                                   │   │
│   │  ┌─────────────────────────────┴─────────────────────────────┐    │   │
│   │  │              🤖 KIMI K2.5 (Moonshot AI)                   │    │   │
│   │  │  • Validação NCM (temp=0, determinístico)                 │    │   │
│   │  │  • Análise de Artwork (temp=1, criativo)                  │    │   │
│   │  │  • Feedback Interpreter (temp=0.7, equilibrado)           │    │   │
│   │  └───────────────────────────────────────────────────────────┘    │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                              ┌───────┴───────┐
│                         BANCO DE DADOS (MySQL 8.0 Docker)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │ users   │ │ pedidos │ │ prompts │ │comparac.│ │analise  │ │diverg.  │  │
│   │ +ncm    │ │+briefing│ │         │ │  itens  │ │ itens   │ │         │  │
│   │+validado│ │ validado│ │         │ │         │ │         │ │         │  │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 KPIs de Sucesso

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MÉTRICAS ALVO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ MÉTRICA                          │ ANTES     │ DEPOIS    │ Δ        │   │
│  ├──────────────────────────────────┼───────────┼───────────┼──────────┤   │
│  │ Pedidos com dados errados        │ 30%       │ < 5%      │ -83%     │   │
│  │ Tempo de validação de briefing   │ 45 min    │ < 5 seg   │ -99.8%   │   │
│  │ Tempo de inspeção CQ             │ 30 min    │ < 5 min   │ -83%     │   │
│  │ Ciclos de revisão (refações)     │ 3-4       │ 1-2       │ -50%     │   │
│  │ Erros técnicos no CQ             │ variável  │ zero      │ -100%    │   │
│  │ Tempo interpretação de feedback  │ 30 min    │ < 3 seg   │ -99.8%   │   │
│  └──────────────────────────────────┴───────────┴───────────┴──────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ O Que NÃO Está no Escopo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FORA DO ROADMAP (FUTURO DISTANTE)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ❌ Kimi K2.6          → Não existe comercialmente (usar K2.5)              │
│  ❌ Agentic OCR        → Custo $0.03/página (manter Tesseract.js)           │
│  ❌ Adobe Firefly      → Sem API pública viável                             │
│  ❌ Pacdora/Blender    → Sem integração automatizada                        │
│  ❌ ECMA/FEFCO auto    → Requer biblioteca CAD especializada                │
│  ❌ Plataforma Comex   → Fase 2, após estabilização completa                │
│       (separada do DocCompare Design)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Última atualização: 2026-05-31*
*Status: Fase 0 concluída. Aguardando início da Fase 1.*
