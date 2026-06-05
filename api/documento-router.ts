import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { documentos, pedidos } from "@db/schema";

export const documentoRouter = createRouter({
  // Registrar documento (ligado a um pedido)
  create: authedQuery
    .input(
      z.object({
        pedidoId: z.number().positive(),
        comparacaoId: z.number().positive().optional(),
        tipoDocumento: z.enum([
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
        ]),
        tipoEmbalagem: z
          .enum(["barcode_label", "color_box", "master_carton", "nao_aplicavel"])
          .default("nao_aplicavel"),
        nomeOriginal: z.string().min(1),
        nomeArmazenado: z.string().min(1),
        mimeType: z.string().min(1),
        tamanhoBytes: z.number().positive(),
        conteudoExtraido: z.string().optional(),
        conteudoOcr: z.string().optional(),
        ordem: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verificar se pedido existe e usuario tem acesso
      const pedidoRows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido || (pedido.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new Error("Pedido nao encontrado ou sem permissao");
      }

      const result = await db.insert(documentos).values({
        pedidoId: input.pedidoId,
        comparacaoId: input.comparacaoId ?? null,
        tipoDocumento: input.tipoDocumento,
        tipoEmbalagem: input.tipoEmbalagem,
        nomeOriginal: input.nomeOriginal,
        nomeArmazenado: input.nomeArmazenado,
        mimeType: input.mimeType,
        tamanhoBytes: input.tamanhoBytes,
        conteudoExtraido: input.conteudoExtraido ?? null,
        conteudoOcr: input.conteudoOcr ?? null,
        ordem: input.ordem,
      });

      return { id: Number(result[0].insertId) };
    }),

  // Listar documentos de um pedido
  listByPedido: authedQuery
    .input(z.object({ pedidoId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verificar acesso
      const pedidoRows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido || (pedido.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new Error("Sem permissao");
      }

      return db
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
        .where(eq(documentos.pedidoId, input.pedidoId))
        .orderBy(documentos.ordem);
    }),

  // Atualizar conteudo extraido
  updateConteudo: authedQuery
    .input(
      z.object({
        id: z.number().positive(),
        conteudoExtraido: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verificar acesso via pedido
      const docRows = await db
        .select({ pedidoId: documentos.pedidoId })
        .from(documentos)
        .where(eq(documentos.id, input.id))
        .limit(1);

      const doc = docRows.at(0);
      if (!doc) throw new Error("Documento nao encontrado");

      const pedidoRows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, doc.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido || pedido.userId !== ctx.user.id) {
        throw new Error("Sem permissao");
      }

      await db
        .update(documentos)
        .set({ conteudoExtraido: input.conteudoExtraido })
        .where(eq(documentos.id, input.id));

      return { success: true };
    }),

  // Excluir documento
  delete: authedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const docRows = await db
        .select({ pedidoId: documentos.pedidoId })
        .from(documentos)
        .where(eq(documentos.id, input.id))
        .limit(1);

      const doc = docRows.at(0);
      if (!doc) throw new Error("Documento nao encontrado");

      const pedidoRows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, doc.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido || pedido.userId !== ctx.user.id) {
        throw new Error("Sem permissao");
      }

      await db.delete(documentos).where(eq(documentos.id, input.id));
      return { success: true };
    }),
});
