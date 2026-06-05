# Especificação Final — Fase 1: Atendimento (IA Validator Multimodal)

## ✅ Decisões Consolidadas (Questionário)

| # | Decisão | Escolha |
|---|---------|---------|
| 1 | Upload de documentos | **Sugere automaticamente, atendente confirma** |
| 2 | Prompts (5 → 3) | **Substituir tudo pelos 3 novos** |
| 3 | Validação programática | **Aponta erros em PDF, NÃO bloqueia avanço** |
| 4 | Relatório de inspeção | **Só obrigatório para reembarques/repetições** |
| 5 | Temperature IA (Fase 1) | **0.3 (equilibrado)** |
| 6 | AQL / Notificações / Métricas | **Manter AQL + Notificações, simplificar Métricas** |
| 7 | Embalagens por fase | **Todas as 3 de uma vez** (barcode + color box + master carton) |

---

## 🏗️ Arquitetura da Fase 1

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASE 1: ATENDIMENTO                                  │
│                     Validação Multimodal + Programática                      │
└─────────────────────────────────────────────────────────────────────────────┘

ATENDENTE faz upload dos documentos:
  📊 Order Details (XLSX)          ← OBRIGATÓRIO
  📐 Die Cut (PDF)                 ← OBRIGATÓRIO
  📷 Foto do produto (JPG/PNG)     ← OBRIGATÓRIO
  📄 Ordem de Compra (PO) (PDF)    ← OBRIGATÓRIO
  📋 Relatório inspeção (PDF)      ← OPCIONAL (só reembarques)

Para CADA arquivo, a plataforma:
  1. Sugere o tipo de documento (baseado no nome/extensão/conteúdo)
  2. Atendente confirma ou corrige
  3. Extrai texto (pdf-parse → Mistral OCR → Tesseract.js)
  4. Salva no banco com tipoDocumento correto

Após upload, roda VALIDAÇÃO PROGRAMÁTICA (0.5s, local, 0 tokens):
  ✅ CNPJ: formato (XX.XXX.XXX/XXXX-XX) + dígito verificador
  ✅ EAN-13: 13 dígitos + dígito verificador GS1
  ✅ DUN-14: 14 dígitos + dígito verificador GS1 + prefixo (inner=1, master=2)
  ✅ NCM: 8 dígitos, existe na tabela
  ✅ Campos obrigatórios preenchidos: nome produto, dimensões, peso

Resultado da validação programática:
  ├── Se tudo OK → segue para IA multimodal
  └── Se erros → aponta erros, MAS NÃO BLOQUEIA
      └── Erros vão para o prompt da IA como "dados de entrada"

Depois roda IA MULTIMODAL (Kimi k2.5, temp=0.3):
  "Cruze a Order Details com:
   • Ordem de Compra — o cliente pediu X, a OD diz Y?
   • Die Cut — as dimensões batem com a OD?
   • Foto — o produto real corresponde à descrição da OD?
   • Relatório inspeção — houve erros similares no passado?"

Saída da IA:
  ├── JSON estruturado com contradições encontradas
  ├── Resumo Executivo em markdown
  └── Severidade: info | alerta | bloqueante

Geração de PDF:
  └── Resumo Executivo (1 página máximo)
      ├── Cabeçalho: código do pedido, data, atendente
      ├── Validação Programática: checklist CNPJ/EAN/DUN/NCM
      ├── Contradições encontradas (OD vs PO, OD vs Die Cut, etc.)
      ├── Recomendações
      └── Status: OK / Com Apontamentos

ATENDENTE revisa o PDF:
  ├── Se concorda → aprova itens → avança para Design
  └── Se discorda → corrige → re-executa

DESIGN recebe:
  ├── Pedido com todos os documentos
  ├── PDF de apontamentos da Fase 1
  └── Sabe exatamente o que precisa corrigir
```

---

## 📋 Prompts (3 novos, substituem os 5 atuais)

### Prompt 1: BRIEFING (Atendimento → Design)
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
5. RELATÓRIO DE INSPEÇÃO PASSADA (PDF) — Histórico de erros anteriores (se houver)

VALIDAÇÕES PROGRAMÁTICAS JÁ REALIZADAS:
{resultado_validacao_programatica}

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

Temperature: 0.3
```

### Prompt 2: REVISÃO DE EMBALAGENS (Design → CQ)
```
Você é um designer sênior de embalagens. Recebeu um pedido do Atendimento
com o PDF de apontamentos da Fase 1. Agora você desenvolveu o artwork e
precisa validá-lo contra a Order Details.

DOCUMENTOS:
1. ORDER DETAILS (referência absoluta)
2. ARTWORK DESENVOLVIDO (PDF)
3. PDF DE APONTAMENTOS DA FASE 1 (correções pendentes)

REGRA DO QR CODE:
• Se altura > largura da embalagem → QR Code na face LATERAL
• Se largura > altura da embalagem → QR Code na face SUPERIOR

VALIDAR:
• Textos, ortografia, códigos de barras (EAN-13, DUN-14)
• Dimensões, pesos, materiais
• Posição do QR Code segundo a regra acima
• Cores (Pantone, CMYK)
• Logos e marcas

FORMATO DE SAÍDA (JSON):
{
  "barcode_label": { "resumoExecutivo": "...", "secoes": [...], "itens": [...] },
  "color_box": { ... },
  "master_carton": { ... }
}

Temperature: 0.3
```

### Prompt 3: REVISÃO SKETCH (CQ → Fornecedor)
```
Você é um inspetor de qualidade senior. Recebeu o sketch/contraprova do
fornecedor e precisa validá-lo contra o artwork aprovado e a Order Details.

DOCUMENTOS:
1. ORDER DETAILS (referência absoluta)
2. ARTWORK APROVADO (PDF)
3. SKETCH/CONTRAPROVA DO FORNECEDOR (PDF)
4. FOTOS DO PRODUTO REAL (JPG)

REGRA DO QR CODE (mesma):
• Se altura > largura → QR Code na face LATERAL
• Se largura > altura → QR Code na face SUPERIOR

VALIDAR:
• Conformidade visual: sketch bate com artwork aprovado?
• Código de barras legível e correto
• Dimensões reais dentro da tolerância
• Peso bruto/liquido correto
• QR Code na posição correta segundo a regra
• Material e acabamento

FORMATO DE SAÍDA (JSON):
{
  "barcode_label": { ... },
  "color_box": { ... },
  "master_carton": { ... }
}

Temperature: 0.3
```

---

## 🔧 O que será implementado (ordem de prioridade)

### Prioridade 1 — Validação Programática
- [ ] `api/lib/validador-cnpj.ts` — algoritmo módulo 11
- [ ] `api/lib/validador-ean.ts` — DV GS1 para EAN-13 e DUN-14 + prefixo
- [ ] `api/lib/validador-ncm.ts` — validação contra tabela NCM
- [ ] `api/lib/validador-programatico.ts` — orquestração

### Prioridade 2 — Prompts
- [ ] Atualizar `api/setup-router.ts` — substituir 5 prompts por 3 novos
- [ ] Atualizar `api/comparacao-router.ts` — temp=0.3 para Fase 1

### Prioridade 3 — Upload com Classificação
- [ ] Atualizar `src/pages/NovaComparacao.tsx` — sugerir tipo de documento
- [ ] Atualizar `api/upload-router.ts` — aceitar tipoDocumento do frontend

### Prioridade 4 — PDF Resumo Executivo
- [ ] `api/templates/resumo-executivo-atendimento.ts` — template HTML
- [ ] `api/pdf-router.ts` — endpoint para gerar PDF da Fase 1

### Prioridade 5 — Integração
- [ ] `api/comparacao-router.ts` — injetar resultado da validação programática no prompt
- [ ] `api/workflow-router.ts` — não bloquear, apenas registrar apontamentos

---

*Especificação final aprovada — 24/05/2026*
