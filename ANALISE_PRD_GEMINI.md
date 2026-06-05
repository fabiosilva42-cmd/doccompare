# Análise do PRD do Gemini vs. DocCompare Real

## Legenda
| Emoji | Significado |
|-------|-------------|
| ✅ | Já existe no DocCompare |
| 🟢 | Faz sentido implementar |
| 🟡 | Útil no futuro, mas não prioridade |
| 🔴 | Não faz sentido (overkill ou conflita) |

---

## 1. Perfis de Usuário

| Perfil | Status | Comentário |
|--------|--------|------------|
| Administrador | ✅ | Já existe (`role: "admin"`) |
| Operador/Revisor | ✅ | Já existe (`departamento`: atendimento/design/cq) |
| Visualizador | 🟡 | Útil, mas baixa prioridade. Pode ser adicionado depois como `role: "viewer"` |

**Veredito:** Nada a mudar aqui. O que temos cobre 100%.

---

## 2. Módulos da Plataforma

### Dashboard (Visão Executiva)

| KPI do Gemini | Status | Comentário |
|---------------|--------|------------|
| Volume de Pedidos por Fase | ✅ | Dashboard já mostra |
| Taxa de Aprovação da IA | 🟢 | **Falta!** KPI importante. Podemos calcular: `itens aprovados sem revisão / total` |
| Taxa de Falsos Positivos | 🟢 | **Falta!** Já temos tabela `divergencias` — só falta expor no dashboard |
| Top Divergências | 🟢 | **Falta!** Fácil de implementar com `GROUP BY` no campo |
| Status de SLA | 🟡 | Útil, mas requer definir SLAs por fase primeiro |

**Veredito:** Os 3 primeiros KPIs são excelentes e fáceis de implementar. O SLA pode esperar.

---

### Gestão de Pedidos (Workflow)

| Funcionalidade | Status | Comentário |
|----------------|--------|------------|
| Kanban por fase | ✅ | Já existe (embora possa ser mais visual) |
| Lista com filtros | ✅ | Já existe em `/historico` |
| Tags de SLA | 🟡 | Útil, mas não urgente |

**Veredito:** Coberto. Melhorias visuais são bem-vindas, mas não bloqueantes.

---

### Motor de Comparação e IA

| Funcionalidade | Status | Comentário |
|----------------|--------|------------|
| Leitura de Order Details | ✅ | Upload de Excel/CSV + extração com XLSX |
| Upload em Lote | ✅ | Já existe (`uploadRouter` aceita array de arquivos) |
| **Visualizador Side-by-Side** | 🟢 | **NÃO EXISTE!** Esta é a funcionalidade mais valiosa do PRD. Ver PDF + arte lado a lado com destaques é essencial para o CQ. |
| Revisão Human-in-the-Loop | ✅ | Já existe (aprovar/reprovar itens) |
| Geração de PDF | ✅ | Já existe (`pdfRouter`) |

**Veredito:** O **visualizador side-by-side** é a grande contribuição do Gemini. Isso facilitaria MUITO o trabalho do CQ.

---

## 3. Fluxo de 4 Estágios

```
Gemini propõe:          Nosso sistema atual:
┌─────────────┐         ┌─────────────┐
│ Atendimento │   →     │ Atendimento │  ✅ Mesmo
├─────────────┤         ├─────────────┤
│ Design      │   →     │ Design      │  ✅ Mesmo
├─────────────┤         ├─────────────┤
│ Prova Forn. │   →     │ Contraprova │  🟡 Terminologia diferente
├─────────────┤         ├─────────────┤
│ Inspeção    │   →     │ CQ          │  ✅ Mesmo
└─────────────┘         └─────────────┘
```

**Veredito:** O fluxo é **identico** ao nosso. A diferença é só terminologia:
- "Prova do Fornecedor" = nossa "contraprova" (arte da fábrica)
- "Inspeção Final" = nosso "CQ" (controle de qualidade)

**Sugestão:** Podemos renomear "CQ" para "Inspeção Final" no frontend para ficar mais claro para o cliente.

---

## 4. Arquitetura Tecnológica — ONDE O GEMINI ERROU FEIO

| Componente | Gemini propõe | Nosso atual | Veredito |
|------------|---------------|-------------|----------|
| Frontend | React / Tailwind | ✅ React 19 + Tailwind | Mesma coisa |
| **Backend** | **Python FastAPI** | Hono + tRPC | 🔴 **NÃO MUDE!** Está funcionando perfeitamente. Trocar = 2 meses de trabalho. |
| **Processamento Assíncrono** | **Redis + Celery** | Processamento síncrono | 🔴 Overkill. Nosso volume não justifica. Kimi responde em 5-15s, é aceitável. |
| **IA** | **Gemini/GPT-4o** | Kimi k2.5 | 🔴 Não mude. Kimi k2.5 está funcionando, é mais barato, e já integrado. |
| **Banco** | **PostgreSQL** | MySQL 8.0 | 🔴 Não mude. Migrar banco = 1 mês de trabalho + risco de dados. |
| Armazenamento | AWS S3 | Local | 🟡 Útil no futuro para escalar, mas agora é overkill ($$) |
| Notificações | SendGrid/SES | Nenhuma | 🟡 Útil no futuro. Por enquanto as notificações in-app bastam. |

**Veredito:** O Gemini propôs uma arquitetura de **enterprise/unicórnio**. Nosso stack atual (React + Hono + tRPC + MySQL + Kimi) é **mais enxuto, mais barato e já funciona**. Trocar agora seria suicídio.

---

## 5. Considerações Técnicas Críticas

| Consideração | Status | Comentário |
|--------------|--------|------------|
| Evitar "Lost in the Middle" | ✅ | Já fazemos! Separamos por tipo de embalagem (barcode_label, color_box, master_carton) e enviamos para a IA separadamente. |
| Trilha de Auditoria | 🟢 | Parcial. Temos `aprovadoPor`, `aprovadoEm`, `createdAt`. Mas podemos expandir para log completo de todas as ações. |
| Imutabilidade dos Prompts | ✅ | Já existe. Só admin edita prompts. |

**Veredito:** Coberto ou facilmente expansível.

---

## 🎯 Resumo Executivo

### ✅ O que já temos (não precisa mudar):
- Arquitetura completa (React + Hono + tRPC + MySQL)
- Sistema de autenticação e permissões
- Upload e extração de documentos
- Motor de comparação com Kimi k2.5
- Workflow por fases
- Geração de PDF

### 🟢 O que faz sentido implementar (do PRD):
1. **Visualizador Side-by-Side** — Mostrar PDF/arte + Order Details lado a lado com destaques
2. **KPI: Taxa de Aprovação da IA** — `% de itens aprovados sem intervenção humana`
3. **KPI: Taxa de Falsos Positivos** — `% de divergências registradas pelo usuário`
4. **Top Divergências** — Gráfico dos erros mais comuns
5. **Logs de Auditoria completos** — Quem fez o quê e quando

### 🔴 O que NÃO faz sentido (do PRD):
1. Trocar backend para Python/FastAPI
2. Trocar banco para PostgreSQL
3. Trocar IA para Gemini/GPT-4o
4. Adicionar Redis + Celery
5. AWS S3 agora (custo desnecessário)

---

*Análise realizada em: 2026-06-01*
*Baseado no PRD gerado pelo Gemini vs. DocCompare v1.0*
