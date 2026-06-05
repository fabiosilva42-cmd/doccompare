/**
 * Serviço de OCR usando Mistral OCR 3
 * Documentação: https://docs.mistral.ai/capabilities/document/
 *
 * Custo: ~$0.001/página (1.000 páginas = $1)
 * Ideal para: PDFs escaneados, imagens complexas, tabelas, documentos multilíngues
 */

import { env } from "./env";

interface MistralOcrPage {
  index: number;
  markdown: string;
  images: Array<{
    id: string;
    top_left_x: number;
    top_left_y: number;
    bottom_right_x: number;
    bottom_right_y: number;
  }>;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
}

interface MistralOcrResponse {
  pages: MistralOcrPage[];
  model: string;
  usage_info: {
    pages_processed: number;
    doc_size_bytes: number;
  };
}

const MISTRAL_API_URL = "https://api.mistral.ai/v1/ocr";

/**
 * Extrai texto de uma imagem ou PDF usando Mistral OCR 3
 */
export async function extrairTextoMistral(
  buffer: Buffer,
  mimeType: string,
  nomeOriginal: string
): Promise<string> {
  try {
    const base64Data = buffer.toString("base64");

    // Determinar o tipo de documento para a API
    const isPdf = mimeType.includes("pdf") || nomeOriginal.endsWith(".pdf");
    const documentType = isPdf ? "document_url" : "image_url";
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.mistralApiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: {
          type: documentType,
          [documentType === "document_url" ? "document_url" : "image_url"]: dataUrl,
        },
        include_image_base64: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral OCR erro ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as MistralOcrResponse;

    if (!data.pages || data.pages.length === 0) {
      return `[Mistral OCR: nenhum texto encontrado em ${nomeOriginal}]`;
    }

    // Concatenar o markdown de todas as páginas
    const textoCompleto = data.pages
      .map((page) => page.markdown)
      .join("\n\n---\n\n");

    return textoCompleto.trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    throw new Error(`Mistral OCR falhou para ${nomeOriginal}: ${msg}`);
  }
}

/**
 * Verifica se o Mistral OCR está configurado e disponível
 */
export function isMistralOcrEnabled(): boolean {
  return !!env.mistralApiKey && env.mistralApiKey.length > 0;
}
