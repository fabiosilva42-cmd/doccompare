import { localAuthRouter } from "./local-auth-router";
import { promptRouter } from "./prompt-router";
import { pedidoRouter } from "./pedido-router";
import { comparacaoRouter } from "./comparacao-router";
import { documentoRouter } from "./documento-router";
import { uploadRouter } from "./upload-router";
import { setupRouter } from "./setup-router";
import { usuarioRouter } from "./usuario-router";
import { pdfRouter } from "./pdf-router";
import { metricasRouter } from "./metricas-router";
import { divergenciaRouter } from "./divergencia-router";
import { workflowRouter } from "./workflow-router";
import { notificacaoRouter } from "./notificacao-router";
import { aqlRouter } from "./aql-router";
import { ocrTestRouter } from "./ocr-test-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: localAuthRouter,
  prompt: promptRouter,
  pedido: pedidoRouter,
  comparacao: comparacaoRouter,
  documento: documentoRouter,
  upload: uploadRouter,
  setup: setupRouter,
  usuario: usuarioRouter,
  pdf: pdfRouter,
  metricas: metricasRouter,
  divergencia: divergenciaRouter,
  workflow: workflowRouter,
  notificacao: notificacaoRouter,
  aql: aqlRouter,
  ocrTest: ocrTestRouter,
});

export type AppRouter = typeof appRouter;
