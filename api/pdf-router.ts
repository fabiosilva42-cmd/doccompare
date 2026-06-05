import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  comparacoes,
  comparacaoItens,
  analiseItens,
  pedidos,
  documentos,
  prompts,
  users,
} from "@db/schema";
import { gerarRelatorioPDF } from "./pdf-generator";
import { gerarPDFFromHTML } from "./pdf-generator";
import { renderResumoExecutivoHTML, type ResumoExecutivoData } from "./templates/resumo-executivo-atendimento";

export const pdfRouter = createRouter({
  // Gerar PDF de um relatório por comparacaoItemId
  gerar: authedQuery
    .input(z.object({ comparacaoItemId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Buscar comparacaoItem com dados relacionados
      const itemRows = await db
        .select()
        .from(comparacaoItens)
        .where(eq(comparacaoItens.id, input.comparacaoItemId))
        .limit(1);

      const item = itemRows.at(0);
      if (!item) throw new Error("Item de comparacao nao encontrado");

      // Buscar comparacao
      const compRows = await db
        .select()
        .from(comparacoes)
        .where(eq(comparacoes.id, item.comparacaoId))
        .limit(1);

      const comparacao = compRows.at(0);
      if (!comparacao) throw new Error("Comparacao nao encontrada");

      // Verificar acesso via pedido
      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, comparacao.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      // Todos podem ver, mas verificamos se é admin ou dono para gerar PDF
      if (pedido.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Sem permissao");
      }

      // Buscar prompt
      const promptRows = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, comparacao.promptId))
        .limit(1);

      const prompt = promptRows.at(0);

      // Buscar analises
      const analisesRows = await db
        .select()
        .from(analiseItens)
        .where(eq(analiseItens.comparacaoItemId, item.id));

      // Buscar documentos do pedido
      const docsRows = await db
        .select({
          nomeOriginal: documentos.nomeOriginal,
          tipoDocumento: documentos.tipoDocumento,
          tipoEmbalagem: documentos.tipoEmbalagem,
        })
        .from(documentos)
        .where(eq(documentos.pedidoId, pedido.id));

      // Buscar nome de quem aprovou
      let aprovadoPorNome: string | null = null;
      if (item.aprovadoPor) {
        const userRows = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, item.aprovadoPor))
          .limit(1);
        aprovadoPorNome = userRows.at(0)?.name ?? null;
      }

      // Montar dados do relatório
      const pdfBuffer = await gerarRelatorioPDF({
        pedido: {
          codigoPedido: pedido.codigoPedido,
          nome: pedido.nome,
          dadosCliente: pedido.dadosCliente,
        },
        comparacao: {
          id: comparacao.id,
          uuid: comparacao.uuid,
          versao: comparacao.versao,
          departamento: comparacao.departamento,
          status: comparacao.status,
          modelo: comparacao.modelo,
          tempoProcessamento: comparacao.tempoProcessamento,
          createdAt: comparacao.createdAt,
        },
        prompt: prompt
          ? {
              nome: prompt.nome,
              descricao: prompt.descricao,
              departamento: prompt.departamento,
            }
          : null,
        embalagem: {
          tipoEmbalagem: item.tipoEmbalagem,
          status: item.status,
          resumoExecutivo: item.resumoExecutivo,
          secoes: item.secoes,
          analises: analisesRows.map((a) => ({
            campo: a.campo,
            valorEsperado: a.valorEsperado,
            valorEncontrado: a.valorEncontrado,
            status: a.status,
            observacao: a.observacao,
          })),
          aprovadoPor: aprovadoPorNome,
          aprovadoEm: item.aprovadoEm,
          observacaoAprovacao: item.observacaoAprovacao,
        },
        documentos: docsRows,
        avisos: item.status === "reprovado"
          ? ["Este relatório identificou discrepâncias críticas que requerem correção antes da aprovação."]
          : undefined,
      });

      return {
        pdfBase64: pdfBuffer.toString("base64"),
        filename: `relatorio_${pedido.codigoPedido}_${item.tipoEmbalagem}_${new Date().toISOString().split("T")[0]}.pdf`,
      };
    }),

  // Gerar PDF do Resumo Executivo da Fase 1 (Atendimento)
  gerarResumoExecutivo: authedQuery
    .input(z.object({
      pedidoId: z.number().positive(),
      validacaoProgramatica: z.object({
        valido: z.boolean(),
        cnpjs: z.array(z.object({ formato: z.string(), valido: z.boolean(), mensagem: z.string() })),
        eans: z.array(z.object({ valor: z.string(), valido: z.boolean(), tipo: z.string(), mensagem: z.string() })),
        ncms: z.array(z.object({ formato: z.string(), valido: z.boolean(), mensagem: z.string() })),
        camposObrigatorios: z.array(z.object({ campo: z.string(), preenchido: z.boolean() })),
        resumo: z.string(),
        temErrosBloqueantes: z.boolean(),
        temAlertas: z.boolean(),
      }),
      contradicoes: z.array(z.object({
        tipo: z.string(),
        sku: z.string(),
        campo: z.string(),
        valorOd: z.string(),
        valorDocumento: z.string(),
        documento: z.string(),
        severidade: z.string(),
        mensagem: z.string(),
        sugestao: z.string(),
      })).default([]),
      recomendacoes: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Buscar dados do pedido
      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      // Verificar acesso
      if (pedido.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Sem permissao");
      }

      // Buscar documentos do pedido
      const docsRows = await db
        .select({ nomeOriginal: documentos.nomeOriginal, tipoDocumento: documentos.tipoDocumento })
        .from(documentos)
        .where(eq(documentos.pedidoId, input.pedidoId));

      const data: ResumoExecutivoData = {
        pedido: {
          codigoPedido: pedido.codigoPedido,
          nome: pedido.nome,
          atendente: ctx.user.name,
          data: new Date(),
        },
        validacaoProgramatica: input.validacaoProgramatica,
        contradicoes: input.contradicoes,
        recomendacoes: input.recomendacoes,
        documentos: docsRows,
      };

      const html = renderResumoExecutivoHTML(data);
      const pdfBuffer = await gerarPDFFromHTML(html, { format: "A4", margin: { top: "15px", right: "15px", bottom: "15px", left: "15px" } });

      return {
        pdfBase64: pdfBuffer.toString("base64"),
        filename: `resumo_executivo_${pedido.codigoPedido}_${new Date().toISOString().split("T")[0]}.pdf`,
      };
    }),
});
