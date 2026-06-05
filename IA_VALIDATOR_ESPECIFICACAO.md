# IA Validator — Especificação Técnica Completa

## 1. O que é o IA Validator?

O **IA Validator** é um sistema de validação automática de documentos que usa Inteligência Artificial (Kimi k2.5) para verificar se a **Order Details (OD)** de um pedido está completa, correta e consistente **antes** de avançar para a fase de Design.

> **Analogia simples:** É como um fiscal de prefeitura que verifica se todos os documentos de uma construção estão em ordem antes de liberar o alvará. Se faltar algo, ele bloqueia e diz exatamente o que está errado.

---

## 2. O Problema que Resolve

### Cenário atual (sem IA Validator):
```
Atendente preenche OD → Designer recebe → Começa a trabalhar →
Descobre que CNPJ está errado → Para tudo → Volta para atendimento →
Perdeu 2 dias de trabalho
```

### Com IA Validator:
```
Atendente preenche OD → 🤖 IA valida em 5 segundos →
CNPJ errado detectado → Bloqueio imediato → Atendente corrige →
Só então avança para Design
```

### Dados reais da empresa (Maio/2026):
| Problema | Ocorrências/mês | Impacto |
|----------|----------------|---------|
| CNPJ incorreto/ausente | 28+ | Risco fiscal, retenção alfandegária |
| DUN-14/EAN-13 trocados | 15+ | Risco de recall, logística comprometida |
| SKUs ausentes na OD | 8+ | Produção não autorizada |
| Pesos/dimensões divergentes | 43+ | Frete errado, cubicagem incorreta |
| QR Code posicionado errado | 35+ | Rastreabilidade logística comprometida |

**Taxa de não-conformidade: 82%** 😱

---

## 3. Como Funciona (Arquitetura)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DO IA VALIDATOR                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   USUÁRIO    │
  │  (Atendente) │
  └──────┬───────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. CADASTRO DO PEDIDO                                                  │
  │     • Código SAT                                                        │
  │     • Nome do produto                                                   │
  │     • Upload da Order Details (Excel/CSV/PDF)                           │
  │     • NCM (código fiscal)                                               │
  │     • CNPJ do fornecedor                                                │
  └────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  2. EXTRATOR DE TEXTO (automático)                                      │
  │     • PDF digital → pdf-parse (texto nativo)                            │
  │     • PDF escaneado → Mistral OCR 3 ($0.001/página)                     │
  │     • Excel/CSV → XLSX parser                                           │
  │     • Imagem → Mistral OCR 3 → fallback Tesseract.js                    │
  │                                                                         │
  │     Resultado: texto estruturado da OD                                  │
  └────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  3. VALIDADOR PROGRAMÁTICO (regras duras)                               │
  │     ┌─────────────────────────────────────────────────────────────────┐ │
  │     │  Regra                          │ Função                        │ │
  │     ├─────────────────────────────────┼───────────────────────────────┤ │
  │     │  CNPJ                           │ Valida formato + DV (mód 11)  │ │
  │     │  EAN-13                         │ 13 dígitos + DV válido        │ │
  │     │  DUN-14                         │ 14 dígitos + DV + prefixo     │ │
  │     │  NCM                            │ Existe na tabela oficial      │ │
  │     │  Peso/Dimensões                 │ Presentes e > 0               │ │
  │     │  Campos obrigatórios            │ Não nulos                     │ │
  │     └─────────────────────────────────┴───────────────────────────────┘ │
  │                                                                         │
  │     Se falhar → ERRO BLOQUEANTE (não chama IA, já sabe o problema)      │
  └────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  4. VALIDADOR SEMÂNTICO (Kimi k2.5)                                     │
  │     "Valide se o código NCM [X] corresponde à descrição do produto [Y]  │
  │      Verifique se a descrição comercial bate com a descrição técnica.   │
  │      Identifique inconsistências entre SKUs."                           │
  │                                                                         │
  │     Temperature: 0 (determinístico, sem criatividade)                   │
  │     Resposta em JSON: { valido, erros[], sugestoes[] }                  │
  └────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  5. RESULTADO CONSOLIDADO                                               │
  │                                                                         │
  │     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
  │     │   ✅ APROVADO   │    │  ⚠️ ALERTAS     │    │   ❌ BLOQUEADO  │  │
  │     │                 │    │  (avisa mas     │    │  (não avança)   │  │
  │     │  Avança para    │    │  permite        │    │  Mostra lista   │  │
  │     │  Design         │    │  avanço)        │    │  de erros       │  │
  │     └─────────────────┘    └─────────────────┘    └─────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tecnologias Envolvidas

### Camada de Validação Programática (Regras Duras)

| Tecnologia | Função | Por que usamos |
|------------|--------|----------------|
| **Node.js** | Runtime do backend | Já é nosso stack |
| **Zod** | Validação de schemas | Valida tipos e formatos |
| **Algoritmo Módulo 11** | DV de CNPJ/EAN/DUN | Padrão brasileiro/GS1 |
| **Regex** | Formatação de campos | CNPJ: `XX.XXX.XXX/XXXX-XX` |

### Camada de Validação Semântica (IA)

| Tecnologia | Função | Por que usamos |
|------------|--------|----------------|
| **Kimi k2.5** | Análise semântica | Já integrado, custo baixo, português nativo |
| **Temperature: 0** | Resposta determinística | Não queremos criatividade, queremos precisão |
| **JSON Schema** | Resposta estruturada | Fácil de parsear no backend |

### Camada de OCR (Extração de Documentos)

| Tecnologia | Quando usar | Custo |
|------------|-------------|-------|
| **pdf-parse** | PDF digital (texto nativo) | $0 |
| **Mistral OCR 3** | PDF escaneado / imagem complexa | ~$0.001/página |
| **Tesseract.js** | Imagem simples / fallback / offline | $0 |

---

## 5. O que Será Implementado (Escopo)

### Fase 1.1: Backend (Semanas 3-4)

```typescript
// api/pedido-router.ts — Nova mutation
pedido.validarBriefing: authedQuery
  .input(z.object({
    pedidoId: z.number(),
    // Campos extraídos da OD ou informados manualmente
    ncm: z.string().optional(),
    cnpjFornecedor: z.string().optional(),
    documentoBase64: z.string().optional(), // OD em base64
  }))
  .mutation(async ({ input }) => {
    // 1. Extrair texto da OD (se houver documento)
    // 2. Validar CNPJ (programático)
    // 3. Validar EAN-13/DUN-14 (programático)
    // 4. Validar NCM semântico (Kimi k2.5)
    // 5. Retornar resultado consolidado
  })
```

**Novos arquivos backend:**
- `api/lib/validador-cnpj.ts` — Algoritmo módulo 11
- `api/lib/validador-ean.ts` — Dígito verificador GS1
- `api/lib/validador-ncm.ts` — Validação contra tabela oficial
- `api/lib/validador-od.ts` — Orquestrador (chama todos os validadores)

### Fase 1.2: Frontend (Semanas 5-6)

```tsx
// src/pages/NovaComparacao.tsx — Novo step no wizard
<Step validacaoOD>
  <CampoNCM />
  <CampoCNPJ />
  <UploadOD />
  <BotaoValidar onClick={validarBriefing} />
  
  {resultado.erros.length > 0 && (
    <PainelErros erros={resultado.erros} />
  )}
  
  {resultado.valido && <BotaoAvancarParaDesign />}
</Step>
```

**Novos componentes frontend:**
- `src/components/ValidadorOD.tsx` — Painel de validação
- `src/components/PainelErros.tsx` — Lista de erros com cores
- `src/components/CampoNCM.tsx` — Input com validação inline

### Fase 1.3: Banco de Dados (Migração)

```sql
-- Novas colunas na tabela pedidos
ALTER TABLE pedidos ADD COLUMN ncm VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN cnpj_fornecedor VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN briefing_validado BOOLEAN DEFAULT FALSE;
ALTER TABLE pedidos ADD COLUMN erros_validacao JSON;
```

---

## 6. Prompt do Kimi k2.5 (Detalhado)

```
Você é um analista fiscal e de compliance especialista em importação 
de brinquedos e produtos infantis para o mercado brasileiro.

RECEBA:
- Código NCM: {ncm}
- Descrição comercial: {descricao}
- CNPJ do fornecedor: {cnpj}
- Códigos de barras (EAN-13): {eans}
- DUN-14 (inner/master): {duns}
- Pesos e dimensões: {dimensoes}

VALIDE:
1. O NCM corresponde à descrição do produto?
   Exemplo: 9503.00.97 = "Outros brinquedos de plástico" → LANÇA BOLHAS ✓
   
2. O CNPJ é consistente com o nome do fornecedor declarado?
   
3. Os códigos EAN-13 são válidos e únicos entre SKUs?
   
4. Os DUN-14 têm prefixo correto (1=inner, 2=master)?
   
5. Os pesos e dimensões são fisicamente plausíveis?
   (Ex: peso bruto > peso líquido, dimensões > 0)
   
6. Há campos obrigatórios ausentes?

RESPONDA EM JSON:
{
  "valido": boolean,
  "confianca": number, // 0.0 a 1.0
  "erros": [
    {
      "campo": "cnpj|ncm|ean|dun|peso|dimensao|geral",
      "severidade": "bloqueante|alerta|info",
      "mensagem": "descrição do erro",
      "sugestao": "como corrigir"
    }
  ],
  "sugestoes": ["sugestão geral 1", "sugestão 2"]
}

Temperature: 0
```

---

## 7. Regras de Bloqueio

| Severidade | Comportamento | Exemplo |
|------------|---------------|---------|
| **BLOQUEANTE** | ❌ Não avança para Design | CNPJ inválido, EAN-13 duplicado, DUN-14 com prefixo errado |
| **ALERTA** | ⚠️ Avança com aviso | NCM não convencional, peso muito baixo, dimensão incomum |
| **INFO** | ℹ️ Apenas informa | Sugestão de otimização, campo opcional ausente |

---

## 8. KPIs de Sucesso do IA Validator

| Métrica | Linha de Base | Meta | Como medir |
|---------|--------------|------|-----------|
| Pedidos com dados errados no Design | 30% | < 5% | Contar pedidos que voltam da fase Design para Atendimento |
| Tempo de validação de briefing | 45 min | < 5 seg | Timestamp do cadastro até aprovação |
| Taxa de falsos negativos do validador | ? | < 2% | Pedidos que passaram na validação mas tinham erros |
| Satisfação do Designer | Baixa | Alta | Pesquisa interna (NPS) |

---

## 9. Diferença: IA Validator vs. Comparador IA

| | IA Validator | Comparador IA (já existe) |
|--|--------------|---------------------------|
| **Quando** | No cadastro do pedido | Durante a análise de design |
| **O quê** | Valida a OD (planilha) | Compara arte vs. OD |
| **Entrada** | Excel/PDF da OD | PDF da arte + foto |
| **Saída** | Lista de erros da OD | Lista de divergências visuais |
| **Bloqueia?** | Sim (se houver erro crítico) | Não (aponta para revisão humana) |
| **Quem usa** | Atendimento | Design / CQ |

---

*Documento técnico para implementação*
*DocCompare — Fase 1: IA Validator*
