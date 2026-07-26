/** Terminal pipeline stages — always shown after workflow phases from active prompts. */
export const TERMINAL_PIPELINE_PHASES = ["concluido", "arquivado"] as const;

export type PromptColumnSource = {
  departamento: string;
  ordem: number;
  ativo?: string;
};

/**
 * Build Kanban column ids from active prompts (ordered by `ordem`) plus terminal phases.
 * Phases present on orders but not in prompts are appended before terminal stages.
 */
export function buildKanbanColumns(
  prompts: PromptColumnSource[] | undefined,
  orderPhases?: Iterable<string>
): string[] {
  const workflow: { dept: string; ordem: number }[] = [];
  const seen = new Set<string>();

  const active = (prompts ?? []).filter((p) => p.ativo !== "nao");

  for (const p of active) {
    const dept = p.departamento;
    if ((TERMINAL_PIPELINE_PHASES as readonly string[]).includes(dept)) continue;

    const existing = workflow.find((w) => w.dept === dept);
    if (existing) {
      if (p.ordem < existing.ordem) existing.ordem = p.ordem;
    } else {
      seen.add(dept);
      workflow.push({ dept, ordem: p.ordem });
    }
  }

  workflow.sort((a, b) => a.ordem - b.ordem);
  const columns = workflow.map((w) => w.dept);

  if (orderPhases) {
    for (const phase of orderPhases) {
      if (
        phase &&
        !(TERMINAL_PIPELINE_PHASES as readonly string[]).includes(phase) &&
        !columns.includes(phase)
      ) {
        columns.push(phase);
      }
    }
  }

  for (const terminal of TERMINAL_PIPELINE_PHASES) {
    if (!columns.includes(terminal)) columns.push(terminal);
  }

  return columns;
}

/** "nova_fase-embalagem" → "Nova Fase Embalagem" */
export function humanizePhase(slug: string): string {
  return slug
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Label de fase resiliente: usa a tradução se existir; para fases novas
 * criadas dinamicamente (sem chave de tradução), humaniza o slug em vez
 * de exibir a chave crua.
 */
export function phaseLabel(t: (key: string) => string, phase: string): string {
  const key = `phase.${phase}`;
  const label = t(key);
  return label === key ? humanizePhase(phase) : label;
}

export function groupPedidosByPhase<T extends { faseAtual: string }>(
  pedidos: T[],
  columns: string[]
): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const col of columns) map[col] = [];

  const firstWorkflow = columns.find(
    (c) => !(TERMINAL_PIPELINE_PHASES as readonly string[]).includes(c)
  );

  for (const p of pedidos) {
    const phase = columns.includes(p.faseAtual) ? p.faseAtual : (firstWorkflow ?? columns[0]);
    map[phase]?.push(p);
  }

  return map;
}
