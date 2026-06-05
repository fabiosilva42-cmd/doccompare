import { z } from "zod";
import { sql, eq, and } from "drizzle-orm";
import { createRouter, adminQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { pedidos, comparacoes, comparacaoItens, analiseItens, divergencias } from "@db/schema";

export const metricasRouter = createRouter({
  // ── Métricas Operacionais ──────────────────────────────────────────

  // Total de pedidos por mês (últimos 12 meses)
  pedidosPorMes: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      mes: sql<string>`DATE_FORMAT(${pedidos.createdAt}, '%Y-%m')`,
      total: sql<number>`count(*)`,
    }).from(pedidos)
      .groupBy(sql`DATE_FORMAT(${pedidos.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${pedidos.createdAt}, '%Y-%m')`)
      .limit(12);
    return rows;
  }),

  // Taxa de reprovação por departamento
  reprovacaoPorDepartamento: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      departamento: comparacoes.departamento,
      total: sql<number>`count(*)`,
      reprovados: sql<number>`sum(case when ${comparacaoItens.status} = 'reprovado' then 1 else 0 end)`,
    }).from(comparacoes)
      .leftJoin(comparacaoItens, eq(comparacaoItens.comparacaoId, comparacoes.id))
      .groupBy(comparacoes.departamento);
    return rows.map((r) => ({
      departamento: r.departamento,
      total: r.total,
      reprovados: r.reprovados,
      taxa: r.total > 0 ? Math.round((r.reprovados / r.total) * 100) : 0,
    }));
  }),

  // Taxa de reprovação por tipo de embalagem
  reprovacaoPorEmbalagem: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      tipoEmbalagem: comparacaoItens.tipoEmbalagem,
      total: sql<number>`count(*)`,
      reprovados: sql<number>`sum(case when ${comparacaoItens.status} = 'reprovado' then 1 else 0 end)`,
    }).from(comparacaoItens)
      .groupBy(comparacaoItens.tipoEmbalagem);
    return rows.map((r) => ({
      tipoEmbalagem: r.tipoEmbalagem,
      total: r.total,
      reprovados: r.reprovados,
      taxa: r.total > 0 ? Math.round((r.reprovados / r.total) * 100) : 0,
    }));
  }),

  // Tempo médio de processamento da IA (por departamento)
  tempoMedioPorDepartamento: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      departamento: comparacoes.departamento,
      tempoMedio: sql<number>`avg(${comparacoes.tempoProcessamento})`,
      total: sql<number>`count(*)`,
    }).from(comparacoes)
      .where(sql`${comparacoes.status} = 'concluido'`)
      .groupBy(comparacoes.departamento);
    return rows.map((r) => ({
      departamento: r.departamento,
      tempoMedio: Math.round((r.tempoMedio ?? 0) * 10) / 10,
      total: r.total,
    }));
  }),

  // Ranking de erros mais comuns (campos que mais falham)
  rankingErros: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      campo: analiseItens.campo,
      totalErros: sql<number>`count(*)`,
    }).from(analiseItens)
      .where(
        sql`${analiseItens.status} in ('warning', 'critical')`
      )
      .groupBy(analiseItens.campo)
      .orderBy(sql`count(*) desc`)
      .limit(10);
    return rows;
  }),

  // ── Métricas de IA ────────────────────────────────────────────────

  // Tokens consumidos (por mês)
  tokensPorMes: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      mes: sql<string>`DATE_FORMAT(${comparacoes.createdAt}, '%Y-%m')`,
      tokensEntrada: sql<number>`sum(${comparacoes.tokensEntrada})`,
      tokensSaida: sql<number>`sum(${comparacoes.tokensSaida})`,
      totalComparacoes: sql<number>`count(*)`,
    }).from(comparacoes)
      .where(sql`${comparacoes.status} = 'concluido'`)
      .groupBy(sql`DATE_FORMAT(${comparacoes.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${comparacoes.createdAt}, '%Y-%m')`)
      .limit(12);
    return rows;
  }),

  // Taxa de divergência IA vs humano
  taxaDivergencia: adminQuery.query(async () => {
    const db = getDb();
    const totalItens = await db.select({
      total: sql<number>`count(*)`,
    }).from(analiseItens)
      .where(sql`${analiseItens.status} != 'nao_verificavel'`);

    const totalDivergencias = await db.select({
      total: sql<number>`count(*)`,
    }).from(divergencias)
      .where(sql`${divergencias.resolvido} = false`);

    const total = totalItens.at(0)?.total ?? 0;
    const divergenciasCount = totalDivergencias.at(0)?.total ?? 0;

    return {
      totalItensAnalisados: total,
      totalDivergencias: divergenciasCount,
      taxa: total > 0 ? Math.round((divergenciasCount / total) * 1000) / 10 : 0,
    };
  }),

  // Evolução da divergência ao longo do tempo
  evolucaoDivergencia: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      mes: sql<string>`DATE_FORMAT(${divergencias.createdAt}, '%Y-%m')`,
      falsosPositivos: sql<number>`sum(case when ${divergencias.tipo} = 'falso_positivo' then 1 else 0 end)`,
      falsosNegativos: sql<number>`sum(case when ${divergencias.tipo} = 'falso_negativo' then 1 else 0 end)`,
      total: sql<number>`count(*)`,
    }).from(divergencias)
      .groupBy(sql`DATE_FORMAT(${divergencias.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${divergencias.createdAt}, '%Y-%m')`)
      .limit(12);
    return rows;
  }),

  // ── Módulo de Divergências ────────────────────────────────────────

  // Listar divergências com filtros
  listarDivergencias: adminQuery
    .input(
      z.object({
        departamento: z.enum(["atendimento", "design", "cq"]).optional(),
        tipo: z.enum(["falso_positivo", "falso_negativo"]).optional(),
        resolvido: z.boolean().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select({
        id: divergencias.id,
        tipo: divergencias.tipo,
        descricaoHumano: divergencias.descricaoHumano,
        descricaoIA: divergencias.descricaoIA,
        campoAfetado: divergencias.campoAfetado,
        resolvido: divergencias.resolvido,
        resolvidoPor: divergencias.resolvidoPor,
        resolvidoEm: divergencias.resolvidoEm,
        createdAt: divergencias.createdAt,
        comparacaoDepartamento: comparacoes.departamento,
        comparacaoPedidoId: comparacoes.pedidoId,
        comparacaoItemTipoEmbalagem: comparacaoItens.tipoEmbalagem,
      }).from(divergencias)
        .leftJoin(comparacaoItens, eq(comparacaoItens.id, divergencias.comparacaoItemId))
        .leftJoin(comparacoes, eq(comparacoes.id, comparacaoItens.comparacaoId))
        .where(
          and(
            input.departamento ? eq(comparacoes.departamento, input.departamento) : undefined,
            input.tipo ? eq(divergencias.tipo, input.tipo) : undefined,
            input.resolvido !== undefined ? eq(divergencias.resolvido, input.resolvido) : undefined
          )
        )
        .orderBy(sql`${divergencias.createdAt} desc`)
        .limit(input.limit);
      return rows;
    }),

  // Resolver divergência
  resolverDivergencia: adminQuery
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(divergencias)
        .set({
          resolvido: true,
          resolvidoPor: ctx.user.id,
          resolvidoEm: new Date(),
        })
        .where(eq(divergencias.id, input.id));
      return { success: true };
    }),

  // ── Overview consolidado ──────────────────────────────────────────

  overview: authedQuery.query(async () => {
    const db = getDb();

    const totalPedidos = await db.select({ count: sql<number>`count(*)` }).from(pedidos);
    const pedidosAtivos = await db.select({ count: sql<number>`count(*)` }).from(pedidos).where(sql`${pedidos.statusGeral} != 'arquivado'`);
    const totalComparacoes = await db.select({ count: sql<number>`count(*)` }).from(comparacoes);
    const comparacoesConcluidas = await db.select({ count: sql<number>`count(*)` }).from(comparacoes).where(eq(comparacoes.status, "concluido"));
    const totalItens = await db.select({ count: sql<number>`count(*)` }).from(comparacaoItens);
    const itensReprovados = await db.select({ count: sql<number>`count(*)` }).from(comparacaoItens).where(eq(comparacaoItens.status, "reprovado"));
    const totalDivergencias = await db.select({ count: sql<number>`count(*)` }).from(divergencias).where(eq(divergencias.resolvido, false));

    // Tendência: mês atual vs mês anterior
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const pedidosMesAtual = await db.select({ count: sql<number>`count(*)` }).from(pedidos)
      .where(sql`MONTH(${pedidos.createdAt}) = ${currentMonth + 1} AND YEAR(${pedidos.createdAt}) = ${currentYear}`);
    const pedidosMesAnterior = await db.select({ count: sql<number>`count(*)` }).from(pedidos)
      .where(sql`MONTH(${pedidos.createdAt}) = ${prevMonth + 1} AND YEAR(${pedidos.createdAt}) = ${prevYear}`);

    const comparacoesMesAtual = await db.select({ count: sql<number>`count(*)` }).from(comparacoes)
      .where(sql`MONTH(${comparacoes.createdAt}) = ${currentMonth + 1} AND YEAR(${comparacoes.createdAt}) = ${currentYear}`);
    const comparacoesMesAnterior = await db.select({ count: sql<number>`count(*)` }).from(comparacoes)
      .where(sql`MONTH(${comparacoes.createdAt}) = ${prevMonth + 1} AND YEAR(${comparacoes.createdAt}) = ${prevYear}`);

    const reprovadosMesAtual = await db.select({ count: sql<number>`count(*)` }).from(comparacaoItens)
      .where(
        sql`${comparacaoItens.status} = 'reprovado' AND MONTH(${comparacaoItens.createdAt}) = ${currentMonth + 1} AND YEAR(${comparacaoItens.createdAt}) = ${currentYear}`
      );
    const reprovadosMesAnterior = await db.select({ count: sql<number>`count(*)` }).from(comparacaoItens)
      .where(
        sql`${comparacaoItens.status} = 'reprovado' AND MONTH(${comparacaoItens.createdAt}) = ${prevMonth + 1} AND YEAR(${comparacaoItens.createdAt}) = ${prevYear}`
      );

    const atualPedidos = pedidosMesAtual.at(0)?.count ?? 0;
    const antigoPedidos = pedidosMesAnterior.at(0)?.count ?? 0;
    const atualComparacoes = comparacoesMesAtual.at(0)?.count ?? 0;
    const antigoComparacoes = comparacoesMesAnterior.at(0)?.count ?? 0;
    const atualReprovados = reprovadosMesAtual.at(0)?.count ?? 0;
    const antigoReprovados = reprovadosMesAnterior.at(0)?.count ?? 0;

    return {
      totalPedidos: totalPedidos.at(0)?.count ?? 0,
      pedidosAtivos: pedidosAtivos.at(0)?.count ?? 0,
      totalComparacoes: totalComparacoes.at(0)?.count ?? 0,
      comparacoesConcluidas: comparacoesConcluidas.at(0)?.count ?? 0,
      totalItens: totalItens.at(0)?.count ?? 0,
      itensReprovados: itensReprovados.at(0)?.count ?? 0,
      totalDivergencias: totalDivergencias.at(0)?.count ?? 0,
      tendencia: {
        pedidos: { atual: atualPedidos, anterior: antigoPedidos, variacao: antigoPedidos > 0 ? Math.round(((atualPedidos - antigoPedidos) / antigoPedidos) * 100) : (atualPedidos > 0 ? 100 : 0) },
        comparacoes: { atual: atualComparacoes, anterior: antigoComparacoes, variacao: antigoComparacoes > 0 ? Math.round(((atualComparacoes - antigoComparacoes) / antigoComparacoes) * 100) : (atualComparacoes > 0 ? 100 : 0) },
        reprovados: { atual: atualReprovados, anterior: antigoReprovados, variacao: antigoReprovados > 0 ? Math.round(((atualReprovados - antigoReprovados) / antigoReprovados) * 100) : (atualReprovados > 0 ? 100 : 0) },
      },
    };
  }),
});
