import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { createUser } from "./local-auth";

export const usuarioRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        departamento: users.departamento,
        isSupervisor: users.isSupervisor,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["user", "admin"]).default("user"),
        departamento: z
          .enum(["atendimento", "design", "cq", "supervisor", "admin"])
          .optional(),
        isSupervisor: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const user = await createUser({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        departamento: input.departamento,
        isSupervisor: input.isSupervisor,
      });
      return user;
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(255).optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
        departamento: z
          .enum(["atendimento", "design", "cq", "supervisor", "admin"])
          .optional(),
        isSupervisor: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      await db
        .update(users)
        .set(data)
        .where(eq(users.id, id));

      return { success: true };
    }),

  updateRole: adminQuery
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.id) {
        throw new Error("Nao pode excluir sua propria conta");
      }
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),
});
