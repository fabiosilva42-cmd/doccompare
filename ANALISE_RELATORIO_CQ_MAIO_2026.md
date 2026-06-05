# Análise do Relatório CQ — Maio/2026
## Calibração de KPIs e Funcionalidades do DocCompare

---

## 📊 Dados Brutos do Relatório

| Indicador | Valor |
|-----------|-------|
| Relatórios analisados | 78 |
| Pedidos SAT | 72 |
| Produtos/SKUs revisados | 530+ |
| Taxa de não-conformidade | **~82%** |
| Aprovação integral sem ressalvas | **< 10%** |
| Média de erros por pedido | **4,5** |
| Correção necessária | ~35 (48,6%) |
| Reprovados | ~22 (30,6%) |

---

## 🎯 Top 5 Problemas Reais (vs. Nossas Soluções)

| # | Problema Real | Ocorrências | Solução DocCompare | Fase |
|---|--------------|-------------|-------------------|------|
| 1 | **Dimensões e Pesos Divergentes** | 43+ | Comparador IA (já existe) + IA Validator | 1 |
| 2 | **QR Code — Posicionamento Incorreto** | 35+ | ZXing + Preflight (validação geométrica) | 2 |
| 3 | **CNPJ — Incorreto ou Ausente** | 28+ | IA Validator (campos obrigatórios SAT) | 1 |
| 4 | **Códigos de Barras DUN14/EAN13** | 15+ | ZXing (leitura + validação de prefixo) | 2 |
| 5 | **SKUs Ausentes na OD** | 8+ | IA Validator (completude da OD) | 1 |

---

## 🔍 Insights Críticos

### 1. O Problema NÃO é só "dados errados no atendimento"

O relatório mostra que **82% dos pedidos têm não-conformidade** — mas isso inclui erros que aparecem em **todos os estágios**:
- OD (Order Details) incompleta → **IA Validator resolve**
- Artwork com CNPJ errado → **IA Validator resolve**
- Sketch com dimensões divergentes → **Comparador IA resolve**
- QR Code posicionado errado na contraprova → **ZXing + Preflight resolve**

### 2. Os erros de código de barras são operacionais, não só técnicos

Não basta "ler" o código de barras — precisamos **validar regras de negócio**:
- Prefixo DUN14: inner="1", master="2"
- EAN-13 não pode ser trocado entre SKUs
- QR Code posicionado segundo regra: `largura > altura = topo; altura > largura = lateral`

### 3. A OD (Order Details) é o ponto de falha #1

Se a OD não tem:
- CNPJ correto
- Peso e dimensões
- Composição do material
- EAN-13 cadastrado
- DUN14 com prefixo correto

...todo o resto do processo fica comprometido.

**Conclusão: O IA Validator deve focar em VALIDAR A OD antes de qualquer coisa.**

---

## 📐 Regras de Negócio para Implementar

### Regra 1: Validação de CNPJ na OD
```
"Extraia o CNPJ do campo 'fornecedor' ou 'remetente' na OD.
Valide o dígito verificador (módulo 11).
Se CNPJ ausente ou inválido: BLOQUEAR."
```

### Regra 2: Validação de DUN14/EAN-13
```
"Verifique todos os códigos de barras na OD:
- DUN14 deve começar com '2' (master) ou '1' (inner)
- EAN-13 deve ter 13 dígitos e dígito verificador válido
- Nenhum código pode se repetir entre SKUs diferentes"
```

### Regra 3: Completude da OD
```
"A OD deve conter obrigatoriamente:
✓ CNPJ do fornecedor (validado)
✓ Peso bruto e líquido por SKU
✓ Dimensões (C x L x A) por SKU
✓ Composição do material
✓ EAN-13 por SKU
✓ DUN14 por caixa master
✓ Tensão elétrica (se aplicável)
✓ Certificação INMETRO (se aplicável)"
```

### Regra 4: QR Code — Regra Geométrica
```
"Na validação de Master Box:
Se largura > altura → QR Code deve estar no TOPO
Se altura > largura → QR Code deve estar na LATERAL
```

---

## 🎯 KPIs Re-calibrados (Baseados em Dados Reais)

| KPI | Base Atual | Meta DocCompare | Impacto Esperado |
|-----|-----------|-----------------|------------------|
| Taxa de não-conformidade | 82% | < 30% | Reduz retrabalho em 52pts |
| Aprovação integral | < 10% | > 60% | Aumenta produtividade 6x |
| Erros por pedido | 4,5 | < 1,0 | Reduz 78% das refações |
| CNPJ incorreto | 28+ casos/mês | 0 | Elimina risco fiscal |
| QR Code posicionado errado | 35+ casos/mês | 0 | Elimina risco logístico |
| Códigos de barras trocados | 15+ casos/mês | 0 | Elimina risco de recall |

---

## 🗺️ Ajuste no Roadmap

### Fase 1: IA Validator (Semanas 3-6) — PRIORIDADE MÁXIMA

Agora sabemos que o foco deve ser:
1. **Validador de OD Completa** (não só NCM)
   - CNPJ (formato + dígito verificador)
   - DUN14/EAN-13 (prefixo + unicidade entre SKUs)
   - Peso e dimensões presentes
   - Composição do material
   - Certificações (INMETRO, etc.)

2. **Bloqueio físico** se OD não passar na validação

### Fase 2: ZXing + Preflight (Semanas 7-10)

Foco em:
1. **Leitor de código de barras** com validação de prefixo DUN14
2. **Validação geométrica de QR Code** (regra largura/altura)
3. **Checklist técnico automático** antes de aprovar CQ

### Fase 3: Feedback Interpreter (Semanas 11-12)

Menos prioritário agora — os dados reais mostram que o problema é **falta de validação técnica**, não **interpretação subjetiva**.

---

## 💡 Recomendação Estratégica

> Com base nos dados reais do CQ, a **Fase 1 (IA Validator)** deve ser EXPANDIDA para incluir validação completa da OD, não só NCM. O NCM é importante, mas o CNPJ e os códigos de barras são os erros que mais causam retrabalho e risco legal.

---

*Análise baseada no Relatório Executivo de CQ — Maio/2026*
*DocCompare — Plataforma de Auditoria Documental*
