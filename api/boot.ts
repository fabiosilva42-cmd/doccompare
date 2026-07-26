import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sql } from "drizzle-orm";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";

const app = new Hono<{ Bindings: HttpBindings }>();

// CORS para permitir requisicoes do mesmo dominio e localhost
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://108.174.150.102:3000"],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  credentials: true,
}));

app.use(bodyLimit({ maxSize: 100 * 1024 * 1024 }));

// Error handler - garante que TODOS os erros retornem JSON
app.onError((err, c) => {
  console.error("[API Error]", err.message, err.stack);
  const isApiRoute = c.req.path.startsWith("/api/");
  if (isApiRoute) {
    return c.json(
      {
        error: "Internal Server Error",
        message: err.message,
        path: c.req.path,
      },
      500
    );
  }
  throw err;
});

// Liveness: processo está de pé
app.get("/api/health", (c) =>
  c.json({ status: "ok", uptime: Math.round(process.uptime()), ts: Date.now() })
);

// Readiness: banco de dados acessível
app.get("/api/ready", async (c) => {
  try {
    await getDb().execute(sql`select 1`);
    return c.json({ status: "ready", db: "ok" });
  } catch (err) {
    console.error("[HEALTH] DB check failed:", err);
    return c.json({ status: "not_ready", db: "error" }, 503);
  }
});

// Deep check: banco + API Kimi (endpoint de modelos é gratuito)
app.get("/api/health/deep", async (c) => {
  const result: Record<string, string> = { db: "ok", kimi: "ok" };
  let healthy = true;
  try {
    await getDb().execute(sql`select 1`);
  } catch {
    result.db = "error";
    healthy = false;
  }
  try {
    const res = await fetch(`${env.kimiOpenUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${env.appId}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      result.kimi = `http_${res.status}`;
      healthy = false;
    }
  } catch {
    result.kimi = "unreachable";
    healthy = false;
  }
  return c.json({ status: healthy ? "healthy" : "degraded", ...result }, healthy ? 200 : 503);
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
