import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

function requireDepartamento(
  ...departamentos: Array<
    "atendimento" | "design" | "cq" | "supervisor" | "admin"
  >
) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: ErrorMessages.unauthenticated,
      });
    }

    const userDept = ctx.user.departamento;
    const isAdmin = ctx.user.role === "admin";
    const isSupervisor = ctx.user.isSupervisor;

    // Admin e supervisor sempre passam
    if (isAdmin || isSupervisor) {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    if (!userDept || !departamentos.includes(userDept)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sem permissao para este departamento",
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

function requireSupervisor() {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: ErrorMessages.unauthenticated,
      });
    }

    if (ctx.user.role !== "admin" && !ctx.user.isSupervisor) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso restrito a supervisores",
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin"));
export const supervisorQuery = authedQuery.use(requireSupervisor());
export const atendimentoQuery = authedQuery.use(
  requireDepartamento("atendimento", "admin", "supervisor")
);
export const designQuery = authedQuery.use(
  requireDepartamento("design", "admin", "supervisor")
);
export const cqQuery = authedQuery.use(
  requireDepartamento("cq", "admin", "supervisor")
);

