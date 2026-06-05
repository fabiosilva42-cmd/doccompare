# Arquitetura Unificada: IA Validator + Comparador IA

## Dúvida Principal: Eles trabalham juntos ou separados?

**RESPOSTA: Trabalham em SEQUÊNCIA. São complementares, não concorrentes.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO COMPLETO DO DOCCOMPARE                            │
│                    (IA Validator + Comparador IA Unificados)                    │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
   │  CLIENTE    │────────▶│   IA VALIDATOR      │────────▶│  COMPARADOR IA      │
   │  (envia     │         │   (Fase 1:          │         │  (Fases 2-3:        │
   │   pedido)   │         │   Atendimento)      │         │   Design + CQ)      │
   └─────────────┘         └─────────────────────┘         └─────────────────────┘
                                  │                              │
                                  ▼                              ▼
                         "A OD está correta?"            "A arte bate com a OD?"
                         
                         • CNPJ válido?                 • CNPJ na arte = OD?
                         • EAN-13 ok?                   • EAN-13 na arte = OD?
                         • DUN-14 ok?                   • DUN-14 na arte = OD?
                         • NCM correto?                 • Dimensões na arte = OD?
                         • Campos obrigatórios?         • Textos na arte = OD?
                         • Sem duplicatas?              • QR Code posicionado?
                         
                         SE SIM → Avança              SE SIM → Aprova
                         SE NÃO → BLOQUEIA            SE NÃO → Reprova
```

---

## 🎯 Analogia: Construção de uma Casa

| Fase | Papel | Pergunta que responde |
|------|-------|----------------------|
| **IA Validator** | Engenheiro civil | "A planta baixa (OD) está correta? As medidas batem? Os materiais estão especificados?" |
| **Comparador IA** | Fiscal de obras | "A casa construída (arte) segue a planta baixa (OD)? As paredes estão no lugar certo?" |

**Sem o IA Validator:** O fiscal compara a casa com uma planta errada → aprova algo que nunca deveria ter sido construído.

**Com os dois:** A planta é validada ANTES → a casa é comparada com a planta certa → 100% de acerto.

---

## 📋 Os 3 Prompts do Usuário vs. As 3 Fases do Sistema

Os prompts que você colou são **OURO**! Eles mapeiam perfeitamente para as 3 fases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 1: ATENDIMENTO  ──▶  PROMPT: BRIEFING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Quem faz: Atendente                                                         │
│  Entrada: Planilha OD (Excel)                                                │
│  Saída: Relatório PDF (1 página) com:                                        │
│         • Inconsistências na OD                                              │
│         • Sugestões de atributos de venda                                    │
│         • Sugestões visuais para o designer                                  │
│         • Nome do responsável do atendimento                                 │
│                                                                              │
│  FUNÇÃO DO IA VALIDATOR AQUI:                                               │
│  ✅ Validar CNPJ, EAN-13, DUN-14, NCM (programático)                        │
│  ✅ Validar consistência semântica (Kimi k2.5)                              │
│  ✅ Gerar PDF do briefing para o designer                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 2: DESIGN  ──▶  PROMPT: REVISÃO DE EMBALAGENS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Quem faz: Designer / CQ                                                    │
│  Entrada: PDFs de artwork (AW) + Master Box (SM) + OD                       │
│  Saída: Relatório PDF (3 páginas) com:                                      │
│         • Comparação item a item AW/SM vs OD                                │
│         • Validação de QR Code (posição na maior face)                      │
│         • CNPJ na embalagem = CNPJ na OD                                    │
│         • País de fabricação igual                                          │
│         • DUN-14 na SM, EAN-13 na AW                                        │
│         • Status: Aprovado / Necessita Correção                             │
│                                                                              │
│  FUNÇÃO DO COMPARADOR IA AQUI:                                              │
│  ✅ Comparar artwork com OD (texto, códigos, dimensões)                     │
│  ✅ Validar posição do QR Code (regra: altura>largura=lateral)              │
│  ✅ Gerar PDF executivo da revisão                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 3: CQ / FORNECEDOR  ──▶  PROMPT: REVISÃO SKETCH                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Quem faz: CQ / Fornecedor                                                  │
│  Entrada: Final AW + Sketch + OD                                            │
│  Saída: Relatório PDF (1 página) com:                                       │
│         • Comparação: Final AW vs Sketch (devem ser IDÊNTICOS)              │
│         • Comparação: Ambos vs OD                                           │
│         • Classificação: 🔴Crítico/🟠Alto/🟡Médio/🔵Baixo                   │
│         • Status: Aprovado / Reprovado / Correção necessária                │
│                                                                              │
│  FUNÇÃO DO COMPARADOR IA AQUI:                                              │
│  ✅ Comparar Final AW vs Sketch (pixel-perfect)                             │
│  ✅ Validar se sketch não alterou nada não-autorizado                       │
│  ✅ Gerar PDF executivo final                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Como Funciona a Arquitetura Técnica

### Base de Dados Única: A Order Details (OD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORDER DETAILS (A VERDADE ABSOLUTA)                   │
│                                                                             │
│  • CNPJ: 79.379.491/0001-83                                                 │
│  • NCM: 9503.00.97                                                          │
│  • EAN-13: 6200000343839                                                    │
│  • DUN-14 Inner: 26200000343833                                             │
│  • DUN-14 Master: 16200000343836                                            │
│  • Dimensões: 56.5 x 31 x 29 cm                                             │
│  • Peso: 6.3 kg                                                             │
│  • País: CHINA                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │  IA VALIDATOR   │         │  COMPARADOR IA  │         │  COMPARADOR IA  │
    │   (Fase 1)      │         │   (Fase 2)      │         │   (Fase 3)      │
    │                 │         │                 │         │                 │
    │ "Esse CNPJ      │         │ "O CNPJ na      │         │ "O CNPJ no      │
    │  tem DV         │         │  artwork é      │         │  sketch é       │
    │  válido?"       │         │  igual ao da    │         │  igual ao da    │
    │                 │         │  OD?"           │         │  OD?"           │
    └─────────────────┘         └─────────────────┘         └─────────────────┘
```

**A OD é a "fonte da verdade".** Todos os validadores usam ela como referência.

---

## 📊 Tabela Comparativa: IA Validator vs. Comparador IA

| Aspecto | IA Validator | Comparador IA |
|---------|-------------|---------------|
| **Quando roda** | No cadastro (Fase 1) | Durante análise (Fases 2-3) |
| **Entrada** | OD (Excel/PDF) | Arte PDF + OD + Fotos |
| **Pergunta** | "A OD está correta?" | "A arte bate com a OD?" |
| **Tecnologia** | Regras duras + Kimi k2.5 | Kimi k2.5 (vision) |
| **Temperature** | 0 (determinístico) | 1 (criativo para análise visual) |
| **Bloqueia fluxo?** | **SIM** (erros críticos) | Não (aponta divergências) |
| **Saída** | Lista de erros + PDF briefing | Lista de divergências + PDF revisão |
| **Usa OCR?** | Sim (Mistral/Tesseract) | Sim (para extrair texto da arte) |

---

## 🛠️ Implementação Técnica

### 1. Prompts a Serem Atualizados

Os prompts atuais do sistema devem ser **substituídos** pelos que você escreveu:

| Prompt Atual | Substituir por | Fase |
|--------------|----------------|------|
| `atendimento-validacao-inicial` | **BRIEFING** (seu prompt) | Atendimento |
| `design-artwork-barcode` | **REVISÃO DE EMBALAGENS** (seu prompt) | Design |
| `design-artwork-colorbox` | **REVISÃO DE EMBALAGENS** (seu prompt) | Design |
| `design-artwork-mastercarton` | **REVISÃO DE EMBALAGENS** (seu prompt) | Design |
| `cq-inspecao-final` | **REVISÃO SKETCH** (seu prompt) | CQ |

### 2. Novo Componente: Gerador de PDF

```typescript
// api/lib/pdf-generator.ts
export async function gerarRelatorioPDF(dados: {
  tipo: "briefing" | "revisao_embalagens" | "revisao_sketch";
  pedidoId: number;
  resultado: string; // Markdown do relatório
  responsavel: string;
}): Promise<Buffer> {
  // Usar biblioteca como PDFKit, Puppeteer, ou jsPDF
  // Gerar PDF profissional com layout alinhado
}
```

### 3. Integração no Fluxo

```typescript
// Fluxo completo no backend:

// FASE 1: Atendimento cadastra pedido
const pedido = await pedidoCreate({ codigo, nome, od: excelBase64 });

// FASE 1.5: IA Validator verifica OD
const validacao = await pedido.validarBriefing({ pedidoId: pedido.id });
if (!validacao.valido) {
  return { bloqueado: true, erros: validacao.erros };
}

// Gera PDF do briefing
const pdfBriefing = await gerarRelatorioPDF({
  tipo: "briefing",
  pedidoId: pedido.id,
  resultado: validacao.resumo,
  responsavel: atendente.name,
});

// Avança para Design
await workflow.avancarFase({ pedidoId: pedido.id });

// FASE 2: Designer faz upload de artwork
const comparacao = await comparacao.executar({
  pedidoId: pedido.id,
  prompt: "revisao_embalagens", // seu prompt
  documentos: [artworkPDF, odPDF],
});

// Gera PDF da revisão
const pdfRevisao = await gerarRelatorioPDF({
  tipo: "revisao_embalagens",
  pedidoId: pedido.id,
  resultado: comparacao.resumo,
});
```

---

## 🎯 Resumo para o Usuário

> **O IA Validator e o Comparador IA são dois lados da mesma moeda:**
> 
> 1. **IA Validator** garante que a **OD está correta** antes de qualquer trabalho começar
> 2. **Comparador IA** garante que o **trabalho segue a OD** em cada fase seguinte
> 
> Eles usam a mesma base de dados (a OD), mas respondem perguntas diferentes em momentos diferentes.
> 
> Os prompts que você escreveu são **muito superiores** aos atuais e devem substituí-los.

---

*Arquitetura DocCompare v2.0*
*IA Validator + Comparador IA Unificados*
