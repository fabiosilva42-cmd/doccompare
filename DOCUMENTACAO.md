# DocCompare — Documentação do Sistema

## 1. Visão Geral

**DocCompare** é uma plataforma de auditoria documental para pedidos de embalagem. Utiliza inteligência artificial (Kimi/Moonshot AI) para comparar documentos de diferentes departamentos (Atendimento, Design, CQ, Comex) e identificar discrepâncias entre especificações técnicas e documentos de produção.

**URL de produção:** `http://108.174.150.102:3000`

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS + shadcn/ui |
| **Backend** | Hono + tRPC + Drizzle ORM |
| **Banco de Dados** | MySQL 8.0 (Docker) |
| **AI/LLM** | Kimi (Moonshot AI) via API REST |
| **OCR** | Tesseract.js (português) |
| **Excel Parser** | xlsx (SheetJS) |
| **PDF Generation** | Playwright (HTML → PDF) |
| **Runtime** | Node.js 20 |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx |
| **Infra** | Ubuntu 22.04 + Docker |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Navegador (Cliente)                     │
│  React 19 + tRPC Client + TanStack Query + Tailwind CSS    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP/80
┌─────────────────────────────────────────────────────────────┐
│                        Nginx                                 │
│              Reverse Proxy (porta 80 → 3000)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ localhost:3000
┌─────────────────────────────────────────────────────────────┐
│                    DocCompare App                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Frontend   │  │  Hono Server │  │   tRPC Router    │  │
│  │  (Vite SPA)  │  │  (API HTTP)  │  │  (12 routers)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                            │                                  │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Drizzle ORM + MySQL 8.0                   │  │
│  │              (Docker Container)                        │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              API Kimi (Moonshot AI)                         │
│              api.moonshot.ai                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Funcionalidades Implementadas

### Fase 1 — Fundação
- ✅ Sistema de autenticação JWT próprio (login, registro, roles)
- ✅ Banco de dados reestruturado (10 tabelas)
- ✅ Sistema de prompts com versionamento automático
- ✅ Upload multi-documento por pedido (PDF, DOCX, XLSX, imagens)
- ✅ OCR com Tesseract.js (português) para imagens
- ✅ Parser Excel com SheetJS

### Fase 2 — Relatórios Granulares
- ✅ Serviço de geração de PDF com Playwright
- ✅ Template HTML profissional com CSS inline
- ✅ Interface de aprovação por embalagem (barcode_label, color_box, master_carton)
- ✅ Override de supervisor com justificativa

### Fase 3 — Dashboard + Divergência
- ✅ Métricas operacionais e de IA
- ✅ Dashboard com gráficos (Recharts)
- ✅ Módulo de divergência IA vs humano (falso_positivo, falso_negativo)

### Fase 4 — Workflow Sequencial + Notificações + AQL
- ✅ Workflow sequencial: Atendimento → Design → CQ → Comex
- ✅ Bloqueio de fases (próxima só libera quando anterior aprovada)
- ✅ Notificações in-app (próximo departamento, supervisor em reprovações)
- ✅ Sistema de AQL com atribuição automática de 20% dos processos
- ✅ Override supervisionado com justificativa
- ✅ Arquivamento automático

### Fase 5 — Deploy + Qualidade (implementada agora)
- ✅ Deploy em servidor VPS (Ubuntu 22.04)
- ✅ Docker Compose com MySQL 8.0
- ✅ PM2 para gerenciamento de processos Node.js
- ✅ Nginx como reverse proxy
- ✅ Upload AWS S3 (preparado, biblioteca instalada)
- ✅ Barra de progresso de upload com status por arquivo
- ✅ Modelo de output padrão configurável por prompt
- ✅ Workflow flexível (não obrigatório começar com atendimento)

---

## 5. Estrutura do Banco de Dados

### Tabelas (10 tabelas)

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema (role, departamento, isSupervisor) |
| `pedidos` | Pedidos/processos (códigoPedido, statusGeral, faseAtual, dadosCliente) |
| `prompts` | Prompts de análise por departamento (com versionamento) |
| `comparacoes` | Rodadas de comparação (v1, v2...) por departamento |
| `comparacaoItens` | Resultados por tipo de embalagem |
| `analiseItens` | Itens individualizados (campo, valorEsperado, valorEncontrado) |
| `documentos` | Arquivos enviados (tipoDocumento, tipoEmbalagem, conteudoExtraido) |
| `divergencias` | Divergências IA vs humano |
| `revisoesAql` | Revisões de amostragem (20% dos itens aprovados) |
| `notificacoes` | Notificações in-app |

### Diagrama de Relacionamentos

```
users (1) ────────< (N) pedidos
                  │
                  ├─< (N) comparacoes ──< (N) comparacaoItens ──< (N) analiseItens
                  │        │
                  │        └─< (N) documentos
                  │
                  ├─< (N) divergencias
                  ├─< (N) notificacoes
                  └─< (N) revisoesAql

prompts (1) ──────< (N) comparacoes
```

---

## 6. API (tRPC Routers)

### Routers Disponíveis (12)

| Router | Path | Descrição |
|--------|------|-----------|
| `auth` | `/api/trpc/auth.*` | Login, registro, JWT, me, logout |
| `pedido` | `/api/trpc/pedido.*` | CRUD de pedidos/processos |
| `comparacao` | `/api/trpc/comparacao.*` | Criar, executar, aprovar itens, gerar PDF |
| `documento` | `/api/trpc/documento.*` | Listar documentos por pedido |
| `upload` | `/api/trpc/upload.*` | Upload de arquivos com extração de texto |
| `prompt` | `/api/trpc/prompt.*` | CRUD de prompts com versionamento |
| `setup` | `/api/trpc/setup.*` | Seed de dados iniciais |
| `usuario` | `/api/trpc/usuario.*` | Gestão de usuários |
| `pdf` | `/api/trpc/pdf.*` | Geração de relatórios PDF |
| `metricas` | `/api/trpc/metricas.*` | Dashboard e métricas |
| `divergencia` | `/api/trpc/divergencia.*` | Módulo IA vs humano |
| `workflow` | `/api/trpc/workflow.*` | Avanço/reprovação de fases |
| `notificacao` | `/api/trpc/notificacao.*` | Notificações in-app |
| `aql` | `/api/trpc/aql.*` | Revisões AQL e estatísticas |

### Endpoints Principais

#### Auth
```
auth.login        — POST { email, password } → { token, user }
auth.register     — POST { name, email, password, adminKey? } → { token, user }
auth.me           — GET → User (requer Bearer token)
auth.logout       — POST → { success: true }
```

#### Pedidos
```
pedido.create     — POST { codigoPedido, nome, faseAtual?, dadosCliente? }
pedido.list       — GET → Pedidos do usuário logado
pedido.listAll    — GET → Todos os pedidos (admin)
pedido.getById    — GET { id } → Detalhe completo do pedido
pedido.updateStatus — POST { id, statusGeral }
pedido.updateFase — POST { id, faseAtual }
pedido.delete     — POST { id }
```

#### Comparação
```
comparacao.create       — POST { pedidoId, departamento, promptId }
comparacao.executar     — POST { comparacaoUuid }
comparacao.aprovarItem  — POST { comparacaoItemId, status, observacao? }
comparacao.getByUuid    — GET { uuid } → Resultado completo
comparacao.checkStatus  — GET { uuid } → Status da comparação
```

#### Workflow
```
workflow.verificarFase  — GET { pedidoId } → { podeAvancar, pendentes, reprovados }
workflow.avancarFase    — POST { pedidoId } → Avança para próxima fase
workflow.reprovarFase   — POST { pedidoId, observacao? } → Notifica correção
workflow.arquivar       — POST { pedidoId } → Arquiva pedido concluído
```

---

## 7. Workflow de Processos

### Fluxo Sequencial

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Atendimento │───▶│   Design    │───▶│     CQ      │───▶│    Comex    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
  Order Details     Barcode Label     Inspeção Final   Documentação
  Validação inicial Color Box        AQL (20%)         de Embarque
                    Master Carton
```

### Regras do Workflow
1. **Cada fase precisa ser aprovada** antes de avançar para a próxima
2. **Reprovação** mantém o pedido na mesma fase e notifica criador + supervisores
3. **Supervisor (admin ou isSupervisor)** pode fazer override em itens reprovados
4. **AQL automático**: 20% dos itens aprovados são designados aleatoriamente para revisão humana
5. **Arquivamento**: pedidos concluídos podem ser arquivados automaticamente

---

## 8. Sistema de AQL (Amostragem de Qualidade)

### Funcionamento
1. Quando uma comparação é **concluída**, o sistema designa automaticamente **20%** dos itens aprovados para revisão humana
2. Os revisores são sorteados entre usuários do departamento **CQ** ou **supervisores**
3. O revisor pode:
   - **Concordar com a IA** (aprovado)
   - **Identificar divergência** (gera registro no módulo de divergências)

### Estatísticas
```
aql.estatisticas — GET → { totalRevisoes, pendentes, concluidas, divergencias }
aql.minhasRevisoes — GET → Revisões designadas para o usuário logado
aql.submeterRevisao — POST { revisaoId, resultado, observacao? }
```

---

## 9. Módulo de Divergências (IA vs Humano)

### Tipos
- **falso_positivo**: IA disse que estava errado, mas humano confirmou que está correto
- **falso_negativo**: IA aprovou, mas humano encontrou erro (via AQL)

### Endpoints
```
divergencia.list      — GET → Divergências não resolvidas
divergencia.create    — POST { comparacaoItemId, tipo, descricaoHumano, descricaoIA?, campoAfetado? }
divergencia.resolver  — POST { id, resolvido }
divergencia.estatisticas — GET → Estatísticas (admin)
```

---

## 10. Variáveis de Ambiente

### ⚠️ IMPORTANTE — Configuração do PM2

O `dotenv` é tratado como **external** no build do esbuild (`--external:dotenv`). Isso significa que o arquivo `.env` **não é carregado automaticamente** pelo bundle em produção. As variáveis de ambiente devem ser definidas no **PM2 ecosystem**.

### Arquivo `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'doccompare',
    script: './dist/boot.js',
    cwd: '/var/www/doccompare',
    env: {
      NODE_ENV: 'production',
      APP_ID: 'sk-bYwHgT8Ob1HsBRluM6Yk3lfkqMPJMvkCOuHMgXF1vxqieU0d',
      APP_SECRET: 'doccompare-secret-key-2024-jwt-signing',
      KIMI_AUTH_URL: 'https://api.moonshot.ai',
      KIMI_OPEN_URL: 'https://api.moonshot.ai',
      DATABASE_URL: 'mysql://doccompare:DocCompareDB@2026@localhost:3306/doccompare'
    }
  }]
};
```

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `APP_ID` | Token da API Kimi (Moonshot) | `sk-...` |
| `APP_SECRET` | Segredo para JWT | string aleatória |
| `KIMI_AUTH_URL` | URL de autenticação Kimi | `https://api.moonshot.ai` |
| `KIMI_OPEN_URL` | URL da API OpenAI Kimi | `https://api.moonshot.ai` |
| `DATABASE_URL` | Conexão MySQL | `mysql://user:pass@host:3306/db` |

### Variáveis Opcionais

```bash
# Porta do servidor (padrão: 3000)
PORT=3000

# AWS S3 (preparado para uso futuro)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua-aws-key
AWS_SECRET_ACCESS_KEY=sua-aws-secret
AWS_S3_BUCKET=doccompare-uploads
```

### Modelo da API Kimi

- **Modelo atual:** `kimi-k2.5` (com reasoning)
- **Temperature:** `1` (único valor aceito pelo k2.5)
- **Endpoint:** `/v1/chat/completions`
- **URL base:** `https://api.moonshot.ai`

---

## 11. Deploy e Infraestrutura

### Servidor
- **IP:** 108.174.150.102
- **Porta SSH:** 22022
- **Usuário:** root
- **SO:** Ubuntu 22.04.5 LTS

### Serviços em Execução

| Serviço | Porta | Status | Container |
|---------|-------|--------|-----------|
| DocCompare (Node.js) | 3000 | ✅ PM2 | — |
| Nginx | 80/443 | ✅ Ativo | — |
| MySQL 8.0 | 3306 | ✅ Docker | `doccompare-mysql` |

### MySQL Docker

- **Imagem:** `mysql:8.0`
- **Container:** `doccompare-mysql`
- **Credenciais:**
  - Root: `root` / `DocCompareRoot@2026`
  - App: `doccompare` / `DocCompareDB@2026`
- **Banco:** `doccompare`

### Comandos Úteis no Servidor

```bash
# Ver status da aplicação
pm2 status
pm2 logs doccompare --lines 50
pm2 logs doccompare --err --lines 50

# Reiniciar app
pm2 restart doccompare

# Parar e iniciar com ecosystem
pm2 stop doccompare
pm2 start /var/www/doccompare/ecosystem.config.js
pm2 save

# Logs do banco de dados
docker logs --tail 50 doccompare-mysql

# Acessar MySQL dentro do container
docker exec doccompare-mysql mysql -u doccompare -pDocCompareDB@2026 doccompare -e "SHOW TABLES;"

# Migrations
npx drizzle-kit migrate
npx drizzle-kit push
```

---

## 12. Problemas Conhecidos e Soluções

### ❌ `dotenv` não carrega em produção
**Causa:** O esbuild bundleia o `dotenv`, que não consegue encontrar o `.env` em runtime.
**Solução:** Adicionar `--external:dotenv` no build e usar PM2 ecosystem para variáveis.

### ❌ `crypto.randomUUID()` falha em HTTP
**Causa:** `crypto.randomUUID()` requer contexto seguro (HTTPS ou localhost).
**Solução:** Substituir por `generateId()` com `Date.now()` + `Math.random()`.

### ❌ API Kimi retorna 404
**Causa:** URL ou endpoint incorreto.
**Solução:** Usar `https://api.moonshot.ai/v1/chat/completions` (não `/api/chat/completions` nem `.cn`).

### ❌ Modelo `kimi-latest` não encontrado
**Causa:** O modelo `kimi-latest` não existe na API Moonshot.
**Solução:** Usar `kimi-k2.5` (com reasoning, temperature=1).

### ❌ Upload de arquivos grandes falha
**Causa:** Body limit do Hono ou timeout do navegador.
**Solução:** Aumentar `bodyLimit` para 100MB e usar `httpLink` (não `httpBatchLink`) no tRPC.

---

## 13. Páginas do Sistema

| Rota | Descrição | Permissão |
|------|-----------|-----------|
| `/login` | Tela de login/registro | Pública |
| `/dashboard` | Dashboard com métricas | Autenticado |
| `/nova-comparacao` | Criar nova comparação | Autenticado |
| `/resultado/:uuid` | Resultado da análise | Autenticado |
| `/historico` | Histórico de pedidos | Autenticado |
| `/notificacoes` | Notificações in-app | Autenticado |
| `/revisoes-aql` | Revisões AQL designadas | Autenticado |
| `/admin/prompts` | Gestão de prompts | Admin |
| `/admin/usuarios` | Gestão de usuários | Admin |
| `/admin/divergencias` | Divergências IA vs humano | Admin |

---

## 14. Credenciais de Acesso

### Administrador Padrão
| Campo | Valor |
|-------|-------|
| Email | `admin@doccompare.com` |
| Senha | `admin123` |
| Role | `admin` |
| Departamento | `admin` |
| Supervisor | Sim |

### API Kimi (Moonshot AI)
As credenciais da API Kimi estão configuradas no PM2 ecosystem. Para trocar:
```bash
ssh -p 22022 root@108.174.150.102
nano /var/www/doccompare/ecosystem.config.js
pm2 restart doccompare
```

---

## 15. Guias de Uso

### Criar uma Nova Comparação
1. Acesse **Nova Comparação**
2. Envie os documentos (arraste ou selecione)
3. Preencha código do pedido e nome (opcional)
4. Clique em **"Próximo"**
5. Selecione o **tipo de análise** (prompt por departamento)
6. Clique em **"Executar Comparação"**
7. Acompanhe o **painel de progresso**
8. Redirecionado automaticamente para o resultado

### Aprovar/Reprovar Itens
1. Acesse o resultado da comparação
2. Cada embalagem (barcode_label, color_box, master_carton) tem botões
3. Clique **Aprovar** ou **Reprovar** por embalagem
4. Supervisores podem usar **Override** com justificativa

### Avançar Fase do Pedido
1. No resultado, quando todos os itens estiverem aprovados
2. Clique em **"Avançar para [próxima fase]"**
3. O próximo departamento será notificado automaticamente

### Revisão AQL
1. Acesse **Revisões AQL**
2. Itens designados aparecem na lista
3. Reveja o resultado da IA
4. Clique **"Concordo com IA"** ou **"Divergência com IA"**
5. Divergências são registradas automaticamente

---

## 16. Desenvolvimento

### Comandos Locais
```bash
# Instalar dependências
npm install

# Ambiente de desenvolvimento
npm run dev

# Build de produção
npm run build

# Type check
npm run check

# Testes
npm run test

# Migrations
npm run db:generate
npm run db:migrate
npm run db:push
```

### Estrutura de Pastas
```
├── api/                    # Backend (Hono + tRPC)
│   ├── routers/           # Sub-routers tRPC
│   ├── lib/               # Serviços (PDF, S3, env)
│   ├── queries/           # Conexão com banco
│   └── middleware.ts      # Auth e roles
├── src/                    # Frontend (React)
│   ├── pages/             # Páginas
│   ├── components/        # Componentes reutilizáveis
│   ├── hooks/             # Custom hooks
│   └── providers/         # Contextos (tRPC, auth)
├── db/
│   ├── schema.ts          # Schema Drizzle ORM
│   └── migrations/        # Migrations SQL
├── contracts/              # Types compartilhados
└── DOCUMENTACAO.md        # Este arquivo
```

---

## 17. Roadmap Futuro

- [ ] Upload AWS S3 (binários dos documentos)
- [ ] Notificações por email/SMS
- [keep  ] Kanban/Pipeline visual de pedidos
- [ ] Filtros avançados no histórico
- [ ] Exportação CSV/Excel
- [ ] Integração com ERP (SAT)
- [ ] CI/CD com GitHub Actions
- [ ] Testes automatizados (Vitest)
- [ ] Health checks e monitoramento

---
## 18. Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `pm2 logs doccompare`
2. Verifique o banco: `docker logs doccompare-mysql`
3. Verifique a API: `curl 'http://localhost:3000/api/trpc/ping?input=%7B%22json%22%3Anull%7D'`
4. Verifique as variáveis: `pm2 show doccompare`

---

*Documentação atualizada em: 31/05/2026*
*Versão do sistema: 0.0.0*
