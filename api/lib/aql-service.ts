import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { comparacaoItens, revisoesAql, users, notificacoes } from "@db/schema";
import { enviarEmail, emailsDosAdmins, appUrl } from "./email";

/**
 * Designa automaticamente 20% dos itens aprovados de uma comparação
 * para revisão humana (AQL).
 */
export async function designarRevisoesAQL(comparacaoId: number): Promise<number> {
  const db = getDb();

  // Buscar itens concluídos desta comparação
  const itens = await db
    .select()
    .from(comparacaoItens)
    .where(
      and(
        eq(comparacaoItens.comparacaoId, comparacaoId),
        eq(comparacaoItens.status, "aprovado")
      )
    );

  if (itens.length === 0) return 0;

  // Calcular 20% (mínimo 1)
  const quantidade = Math.max(1, Math.ceil(itens.length * 0.2));

  // Selecionar aleatoriamente
  const selecionados = itens
    .sort(() => Math.random() - 0.5)
    .slice(0, quantidade);

  // Buscar revisores disponíveis (usuários com departamento CQ ou supervisor)
  const revisores = await db
    .select()
    .from(users)
    .where(
      sql`${users.departamento} = 'cq' OR ${users.isSupervisor} = true`
    );

  if (revisores.length === 0) return 0;

  let designados = 0;
  const porRevisor = new Map<number, { email: string; count: number }>();

  for (const item of selecionados) {
    // Verificar se já existe revisão para este item
    const existing = await db
      .select()
      .from(revisoesAql)
      .where(eq(revisoesAql.comparacaoItemId, item.id))
      .limit(1);

    if (existing.length > 0) continue;

    // Sortear revisor
    const revisor = revisores[Math.floor(Math.random() * revisores.length)];

    await db.insert(revisoesAql).values({
      comparacaoItemId: item.id,
      designadoPara: revisor.id,
      status: "pendente",
    });

    const atual = porRevisor.get(revisor.id) ?? { email: revisor.email, count: 0 };
    atual.count++;
    porRevisor.set(revisor.id, atual);

    designados++;
  }

  // Notificar cada revisor (in-app + email)
  const adminEmails = await emailsDosAdmins(db);
  for (const [revisorId, info] of porRevisor) {
    await db.insert(notificacoes).values({
      userId: revisorId,
      tipo: "revisao_aql",
      titulo: `${info.count} ${info.count === 1 ? "revisão AQL designada" : "revisões AQL designadas"} para você`,
      mensagem: `Você foi sorteado para revisar ${info.count} ${info.count === 1 ? "item aprovado" : "itens aprovados"} pela IA. Acesse "Revisões AQL" para avaliar.`,
      referenciaId: comparacaoId,
      referenciaTipo: "comparacao",
    });

    await enviarEmail({
      destinatarios: [info.email, ...adminEmails],
      assunto: `${info.count} ${info.count === 1 ? "revisão AQL" : "revisões AQL"} para você`,
      mensagem: `Você foi sorteado para revisar ${info.count} ${info.count === 1 ? "item aprovado" : "itens aprovados"} pela IA no controle de qualidade AQL.`,
      ctaLabel: "Abrir Revisões AQL",
      ctaUrl: appUrl("/revisoes-aql"),
    });
  }

  return designados;
}
