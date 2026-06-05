import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  divergencias,
  comparacaoItens,
  comparacoes,
  pedidos,
} from "@db/schema";

export const divergenciaRouter = createRouter({
  // Listar divergências não resolvidas
  list: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: divergencias.id,
        tipo: divergencias.tipo,
        descricaoHumano: divergencias.descricaoHumano,
        descricaoIA: divergencias.descricaoIA,
        campoAfetado: divergencias.campoAfetado,
        resolvido: divergencias.resolvido,
        resolvidoPor: divergencias.resolvidoPor,
        resolvidoEm: divergencias.resolvidoEm,
        createdAt: divergencias.createdAt,
        pedidoCodigo: pedidos.codigoPedido,
        pedidoNome: pedidos.nome,
        tipoEmbalagem: comparacaoItens.tipoEmbalagem,
        comparacaoItemId: comparacaoItens.id,
      })
      .from(divergencias)
      .leftJoin(comparacaoItens, eq(comparacaoItens.id, divergencias.comparacaoItemId))
      .leftJoin(comparacoes, eq(comparacoes.id, comparacaoItens.comparacaoId))
      .leftJoin(pedidos, eq(pedidos.id, comparacoes.pedidoId))
      .where(eq(divergencias.resolvido, false))
      .orderBy(desc(divergencias.createdAt));

    return rows;
  }),

  // Listar todas as divergências (admin)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: divergencias.id,
        tipo: divergencias.tipo,
        descricaoHumano: divergencias.descricaoHumano,
        descricaoIA: divergencias.descricaoIA,
        campoAfetado: divergencias.campoAfetado,
        resolvido: divergencias.resolvido,
        resolvidoPor: divergencias.resolvidoPor,
        resolvidoEm: divergencias.resolvidoEm,
        createdAt: divergencias.createdAt,
        pedidoCodigo: pedidos.codigoPedido,
        pedidoNome: pedidos.nome,
        tipoEmbalagem: comparacaoItens.tipoEmbalagem,
        comparacaoItemId: comparacaoItens.id,
      })
      .from(divergencias)
      .leftJoin(comparacaoItens, eq(comparacaoItens.id, divergencias.comparacaoItemId))
      .leftJoin(comparacoes, eq(comparacoes.id, comparacaoItens.comparacaoId))
      .leftJoin(pedidos, eq(pedidos.id, comparacoes.pedidoId))
      .orderBy(desc(divergencias.createdAt));

    return rows;
  }),

  // Criar divergência
  create: authedQuery
    .input(
      z.object({
        comparacaoItemId: z.number().positive(),
        tipo: z.enum(["falso_positivo", "falso_negativo"]),
        descricaoHumano: z.string().min(1),
        descricaoIA: z.string().optional(),
        campoAfetado: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(divergencias).values({
        comparacaoItemId: input.comparacaoItemId,
        tipo: input.tipo,
        descricaoHumano: input.descricaoHumano,
        descricaoIA: input.descricaoIA ?? null,
        campoAfetado: input.campoAfetado ?? null,
      });
      return { success: true };
    }),

  // Resolver divergência
  resolver: authedQuery
    .input(
      z.object({
        id: z.number().positive(),
        resolvido: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(divergencias)
        .set({
          resolvido: input.resolvido,
          resolvidoPor: ctx.user.id,
          resolvidoEm: new Date(),
        })
        .where(eq(divergencias.id, input.id));
      return { success: true };
    }),

  // Estatísticas de divergências
  estatisticas: adminQuery.query(async () => {
    const db = getDb();

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(divergencias);

    const resolvidas = await db
      .select({ count: sql<number>`count(*)` })
      .from(divergencias)
      .where(eq(divergencias.resolvido, true));

    const pendentes = await db
      .select({ count: sql<number>`count(*)` })
      .from(divergencias)
      .where(eq(divergencias.resolvido, false));

    const porTipo = await db
      .select({
        tipo: divergencias.tipo,
        count: sql<number>`count(*)`,
      })
      .from(divergencias)
      .groupBy(divergencias.tipo);

    return {
      total: total.at(0)?.count ?? 0,
      resolvidas: resolvidas.at(0)?.count ?? 0,
      pendentes: pendentes.at(0)?.count ?? 0,
      porTipo,
    };
  }),
});
