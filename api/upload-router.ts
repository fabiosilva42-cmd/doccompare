import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { documentos, pedidos } from "@db/schema";
import { extrairTexto } from "./extrator-texto";

export const uploadRouter = createRouter({
  register: authedQuery
    .input(
      z.object({
        pedidoId: z.number().positive(),
        files: z.array(
          z.object({
            nomeOriginal: z.string(),
            mimeType: z.string(),
            tamanhoBytes: z.number(),
            base64: z.string(),
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
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verificar se pedido existe e usuario tem acesso
      const pedidoRows = await db
        .select({ userId: pedidos.userId, statusGeral: pedidos.statusGeral })
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido || (pedido.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new Error("Pedido nao encontrado");
      }

      const insertedIds: number[] = [];

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const buffer = Buffer.from(file.base64, "base64");
        const conteudoExtraido = await extrairTexto(
          buffer,
          file.mimeType,
          file.nomeOriginal
        );

        const result = await db.insert(documentos).values({
          pedidoId: input.pedidoId,
          tipoDocumento: file.tipoDocumento,
          tipoEmbalagem: file.tipoEmbalagem,
          nomeOriginal: file.nomeOriginal,
          nomeArmazenado: file.nomeOriginal,
          mimeType: file.mimeType,
          tamanhoBytes: file.tamanhoBytes,
          conteudoExtraido,
          ordem: i,
        });
        insertedIds.push(Number(result[0].insertId));
      }

      return { documentoIds: insertedIds };
    }),
});
