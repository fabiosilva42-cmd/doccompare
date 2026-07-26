import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

// ── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  departamento: mysqlEnum("departamento", [
    "atendimento",
    "design",
    "cq",
    "supervisor",
    "admin",
  ]),
  isSupervisor: boolean("is_supervisor").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Pedidos (Processos / Ordens de Compra) ──────────────────────────
export const pedidos = mysqlTable("pedidos", {
  id: serial("id").primaryKey(),
  codigoPedido: varchar("codigo_pedido", { length: 100 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  statusGeral: mysqlEnum("status_geral", [
    "pendente",
    "em_andamento",
    "concluido",
    "arquivado",
    "cancelado",
  ])
    .default("pendente")
    .notNull(),
  faseAtual: mysqlEnum("fase_atual", [
    "atendimento",
    "design",
    "cq",
    "concluido",
    "arquivado",
  ])
    .default("atendimento")
    .notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  dadosCliente: json("dados_cliente").$type<{
    nomeCliente?: string;
    numeroPI?: string;
    numeroPO?: string;
    fornecedor?: string;
    quantidade?: number;
    dataEntrega?: string;
    observacoes?: string;
  }>(),
  arquivadoAt: timestamp("arquivado_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Pedido = typeof pedidos.$inferSelect;
export type InsertPedido = typeof pedidos.$inferInsert;

// ── Prompts (antes analise_tipos, expandido) ────────────────────────
export const prompts = mysqlTable("prompts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  departamento: mysqlEnum("departamento", [
    "atendimento",
    "design",
    "cq",
  ]).notNull(),
  tipoEmbalagem: mysqlEnum("tipo_embalagem", [
    "barcode_label",
    "color_box",
    "master_carton",
    "todos",
  ])
    .default("todos")
    .notNull(),
  promptSistema: text("prompt_sistema").notNull(),
  promptUsuario: text("prompt_usuario"),
  modeloOutput: text("modelo_output"),
  variaveis: json("variaveis").$type<
    Array<{ nome: string; descricao: string; obrigatorio: boolean }>
  >(),
  icone: varchar("icone", { length: 50 }).notNull().default("FileText"),
  badge: varchar("badge", { length: 20 }).notNull().default("BASICO"),
  ordem: int("ordem").notNull().default(0),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  versao: int("versao").notNull().default(1),
  promptPaiId: bigint("prompt_pai_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

// ── Comparacoes (rodadas v1, v2...) ─────────────────────────────────
export const comparacoes = mysqlTable("comparacoes", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  pedidoId: bigint("pedido_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => pedidos.id),
  versao: int("versao").notNull().default(1),
  departamento: mysqlEnum("departamento", [
    "atendimento",
    "design",
    "cq",
  ]).notNull(),
  promptId: bigint("prompt_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => prompts.id),
  status: mysqlEnum("status", [
    "pendente",
    "processando",
    "concluido",
    "erro",
  ])
    .default("pendente")
    .notNull(),
  mensagemErro: text("mensagem_erro"),
  tokensEntrada: int("tokens_entrada"),
  tokensSaida: int("tokens_saida"),
  tempoProcessamento: int("tempo_processamento"),
  modelo: varchar("modelo", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Comparacao = typeof comparacoes.$inferSelect;
export type InsertComparacao = typeof comparacoes.$inferInsert;

// ── Comparacao Itens (resultado por embalagem) ──────────────────────
export const comparacaoItens = mysqlTable("comparacao_itens", {
  id: serial("id").primaryKey(),
  comparacaoId: bigint("comparacao_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => comparacoes.id),
  tipoEmbalagem: mysqlEnum("tipo_embalagem", [
    "barcode_label",
    "color_box",
    "master_carton",
  ]).notNull(),
  status: mysqlEnum("status", [
    "pendente",
    "aprovado",
    "reprovado",
    "parcial",
  ])
    .default("pendente")
    .notNull(),
  resumoExecutivo: text("resumo_executivo"),
  secoes: json("secoes").$type<
    Array<{
      titulo: string;
      conteudo: string;
      severidade: "info" | "warning" | "critical";
    }>
  >(),
  tabelaComparativa: json("tabela_comparativa").$type<
    Array<{
      item: string;
      valores: Record<string, string>;
      diferenca: boolean;
    }>
  >(),
  tokensEntrada: int("tokens_entrada"),
  tokensSaida: int("tokens_saida"),
  tempoProcessamento: int("tempo_processamento"),
  modelo: varchar("modelo", { length: 100 }),
  aprovadoPor: bigint("aprovado_por", { mode: "number", unsigned: true }),
  aprovadoEm: timestamp("aprovado_em"),
  observacaoAprovacao: text("observacao_aprovacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ComparacaoItem = typeof comparacaoItens.$inferSelect;
export type InsertComparacaoItem = typeof comparacaoItens.$inferInsert;

// ── Analise Itens (item a item dentro de cada resultado) ────────────
export const analiseItens = mysqlTable("analise_itens", {
  id: serial("id").primaryKey(),
  comparacaoItemId: bigint("comparacao_item_id", {
    mode: "number",
    unsigned: true,
  })
    .notNull()
    .references(() => comparacaoItens.id),
  campo: varchar("campo", { length: 255 }).notNull(),
  valorEsperado: text("valor_esperado"),
  valorEncontrado: text("valor_encontrado"),
  status: mysqlEnum("status", ["ok", "warning", "critical", "nao_verificavel"])
    .default("ok")
    .notNull(),
  observacao: text("observacao"),
  thumbnailUrl: text("thumbnail_url"),
  aprovadoPor: bigint("aprovado_por", { mode: "number", unsigned: true }),
  aprovadoEm: timestamp("aprovado_em"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AnaliseItem = typeof analiseItens.$inferSelect;
export type InsertAnaliseItem = typeof analiseItens.$inferInsert;

// ── Documentos ──────────────────────────────────────────────────────
export const documentos = mysqlTable("documentos", {
  id: serial("id").primaryKey(),
  pedidoId: bigint("pedido_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => pedidos.id),
  comparacaoId: bigint("comparacao_id", { mode: "number", unsigned: true }),
  tipoDocumento: mysqlEnum("tipo_documento", [
    "order_details",
    "foto",
    "die_cut",
    "briefing",
    "artwork",
    "contraprova",
    "relatorio_inspecao",
    "packing_list",
    "commercial_invoice",
    "bill_of_lading",
    "outro",
  ])
    .default("outro")
    .notNull(),
  tipoEmbalagem: mysqlEnum("tipo_embalagem", [
    "barcode_label",
    "color_box",
    "master_carton",
    "nao_aplicavel",
  ])
    .default("nao_aplicavel")
    .notNull(),
  nomeOriginal: varchar("nome_original", { length: 255 }).notNull(),
  nomeArmazenado: varchar("nome_armazenado", { length: 255 }).notNull(),
  s3Key: varchar("s3_key", { length: 512 }),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  tamanhoBytes: bigint("tamanho_bytes", { mode: "number" }).notNull(),
  conteudoExtraido: text("conteudo_extraido"),
  conteudoOcr: text("conteudo_ocr"),
  ordem: int("ordem").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

// ── Divergencias (IA vs humano) ─────────────────────────────────────
export const divergencias = mysqlTable("divergencias", {
  id: serial("id").primaryKey(),
  comparacaoItemId: bigint("comparacao_item_id", {
    mode: "number",
    unsigned: true,
  })
    .notNull()
    .references(() => comparacaoItens.id),
  tipo: mysqlEnum("tipo", ["falso_positivo", "falso_negativo"]).notNull(),
  descricaoHumano: text("descricao_humano").notNull(),
  descricaoIA: text("descricao_ia"),
  campoAfetado: varchar("campo_afetado", { length: 255 }),
  resolvido: boolean("resolvido").default(false).notNull(),
  resolvidoPor: bigint("resolvido_por", { mode: "number", unsigned: true }),
  resolvidoEm: timestamp("resolvido_em"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Divergencia = typeof divergencias.$inferSelect;
export type InsertDivergencia = typeof divergencias.$inferInsert;

// ── Revisoes AQL ────────────────────────────────────────────────────
export const revisoesAql = mysqlTable("revisoes_aql", {
  id: serial("id").primaryKey(),
  comparacaoItemId: bigint("comparacao_item_id", {
    mode: "number",
    unsigned: true,
  })
    .notNull()
    .references(() => comparacaoItens.id),
  designadoPara: bigint("designado_para", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  designadoEm: timestamp("designado_em").defaultNow().notNull(),
  status: mysqlEnum("status", ["pendente", "em_revisao", "concluido"])
    .default("pendente")
    .notNull(),
  resultado: mysqlEnum("resultado", ["aprovado", "reprovado", "divergencia"]),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type RevisaoAql = typeof revisoesAql.$inferSelect;
export type InsertRevisaoAql = typeof revisoesAql.$inferInsert;

// ── Notificacoes ────────────────────────────────────────────────────
export const notificacoes = mysqlTable("notificacoes", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  tipo: mysqlEnum("tipo", [
    "comparacao_concluida",
    "comparacao_reprovada",
    "proxima_fase",
    "revisao_aql",
    "sistema",
  ]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  referenciaId: bigint("referencia_id", { mode: "number", unsigned: true }),
  referenciaTipo: varchar("referencia_tipo", { length: 50 }),
  lida: boolean("lida").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
