import { describe, it, expect } from "vitest";
import {
  buildKanbanColumns,
  groupPedidosByPhase,
  humanizePhase,
  phaseLabel,
} from "./kanbanColumns";

describe("buildKanbanColumns — colunas dinâmicas", () => {
  const basePrompts = [
    { departamento: "atendimento", ordem: 1 },
    { departamento: "design", ordem: 2 },
    { departamento: "cq", ordem: 3 },
  ];

  it("gera colunas a partir dos prompts ativos, na ordem, + fases terminais", () => {
    expect(buildKanbanColumns(basePrompts)).toEqual([
      "atendimento",
      "design",
      "cq",
      "concluido",
      "arquivado",
    ]);
  });

  it("um NOVO departamento de prompt vira coluna automaticamente (sem mudança de código)", () => {
    const comNovaFase = [...basePrompts, { departamento: "embalagem", ordem: 4 }];
    expect(buildKanbanColumns(comNovaFase)).toEqual([
      "atendimento",
      "design",
      "cq",
      "embalagem",
      "concluido",
      "arquivado",
    ]);
  });

  it("respeita a ordem configurada nos prompts, não a ordem de cadastro", () => {
    const foraDeOrdem = [
      { departamento: "cq", ordem: 3 },
      { departamento: "pre_producao", ordem: 0 },
      { departamento: "atendimento", ordem: 1 },
    ];
    expect(buildKanbanColumns(foraDeOrdem).slice(0, 3)).toEqual([
      "pre_producao",
      "atendimento",
      "cq",
    ]);
  });

  it("ignora prompts inativos", () => {
    const prompts = [
      { departamento: "atendimento", ordem: 1 },
      { departamento: "obsoleto", ordem: 2, ativo: "nao" },
    ];
    expect(buildKanbanColumns(prompts)).not.toContain("obsoleto");
  });

  it("fases presentes em pedidos mas sem prompt também viram coluna", () => {
    const cols = buildKanbanColumns(basePrompts, ["fase_legada", "design"]);
    expect(cols).toContain("fase_legada");
    // antes das terminais
    expect(cols.indexOf("fase_legada")).toBeLessThan(cols.indexOf("concluido"));
  });

  it("não duplica colunas com múltiplos prompts do mesmo departamento", () => {
    const prompts = [
      { departamento: "design", ordem: 2 },
      { departamento: "design", ordem: 5 },
    ];
    const cols = buildKanbanColumns(prompts);
    expect(cols.filter((c) => c === "design")).toHaveLength(1);
  });
});

describe("groupPedidosByPhase", () => {
  it("agrupa pedidos e não perde pedido de fase desconhecida", () => {
    const cols = ["atendimento", "design", "concluido", "arquivado"];
    const pedidos = [
      { id: 1, faseAtual: "design" },
      { id: 2, faseAtual: "fase_inexistente" },
    ];
    const grouped = groupPedidosByPhase(pedidos, cols);
    expect(grouped.design).toHaveLength(1);
    // fallback: primeira coluna de workflow
    expect(grouped.atendimento).toHaveLength(1);
  });
});

describe("phaseLabel — rótulo resiliente para fases novas", () => {
  const tMock = (key: string) => (key === "phase.design" ? "Design" : key);

  it("usa a tradução quando existe", () => {
    expect(phaseLabel(tMock, "design")).toBe("Design");
  });

  it("humaniza o slug quando NÃO existe tradução (nunca mostra chave crua)", () => {
    expect(phaseLabel(tMock, "pre_producao")).toBe("Pre Producao");
    expect(phaseLabel(tMock, "nova-fase")).toBe("Nova Fase");
  });

  it("humanizePhase formata slugs compostos", () => {
    expect(humanizePhase("controle_qualidade_final")).toBe("Controle Qualidade Final");
  });
});
