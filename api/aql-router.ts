import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  comparacaoItens,
  comparacoes,
  revisoesAql,
  divergencias,
  pedidos,
  users,
} from "@db/schema";
import { designarRevisoesAQL } from "./lib/aql-service";

export const aqlRouter = createRouter({
  // Designar automaticamente 20% dos itens concluídos para revisão AQL
  // Também chamado automaticamente quando uma comparação é concluída
  designarRevisoes: adminQuery
    .input(z.object({ comparacaoId: z.number().positive() }))
    .mutation(async ({ input }) => {
      const designados = await designarRevisoesAQL(input.comparacaoId);
      return { designados };
    }),

  // Listar revisões designadas para o usuário logado
  minhasRevisoes: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        id: revisoesAql.id,
        status: revisoesAql.status,
        resultado: revisoesAql.resultado,
        observacao: revisoesAql.observacao,
        designadoEm: revisoesAql.designadoEm,
        comparacaoItemId: revisoesAql.comparacaoItemId,
        pedidoCodigo: pedidos.codigoPedido,
        pedidoNome: pedidos.nome,
        tipoEmbalagem: comparacaoItens.tipoEmbalagem,
        departamento: comparacoes.departamento,
      })
      .from(revisoesAql)
      .leftJoin(comparacaoItens, eq(comparacaoItens.id, revisoesAql.comparacaoItemId))
      .leftJoin(comparacoes, eq(comparacoes.id, comparacaoItens.comparacaoId))
      .leftJoin(pedidos, eq(pedidos.id, comparacoes.pedidoId))
      .where(eq(revisoesAql.designadoPara, ctx.user.id))
      .orderBy(desc(revisoesAql.designadoEm));

    return rows;
  }),

  // Listar todas as revisões (admin)
  listarTodas: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: revisoesAql.id,
        status: revisoesAql.status,
        resultado: revisoesAql.resultado,
        observacao: revisoesAql.observacao,
        designadoEm: revisoesAql.designadoEm,
        comparacaoItemId: revisoesAql.comparacaoItemId,
        pedidoCodigo: pedidos.codigoPedido,
        pedidoNome: pedidos.nome,
        tipoEmbalagem: comparacaoItens.tipoEmbalagem,
        revisorNome: users.name,
      })
      .from(revisoesAql)
      .leftJoin(comparacaoItens, eq(comparacaoItens.id, revisoesAql.comparacaoItemId))
      .leftJoin(comparacoes, eq(comparacoes.id, comparacaoItens.comparacaoId))
      .leftJoin(pedidos, eq(pedidos.id, comparacoes.pedidoId))
      .leftJoin(users, eq(users.id, revisoesAql.designadoPara))
      .orderBy(desc(revisoesAql.designadoEm));

    return rows;
  }),

  // Submeter resultado da revisão
  submeterRevisao: authedQuery
    .input(
      z.object({
        revisaoId: z.number().positive(),
        resultado: z.enum(["aprovado", "reprovado", "divergencia"]),
        observacao: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verificar se a revisão pertence ao usuário
      const revRows = await db
        .select()
        .from(revisoesAql)
        .where(eq(revisoesAql.id, input.revisaoId))
        .limit(1);

      const revisao = revRows.at(0);
      if (!revisao) throw new Error("Revisao nao encontrada");
      if (revisao.designadoPara !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Esta revisao nao foi designada para voce");
      }

      await db
        .update(revisoesAql)
        .set({
          status: "concluido",
          resultado: input.resultado,
          observacao: input.observacao ?? null,
        })
        .where(eq(revisoesAql.id, input.revisaoId));

      // Se houve divergência, registrar
      if (input.resultado === "divergencia") {
        await db.insert(divergencias).values({
          comparacaoItemId: revisao.comparacaoItemId,
          tipo: "falso_negativo",
          descricaoHumano: input.observacao || "Divergencia identificada na revisao AQL",
          descricaoIA: "IA aprovou, humano identificou erro",
          campoAfetado: "Geral",
        });
      }

      return { success: true };
    }),

  // Estatísticas do AQL
  estatisticas: adminQuery.query(async () => {
    const db = getDb();

    const totalRevisoes = await db
      .select({ count: sql<number>`count(*)` })
      .from(revisoesAql);

    const pendentes = await db
      .select({ count: sql<number>`count(*)` })
      .from(revisoesAql)
      .where(eq(revisoesAql.status, "pendente"));

    const concluidas = await db
      .select({ count: sql<number>`count(*)` })
      .from(revisoesAql)
      .where(eq(revisoesAql.status, "concluido"));

    const divergenciasCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(revisoesAql)
      .where(eq(revisoesAql.resultado, "divergencia"));

    return {
      totalRevisoes: totalRevisoes.at(0)?.count ?? 0,
      pendentes: pendentes.at(0)?.count ?? 0,
      concluidas: concluidas.at(0)?.count ?? 0,
      divergencias: divergenciasCount.at(0)?.count ?? 0,
    };
  }),
});
