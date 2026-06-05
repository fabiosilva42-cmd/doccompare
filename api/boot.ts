import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";

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
