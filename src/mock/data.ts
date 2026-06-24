/** Mock data for offline / demo mode (VITE_USE_MOCK=true) */

export const MOCK_TOKEN = "mock-demo-token";

export const MOCK_USER = {
  id: 1,
  name: "Ricardo Mendes",
  email: "admin@doccompare.com",
  role: "admin" as const,
  departamento: "admin" as const,
  isSupervisor: true,
  avatar: null,
  createdAt: new Date("2026-01-15"),
  lastSignInAt: new Date(),
};

export const MOCK_DEMO_USERS = [
  MOCK_USER,
  {
    id: 2,
    name: "Ana Atendimento",
    email: "atendimento@doccompare.com",
    role: "user" as const,
    departamento: "atendimento" as const,
    isSupervisor: false,
    avatar: null,
    createdAt: new Date("2026-02-01"),
    lastSignInAt: new Date(),
  },
  {
    id: 3,
    name: "Bruno Design",
    email: "design@doccompare.com",
    role: "user" as const,
    departamento: "design" as const,
    isSupervisor: false,
    avatar: null,
    createdAt: new Date("2026-02-01"),
    lastSignInAt: new Date(),
  },
  {
    id: 4,
    name: "Carla CQ",
    email: "cq@doccompare.com",
    role: "user" as const,
    departamento: "cq" as const,
    isSupervisor: false,
    avatar: null,
    createdAt: new Date("2026-02-01"),
    lastSignInAt: new Date(),
  },
  {
    id: 5,
    name: "Sofia Supervisor",
    email: "supervisor@doccompare.com",
    role: "user" as const,
    departamento: "supervisor" as const,
    isSupervisor: true,
    avatar: null,
    createdAt: new Date("2026-02-01"),
    lastSignInAt: new Date(),
  },
];

export const MOCK_SESSION_USER_KEY = "doccompare_mock_user_id";

export function resolveMockUser(email?: string) {
  const normalized = (email ?? "").trim().toLowerCase();
  const exact = MOCK_DEMO_USERS.find((u) => u.email === normalized);
  if (exact) return exact;
  if (normalized.includes("atendimento")) return MOCK_DEMO_USERS[1];
  if (normalized.includes("design")) return MOCK_DEMO_USERS[2];
  if (normalized.includes("cq") || normalized.includes("quality")) return MOCK_DEMO_USERS[3];
  if (normalized.includes("supervisor")) return MOCK_DEMO_USERS[4];
  if (normalized.includes("admin")) return MOCK_USER;
  return MOCK_USER;
}

export function getActiveMockUser() {
  if (typeof sessionStorage === "undefined") return MOCK_USER;
  const id = Number(sessionStorage.getItem(MOCK_SESSION_USER_KEY));
  return MOCK_DEMO_USERS.find((u) => u.id === id) ?? MOCK_USER;
}

export function setActiveMockUser(userId: number) {
  sessionStorage.setItem(MOCK_SESSION_USER_KEY, String(userId));
}

export const MOCK_COMPARACAO_UUID = "mock-demo-result-001";

export const MOCK_PROMPTS = [
  {
    id: 1,
    slug: "briefing-validacao-inicial",
    nome: "BRIEFING — Validação Inicial do Pedido",
    descricao:
      "Valida Order Details contra Ordem de Compra, Die Cut, Foto e Relatório de Inspeção.",
    departamento: "atendimento" as const,
    tipoEmbalagem: "todos" as const,
    icone: "ClipboardCheck",
    badge: "BASICO",
    ordem: 1,
    ativo: "sim" as const,
    promptSistema: "[Mock prompt — atendimento]",
    promptUsuario: null,
    modeloOutput: null,
    variaveis: [{ nome: "codigoPedido", descricao: "Código do pedido", obrigatorio: true }],
    versao: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    slug: "revisao-embalagens",
    nome: "REVISÃO DE EMBALAGENS — Artwork vs Order Details",
    descricao: "Compara artwork desenvolvido com a Order Details.",
    departamento: "design" as const,
    tipoEmbalagem: "todos" as const,
    icone: "Palette",
    badge: "BASICO",
    ordem: 2,
    ativo: "sim" as const,
    promptSistema: "[Mock prompt — design]",
    promptUsuario: null,
    modeloOutput: null,
    variaveis: [],
    versao: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: 3,
    slug: "revisao-sketch",
    nome: "REVISÃO SKETCH — Contraprova vs Artwork",
    descricao: "Valida sketch do fornecedor contra artwork aprovado.",
    departamento: "cq" as const,
    tipoEmbalagem: "todos" as const,
    icone: "ShieldCheck",
    badge: "PRO",
    ordem: 3,
    ativo: "sim" as const,
    promptSistema: "[Mock prompt — cq]",
    promptUsuario: null,
    modeloOutput: null,
    variaveis: [],
    versao: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

export const MOCK_PEDIDOS = [
  {
    id: 1,
    codigoPedido: "SAT11675-25",
    nome: "LED Mirror Inner Box",
    statusGeral: "em_andamento" as const,
    faseAtual: "atendimento" as const,
    dadosCliente: {
      nomeCliente: "Cliente Demo Ltda",
      numeroPO: "PO-2025-8842",
      fornecedor: "Shenzhen Toys Co.",
    },
    createdAt: new Date("2026-03-10"),
    updatedAt: new Date("2026-03-12"),
    comparacaoCount: 1,
    documentoCount: 4,
    taxaDivergencia: 12,
    departamentoAtivo: "atendimento" as const,
    responsavelNome: "Ana Atendimento",
  },
  {
    id: 2,
    codigoPedido: "SAT12052-26-1",
    nome: "Plush Bear Color Box",
    statusGeral: "pendente" as const,
    faseAtual: "design" as const,
    dadosCliente: { nomeCliente: "ToyWorld Brasil", fornecedor: "Guangzhou Plush Mfg" },
    createdAt: new Date("2026-03-05"),
    updatedAt: new Date("2026-03-08"),
    comparacaoCount: 2,
    documentoCount: 6,
    taxaDivergencia: 28,
    departamentoAtivo: "design" as const,
    responsavelNome: "Bruno Design",
  },
  {
    id: 3,
    codigoPedido: "SAT09901-24",
    nome: "Master Carton — Board Game",
    statusGeral: "concluido" as const,
    faseAtual: "concluido" as const,
    dadosCliente: { nomeCliente: "Games Import SA" },
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-20"),
    comparacaoCount: 3,
    documentoCount: 8,
    taxaDivergencia: 0,
    departamentoAtivo: "cq" as const,
    responsavelNome: "Carla CQ",
  },
  {
    id: 4,
    codigoPedido: "SAT11890-26",
    nome: "Barcode Label — Snack Pack",
    statusGeral: "em_andamento" as const,
    faseAtual: "cq" as const,
    dadosCliente: { nomeCliente: "SnackCo", numeroPO: "PO-2026-1102" },
    createdAt: new Date("2026-03-14"),
    updatedAt: new Date("2026-03-15"),
    comparacaoCount: 1,
    documentoCount: 3,
    taxaDivergencia: 5,
    departamentoAtivo: "cq" as const,
    responsavelNome: "Carla CQ",
  },
  {
    id: 5,
    codigoPedido: "SAT08771-23",
    nome: "Vintage Puzzle Box (archived)",
    statusGeral: "arquivado" as const,
    faseAtual: "arquivado" as const,
    dadosCliente: { nomeCliente: "Retro Toys" },
    createdAt: new Date("2025-11-10"),
    updatedAt: new Date("2025-12-01"),
    comparacaoCount: 2,
    documentoCount: 5,
    taxaDivergencia: 3,
    departamentoAtivo: "atendimento" as const,
    responsavelNome: "Ana Atendimento",
  },
];

/** Deterministic dashboard metrics derived from mock pedidos (stable for UAT). */
export function computeMockOverview() {
  const totalPedidos = MOCK_PEDIDOS.length;
  const pedidosAtivos = MOCK_PEDIDOS.filter(
    (p) => p.statusGeral === "em_andamento" || p.statusGeral === "pendente"
  ).length;
  const totalComparacoes = MOCK_PEDIDOS.reduce((sum, p) => sum + (p.comparacaoCount ?? 0), 0);
  const comparacoesConcluidas = MOCK_PEDIDOS.filter(
    (p) => p.statusGeral === "concluido" || p.statusGeral === "arquivado"
  ).reduce((sum, p) => sum + (p.comparacaoCount ?? 0), 0);

  return {
    totalPedidos,
    pedidosAtivos,
    totalComparacoes,
    comparacoesConcluidas,
    totalItens: totalComparacoes * 3,
    itensReprovados: 3,
    totalDivergencias: 1,
    tendencia: {
      pedidos: { atual: 3, anterior: 2, variacao: 50 },
      comparacoes: { atual: 6, anterior: 5, variacao: 20 },
      reprovados: { atual: 1, anterior: 2, variacao: -50 },
    },
  };
}

const mockAnalises = [
  {
    id: 1,
    comparacaoItemId: 1,
    campo: "EAN-13 (Barcode Label)",
    valorEsperado: "6952373407492",
    valorEncontrado: "6952373407492",
    status: "ok" as const,
    observacao: null,
    aprovadoPor: null,
    aprovadoEm: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    comparacaoItemId: 1,
    campo: "Dimensões (L×W×H mm)",
    valorEsperado: "120 × 80 × 45",
    valorEncontrado: "120 × 82 × 45",
    status: "warning" as const,
    observacao: "Largura diverge 2mm em relação ao Die Cut",
    aprovadoPor: null,
    aprovadoEm: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    comparacaoItemId: 1,
    campo: "DUN-14 (Master Carton)",
    valorEsperado: "26952373407506",
    valorEncontrado: "26952373407519",
    status: "critical" as const,
    observacao: "Dígito verificador incorreto na OD",
    aprovadoPor: null,
    aprovadoEm: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MOCK_COMPARACAO_RESULT = {
  comparacao: {
    id: 1,
    uuid: MOCK_COMPARACAO_UUID,
    pedidoId: 1,
    versao: 1,
    departamento: "atendimento" as const,
    promptId: 1,
    status: "concluido" as const,
    mensagemErro: null,
    tokensEntrada: 12450,
    tokensSaida: 3200,
    tempoProcessamento: 42,
    modelo: "kimi-k2.5",
    createdAt: new Date("2026-03-12T10:30:00"),
    updatedAt: new Date("2026-03-12T10:31:00"),
  },
  prompt: MOCK_PROMPTS[0],
  pedido: {
    id: 1,
    codigoPedido: "SAT11675-25",
    nome: "LED Mirror Inner Box",
    statusGeral: "em_andamento",
    faseAtual: "atendimento",
    userId: 1,
    dadosCliente: MOCK_PEDIDOS[0].dadosCliente,
    createdAt: new Date("2026-03-10"),
    updatedAt: new Date("2026-03-12"),
  },
  documentos: [
    {
      id: 1,
      nomeOriginal: "SAT11675-25_OrderDetails.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tamanhoBytes: 45600,
      tipoDocumento: "order_details",
      tipoEmbalagem: "nao_aplicavel",
      ordem: 0,
    },
    {
      id: 2,
      nomeOriginal: "DieCut_InnerBox.pdf",
      mimeType: "application/pdf",
      tamanhoBytes: 128000,
      tipoDocumento: "die_cut",
      tipoEmbalagem: "nao_aplicavel",
      ordem: 1,
    },
    {
      id: 3,
      nomeOriginal: "PO-8842.pdf",
      mimeType: "application/pdf",
      tamanhoBytes: 89000,
      tipoDocumento: "commercial_invoice",
      tipoEmbalagem: "nao_aplicavel",
      ordem: 2,
    },
    {
      id: 4,
      nomeOriginal: "product_photo.jpg",
      mimeType: "image/jpeg",
      tamanhoBytes: 2400000,
      tipoDocumento: "foto",
      tipoEmbalagem: "nao_aplicavel",
      ordem: 3,
    },
  ],
  itens: [
    {
      id: 1,
      comparacaoId: 1,
      tipoEmbalagem: "barcode_label" as const,
      status: "pendente" as const,
      resumoExecutivo:
        "**Pedido SAT11675-25** apresenta **2 apontamentos** entre Order Details, Die Cut e PO.\n\nO EAN-13 do barcode label está correto. Há divergência de 2mm na largura do Die Cut e DUN-14 com dígito verificador inválido na OD.",
      secoes: [
        {
          titulo: "OD vs Ordem de Compra",
          conteudo: "Quantidade e SKU conferem. PO solicita acabamento matte — OD indica glossy.",
          severidade: "warning" as const,
        },
        {
          titulo: "OD vs Die Cut",
          conteudo: "Dimensão largura: OD 80mm, Die Cut 82mm.",
          severidade: "critical" as const,
        },
      ],
      tabelaComparativa: [],
      analises: mockAnalises,
      aprovadoPor: null,
      aprovadoEm: null,
      observacaoAprovacao: null,
    },
    {
      id: 2,
      comparacaoId: 1,
      tipoEmbalagem: "color_box" as const,
      status: "pendente" as const,
      resumoExecutivo: "Color box sem contradições críticas identificadas.",
      secoes: [
        {
          titulo: "Completude",
          conteudo: "Todos os campos obrigatórios presentes na OD.",
          severidade: "info" as const,
        },
      ],
      tabelaComparativa: [],
      analises: [
        {
          ...mockAnalises[0],
          id: 4,
          comparacaoItemId: 2,
          campo: "Texto produto (PT-BR)",
          valorEsperado: "Espelho LED com luz",
          valorEncontrado: "Espelho LED com luz",
          status: "ok" as const,
        },
      ],
      aprovadoPor: null,
      aprovadoEm: null,
      observacaoAprovacao: null,
    },
    {
      id: 3,
      comparacaoId: 1,
      tipoEmbalagem: "master_carton" as const,
      status: "pendente" as const,
      resumoExecutivo: "Master carton: atenção ao DUN-14 e peso bruto.",
      secoes: [],
      tabelaComparativa: [],
      analises: mockAnalises.slice(2, 3),
      aprovadoPor: null,
      aprovadoEm: null,
      observacaoAprovacao: null,
    },
  ],
};

export const MOCK_NOTIFICACOES = [
  {
    id: 1,
    userId: 1,
    tipo: "comparacao_concluida" as const,
    titulo: "Análise concluída",
    mensagem: "A comparação do pedido SAT11675-25 foi finalizada.",
    referenciaId: 1,
    referenciaTipo: "comparacao",
    lida: false,
    createdAt: new Date("2026-03-12T10:31:00"),
  },
  {
    id: 2,
    userId: 1,
    tipo: "proxima_fase" as const,
    titulo: "Pedido aguarda Design",
    mensagem: 'O pedido "Plush Bear" foi movido para a fase de design.',
    referenciaId: 2,
    referenciaTipo: "pedido",
    lida: true,
    createdAt: new Date("2026-03-08T14:00:00"),
  },
];

export const MOCK_USUARIOS = MOCK_DEMO_USERS;

export const MOCK_DIVERGENCIAS = [
  {
    id: 1,
    tipo: "falso_positivo" as const,
    descricaoHumano: "IA marcou erro de cor — era variação de impressão aceitável",
    descricaoIA: "Pantone divergente",
    campoAfetado: "Cor Pantone",
    resolvido: false,
    resolvidoPor: null,
    resolvidoEm: null,
    createdAt: new Date("2026-03-01"),
    comparacaoDepartamento: "design",
    comparacaoPedidoId: 2,
    comparacaoItemTipoEmbalagem: "color_box",
  },
];

export const MOCK_AQL_REVISOES = [
  {
    id: 1,
    comparacaoItemId: 1,
    designadoPara: 1,
    designadoEm: new Date("2026-03-12"),
    status: "pendente" as const,
    resultado: null,
    observacao: null,
    pedidoCodigo: "SAT11675-25",
    pedidoNome: "LED Mirror Inner Box",
    tipoEmbalagem: "barcode_label",
    departamento: "atendimento",
  },
];

/** Minimal valid PDF (blank page) as base64 */
export const MOCK_PDF_BASE64 =
  "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUj4+CmVuZG9iagoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE5NQolJUVPRg==";
