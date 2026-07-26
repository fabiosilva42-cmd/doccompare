import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { createWorker } from "tesseract.js";
import { extrairTextoMistral, isMistralOcrEnabled } from "./lib/mistral-ocr";

export interface ExtracaoResult {
  texto: string;
  engine: string;
}

/**
 * Extrai texto de diferentes tipos de documentos usando estratégia híbrida:
 *
 * 1. PDF digital (texto nativo)     → pdf-parse
 * 2. PDF escaneado / Imagem / Tabela → Mistral OCR 3 (primário)
 * 3. Imagem simples / Fallback       → Tesseract.js
 * 4. DOCX / Excel / Texto            → parsers nativos
 */
export async function extrairTextoComInfo(
  buffer: Buffer,
  mimeType: string,
  nomeOriginal: string
): Promise<ExtracaoResult> {
  // ── Arquivos de texto plano ─────────────────────────────────────────
  if (
    mimeType.includes("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("csv") ||
    nomeOriginal.endsWith(".txt") ||
    nomeOriginal.endsWith(".csv") ||
    nomeOriginal.endsWith(".json") ||
    nomeOriginal.endsWith(".md")
  ) {
    return { texto: buffer.toString("utf-8"), engine: "texto-plano" };
  }

  // ── PDF ─────────────────────────────────────────────────────────────
  if (mimeType.includes("pdf") || nomeOriginal.endsWith(".pdf")) {
    return await extrairTextoPdfComInfo(buffer, mimeType, nomeOriginal);
  }

  // ── DOCX ────────────────────────────────────────────────────────────
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("officedocument.word") ||
    nomeOriginal.endsWith(".docx")
  ) {
    try {
      const r = await mammoth.extractRawText({ buffer });
      return { texto: r.value, engine: "mammoth-docx" };
    } catch {
      return { texto: `[Nao foi possivel extrair texto do DOCX: ${nomeOriginal}]`, engine: "erro" };
    }
  }

  // ── DOC (formato antigo) ────────────────────────────────────────────
  if (nomeOriginal.endsWith(".doc")) {
    const str = buffer.toString("utf-8");
    const legivel = str.replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, " ");
    const linhas = legivel.split(/\s+/).filter((w) => w.length > 2).join(" ");
    return {
      texto: linhas.length > 100 ? linhas : `[Formato .doc nao suportado: ${nomeOriginal}]`,
      engine: "doc-legacy",
    };
  }

  // ── Excel (XLSX, XLS) ───────────────────────────────────────────────
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    nomeOriginal.endsWith(".xlsx") ||
    nomeOriginal.endsWith(".xls")
  ) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let texto = "";
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        texto += `=== ABA: ${sheetName} ===\n${csv}\n\n`;
      }
      return { texto: texto.trim() || `[Planilha vazia: ${nomeOriginal}]`, engine: "xlsx" };
    } catch {
      return { texto: `[Nao foi possivel extrair texto da planilha: ${nomeOriginal}]`, engine: "erro" };
    }
  }

  // ── Imagens (JPEG, PNG, TIFF, BMP, WebP) ────────────────────────────
  if (
    mimeType.includes("image/") ||
    nomeOriginal.endsWith(".jpg") ||
    nomeOriginal.endsWith(".jpeg") ||
    nomeOriginal.endsWith(".png") ||
    nomeOriginal.endsWith(".tiff") ||
    nomeOriginal.endsWith(".bmp") ||
    nomeOriginal.endsWith(".webp")
  ) {
    return await extrairTextoImagemComInfo(buffer, mimeType, nomeOriginal);
  }

  // ── Fallback ────────────────────────────────────────────────────────
  try {
    return { texto: buffer.toString("utf-8"), engine: "fallback-string" };
  } catch {
    return { texto: `[Formato nao suportado: ${nomeOriginal} (${mimeType})]`, engine: "erro" };
  }
}

/**
 * Wrapper compatível — retorna apenas o texto
 */
export async function extrairTexto(
  buffer: Buffer,
  mimeType: string,
  nomeOriginal: string
): Promise<string> {
  const r = await extrairTextoComInfo(buffer, mimeType, nomeOriginal);
  return r.texto;
}

async function extrairTextoPdfComInfo(
  buffer: Buffer,
  mimeType: string,
  nomeOriginal: string
): Promise<ExtracaoResult> {
  let textoNativo = "";

  try {
    // pdf-parse v2: API baseada em classe (a v1 era uma função)
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy().catch(() => {});
    textoNativo = result.text?.trim() ?? "";
  } catch (err) {
    console.warn(`[pdf-parse] Falha ao extrair ${nomeOriginal}:`, err instanceof Error ? err.message : err);
    textoNativo = "";
  }

  if (textoNativo.length > 200) {
    return { texto: textoNativo, engine: "pdf-parse-nativo" };
  }

  if (isMistralOcrEnabled()) {
    try {
      const textoOcr = await extrairTextoMistral(buffer, mimeType, nomeOriginal);
      if (textoOcr.length > 50) {
        return { texto: textoOcr, engine: "mistral-ocr" };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.warn(`[Mistral OCR fallback] ${msg}`);
    }
  }

  if (textoNativo.length > 0) {
    return { texto: textoNativo, engine: "pdf-parse-curto" };
  }

  return { texto: `[Nao foi possivel extrair texto do PDF: ${nomeOriginal}]`, engine: "erro" };
}

async function extrairTextoImagemComInfo(
  buffer: Buffer,
  mimeType: string,
  nomeOriginal: string
): Promise<ExtracaoResult> {
  if (isMistralOcrEnabled()) {
    try {
      const textoOcr = await extrairTextoMistral(buffer, mimeType, nomeOriginal);
      if (textoOcr.length > 10) {
        return { texto: textoOcr, engine: "mistral-ocr" };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.warn(`[Mistral OCR fallback imagem] ${msg}`);
    }
  }

  try {
    const worker = await createWorker("por+eng");
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return {
      texto: text.trim() || `[OCR nao encontrou texto: ${nomeOriginal}]`,
      engine: "tesseract-js",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return { texto: `[OCR falhou para ${nomeOriginal}: ${msg}]`, engine: "erro" };
  }
}

export async function extrairTextoOCR(
  buffer: Buffer,
  nomeOriginal: string
): Promise<string> {
  const r = await extrairTextoImagemComInfo(buffer, "image/png", nomeOriginal);
  return r.texto;
}
