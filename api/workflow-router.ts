import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { enviarEmail, emailsDosAdmins, appUrl } from "./lib/email";
import {
  pedidos,
  comparacoes,
  comparacaoItens,
  notificacoes,
  users,
} from "@db/schema";

const FASES = ["atendimento", "design", "cq", "concluido", "arquivado"] as const;

function proximaFase(atual: string): string | null {
  const idx = FASES.indexOf(atual as any);
  if (idx === -1 || idx >= FASES.length - 1) return null;
  return FASES[idx + 1];
}

/**
 * Verifica se todas as embalagens da comparação mais recente de uma fase estão aprovadas.
 */
async function verificarAprovacaoFase(
  db: ReturnType<typeof getDb>,
  pedidoId: number,
  departamento: string
): Promise<{ podeAvancar: boolean; pendentes: number; reprovados: number }> {
  // Buscar a comparação mais recente desta fase/departamento
  const compRows = await db
    .select()
    .from(comparacoes)
    .where(
      and(
        eq(comparacoes.pedidoId, pedidoId),
        eq(comparacoes.departamento, departamento as any)
      )
    )
    .orderBy(sql`${comparacoes.versao} desc`)
    .limit(1);

  const comparacao = compRows.at(0);
  if (!comparacao) {
    return { podeAvancar: false, pendentes: 0, reprovados: 0 };
  }

  const itens = await db
    .select({ status: comparacaoItens.status })
    .from(comparacaoItens)
    .where(eq(comparacaoItens.comparacaoId, comparacao.id));

  const pendentes = itens.filter((i) => i.status === "pendente").length;
  const reprovados = itens.filter((i) => i.status === "reprovado").length;

  return {
    podeAvancar: pendentes === 0 && reprovados === 0 && itens.length > 0,
    pendentes,
    reprovados,
  };
}

async function criarNotificacao(
  db: ReturnType<typeof getDb>,
  userId: number,
  tipo: string,
  titulo: string,
  mensagem: string,
  referenciaId?: number,
  referenciaTipo?: string
) {
  await db.insert(notificacoes).values({
    userId,
    tipo: tipo as any,
    titulo,
    mensagem,
    referenciaId,
    referenciaTipo,
  });
}

export const workflowRouter = createRouter({
  // Verificar se o pedido pode avançar de fase
  verificarFase: authedQuery
    .input(z.object({ pedidoId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      const status = await verificarAprovacaoFase(
        db,
        input.pedidoId,
        pedido.faseAtual
      );

      return {
        faseAtual: pedido.faseAtual,
        proximaFase: proximaFase(pedido.faseAtual),
        podeAvancar: status.podeAvancar,
        pendentes: status.pendentes,
        reprovados: status.reprovados,
      };
    }),

  // Avançar o pedido para a próxima fase
  avancarFase: authedQuery
    .input(z.object({ pedidoId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      // Verificar se o usuário tem permissão para esta fase
      const userDept = ctx.user.departamento;
      const isAdmin = ctx.user.role === "admin";
      const isSupervisor = ctx.user.isSupervisor;

      if (!isAdmin && !isSupervisor && userDept !== pedido.faseAtual) {
        throw new Error("Voce nao pode avancar uma fase que nao e a sua");
      }

      // Verificar se pode avançar
      const status = await verificarAprovacaoFase(
        db,
        input.pedidoId,
        pedido.faseAtual
      );

      if (!status.podeAvancar) {
        throw new Error(
          `Nao e possivel avancar. Pendencias: ${status.pendentes}, Reprovados: ${status.reprovados}`
        );
      }

      const proxima = proximaFase(pedido.faseAtual);
      if (!proxima) {
        throw new Error("Este pedido ja esta na fase final");
      }

      // Atualizar fase
      await db
        .update(pedidos)
        .set({
          faseAtual: proxima as any,
          statusGeral: proxima === "concluido" ? "concluido" : proxima === "arquivado" ? "arquivado" : "em_andamento",
        })
        .where(eq(pedidos.id, input.pedidoId));

      // Notificar usuários do próximo departamento
      const proximoDept = proxima === "concluido" || proxima === "arquivado" ? null : proxima;
      if (proximoDept) {
        const usersNext = await db
          .select()
          .from(users)
          .where(eq(users.departamento, proximoDept as any));

        for (const u of usersNext) {
          await criarNotificacao(
            db,
            u.id,
            "proxima_fase",
            `Pedido ${pedido.codigoPedido} aguarda ${proximoDept}`,
            `O pedido "${pedido.nome}" (${pedido.codigoPedido}) foi movido para a fase de ${proximoDept}.`,
            pedido.id,
            "pedido"
          );
        }

        await enviarEmail({
          destinatarios: [
            ...usersNext.map((u) => u.email),
            ...(await emailsDosAdmins(db)),
          ],
          assunto: `Pedido ${pedido.codigoPedido} aguarda ${proximoDept}`,
          mensagem: `O pedido "${pedido.nome}" (${pedido.codigoPedido}) foi movido para a fase de <strong>${proximoDept}</strong> e aguarda sua análise.`,
          ctaLabel: "Abrir DocCompare",
          ctaUrl: appUrl("/dashboard"),
        });
      }

      // Notificar supervisor se houve reprovação resolvida
      if (status.reprovados > 0) {
        const supervisors = await db
          .select()
          .from(users)
          .where(eq(users.isSupervisor, true));

        for (const s of supervisors) {
          await criarNotificacao(
            db,
            s.id,
            "comparacao_reprovada",
            `Pedido ${pedido.codigoPedido} avançou com override`,
            `O pedido "${pedido.nome}" avançou de fase após correção de itens reprovados.`,
            pedido.id,
            "pedido"
          );
        }

        await enviarEmail({
          destinatarios: [
            ...supervisors.map((s) => s.email),
            ...(await emailsDosAdmins(db)),
          ],
          assunto: `Pedido ${pedido.codigoPedido} avançou com override`,
          mensagem: `O pedido "${pedido.nome}" avançou de fase após correção de itens reprovados.`,
          ctaLabel: "Ver pedido",
          ctaUrl: appUrl("/historico"),
        });
      }

      return { success: true, faseAnterior: pedido.faseAtual, novaFase: proxima };
    }),

  // Reprovar e voltar para correção (mantém na mesma fase, mas notifica)
  reprovarFase: authedQuery
    .input(
      z.object({
        pedidoId: z.number().positive(),
        observacao: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      // Notificar o criador do pedido e supervisors
      await criarNotificacao(
        db,
        pedido.userId,
        "comparacao_reprovada",
        `Pedido ${pedido.codigoPedido} precisa de correção`,
        `A fase de ${pedido.faseAtual} do pedido "${pedido.nome}" foi reprovada.${input.observacao ? ` Observação: ${input.observacao}` : ""}`,
        pedido.id,
        "pedido"
      );

      const supervisors = await db
        .select()
        .from(users)
        .where(eq(users.isSupervisor, true));

      for (const s of supervisors) {
        await criarNotificacao(
          db,
          s.id,
          "comparacao_reprovada",
          `REPROVAÇÃO: Pedido ${pedido.codigoPedido}`,
          `O pedido "${pedido.nome}" foi reprovado na fase de ${pedido.faseAtual}.${input.observacao ? ` Observação: ${input.observacao}` : ""}`,
          pedido.id,
          "pedido"
        );
      }

      const criadorRows = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, pedido.userId))
        .limit(1);

      await enviarEmail({
        destinatarios: [
          ...criadorRows.map((c) => c.email),
          ...supervisors.map((s) => s.email),
          ...(await emailsDosAdmins(db)),
        ],
        assunto: `Pedido ${pedido.codigoPedido} precisa de correção`,
        mensagem: `A fase de <strong>${pedido.faseAtual}</strong> do pedido "${pedido.nome}" foi reprovada.${input.observacao ? `<br><br><em>Observação: ${input.observacao}</em>` : ""}`,
        ctaLabel: "Ver pedido",
        ctaUrl: appUrl("/historico"),
      });

      return { success: true };
    }),

  // Arquivar pedido automaticamente (após concluído)
  arquivar: authedQuery
    .input(z.object({ pedidoId: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const pedidoRows = await db
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, input.pedidoId))
        .limit(1);

      const pedido = pedidoRows.at(0);
      if (!pedido) throw new Error("Pedido nao encontrado");

      if (pedido.faseAtual !== "concluido") {
        throw new Error("O pedido precisa estar concluido para ser arquivado");
      }

      await db
        .update(pedidos)
        .set({
          statusGeral: "arquivado",
          faseAtual: "arquivado",
          arquivadoAt: new Date(),
        })
        .where(eq(pedidos.id, input.pedidoId));

      return { success: true };
    }),
});
