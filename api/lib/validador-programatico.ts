/**
 * Orquestrador de Validação Programática
 *
 * Recebe o texto extraído da Order Details e valida:
 * - CNPJ (formato + dígito verificador)
 * - EAN-13 (dígito verificador GS1)
 * - DUN-14 (dígito verificador GS1 + prefixo)
 * - NCM (formato + conhecimento)
 * - Campos obrigatórios preenchidos
 *
 * Roda em ~0.5s, 0 tokens de IA, 100% local.
 */

import { validarCnpj, extrairCnpjs } from "./validador-cnpj";
import { validarEan13, validarDun14, extrairCodigosBarras } from "./validador-ean";
import { validarNcm, extrairNcms } from "./validador-ncm";

export interface ResultadoValidacaoProgramatica {
  valido: boolean;
  cnpjs: Array<{
    valor: string;
    valido: boolean;
    formato: string;
    mensagem: string;
  }>;
  eans: Array<{
    valor: string;
    valido: boolean;
    tipo: "ean13" | "dun14" | "desconhecido";
    mensagem: string;
    prefixo?: string;
  }>;
  ncms: Array<{
    valor: string;
    valido: boolean;
    formato: string;
    mensagem: string;
    descricao?: string;
  }>;
  camposObrigatorios: Array<{
    campo: string;
    preenchido: boolean;
    valor?: string;
  }>;
  resumo: string;
  temErrosBloqueantes: boolean;
  temAlertas: boolean;
}

/**
 * Valida um texto extraído da Order Details
 */
export function validarOrderDetails(texto: string): ResultadoValidacaoProgramatica {
  const cnpjs: ResultadoValidacaoProgramatica["cnpjs"] = [];
  const eans: ResultadoValidacaoProgramatica["eans"] = [];
  const ncms: ResultadoValidacaoProgramatica["ncms"] = [];

  // ── Códigos de Barras (EAN-13 / DUN-14) — extrair PRIMEIRO ──────────
  // para evitar que sejam confundidos com CNPJ (ambos têm 14 dígitos)
  const codigosEncontrados = extrairCodigosBarras(texto);

  // Conjunto de posições ocupadas por códigos de barras
  const posicoesBarras = new Set<string>();
  for (const codigo of codigosEncontrados) {
    // Encontrar todas as ocorrências deste código no texto
    let idx = texto.indexOf(codigo);
    while (idx !== -1) {
      for (let i = idx; i < idx + codigo.length; i++) {
        posicoesBarras.add(`${i}`);
      }
      idx = texto.indexOf(codigo, idx + 1);
    }
  }

  // ── CNPJ ────────────────────────────────────────────────────────────
  // Extrair CNPJs, mas excluir os que se sobrepõem a códigos de barras
  const cnpjsEncontrados = extrairCnpjs(texto);
  for (const cnpjStr of cnpjsEncontrados) {
    const numerosCnpj = cnpjStr.replace(/\D/g, "");
    // Verificar se este CNPJ é substring de algum código de barras
    let ehParteDeBarra = false;
    for (const codigo of codigosEncontrados) {
      if (codigo.includes(numerosCnpj)) {
        ehParteDeBarra = true;
        break;
      }
    }
    if (ehParteDeBarra) continue;

    const resultado = validarCnpj(cnpjStr);
    cnpjs.push({
      valor: cnpjStr,
      valido: resultado.valido,
      formato: resultado.formato,
      mensagem: resultado.mensagem,
    });
  }

  // ── Processar códigos de barras ─────────────────────────────────────
  for (const codigo of codigosEncontrados) {
    // Tentar detectar se é inner ou master pelo contexto
    const linhaContexto = encontrarLinhaContexto(texto, codigo);
    const tipoEsperado = detectarTipoEmbalagem(linhaContexto);

    if (codigo.length === 13) {
      const resultado = validarEan13(codigo);
      eans.push({
        valor: codigo,
        valido: resultado.valido,
        tipo: resultado.tipo,
        mensagem: resultado.mensagem,
      });
    } else if (codigo.length === 14) {
      const resultado = validarDun14(codigo, tipoEsperado);
      eans.push({
        valor: codigo,
        valido: resultado.valido,
        tipo: resultado.tipo,
        mensagem: resultado.mensagem,
        prefixo: resultado.prefixo,
      });
    }
  }

  // ── NCM ─────────────────────────────────────────────────────────────
  const ncmsEncontrados = extrairNcms(texto);
  for (const ncmStr of ncmsEncontrados) {
    // Tentar encontrar descrição do produto próximo ao NCM
    const descricaoProduto = extrairDescricaoProxima(texto, ncmStr);
    const resultado = validarNcm(ncmStr, descricaoProduto);
    ncms.push({
      valor: ncmStr,
      valido: resultado.valido,
      formato: resultado.formato,
      mensagem: resultado.mensagem,
      descricao: resultado.descricao,
    });
  }

  // ── Campos Obrigatórios ─────────────────────────────────────────────
  const camposObrigatorios = validarCamposObrigatorios(texto);

  // ── Resumo ──────────────────────────────────────────────────────────
  const cnpjsInvalidos = cnpjs.filter((c) => !c.valido).length;
  const eansInvalidos = eans.filter((e) => !e.valido).length;
  const ncmsInvalidos = ncms.filter((n) => !n.valido).length;
  const camposFaltantes = camposObrigatorios.filter((c) => !c.preenchido).length;

  const partesResumo: string[] = [];
  if (cnpjs.length > 0) {
    partesResumo.push(`${cnpjs.length} CNPJ(s): ${cnpjsInvalidos} inválido(s)`);
  }
  if (eans.length > 0) {
    const ean13Count = eans.filter((e) => e.tipo === "ean13").length;
    const dun14Count = eans.filter((e) => e.tipo === "dun14").length;
    partesResumo.push(`${eans.length} código(s): ${ean13Count} EAN-13, ${dun14Count} DUN-14. ${eansInvalidos} inválido(s)`);
  }
  if (ncms.length > 0) {
    partesResumo.push(`${ncms.length} NCM(s): ${ncmsInvalidos} com problema`);
  }
  if (camposFaltantes > 0) {
    partesResumo.push(`${camposFaltantes} campo(s) obrigatório(s) faltando`);
  }

  const temErrosBloqueantes = cnpjsInvalidos > 0 || eansInvalidos > 0 || ncmsInvalidos > 0 || camposFaltantes > 0;
  const temAlertas = ncms.some((n) => n.valido && n.mensagem.includes("ALERTA"));

  const resumo = partesResumo.length > 0
    ? partesResumo.join(" | ")
    : "Nenhum código encontrado no texto. Verifique se o OCR extraiu corretamente.";

  return {
    valido: !temErrosBloqueantes,
    cnpjs,
    eans,
    ncms,
    camposObrigatorios,
    resumo,
    temErrosBloqueantes,
    temAlertas,
  };
}

/**
 * Encontra a linha onde o código aparece no texto
 */
function encontrarLinhaContexto(texto: string, codigo: string): string {
  const linhas = texto.split(/\n/);
  for (const linha of linhas) {
    if (linha.includes(codigo)) {
      return linha.toLowerCase();
    }
  }
  return "";
}

/**
 * Detecta se o código é de inner pack ou master carton pelo contexto
 */
function detectarTipoEmbalagem(linhaContexto: string): "inner" | "master" | undefined {
  const innerKeywords = ["inner", "inner pack", "unit", "unidade", "individual"];
  const masterKeywords = ["master", "carton", "caixa master", "shipping", "transporte"];

  for (const kw of innerKeywords) {
    if (linhaContexto.includes(kw)) return "inner";
  }
  for (const kw of masterKeywords) {
    if (linhaContexto.includes(kw)) return "master";
  }

  return undefined;
}

/**
 * Tenta extrair a descrição do produto próxima ao NCM
 */
function extrairDescricaoProxima(texto: string, ncm: string): string | undefined {
  const linhas = texto.split(/\n/);
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].includes(ncm)) {
      // Pegar a mesma linha e a próxima
      const contexto = [linhas[i], linhas[i + 1] || ""].join(" ");
      // Tentar extrair texto após o NCM
      const aposNcm = contexto.split(ncm)[1] || "";
      const descricao = aposNcm.replace(/^[^a-zA-Z]*/, "").trim();
      if (descricao.length > 3) return descricao;
    }
  }
  return undefined;
}

/**
 * Valida se campos obrigatórios estão presentes no texto
 */
function validarCamposObrigatorios(texto: string): ResultadoValidacaoProgramatica["camposObrigatorios"] {
  const lower = texto.toLowerCase();
  const campos = [
    { campo: "nome do produto / item description", keywords: ["item description", "product name", "nome do produto", "item name"] },
    { campo: "dimensões / dimensions", keywords: ["dimension", "dimens", "size", "tamanho", "l x w x h", "cm", "mm"] },
    { campo: "peso / weight", keywords: ["weight", "peso", "gross", "net", "kg", "g "] },
    { campo: "quantidade / quantity", keywords: ["quantity", "quantidade", "qty", "pcs", "units"] },
    { campo: "código do produto / sku", keywords: ["sku", "item no", "product code", "codigo", "style", "st"] },
    { campo: "material", keywords: ["material", "paper", "plastic", "cardboard", "carton", "pvc", "abs"] },
    { campo: "cores / colors", keywords: ["color", "cor", "pantone", "cmyk", "rgb"] },
    { campo: "textos / markings", keywords: ["marking", "texto", "text", "warning", "caution", "idade", "age"] },
  ];

  return campos.map(({ campo, keywords }) => {
    const preenchido = keywords.some((kw) => lower.includes(kw.toLowerCase()));
    return { campo, preenchido };
  });
}
