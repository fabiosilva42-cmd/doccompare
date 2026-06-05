# Como Funcionam AQL, Métricas e Notificações

## 1. AQL — Amostragem de Qualidade (Revisão Humana)

### Como funciona HOJE:
```
Quando uma comparação termina e os itens são APROVADOS:
  └── Sistema sorteia 20% dos itens aleatoriamente
      └── Designa para um usuário do mesmo departamento revisar
          └── Revisor humano vê o que a IA disse
              ├── CONCORDA → "Aprovado" (registra que IA acertou)
              └── DISCORDA → "Divergência" (registra que IA errou)
                  └── Admin vê na tela "Divergências" para calibrar prompts
```

**Exemplo prático:**
- IA do CQ diz: "Color Box SAT12052-26-1 está OK, cor bate com OD"
- Revisor AQL olha e diz: "Não, a cor está errada, é ROSA não AZUL"
- Sistema registra: **Falso Negativo** da IA (IA disse OK mas deveria ter reprovado)
- Admin usa isso para melhorar o prompt do CQ

### Como funcionaria no NOVO sistema:
```
Fase Atendimento: comparação termina → itens aprovados → 20% sorteados
  └── Revisor do Atendimento confere se a IA acertou as contradições
      └── Se IA errou → divergência registrada → prompt melhorado

Fase Design: comparação termina → itens aprovados → 20% sorteados
  └── Revisor do Design confere se a IA acertou os erros do artwork

Fase CQ: comparação termina → itens aprovados → 20% sorteados
  └── Revisor do CQ confere se a IA acertou a inspeção final
```

**Valor:** O AQL é um "controle de qualidade da própria IA". Sem ele, você nunca sabe se a IA está acertando ou errando.

---

## 2. Métricas / Dashboard

### Como funciona HOJE:
O Dashboard mostra gráficos para admin:
- **Total de pedidos, comparações, concluídos** (cards animados)
- **Reprovação por departamento** (gráfico de barras)
  - "Design reprova 30% dos pedidos, CQ reprova 15%"
- **Reprovação por tipo de embalagem** (gráfico de pizza)
  - "Master Carton tem mais erros que Barcode Label"
- **Ranking de erros** (lista)
  - "Erro #1: Dimensões erradas (43x), Erro #2: QR Code posição (35x)"
- **Consumo de tokens por mês** (gráfico de linha)
  - "Gastamos $50 em tokens de IA em maio"

### Como funcionaria no NOVO sistema:
```
Dashboard mostraria:
├── Total de pedidos por fase
├── Taxa de aprovação por fase (Atendimento, Design, CQ)
├── Top erros encontrados pela validação programática
│   └── "DUN-14 com prefixo trocado: 15 ocorrências"
├── Top contradições encontradas pela IA multimodal
│   └── "OD vs PO: cor divergente: 8 ocorrências"
└── Consumo de tokens (custo de IA)
```

**Valor:** Você vê onde estão os gargalos. Se o Atendimento está aprovando 95% mas o CQ reprovando 40%, o problema está na Fase 1.

---

## 3. Notificações Push

### Como funciona HOJE:
```
Eventos que geram notificação:
├── Comparação concluída → notifica quem criou o pedido
├── Pedido avança de fase → notifica próximo departamento
│   └── "Pedido SAT12052-26-1 foi movido para Design"
├── Comparação reprovada → notifica criador + supervisores
├── Revisão AQL designada → notifica revisor
└── Notificação de sistema (manutenção, etc.)
```

### Como funcionaria no NOVO sistema:
```
Notificações essenciais:
├── Fase 1 concluída → notifica Design
│   └── "Pedido SAT12052-26-1: Validação concluída. PDF de apontamentos disponível."
├── Fase 2 concluída → notifica CQ
│   └── "Pedido SAT12052-26-1: Artwork revisado. Aguardando inspeção final."
├── Pedido reprovado → notifica criador + supervisor
│   └── "Pedido SAT12052-26-1 foi reprovado na fase de CQ."
└── Revisão AQL designada → notifica revisor
```

**Valor:** Sem notificações, o designer nunca sabe que tem um pedido novo para trabalhar. Precisa ficar atualizando a página.

---

## RESUMO COMPARATIVO

| Funcionalidade | Complexidade | Valor para você | Recomendação |
|----------------|-------------|-----------------|--------------|
| **AQL** | Média | ⭐⭐⭐⭐⭐ Essencial para calibrar a IA | **Manter** |
| **Notificações** | Baixa | ⭐⭐⭐⭐⭐ Sem isso, ninguém sabe quando trabalhar | **Manter** |
| **Métricas/Dashboard** | Alta | ⭐⭐⭐ Útil para gestão, mas não bloqueia operação | **Simplificar** |
| | | | Manter só: total pedidos, aprovação por fase, top erros |

---

*Qual sua decisão?*
