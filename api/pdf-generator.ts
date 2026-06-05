import { chromium } from "playwright";
import { renderRelatorioHTML, type RelatorioData } from "./templates/relatorio-template";

let browserInstance: Awaited<ReturnType<typeof chromium.launch>> | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

/**
 * Gera um PDF a partir de dados de relatório.
 * Reutiliza a instância do browser para performance.
 */
export async function gerarRelatorioPDF(data: RelatorioData): Promise<Buffer> {
  const html = renderRelatorioHTML(data);
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
    await context.close();
  }
}

/**
 * Gera PDF a partir de HTML customizado.
 * Útil para templates específicos por departamento no futuro.
 */
export async function gerarPDFFromHTML(
  html: string,
  options?: {
    format?: "A4" | "A3" | "Letter";
    landscape?: boolean;
    margin?: { top: string; right: string; bottom: string; left: string };
  }
): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: options?.format || "A4",
      printBackground: true,
      landscape: options?.landscape || false,
      margin: options?.margin || { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
    await context.close();
  }
}

/**
 * Fecha o browser. Chamar ao desligar o servidor.
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
