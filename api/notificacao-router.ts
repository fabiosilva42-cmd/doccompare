import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { notificacoes } from "@db/schema";

export const notificacaoRouter = createRouter({
  // Listar notificações do usuário logado
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(notificacoes)
      .where(eq(notificacoes.userId, ctx.user.id))
      .orderBy(desc(notificacoes.createdAt))
      .limit(50);
    return rows;
  }),

  // Contar notificações não lidas
  countNaoLidas: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificacoes)
      .where(
        and(eq(notificacoes.userId, ctx.user.id), eq(notificacoes.lida, false))
      );
    return rows.at(0)?.count ?? 0;
  }),

  // Marcar como lida
  marcarLida: authedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(notificacoes)
        .set({ lida: true })
        .where(
          and(eq(notificacoes.id, input.id), eq(notificacoes.userId, ctx.user.id))
        );
      return { success: true };
    }),

  // Marcar todas como lidas
  marcarTodasLidas: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(notificacoes)
      .set({ lida: true })
      .where(
        and(eq(notificacoes.userId, ctx.user.id), eq(notificacoes.lida, false))
      );
    return { success: true };
  }),

  // Excluir notificação
  delete: authedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(notificacoes)
        .where(
          and(eq(notificacoes.id, input.id), eq(notificacoes.userId, ctx.user.id))
        );
      return { success: true };
    }),
});
