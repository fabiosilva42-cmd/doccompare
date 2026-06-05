import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  generateToken,
  verifyToken,
  comparePassword,
  hashPassword,
  findUserByEmail,
  findUserById,
  createUser,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from "./local-auth";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export const localAuthRouter = createRouter({
  // Registro (apenas admin pode criar contas)
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email(),
        password: z.string().min(6),
        adminKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se email ja existe
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email ja esta cadastrado",
        });
      }

      // Se adminKey for fornecida e correta, cria como admin
      const isAdmin = input.adminKey === process.env.APP_SECRET;

      const user = await createUser({
        name: input.name,
        email: input.email,
        password: input.password,
        role: isAdmin ? "admin" : "user",
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar usuario",
        });
      }

      const token = generateToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departamento: user.departamento,
          isSupervisor: user.isSupervisor,
        },
      };
    }),

  // Login
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Conta sem senha configurada",
        });
      }

      const valid = await comparePassword(input.password, user.password);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      // Atualizar lastSignInAt
      const db = getDb();
      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));

      const token = generateToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departamento: user.departamento,
          isSupervisor: user.isSupervisor,
        },
      };
    }),

  // Me
  me: publicQuery.query(async ({ ctx }) => {
    const authHeader =
      ctx.req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departamento: user.departamento,
      isSupervisor: user.isSupervisor,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    };
  }),

  // Logout (client-side only, mas mantemos para compatibilidade)
  logout: publicQuery.mutation(() => {
    return { success: true };
  }),

  // Esqueci minha senha
  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      // Sempre retorna sucesso (nao revela se email existe)
      if (user) {
        const resetToken = generatePasswordResetToken(user.id);
        // TODO: enviar email real quando tiver SMTP
        console.log(`[PASSWORD-RESET] Token para ${user.email}: /recuperar-senha?token=${resetToken}`);
      }
      return { success: true };
    }),

  // Redefinir senha com token
  resetPassword: publicQuery
    .input(z.object({ token: z.string(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const decoded = verifyPasswordResetToken(input.token);
      if (!decoded) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Link de recuperacao expirado ou invalido",
        });
      }

      const db = getDb();
      const hashed = await hashPassword(input.password);
      await db.update(users).set({ password: hashed }).where(eq(users.id, decoded.userId));

      return { success: true };
    }),
});
