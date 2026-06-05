import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { extrairTextoComInfo } from "./extrator-texto";

export const ocrTestRouter = createRouter({
  testar: publicQuery
    .input(
      z.object({
        base64: z.string().min(1),
        mimeType: z.string().min(1),
        nomeOriginal: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const start = Date.now();
      const buffer = Buffer.from(input.base64, "base64");

      const resultado = await extrairTextoComInfo(
        buffer,
        input.mimeType,
        input.nomeOriginal
      );

      const tempoMs = Date.now() - start;

      return {
        ok: !resultado.engine.startsWith("erro"),
        texto: resultado.texto.slice(0, 8000),
        textoCompleto: resultado.texto.length > 8000,
        tamanhoOriginal: resultado.texto.length,
        engine: resultado.engine,
        tempoMs,
        tamanhoBytes: buffer.length,
        mimeType: input.mimeType,
        nomeOriginal: input.nomeOriginal,
      };
    }),
});
