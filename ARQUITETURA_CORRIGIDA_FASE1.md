# Arquitetura Corrigida — Fase 1: Atendimento (Análise Multimodal)

## ⚠️ Desentendimento Corrigido

Você tem razão! Eu estava pensando no IA Validator como apenas "validar a OD isoladamente". 

**Mas a Fase 1 real é:**
> Cruzar a OD **COM TODOS OS DOCUMENTOS** (Die Cut, Foto, PO, Relatório de inspeção) para encontrar contradições **antes** do designer receber.

---

## 🎯 O que a Fase 1 (Atendimento) realmente faz

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FASE 1: ATENDIMENTO (CORRIGIDA)                         │
│                     Análise Multimodal + Validação Programática                 │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐
   │  ATENDENTE  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  UPLOAD DE DOCUMENTOS (pacote completo)                                 │
   │                                                                          │
   │  📊 Order Details (Excel)      ← A "verdade absoluta"                   │
   │  📐 Die Cut (PDF)              ← Molde estrutural                       │
   │  📷 Foto do produto (JPG)      ← Referência visual                      │
   │  📄 Ordem de Compra (PDF)      ← O que o cliente pediu                  │
   │  📋 Relatório inspeção (PDF)   ← Histórico de problemas passados        │
   └────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  CAMADA 1: VALIDAÇÃO PROGRAMÁTICA (rápida, 0.5s)                       │
   │                                                                          │
   │  • CNPJ válido? → Formato + DV                                          │
   │  • EAN-13 válido? → 13 dígitos + DV                                     │
   │  • DUN-14 válido? → 14 dígitos + DV + prefixo                           │
   │  • NCM existe? → Na tabela oficial                                      │
   │  • Campos obrigatórios preenchidos? → Não nulos                         │
   │                                                                          │
   │  Se FALHAR → BLOQUEIO IMEDIATO (não gasta tokens de IA)                 │
   └────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼ (só passa se Camada 1 OK)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  CAMADA 2: ANÁLISE MULTIMODAL COM IA (Kimi k2.5)                        │
   │                                                                          │
   │  Entrada: texto extraído de TODOS os documentos                         │
   │                                                                          │
   │  "Cruze a Order Details com:                                            │
   │   • O Die Cut — as dimensões batem?                                     │
   │   • A Ordem de Compra — o cliente pediu X, a OD diz Y?                  │
   │   • A Foto — o produto real corresponde à descrição da OD?              │
   │   • O Relatório de inspeção — houve erros similares no passado?"        │
   │                                                                          │
   │  Temperature: 0 (determinístico)                                        │
   │  Resposta: JSON estruturado com contradições encontradas                │
   └────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SAÍDA: RESUMO EXECUTIVO EM PDF                                         │
   │                                                                          │
   │  ┌─────────────────────────────────────────────────────────────────┐   │
   │  │  RELATÓRIO DE VALIDAÇÃO — SAT12052-26-1                        │   │
   │  │  Responsável: [Nome do Atendente]                                │   │
   │  │  Data: 01/06/2026                                               │   │
   │  │                                                                  │   │
   │  │  ✅ CNPJ: Válido (79.379.491/0001-83)                            │   │
   │  │  ✅ EAN-13: 10/10 válidos                                        │   │
   │  │  ❌ DUN-14: 0/10 válidos (prefixos trocados)                     │   │
   │  │                                                                  │   │
   │  │  CONTRADIÇÕES ENCONTRADAS:                                       │   │
   │  │  • Ordem de Compra pede cor AZUL, OD diz ROSA (ST85102)         │   │
   │  │  • Die Cut: dimensão 60cm, OD diz 56.5cm (ST85113)              │   │
   │  │  • Relatório inspeção: QR Code posicionado errado (recorrente)  │   │
   │  │                                                                  │   │
   │  │  STATUS: ❌ BLOQUEADO — Corrija antes de enviar ao Design       │   │
   │  └─────────────────────────────────────────────────────────────────┘   │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  ATENDENTE REVISA   │
                         │  e aciona cliente   │
                         │  se necessário      │
                         └─────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  CORREÇÕES          │
                         │  (loop até aprovar) │
                         └─────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  AVANÇA PARA DESIGN │
                         │  (Kanban movido)    │
                         └─────────────────────┘
```

---

## 📋 Comparativo: Minha Visão Errada vs. Visão Correta

| | Minha visão (ERRADA) | Visão correta (SUA) |
|--|----------------------|---------------------|
| **Entrada** | Só a OD (Excel) | OD + Die Cut + Foto + PO + Relatório |
| **Ação** | Validar campos da OD | Cruzar TODOS os documentos |
| **Pergunta** | "A OD está preenchida?" | "Todos os documentos dizem a mesma coisa?" |
| **Bloqueio** | Se OD incompleta | Se houver contradição entre documentos |
| **Saída** | Lista de campos faltantes | Resumo Executivo com contradições |

---

## 🛠️ Prompt da Fase 1 (Atualizado com sua descrição)

```
Você é um analista sênior de atendimento e compliance, especialista em 
importação de brinquedos e produtos infantis para o Brasil.

CONTEXTO:
Você recebeu um pacote de documentos de um pedido SAT. Sua função é 
BLINDAR o designer contra informações erradas, retrabalho e "telefone 
sem fio" com o cliente.

DOCUMENTOS FORNECIDOS:
1. ORDER DETAILS (Excel) — A "fonte da verdade" com especificações técnicas
2. DIE CUT (PDF) — Molde estrutural da embalagem
3. FOTO DO PRODUTO (JPG) — Imagem de referência do produto real
4. ORDEM DE COMPRA (PDF) — O que o cliente efetivamente pediu
5. RELATÓRIO DE INSPEÇÃO PASSADA (PDF) — Histórico de erros anteriores

INSTRUÇÕES:
1. Extraia o texto de TODOS os documentos
2. Compare item a item, SKU por SKU
3. Identifique QUALQUER contradição entre documentos
4. Verifique se há erros recorrentes do histórico

REGRAS CRÍTICAS:
• A Ordem de Compra é a VONTADE do cliente. Se conflitar com a OD, 
  a Ordem de Compra tem PRIORIDADE (é ela que gera receita).
• O Die Cut é a ESTRUTURA. Se as dimensões do Die Cut divergirem 
  da OD, isso é um ERRO CRÍTICO.
• A Foto é a REALIDADE. Se o produto na foto não corresponder à 
  descrição da OD, reporte.

VALIDAÇÕES PROGRAMÁTICAS (já realizadas):
✓ CNPJ: {cnpj} → {status_cnpj}
✓ EAN-13: {lista_eans} → {status_eans}
✓ DUN-14: {lista_duns} → {status_duns}
✓ NCM: {ncm} → {status_ncm}

FORMATO DE SAÍDA (JSON):
{
  "valido": boolean,
  "bloqueado": boolean,
  "resumo_executivo": "markdown com parágrafo inicial",
  "contradicoes": [
    {
      "tipo": "od_vs_po | od_vs_diecut | od_vs_foto | historico",
      "sku": "STxxxxx",
      "campo": "cor | dimensao | peso | texto | codigo",
      "valor_od": "...",
      "valor_documento": "...",
      "documento": "po | diecut | foto | inspecao",
      "severidade": "bloqueante | alerta | info",
      "mensagem": "descrição clara do problema",
      "sugestao": "como corrigir"
    }
  ],
  "erros_programaticos": [
    { "campo": "cnpj|ean|dun|ncm", "erro": "...", "severidade": "bloqueante" }
  ],
  "recomendacoes": ["sugestão 1", "sugestão 2"]
}

Temperature: 0
```

---

## 🎯 O que será implementado na Fase 1

### Backend:
```
api/
├── lib/
│   ├── validador-cnpj.ts          ← Algoritmo módulo 11
│   ├── validador-ean.ts           ← DV GS1
│   ├── validador-ncm.ts           ← Tabela oficial
│   ├── validador-programatico.ts  ← Orquestra validações duras
│   ├── extrator-multimodal.ts     ← Extrai texto de todos os docs
│   └── gerador-pdf.ts             ← Gera PDF do resumo executivo
│
├── comparacao-router.ts           ← Mutation executar (já existe)
│   └── Agora recebe ARRAY de documentos (OD + PO + Die Cut + Foto)
│
└── prompts/
    └── atendimento-validacao-inicial  ← Substituído pelo prompt acima
```

### Frontend:
```
src/pages/NovaComparacao.tsx
└── Step 1: Upload de Múltiplos Documentos
    ├── Upload Order Details (obrigatório)
    ├── Upload Die Cut (obrigatório)
    ├── Upload Foto do Produto (obrigatório)
    ├── Upload Ordem de Compra (obrigatório)
    └── Upload Relatório Inspeção (opcional)
```

---

*Arquitetura corrigida — Fase 1: Análise Multimodal*
*DocCompare v2.0*
