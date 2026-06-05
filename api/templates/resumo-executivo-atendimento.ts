/**
 * Template HTML para geração do Resumo Executivo da Fase 1 (Atendimento)
 *
 * Este PDF é emitido após a validação programática e a análise multimodal.
 * O Design recebe este documento junto com o pedido.
 *
 * Limite: 1 página
 */

export interface ResumoExecutivoData {
  pedido: {
    codigoPedido: string;
    nome: string;
    atendente: string;
    data: Date;
  };
  validacaoProgramatica: {
    valido: boolean;
    cnpjs: Array<{ formato: string; valido: boolean; mensagem: string }>;
    eans: Array<{ valor: string; valido: boolean; tipo: string; mensagem: string }>;
    ncms: Array<{ formato: string; valido: boolean; mensagem: string }>;
    camposObrigatorios: Array<{ campo: string; preenchido: boolean }>;
    resumo: string;
    temErrosBloqueantes: boolean;
    temAlertas: boolean;
  };
  contradicoes: Array<{
    tipo: string;
    sku: string;
    campo: string;
    valorOd: string;
    valorDocumento: string;
    documento: string;
    severidade: string;
    mensagem: string;
    sugestao: string;
  }>;
  recomendacoes: string[];
  documentos: Array<{
    nomeOriginal: string;
    tipoDocumento: string;
  }>;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusEmoji(valido: boolean): string {
  return valido ? "✅" : "❌";
}

function severidadeEmoji(sev: string): string {
  switch (sev) {
    case "bloqueante":
      return "🔴";
    case "alerta":
      return "🟡";
    default:
      return "🔵";
  }
}

export function renderResumoExecutivoHTML(data: ResumoExecutivoData): string {
  const { pedido, validacaoProgramatica, contradicoes, recomendacoes, documentos } = data;

  const docsHtml = documentos
    .map(
      (d) => `
    <tr>
      <td>${d.nomeOriginal}</td>
      <td>${d.tipoDocumento.replace(/_/g, " ").toUpperCase()}</td>
    </tr>
  `
    )
    .join("");

  const cnpjsHtml = validacaoProgramatica.cnpjs
    .map(
      (c) => `
    <tr>
      <td>${c.formato}</td>
      <td>${statusEmoji(c.valido)} ${c.mensagem}</td>
    </tr>
  `
    )
    .join("");

  const eansHtml = validacaoProgramatica.eans
    .map(
      (e) => `
    <tr>
      <td>${e.valor} (${e.tipo.toUpperCase()})</td>
      <td>${statusEmoji(e.valido)} ${e.mensagem}</td>
    </tr>
  `
    )
    .join("");

  const ncmsHtml = validacaoProgramatica.ncms
    .map(
      (n) => `
    <tr>
      <td>${n.formato}</td>
      <td>${statusEmoji(n.valido)} ${n.mensagem}</td>
    </tr>
  `
    )
    .join("");

  const camposHtml = validacaoProgramatica.camposObrigatorios
    .map(
      (c) => `
    <tr>
      <td>${c.campo}</td>
      <td>${statusEmoji(c.preenchido)} ${c.preenchido ? "Presente" : "Faltando"}</td>
    </tr>
  `
    )
    .join("");

  const contradicoesHtml = contradicoes
    .map(
      (c) => `
    <div class="contracao ${c.severidade}">
      <div class="contracao-header">
        <span class="contracao-sev">${severidadeEmoji(c.severidade)} ${c.severidade.toUpperCase()}</span>
        <span class="contracao-sku">${c.sku}</span>
        <span class="contracao-tipo">${c.documento.toUpperCase()}</span>
      </div>
      <p class="contracao-msg">${c.mensagem}</p>
      <div class="contracao-detalhes">
        <span><strong>OD:</strong> ${c.valorOd || "—"}</span>
        <span><strong>Documento:</strong> ${c.valorDocumento || "—"}</span>
      </div>
      <p class="contracao-sugestao">💡 ${c.sugestao}</p>
    </div>
  `
    )
    .join("");

  const recomendacoesHtml = recomendacoes
    .map((r) => `<li>• ${r}</li>`)
    .join("");

  const statusGeral = validacaoProgramatica.temErrosBloqueantes || contradicoes.length > 0
    ? { classe: "status-atencao", texto: "⚠️ COM APONTAMENTOS" }
    : { classe: "status-ok", texto: "✅ APROVADO" };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Resumo Executivo — ${pedido.codigoPedido}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5px;
      line-height: 1.45;
      color: #334155;
      background: #fff;
      padding: 20px 24px;
    }
    .header {
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-left {}
    .header-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-subtitle {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 8.5px;
      color: #64748b;
    }

    .status-geral {
      display: inline-block;
      padding: 5px 16px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .status-ok { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-atencao { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .status-erro { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    .two-col {
      display: flex;
      gap: 12px;
    }
    .col {
      flex: 1;
    }

    .section { margin-bottom: 10px; }
    .section-title {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #fff;
      background: #1e3a5f;
      padding: 4px 8px;
      margin-bottom: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 3px 5px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
      font-size: 7.5px;
      text-transform: uppercase;
    }

    .contracao {
      border-left: 3px solid #cbd5e1;
      padding: 6px 8px;
      margin-bottom: 5px;
      background: #f8fafc;
    }
    .contracao.bloqueante { border-left-color: #ef4444; background: #fef2f2; }
    .contracao.alerta { border-left-color: #f59e0b; background: #fffbeb; }
    .contracao.info { border-left-color: #3b82f6; background: #eff6ff; }

    .contracao-header {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 2px;
    }
    .contracao-sev {
      font-size: 7px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 2px;
      background: #fff;
    }
    .contracao-sku {
      font-weight: 600;
      font-size: 8.5px;
      color: #1e3a5f;
    }
    .contracao-tipo {
      font-size: 7px;
      color: #64748b;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 2px;
    }
    .contracao-msg {
      font-size: 8.5px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 2px;
    }
    .contracao-detalhes {
      display: flex;
      gap: 12px;
      font-size: 8px;
      color: #475569;
      margin-bottom: 2px;
    }
    .contracao-sugestao {
      font-size: 7.5px;
      color: #059669;
      font-style: italic;
    }

    .recomendacoes {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 6px 8px;
      font-size: 8px;
      color: #1e40af;
    }
    .recomendacoes li {
      list-style: none;
      margin-bottom: 1px;
    }

    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: 7px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }

    .badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 2px;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="header-title">Resumo Executivo — Validação Inicial</div>
      <div class="header-subtitle">Fase 1: Atendimento → Design</div>
    </div>
    <div class="header-right">
      <strong>Pedido:</strong> ${pedido.codigoPedido}<br>
      <strong>Data:</strong> ${formatDate(pedido.data)}<br>
      <strong>Atendente:</strong> ${pedido.atendente}
    </div>
  </div>

  <!-- Status Geral -->
  <div class="status-geral ${statusGeral.classe}">${statusGeral.texto}</div>

  <!-- Documentos Analisados -->
  <div class="section">
    <div class="section-title">📄 Documentos Analisados</div>
    <table>
      <thead><tr><th>Documento</th><th>Tipo</th></tr></thead>
      <tbody>${docsHtml}</tbody>
    </table>
  </div>

  <div class="two-col">
    <!-- Validação Programática -->
    <div class="col">
      <div class="section">
        <div class="section-title">🔍 Validação Programática</div>
        <table>
          <thead><tr><th>Item</th><th>Status</th></tr></thead>
          <tbody>
            ${cnpjsHtml}
            ${eansHtml}
            ${ncmsHtml}
            ${camposHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Contradições -->
    <div class="col">
      <div class="section">
        <div class="section-title">⚡ Contradições Encontradas (${contradicoes.length})</div>
        ${contradicoes.length > 0 ? contradicoesHtml : '<p style="font-size:8px;color:#64748b;padding:4px;">Nenhuma contradição encontrada entre documentos.</p>'}
      </div>
    </div>
  </div>

  <!-- Recomendações -->
  ${recomendacoes.length > 0 ? `
  <div class="section">
    <div class="section-title">💡 Recomendações para o Design</div>
    <ul class="recomendacoes">
      ${recomendacoesHtml}
    </ul>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    Gerado automaticamente pela Plataforma de Compare — ${formatDate(new Date())}<br>
    Este documento deve ser revisado pelo designer antes do início do desenvolvimento do artwork.
  </div>
</body>
</html>`;
}
