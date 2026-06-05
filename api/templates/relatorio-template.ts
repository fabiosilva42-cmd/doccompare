/**
 * Template HTML para geração de relatórios PDF.
 * Baseado no modelo de relatório de inspeção do CQ.
 */

export interface RelatorioData {
  pedido: {
    codigoPedido: string;
    nome: string;
    dadosCliente?: {
      nomeCliente?: string;
      numeroPI?: string;
      numeroPO?: string;
      fornecedor?: string;
      quantidade?: number;
      dataEntrega?: string;
    } | null;
  };
  comparacao: {
    id: number;
    uuid: string;
    versao: number;
    departamento: string;
    status: string;
    modelo?: string | null;
    tempoProcessamento?: number | null;
    createdAt: Date;
  };
  prompt?: {
    nome: string;
    descricao: string;
    departamento: string;
  } | null;
  embalagem: {
    tipoEmbalagem: string;
    status: string;
    resumoExecutivo?: string | null;
    secoes?: Array<{
      titulo: string;
      conteudo: string;
      severidade: "info" | "warning" | "critical";
    }> | null;
    analises: Array<{
      campo: string;
      valorEsperado?: string | null;
      valorEncontrado?: string | null;
      status: "ok" | "warning" | "critical" | "nao_verificavel";
      observacao?: string | null;
    }>;
    aprovadoPor?: string | null;
    aprovadoEm?: Date | null;
    observacaoAprovacao?: string | null;
  };
  documentos: Array<{
    nomeOriginal: string;
    tipoDocumento: string;
    tipoEmbalagem: string;
  }>;
  avisos?: string[];
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string): string {
  switch (status) {
    case "ok":
      return "status-ok";
    case "warning":
      return "status-warning";
    case "critical":
      return "status-critical";
    case "nao_verificavel":
      return "status-na";
    case "aprovado":
      return "status-ok";
    case "reprovado":
      return "status-critical";
    default:
      return "status-na";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "ok":
      return "OK";
    case "warning":
      return "ALERTA";
    case "critical":
      return "CRÍTICO";
    case "nao_verificavel":
      return "N/A";
    case "aprovado":
      return "APROVADO";
    case "reprovado":
      return "REPROVADO";
    default:
      return status.toUpperCase();
  }
}

function severidadeClass(sev: string): string {
  switch (sev) {
    case "critical":
      return "sev-critical";
    case "warning":
      return "sev-warning";
    default:
      return "sev-info";
  }
}

export function renderRelatorioHTML(data: RelatorioData): string {
  const { pedido, comparacao, prompt, embalagem, documentos, avisos } = data;
  const dc = pedido.dadosCliente;

  const docsHtml = documentos
    .map(
      (d) => `
    <tr>
      <td>${d.nomeOriginal}</td>
      <td>${d.tipoDocumento}</td>
      <td>${d.tipoEmbalagem}</td>
    </tr>
  `
    )
    .join("");

  const analisesHtml = embalagem.analises
    .map(
      (a) => `
    <tr class="${statusClass(a.status)}">
      <td>${a.campo}</td>
      <td>${a.valorEsperado || "—"}</td>
      <td>${a.valorEncontrado || "—"}</td>
      <td><span class="badge ${statusClass(a.status)}">${statusLabel(a.status)}</span></td>
      <td>${a.observacao || "—"}</td>
    </tr>
  `
    )
    .join("");

  const secoesHtml =
    embalagem.secoes
      ?.map(
        (s) => `
    <div class="secao ${severidadeClass(s.severidade)}">
      <h4>${s.titulo}</h4>
      <div class="secao-conteudo">${s.conteudo.replace(/\n/g, "<br/>")}</div>
    </div>
  `
      )
      .join("") || "";

  const avisosHtml =
    avisos && avisos.length > 0
      ? `
    <div class="section">
      <h3 class="section-title">⚠️ AVISOS / LIMITAÇÕES DA ANÁLISE</h3>
      <div class="avisos">
        ${avisos.map((a) => `<div class="aviso-item">• ${a}</div>`).join("")}
      </div>
    </div>
  `
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Análise — ${pedido.codigoPedido}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #334155;
      background: #fff;
      padding: 32px;
    }
    .header {
      border-bottom: 3px solid #1e3a5f;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 10px;
      font-size: 10px;
    }
    .header-meta span { color: #64748b; }
    .header-meta strong { color: #334155; }

    .status-geral {
      display: inline-block;
      padding: 8px 24px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 16px 0;
    }
    .status-aprovado { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-reprovado { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .status-pendente { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }

    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #fff;
      background: #1e3a5f;
      padding: 8px 12px;
      margin-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
    }
    tr:nth-child(even) { background: #f8fafc; }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-ok .badge { background: #dcfce7; color: #166534; }
    .status-warning .badge { background: #fef3c7; color: #92400e; }
    .status-critical .badge { background: #fee2e2; color: #991b1b; }
    .status-na .badge { background: #f1f5f9; color: #64748b; }

    .resumo-box {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 10.5px;
      line-height: 1.7;
    }

    .secao {
      border-left: 4px solid #cbd5e1;
      padding: 10px 14px;
      margin-bottom: 10px;
      background: #fff;
    }
    .secao h4 { font-size: 10.5px; font-weight: 700; color: #334155; margin-bottom: 4px; }
    .secao-conteudo { color: #475569; font-size: 10px; line-height: 1.6; }
    .sev-critical { border-left-color: #ef4444; background: #fef2f2; }
    .sev-warning { border-left-color: #f59e0b; background: #fffbeb; }
    .sev-info { border-left-color: #3b82f6; background: #eff6ff; }

    .assinatura {
      margin-top: 24px;
      border-top: 2px solid #1e3a5f;
      padding-top: 16px;
    }
    .assinatura-grid {
      display: flex;
      gap: 24px;
      margin-top: 10px;
    }
    .assinatura-item {
      flex: 1;
      text-align: center;
    }
    .assinatura-linha {
      border-bottom: 1px solid #94a3b8;
      height: 30px;
      margin-bottom: 4px;
    }
    .assinatura-label { font-size: 9px; color: #64748b; }
    .assinatura-valor { font-size: 10px; font-weight: 600; color: #334155; }

    .avisos { background: #fffbeb; border: 1px solid #fcd34d; padding: 12px; }
    .aviso-item { font-size: 10px; color: #92400e; margin-bottom: 4px; }

    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-title">Relatório de Análise — ${prompt?.departamento?.toUpperCase() || "ANÁLISE"}</div>
    <div class="header-meta">
      <span><strong>Pedido:</strong> ${pedido.codigoPedido}</span>
      <span><strong>Produto:</strong> ${pedido.nome}</span>
      ${dc?.nomeCliente ? `<span><strong>Cliente:</strong> ${dc.nomeCliente}</span>` : ""}
      ${dc?.fornecedor ? `<span><strong>Fornecedor:</strong> ${dc.fornecedor}</span>` : ""}
      ${dc?.numeroPI ? `<span><strong>PI:</strong> ${dc.numeroPI}</span>` : ""}
      ${dc?.numeroPO ? `<span><strong>PO:</strong> ${dc.numeroPO}</span>` : ""}
      <span><strong>Data:</strong> ${formatDate(comparacao.createdAt)}</span>
      <span><strong>Modelo IA:</strong> ${comparacao.modelo || "kimi-latest"}</span>
    </div>
  </div>

  <!-- Status Geral -->
  <div class="section">
    <div class="status-geral ${embalagem.status === "aprovado" ? "status-aprovado" : embalagem.status === "reprovado" ? "status-reprovado" : "status-pendente"}">
      ${embalagem.status === "aprovado" ? "✓ APROVADO" : embalagem.status === "reprovado" ? "✗ REPROVADO" : "⏳ PENDENTE"}
      — ${embalagem.tipoEmbalagem.replace("_", " ").toUpperCase()}
    </div>
    ${embalagem.observacaoAprovacao ? `<p style="font-size:10px;color:#64748b;margin-top:6px;"><strong>Observação:</strong> ${embalagem.observacaoAprovacao}</p>` : ""}
  </div>

  <!-- Documentos -->
  <div class="section">
    <h3 class="section-title">📄 Documentos Analisados</h3>
    <table>
      <thead>
        <tr><th>Documento</th><th>Tipo</th><th>Embalagem</th></tr>
      </thead>
      <tbody>${docsHtml}</tbody>
    </table>
  </div>

  <!-- Resumo Executivo -->
  ${embalagem.resumoExecutivo ? `
  <div class="section">
    <h3 class="section-title">📊 Resumo Executivo</h3>
    <div class="resumo-box">${embalagem.resumoExecutivo.replace(/\n/g, "<br/>")}</div>
  </div>
  ` : ""}

  <!-- Itens Analisados -->
  <div class="section">
    <h3 class="section-title">🔍 Validação dos Dados — Relatório vs Documentos</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Valor Esperado</th>
          <th>Valor Encontrado</th>
          <th>Status</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>${analisesHtml}</tbody>
    </table>
  </div>

  <!-- Seções Detalhadas -->
  ${secoesHtml ? `
  <div class="section">
    <h3 class="section-title">📝 Detalhamento da Análise</h3>
    ${secoesHtml}
  </div>
  ` : ""}

  <!-- Avisos -->
  ${avisosHtml}

  <!-- Assinatura -->
  <div class="assinatura">
    <h3 class="section-title">✍️ Assinatura Digital / Aprovação</h3>
    <div class="assinatura-grid">
      <div class="assinatura-item">
        <div class="assinatura-linha"></div>
        <div class="assinatura-label">Análise realizada por IA</div>
        <div class="assinatura-valor">${comparacao.modelo || "kimi-latest"}</div>
      </div>
      <div class="assinatura-item">
        <div class="assinatura-linha"></div>
        <div class="assinatura-label">Validado por</div>
        <div class="assinatura-valor">${embalagem.aprovadoPor || "Pendente"}</div>
      </div>
      <div class="assinatura-item">
        <div class="assinatura-linha"></div>
        <div class="assinatura-label">Data da validação</div>
        <div class="assinatura-valor">${formatDate(embalagem.aprovadoEm)}</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Relatório gerado pela Plataforma de Compare — ${formatDate(new Date())}<br/>
    Este documento é gerado automaticamente e possui valor de auditoria.
  </div>
</body>
</html>`;
}
