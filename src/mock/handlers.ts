import {
  MOCK_TOKEN,
  MOCK_PROMPTS,
  MOCK_PEDIDOS,
  MOCK_COMPARACAO_RESULT,
  MOCK_COMPARACAO_UUID,
  MOCK_NOTIFICACOES,
  MOCK_USUARIOS,
  MOCK_DIVERGENCIAS,
  MOCK_AQL_REVISOES,
  MOCK_PDF_BASE64,
  resolveMockUser,
  getActiveMockUser,
  setActiveMockUser,
} from "./data";

type MockState = {
  itemStatuses: Record<number, string>;
  workflowAdvanced: boolean;
};

const state: MockState = {
  itemStatuses: { 1: "pendente", 2: "pendente", 3: "pendente" },
  workflowAdvanced: false,
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasToken(): boolean {
  return !!localStorage.getItem("doccompare_token");
}

export async function handleMockProcedure(
  path: string,
  input: unknown,
  type: "query" | "mutation" | "subscription"
): Promise<unknown> {
  // Simulate network latency for mutations / heavy queries
  if (type === "mutation" || path.includes("executar")) {
    await delay(path === "comparacao.executar" ? 1500 : 300);
  }

  switch (path) {
    case "auth.login":
    case "auth.register": {
      const email = (input as { email?: string })?.email;
      const user = resolveMockUser(email);
      setActiveMockUser(user.id);
      return {
        token: MOCK_TOKEN,
        user: {
          ...user,
          ...(path === "auth.register" ? { name: (input as { name?: string })?.name ?? user.name } : {}),
        },
      };
    }

    case "auth.logout":
      sessionStorage.removeItem("doccompare_mock_user_id");
      return { success: true };

    case "auth.me":
      return hasToken() ? getActiveMockUser() : null;

    case "auth.forgotPassword":
    case "auth.resetPassword":
      return { success: true };

    case "prompt.list":
      return MOCK_PROMPTS.map(({ promptSistema, promptUsuario, modeloOutput, variaveis, versao, createdAt, updatedAt, ...p }) => p);

    case "prompt.listAdmin":
      return MOCK_PROMPTS;

    case "prompt.update":
    case "prompt.toggleAtivo":
      return { success: true };

    case "pedido.list":
      return MOCK_PEDIDOS;

    case "pedido.create":
      return { id: 99 };

    case "pedido.delete":
    case "pedido.duplicar":
    case "pedido.arquivar":
    case "pedido.updateStatus":
      return { success: true, id: 99 };

    case "comparacao.create":
      return { id: 1, uuid: MOCK_COMPARACAO_UUID };

    case "comparacao.executar":
      return {
        status: "concluido",
        tempoProcessamento: 38,
        tokensEntrada: 11000,
        tokensSaida: 2800,
      };

    case "comparacao.getByUuid": {
      const result = structuredClone(MOCK_COMPARACAO_RESULT);
      result.itens = result.itens.map((item) => ({
        ...item,
        status: (state.itemStatuses[item.id] ?? item.status) as typeof item.status,
      }));
      if (state.workflowAdvanced) {
        result.pedido = { ...result.pedido, faseAtual: "design" };
      }
      return result;
    }

    case "comparacao.checkStatus":
      return { status: "concluido", mensagemErro: null, tempoProcessamento: 42 };

    case "comparacao.aprovarItem": {
      const { comparacaoItemId, status } = input as { comparacaoItemId: number; status: string };
      state.itemStatuses[comparacaoItemId] = status;
      return { success: true };
    }

    case "comparacao.aprovarAnaliseItem":
      return { success: true };

    case "upload.register":
      return { documentoIds: [101, 102] };

    case "workflow.verificarFase": {
      const pendentes = Object.values(state.itemStatuses).filter((s) => s === "pendente").length;
      const reprovados = Object.values(state.itemStatuses).filter((s) => s === "reprovado").length;
      const faseAtual = state.workflowAdvanced ? "design" : "atendimento";
      return {
        faseAtual,
        proximaFase: faseAtual === "atendimento" ? "design" : faseAtual === "design" ? "cq" : "concluido",
        podeAvancar: pendentes === 0 && reprovados === 0,
        pendentes,
        reprovados,
      };
    }

    case "workflow.avancarFase":
      state.workflowAdvanced = true;
      return { success: true, faseAnterior: "atendimento", novaFase: "design" };

    case "workflow.reprovarFase":
      return { success: true };

    case "pdf.gerar":
    case "pdf.gerarResumoExecutivo":
      return {
        pdfBase64: MOCK_PDF_BASE64,
        filename: "relatorio_mock.pdf",
      };

    case "metricas.overview":
      return {
        totalPedidos: 12,
        pedidosAtivos: 8,
        totalComparacoes: 24,
        comparacoesConcluidas: 22,
        totalItens: 66,
        itensReprovados: 3,
        totalDivergencias: 1,
        tendencia: {
          pedidos: { atual: 4, anterior: 3, variacao: 33 },
          comparacoes: { atual: 6, anterior: 5, variacao: 20 },
          reprovados: { atual: 1, anterior: 2, variacao: -50 },
        },
      };

    case "metricas.reprovacaoPorDepartamento":
      return [
        { departamento: "atendimento", total: 8, reprovados: 1, taxa: 13 },
        { departamento: "design", total: 10, reprovados: 2, taxa: 20 },
        { departamento: "cq", total: 6, reprovados: 0, taxa: 0 },
      ];

    case "metricas.reprovacaoPorEmbalagem":
      return [
        { tipoEmbalagem: "barcode_label", total: 20, reprovados: 2, taxa: 10 },
        { tipoEmbalagem: "color_box", total: 20, reprovados: 1, taxa: 5 },
        { tipoEmbalagem: "master_carton", total: 20, reprovados: 0, taxa: 0 },
      ];

    case "metricas.rankingErros":
      return [
        { campo: "DUN-14", totalErros: 8 },
        { campo: "Dimensões", totalErros: 6 },
        { campo: "EAN-13", totalErros: 4 },
      ];

    case "metricas.tokensPorMes":
      return [
        { mes: "2026-01", tokensEntrada: 120000, tokensSaida: 35000, totalComparacoes: 8 },
        { mes: "2026-02", tokensEntrada: 98000, tokensSaida: 28000, totalComparacoes: 6 },
        { mes: "2026-03", tokensEntrada: 145000, tokensSaida: 42000, totalComparacoes: 10 },
      ];

    case "metricas.listarDivergencias":
      return MOCK_DIVERGENCIAS;

    case "metricas.resolverDivergencia":
      return { success: true };

    case "notificacao.list":
      return MOCK_NOTIFICACOES;

    case "notificacao.countNaoLidas":
      return MOCK_NOTIFICACOES.filter((n) => !n.lida).length;

    case "notificacao.marcarLida":
    case "notificacao.marcarTodasLidas":
    case "notificacao.delete":
      return { success: true };

    case "aql.minhasRevisoes":
      return MOCK_AQL_REVISOES;

    case "aql.submeterRevisao":
      return { success: true };

    case "usuario.list":
      return MOCK_USUARIOS;

    case "usuario.create":
    case "usuario.update":
    case "usuario.updateRole":
    case "usuario.delete":
      return { success: true };

    case "divergencia.list":
    case "divergencia.listAll":
      return MOCK_DIVERGENCIAS;

    case "divergencia.create":
    case "divergencia.resolver":
      return { success: true };

    default:
      console.warn(`[Mock API] Unhandled procedure: ${path}`, input);
      return null;
  }
}

export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === "true";
}
