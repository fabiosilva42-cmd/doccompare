import { userStorageKey } from "./userStorageKey";

export type PedidoListItem = {
  id: number;
  codigoPedido: string;
  nome: string;
  statusGeral: string;
  faseAtual: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  documentoCount?: number;
  comparacaoCount?: number;
  dadosCliente?: {
    nomeCliente?: string;
    numeroPO?: string;
    fornecedor?: string;
  };
  /** Active workflow department (F2 filter) */
  departamentoAtivo?: string;
  /** Assignee shown on Kanban cards (F6) */
  responsavelNome?: string;
  /** Frontend-only until backend adds field */
  taxaDivergencia?: number;
};

export type PedidoFilterState = {
  search: string;
  status: string;
  phase: string;
  department: string;
  dateFrom: string;
  dateTo: string;
  divergenceMin: string;
  divergenceMax: string;
};

export const DEFAULT_PEDIDO_FILTERS: PedidoFilterState = {
  search: "",
  status: "todos",
  phase: "todos",
  department: "todos",
  dateFrom: "",
  dateTo: "",
  divergenceMin: "",
  divergenceMax: "",
};

export type FilterPreset = {
  id: string;
  name: string;
  filters: PedidoFilterState;
  createdAt: string;
};

const PRESETS_KEY = "doccompare_filter_presets";

export function loadFilterPresets(userId?: number | null): FilterPreset[] {
  try {
    const raw = localStorage.getItem(userStorageKey(PRESETS_KEY, userId));
    return raw ? (JSON.parse(raw) as FilterPreset[]) : [];
  } catch {
    return [];
  }
}

export function saveFilterPresets(presets: FilterPreset[], userId?: number | null) {
  localStorage.setItem(userStorageKey(PRESETS_KEY, userId), JSON.stringify(presets));
}

function pedidoDepartment(p: PedidoListItem) {
  return p.departamentoAtivo ?? p.faseAtual;
}

export function applyPedidoFilters(pedidos: PedidoListItem[], filters: PedidoFilterState): PedidoListItem[] {
  return pedidos.filter((p) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const client = p.dadosCliente?.nomeCliente?.toLowerCase() ?? "";
      const po = p.dadosCliente?.numeroPO?.toLowerCase() ?? "";
      const match =
        p.nome.toLowerCase().includes(q) ||
        p.codigoPedido.toLowerCase().includes(q) ||
        client.includes(q) ||
        po.includes(q);
      if (!match) return false;
    }

    if (filters.status !== "todos" && p.statusGeral !== filters.status) return false;
    if (filters.phase !== "todos" && p.faseAtual !== filters.phase) return false;
    if (filters.department !== "todos" && pedidoDepartment(p) !== filters.department) return false;

    const created = new Date(p.createdAt).getTime();
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
      if (created < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).setHours(23, 59, 59, 999);
      if (created > to) return false;
    }

    const rate = p.taxaDivergencia ?? 0;
    if (filters.divergenceMin !== "" && rate < Number(filters.divergenceMin)) return false;
    if (filters.divergenceMax !== "" && rate > Number(filters.divergenceMax)) return false;

    return true;
  });
}

export function pedidosToExportRows(
  pedidos: PedidoListItem[],
  labels: {
    code: string;
    name: string;
    phase: string;
    status: string;
    department: string;
    client: string;
    po: string;
    assignee: string;
    docs: string;
    comparisons: string;
    divergence: string;
    created: string;
  },
  tPhase: (phase: string) => string,
  tStatus: (status: string) => string,
  tDept: (dept: string) => string,
  locale: string
) {
  const dateFmt = locale === "pt" ? "pt-BR" : "en-US";
  return pedidos.map((p) => ({
    [labels.code]: p.codigoPedido,
    [labels.name]: p.nome,
    [labels.phase]: tPhase(p.faseAtual),
    [labels.status]: tStatus(p.statusGeral),
    [labels.department]: tDept(pedidoDepartment(p)),
    [labels.client]: p.dadosCliente?.nomeCliente ?? "",
    [labels.po]: p.dadosCliente?.numeroPO ?? "",
    [labels.assignee]: p.responsavelNome ?? "",
    [labels.docs]: p.documentoCount ?? 0,
    [labels.comparisons]: p.comparacaoCount ?? 0,
    [labels.divergence]: p.taxaDivergencia != null ? `${p.taxaDivergencia}%` : "—",
    [labels.created]: new Date(p.createdAt).toLocaleDateString(dateFmt),
  }));
}

export function pedidoExportFieldDefs(labels: {
  code: string;
  name: string;
  phase: string;
  status: string;
  department: string;
  client: string;
  po: string;
  assignee: string;
  docs: string;
  comparisons: string;
  divergence: string;
  created: string;
}) {
  return [
    { key: labels.code, label: labels.code, defaultSelected: true },
    { key: labels.name, label: labels.name, defaultSelected: true },
    { key: labels.phase, label: labels.phase, defaultSelected: true },
    { key: labels.status, label: labels.status, defaultSelected: true },
    { key: labels.department, label: labels.department, defaultSelected: true },
    { key: labels.client, label: labels.client, defaultSelected: true },
    { key: labels.po, label: labels.po, defaultSelected: true },
    { key: labels.assignee, label: labels.assignee, defaultSelected: false },
    { key: labels.docs, label: labels.docs, defaultSelected: false },
    { key: labels.comparisons, label: labels.comparisons, defaultSelected: false },
    { key: labels.divergence, label: labels.divergence, defaultSelected: true },
    { key: labels.created, label: labels.created, defaultSelected: true },
  ];
}
