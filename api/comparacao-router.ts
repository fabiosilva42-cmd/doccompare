import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  pedidos,
  comparacoes,
  comparacaoItens,
  analiseItens,
  documentos,
  prompts,
} from "@db/schema";
import { env } from "./lib/env";
import { designarRevisoesAQL } from "./lib/aql-service";
import { validarOrderDetails } from "./lib/validador-programatico";

function generateUuid() {
  return crypto.randomUUID();
}

export const comparacaoRouter = createRouter({
  // Criar nova comparacao (dentro de um pedido)
  create: authedQuery
    .input(
      z.object({
        pedidoId: z.number().positive(),
        departamento: z.enum(["atendimento", "design", "cq"]),
        promptId: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Verificar se pedido existe e usuario tem acesso
      const pedidoRows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      // Buscar ultima versao deste departamento para este pedido
      const versaoRows = await db
        .select({ versao: comparacoes.versao })
        .from(comparacoes)
        .where(
          sql`${comparacoes.pedidoId} = ${input.pedidoId} AND ${comparacoes.departamento} = ${input.departamento}`
        )
        .orderBy(desc(comparacoes.versao))
        .limit(1);

      const proximaVersao = (versaoRows.at(0)?.versao ?? 0) + 1;
      const novoUuid = generateUuid();

      const result = await db.insert(comparacoes).values({
        uuid: novoUuid,
        pedidoId: input.pedidoId,
        versao: proximaVersao,
        departamento: input.departamento,
        promptId: input.promptId,
        status: "pendente",
      });

      return { id: Number(result[0].insertId), uuid: novoUuid };
    }),

  // Listar comparacoes de um pedido
  listByPedido: authedQuery
    .input(z.object({ pedidoId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({
          id: comparacoes.id,
          uuid: comparacoes.uuid,
          versao: comparacoes.versao,
          departamento: comparacoes.departamento,
          status: comparacoes.status,
          tempoProcessamento: comparacoes.tempoProcessamento,
          modelo: comparacoes.modelo,
          createdAt: comparacoes.createdAt,
          promptNome: prompts.nome,
        })
        .from(comparacoes)
        .leftJoin(prompts, eq(comparacoes.promptId, prompts.id))
        .where(eq(comparacoes.pedidoId, input.pedidoId))
        .orderBy(desc(comparacoes.createdAt));
      return rows;
    }),

  // Todas as comparacoes (admin)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: comparacoes.id,
        uuid: comparacoes.uuid,
        versao: comparacoes.versao,
        departamento: comparacoes.departamento,
        status: comparacoes.status,
        pedidoCodigo: pedidos.codigoPedido,
        pedidoNome: pedidos.nome,
        promptNome: prompts.nome,
        createdAt: comparacoes.createdAt,
      })
      .from(comparacoes)
      .leftJoin(pedidos, eq(comparacoes.pedidoId, pedidos.id))
      .leftJoin(prompts, eq(comparacoes.promptId, prompts.id))
      .orderBy(desc(comparacoes.createdAt));
    return rows;
  }),

  // Obter comparacao por UUID com itens por embalagem
  getByUuid: authedQuery
    .input(z.object({ uuid: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Aceita o uuid da comparação OU o id numérico do pedido (várias
      // páginas linkam /resultado/{pedidoId}) — nesse caso resolve para a
      // comparação mais recente do pedido.
      let uuid = input.uuid;
      if (/^\d+$/.test(uuid)) {
        const latest = await db
          .select({ uuid: comparacoes.uuid })
          .from(comparacoes)
          .where(eq(comparacoes.pedidoId, Number(uuid)))
          .orderBy(desc(comparacoes.id))
          .limit(1);
        const l = latest.at(0);
        if (!l) return null;
        uuid = l.uuid;
      }

      const compRows = await db
        .select()
        .from(comparacoes)
        .leftJoin(prompts, eq(comparacoes.promptId, prompts.id))
        .leftJoin(pedidos, eq(comparacoes.pedidoId, pedidos.id))
        .where(eq(comparacoes.uuid, uuid))
        .limit(1);

      const row = compRows.at(0);
      if (!row) return null;

      // Buscar itens por embalagem
      const itens = await db
        .select()
        .from(comparacaoItens)
        .where(eq(comparacaoItens.comparacaoId, row.comparacoes.id))
        .orderBy(comparacaoItens.tipoEmbalagem);

      // Para cada item, buscar analise_itens
      const itensComAnalise = await Promise.all(
        itens.map(async (item) => {
          const analises = await db
            .select()
            .from(analiseItens)
            .where(eq(analiseItens.comparacaoItemId, item.id))
            .orderBy(analiseItens.campo);
          return { ...item, analises };
        })
      );

      // Buscar documentos do pedido
      const docs = await db
        .select({
          id: documentos.id,
          nomeOriginal: documentos.nomeOriginal,
          mimeType: documentos.mimeType,
          tamanhoBytes: documentos.tamanhoBytes,
          tipoDocumento: documentos.tipoDocumento,
          tipoEmbalagem: documentos.tipoEmbalagem,
          ordem: documentos.ordem,
        })
        .from(documentos)
        .where(eq(documentos.pedidoId, row.comparacoes.pedidoId))
        .orderBy(documentos.ordem);

      return {
        comparacao: row.comparacoes,
        prompt: row.prompts,
        pedido: row.pedidos,
        itens: itensComAnalise,
        documentos: docs,
      };
    }),

  // Executar analise (chama API Kimi)
  executar: authedQuery
    .input(z.object({ comparacaoUuid: z.string() }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const db = getDb();

      // Buscar comparacao
      const compRows = await db
        .select()
        .from(comparacoes)
        .leftJoin(prompts, eq(comparacoes.promptId, prompts.id))
        .leftJoin(pedidos, eq(comparacoes.pedidoId, pedidos.id))
        .where(eq(comparacoes.uuid, input.comparacaoUuid))
        .limit(1);

      const row = compRows.at(0);
      if (!row) {
        throw new Error("Comparacao nao encontrada");
      }

      // Atualizar status
      await db
        .update(comparacoes)
        .set({ status: "processando" })
        .where(eq(comparacoes.id, row.comparacoes.id));

      try {
        // Buscar documentos do pedido com conteudo
        const docs = await db
          .select()
          .from(documentos)
          .where(eq(documentos.pedidoId, row.comparacoes.pedidoId))
          .orderBy(documentos.ordem);

        if (docs.length < 1) {
          throw new Error("E necessario pelo menos 1 documento para analise");
        }

        // ── Validação Programática (Fase 1: atendimento) ───────────────────
        let resultadoValidacaoProgramatica = "";
        if (row.prompts?.departamento === "atendimento") {
          const orderDetailsDoc = docs.find((d) => d.tipoDocumento === "order_details");
          if (orderDetailsDoc?.conteudoExtraido) {
            const validacao = validarOrderDetails(orderDetailsDoc.conteudoExtraido);
            resultadoValidacaoProgramatica = JSON.stringify(validacao, null, 2);
          }
        }

        // Montar prompt
        let systemPrompt = row.prompts?.promptSistema ?? "";
        // Injetar resultado da validação programática no prompt de atendimento
        if (row.prompts?.departamento === "atendimento" && resultadoValidacaoProgramatica) {
          systemPrompt = systemPrompt.replace(
            "{resultado_validacao_programatica}",
            resultadoValidacaoProgramatica
          );
        }

        let userMessage = `Analise os seguintes documentos do pedido ${row.pedidos?.codigoPedido ?? ""}:\n\n`;

        // Separar documentos por tipo de embalagem
        const orderDetails = docs.find((d) => d.tipoDocumento === "order_details");
        const outrosDocs = docs.filter((d) => d.tipoDocumento !== "order_details");

        if (orderDetails) {
          userMessage += `=== BASE DE COMPARACAO (Order Details): ${orderDetails.nomeOriginal} ===\n${orderDetails.conteudoExtraido ?? "[Conteudo nao extraido]"}\n\n`;
        }

        for (const doc of outrosDocs) {
          const conteudo = doc.conteudoExtraido ?? "[Conteudo nao extraido]";
          userMessage += `=== ${doc.tipoDocumento.toUpperCase()} (${doc.tipoEmbalagem}): ${doc.nomeOriginal} ===\n${conteudo}\n\n`;
        }

        const modeloOutput = row.prompts?.modeloOutput;
        if (modeloOutput && modeloOutput.trim().length > 0) {
          userMessage += `\n=== MODELO DE OUTPUT ESPERADO ===\n${modeloOutput}\n\n`;
        }

        userMessage += `\nForneca a analise completa seguindo as diretrizes do seu papel. Responda em portugues do Brasil. Formate a resposta em JSON com a seguinte estrutura EXATA:

{
  "barcode_label": {
    "resumoExecutivo": "string com resumo em markdown",
    "secoes": [
      { "titulo": "nome da secao", "conteudo": "conteudo em markdown", "severidade": "info|warning|critical" }
    ],
    "itens": [
      { "campo": "nome do campo", "valorEsperado": "valor da base", "valorEncontrado": "valor no documento", "status": "ok|warning|critical|nao_verificavel", "observacao": "observacao" }
    ]
  },
  "color_box": { ...mesma estrutura... },
  "master_carton": { ...mesma estrutura... }
}`;

        // Chamar API Kimi
        const response = await fetch(`${env.kimiOpenUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.appId}`,
          },
          body: JSON.stringify({
            model: "kimi-k2.5",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API Kimi: ${response.status} - ${errorText}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        const content = (data.choices as Array<{ message: { content: string } }>)?.[0]?.message?.content ?? "{}";

        // Parse JSON da resposta
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = {};
        }

        const tempoProcessamento = Math.round((Date.now() - startTime) / 1000);
        const tokensEntrada = (data.usage as Record<string, number> | undefined)?.prompt_tokens ?? 0;
        const tokensSaida = (data.usage as Record<string, number> | undefined)?.completion_tokens ?? 0;

        // Criar comparacao_itens para cada embalagem
        const embalagens = ["barcode_label", "color_box", "master_carton"] as const;

        for (const emb of embalagens) {
          const embData = parsed[emb] as Record<string, unknown> | undefined;
          if (!embData) continue;

          const itemResult = await db.insert(comparacaoItens).values([{
            comparacaoId: row.comparacoes.id,
            tipoEmbalagem: emb,
            status: "pendente",
            resumoExecutivo: (embData.resumoExecutivo as string) ?? "Sem resumo disponivel",
            secoes: (embData.secoes as unknown) ?? [],
            tabelaComparativa: (embData.tabelaComparativa as unknown) ?? [],
            tokensEntrada: Math.round(tokensEntrada / embalagens.length),
            tokensSaida: Math.round(tokensSaida / embalagens.length),
            tempoProcessamento,
            modelo: "kimi-latest",
          } as any]);

          const comparacaoItemId = Number(itemResult[0].insertId);

          // Inserir analise_itens
          const itens = (embData.itens as Array<Record<string, unknown>>) ?? [];
          for (const item of itens) {
            await db.insert(analiseItens).values({
              comparacaoItemId,
              campo: (item.campo as string) ?? "Campo desconhecido",
              valorEsperado: (item.valorEsperado as string) ?? null,
              valorEncontrado: (item.valorEncontrado as string) ?? null,
              status: (item.status as "ok" | "warning" | "critical" | "nao_verificavel") ?? "nao_verificavel",
              observacao: (item.observacao as string) ?? null,
            });
          }
        }

        // Atualizar comparacao
        await db
          .update(comparacoes)
          .set({
            status: "concluido",
            tokensEntrada,
            tokensSaida,
            tempoProcessamento,
            modelo: "kimi-latest",
          })
          .where(eq(comparacoes.id, row.comparacoes.id));

        // Designar 20% dos itens aprovados para revisão AQL
        try {
          await designarRevisoesAQL(row.comparacoes.id);
        } catch {
          // Falha silenciosa: AQL não deve quebrar a comparação
        }

        return {
          status: "concluido",
          tempoProcessamento,
          tokensEntrada,
          tokensSaida,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        await db
          .update(comparacoes)
          .set({ status: "erro", mensagemErro: msg })
          .where(eq(comparacoes.id, row.comparacoes.id));
        throw error;
      }
    }),

  // Aprovar/Reprovar item de comparacao (por embalagem)
  aprovarItem: authedQuery
    .input(
      z.object({
        comparacaoItemId: z.number().positive(),
        status: z.enum(["aprovado", "reprovado", "parcial"]),
        observacao: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(comparacaoItens)
        .set({
          status: input.status,
          aprovadoPor: ctx.user.id,
          aprovadoEm: new Date(),
          observacaoAprovacao: input.observacao ?? null,
        })
        .where(eq(comparacaoItens.id, input.comparacaoItemId));

      return { success: true };
    }),

  // Aprovar/Reprovar item individual (campo a campo)
  aprovarAnaliseItem: authedQuery
    .input(
      z.object({
        analiseItemId: z.number().positive(),
        aprovado: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(analiseItens)
        .set({
          aprovadoPor: ctx.user.id,
          aprovadoEm: new Date(),
        })
        .where(eq(analiseItens.id, input.analiseItemId));

      return { success: true };
    }),

  // Excluir comparacao
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const rows = await db
        .select({ pedidoId: comparacoes.pedidoId })
        .from(comparacoes)
        .where(eq(comparacoes.id, input.id))
        .limit(1);

      const comp = rows.at(0);
      if (!comp) throw new Error("Comparacao nao encontrada");

      // Verificar permissao via pedido
      const pedidoRows = await db
        .select({ userId: pedidos.userId })
        .from(pedidos)
        .where(eq(pedidos.id, comp.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido || (pedido.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new Error("Sem permissao");
      }

      // Excluir itens relacionados
      const itens = await db
        .select({ id: comparacaoItens.id })
        .from(comparacaoItens)
        .where(eq(comparacaoItens.comparacaoId, input.id));

      for (const item of itens) {
        await db.delete(analiseItens).where(eq(analiseItens.comparacaoItemId, item.id));
      }

      await db.delete(comparacaoItens).where(eq(comparacaoItens.comparacaoId, input.id));
      await db.delete(comparacoes).where(eq(comparacoes.id, input.id));

      return { success: true };
    }),

  // Verificar status (para polling)
  checkStatus: authedQuery
    .input(z.object({ uuid: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({
          status: comparacoes.status,
          mensagemErro: comparacoes.mensagemErro,
          tempoProcessamento: comparacoes.tempoProcessamento,
        })
        .from(comparacoes)
        .where(eq(comparacoes.uuid, input.uuid))
        .limit(1);

      const row = rows.at(0);
      if (!row) return null;
      return row;
    }),
});
