import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifyToken, findUserById } from "./local-auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Autenticacao via Bearer token (sistema proprio)
  try {
    const authHeader = opts.req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await findUserById(decoded.userId);
        if (user) {
          ctx.user = user;
        }
      }
    }
  } catch {
    // Auth optional
  }

  return ctx;
}
