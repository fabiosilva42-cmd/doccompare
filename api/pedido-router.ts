import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { pedidos, documentos, comparacoes } from "@db/schema";

export const pedidoRouter = createRouter({
  // Criar novo pedido (qualquer departamento pode iniciar)
  create: authedQuery
    .input(
      z.object({
        codigoPedido: z.string().min(1).max(100),
        nome: z.string().min(1).max(255),
        faseAtual: z.enum(["atendimento", "design", "cq"]).optional(),
        dadosCliente: z
          .object({
            nomeCliente: z.string().optional(),
            numeroPI: z.string().optional(),
            numeroPO: z.string().optional(),
            fornecedor: z.string().optional(),
            quantidade: z.number().optional(),
            dataEntrega: z.string().optional(),
            observacoes: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      try {
        const result = await db.insert(pedidos).values({
          codigoPedido: input.codigoPedido,
          nome: input.nome,
          userId: ctx.user.id,
          dadosCliente: input.dadosCliente ?? {},
          statusGeral: "pendente",
          faseAtual: input.faseAtual ?? "atendimento",
        });
        return { id: Number(result[0].insertId) };
      } catch (err: any) {
        if (err.message?.includes("Duplicate entry") || err.code === "ER_DUP_ENTRY") {
          throw new Error("Codigo de pedido ja existe. Use um codigo unico.");
        }
        throw err;
      }
    }),

  // Listar pedidos do usuario
  list: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: pedidos.id,
        codigoPedido: pedidos.codigoPedido,
        nome: pedidos.nome,
        statusGeral: pedidos.statusGeral,
        faseAtual: pedidos.faseAtual,
        dadosCliente: pedidos.dadosCliente,
        createdAt: pedidos.createdAt,
        updatedAt: pedidos.updatedAt,
        comparacaoCount: sql<number>`(select count(*) from comparacoes where comparacoes.pedido_id = ${pedidos.id})`,
        documentoCount: sql<number>`(select count(*) from documentos where documentos.pedido_id = ${pedidos.id})`,
      })
      .from(pedidos)
      .orderBy(desc(pedidos.createdAt));
    return rows;
  }),

  // Todos os pedidos (admin)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: pedidos.id,
        codigoPedido: pedidos.codigoPedido,
        nome: pedidos.nome,
        statusGeral: pedidos.statusGeral,
        faseAtual: pedidos.faseAtual,
        userName: sql<string>`(select name from users where users.id = ${pedidos.userId})`,
        createdAt: pedidos.createdAt,
        comparacaoCount: sql<number>`(select count(*) from comparacoes where comparacoes.pedido_id = ${pedidos.id})`,
      })
      .from(pedidos)
      .orderBy(desc(pedidos.createdAt));
    return rows;
  }),

  // Obter pedido por ID
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, input.id))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) return null;

      // Buscar documentos
      const docs = await db
        .select({
          id: documentos.id,
          nomeOriginal: documentos.nomeOriginal,
          mimeType: documentos.mimeType,
          tamanhoBytes: documentos.tamanhoBytes,
          tipoDocumento: documentos.tipoDocumento,
          tipoEmbalagem: documentos.tipoEmbalagem,
          ordem: documentos.ordem,
          createdAt: documentos.createdAt,
        })
        .from(documentos)
        .where(eq(documentos.pedidoId, pedido.id))
        .orderBy(documentos.ordem);

      // Buscar comparacoes com itens
      const comps = await db
        .select({
          id: comparacoes.id,
          uuid: comparacoes.uuid,
          versao: comparacoes.versao,
          departamento: comparacoes.departamento,
          status: comparacoes.status,
          createdAt: comparacoes.createdAt,
        })
        .from(comparacoes)
        .where(eq(comparacoes.pedidoId, pedido.id))
        .orderBy(desc(comparacoes.createdAt));

      return {
        pedido,
        documentos: docs,
        comparacoes: comps,
      };
    }),

  // Atualizar status/fase
  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        statusGeral: z
          .enum(["pendente", "em_andamento", "concluido", "arquivado", "cancelado"])
          .optional(),
        faseAtual: z
          .enum(["atendimento", "design", "cq", "concluido", "arquivado"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const rows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, id))
        .limit(1);

      const pedido = rows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");
      if (pedido.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Sem permissao");
      }

      await db.update(pedidos).set(data).where(eq(pedidos.id, id));
      return { success: true };
    }),

  // Arquivar pedido
  arquivar: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select({ userId: pedidos.userId, statusGeral: pedidos.statusGeral })
        .from(pedidos)
        .where(eq(pedidos.id, input.id))
        .limit(1);

      const pedido = rows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");
      if (pedido.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Sem permissao");
      }

      await db
        .update(pedidos)
        .set({
          statusGeral: "arquivado",
          faseAtual: "arquivado",
          arquivadoAt: new Date(),
        })
        .where(eq(pedidos.id, input.id));

      return { success: true };
    }),

  // Duplicar pedido
  duplicar: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(pedidos).where(eq(pedidos.id, input.id)).limit(1);
      const original = rows.at(0);
      if (!original) throw new Error("Pedido nao encontrado");

      const result = await db.insert(pedidos).values({
        codigoPedido: original.codigoPedido + " (copia)",
        nome: original.nome,
        userId: ctx.user.id,
        dadosCliente: original.dadosCliente,
        statusGeral: "pendente",
        faseAtual: "atendimento",
      });

      return { id: Number(result[0].insertId) };
    }),

  // Excluir pedido (admin only)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Excluir em cascada manualmente
      await db.delete(documentos).where(eq(documentos.pedidoId, input.id));
      await db.delete(comparacoes).where(eq(comparacoes.pedidoId, input.id));
      await db.delete(pedidos).where(eq(pedidos.id, input.id));
      return { success: true };
    }),
});
