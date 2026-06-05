import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { comparacaoItens, revisoesAql, users } from "@db/schema";

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

    designados++;
  }

  return designados;
}
