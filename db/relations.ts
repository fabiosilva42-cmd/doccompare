import { relations } from "drizzle-orm";
import {
  users,
  pedidos,
  prompts,
  comparacoes,
  comparacaoItens,
  analiseItens,
  documentos,
  divergencias,
  revisoesAql,
  notificacoes,
} from "./schema";

// ── Users ───────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  pedidos: many(pedidos),
  comparacoes: many(comparacoes),
  comparacaoItensAprovados: many(comparacaoItens),
  analiseItensAprovados: many(analiseItens),
  divergenciasResolvidas: many(divergencias),
  revisoesAqlDesignadas: many(revisoesAql),
  notificacoes: many(notificacoes),
}));

// ── Pedidos ─────────────────────────────────────────────────────────
export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  criadoPor: one(users, {
    fields: [pedidos.userId],
    references: [users.id],
  }),
  documentos: many(documentos),
  comparacoes: many(comparacoes),
}));

// ── Prompts ─────────────────────────────────────────────────────────
export const promptsRelations = relations(prompts, ({ many }) => ({
  comparacoes: many(comparacoes),
}));

// ── Comparacoes ─────────────────────────────────────────────────────
export const comparacoesRelations = relations(comparacoes, ({ one, many }) => ({
  pedido: one(pedidos, {
    fields: [comparacoes.pedidoId],
    references: [pedidos.id],
  }),
  prompt: one(prompts, {
    fields: [comparacoes.promptId],
    references: [prompts.id],
  }),
  itens: many(comparacaoItens),
  documentos: many(documentos),
}));

// ── Comparacao Itens ────────────────────────────────────────────────
export const comparacaoItensRelations = relations(comparacaoItens, ({ one, many }) => ({
  comparacao: one(comparacoes, {
    fields: [comparacaoItens.comparacaoId],
    references: [comparacoes.id],
  }),
  aprovadoPorUsuario: one(users, {
    fields: [comparacaoItens.aprovadoPor],
    references: [users.id],
  }),
  analiseItens: many(analiseItens),
  divergencias: many(divergencias),
  revisoesAql: many(revisoesAql),
}));

// ── Analise Itens ───────────────────────────────────────────────────
export const analiseItensRelations = relations(analiseItens, ({ one }) => ({
  comparacaoItem: one(comparacaoItens, {
    fields: [analiseItens.comparacaoItemId],
    references: [comparacaoItens.id],
  }),
  aprovadoPorUsuario: one(users, {
    fields: [analiseItens.aprovadoPor],
    references: [users.id],
  }),
}));

// ── Documentos ──────────────────────────────────────────────────────
export const documentosRelations = relations(documentos, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [documentos.pedidoId],
    references: [pedidos.id],
  }),
  comparacao: one(comparacoes, {
    fields: [documentos.comparacaoId],
    references: [comparacoes.id],
  }),
}));

// ── Divergencias ────────────────────────────────────────────────────
export const divergenciasRelations = relations(divergencias, ({ one }) => ({
  comparacaoItem: one(comparacaoItens, {
    fields: [divergencias.comparacaoItemId],
    references: [comparacaoItens.id],
  }),
  resolvidoPorUsuario: one(users, {
    fields: [divergencias.resolvidoPor],
    references: [users.id],
  }),
}));

// ── Revisoes AQL ────────────────────────────────────────────────────
export const revisoesAqlRelations = relations(revisoesAql, ({ one }) => ({
  comparacaoItem: one(comparacaoItens, {
    fields: [revisoesAql.comparacaoItemId],
    references: [comparacaoItens.id],
  }),
  designadoParaUsuario: one(users, {
    fields: [revisoesAql.designadoPara],
    references: [users.id],
  }),
}));

// ── Notificacoes ────────────────────────────────────────────────────
export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  user: one(users, {
    fields: [notificacoes.userId],
    references: [users.id],
  }),
}));
