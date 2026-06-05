import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { prompts } from "@db/schema";

export const promptRouter = createRouter({
  // Listar prompts ativos (para usuarios)
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: prompts.id,
        slug: prompts.slug,
        nome: prompts.nome,
        descricao: prompts.descricao,
        departamento: prompts.departamento,
        tipoEmbalagem: prompts.tipoEmbalagem,
        icone: prompts.icone,
        badge: prompts.badge,
        ordem: prompts.ordem,
        ativo: prompts.ativo,
      })
      .from(prompts)
      .where(eq(prompts.ativo, "sim"))
      .orderBy(prompts.ordem);
  }),

  // Listar por departamento
  listByDepartamento: publicQuery
    .input(
      z.object({
        departamento: z.enum(["atendimento", "design", "cq"]),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          id: prompts.id,
          slug: prompts.slug,
          nome: prompts.nome,
          descricao: prompts.descricao,
          departamento: prompts.departamento,
          tipoEmbalagem: prompts.tipoEmbalagem,
          icone: prompts.icone,
          badge: prompts.badge,
          ordem: prompts.ordem,
          ativo: prompts.ativo,
        })
        .from(prompts)
        .where(eq(prompts.departamento, input.departamento))
        .orderBy(prompts.ordem);
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({
          id: prompts.id,
          slug: prompts.slug,
          nome: prompts.nome,
          descricao: prompts.descricao,
          departamento: prompts.departamento,
          tipoEmbalagem: prompts.tipoEmbalagem,
          icone: prompts.icone,
          badge: prompts.badge,
          ordem: prompts.ordem,
          ativo: prompts.ativo,
        })
        .from(prompts)
        .where(eq(prompts.slug, input.slug))
        .limit(1);
      return rows.at(0) ?? null;
    }),

  // Admin endpoints - retornam o prompt completo
  listAdmin: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(prompts)
      .orderBy(desc(prompts.createdAt));
  }),

  create: adminQuery
    .input(
      z.object({
        slug: z.string().min(1).max(100),
        nome: z.string().min(1).max(255),
        descricao: z.string().min(1),
        departamento: z.enum(["atendimento", "design", "cq"]),
        tipoEmbalagem: z
          .enum(["barcode_label", "color_box", "master_carton", "todos"])
          .default("todos"),
        promptSistema: z.string().min(1),
        promptUsuario: z.string().optional(),
        modeloOutput: z.string().optional(),
        variaveis: z
          .array(
            z.object({
              nome: z.string(),
              descricao: z.string(),
              obrigatorio: z.boolean(),
            })
          )
          .optional(),
        badge: z.string().default("BASICO"),
        icone: z.string().default("FileText"),
        ordem: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(prompts).values({
        ...input,
        ativo: "sim",
        versao: 1,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(1),
        descricao: z.string().min(1),
        departamento: z.enum(["atendimento", "design", "cq"]),
        tipoEmbalagem: z.enum([
          "barcode_label",
          "color_box",
          "master_carton",
          "todos",
        ]),
        promptSistema: z.string().min(1),
        promptUsuario: z.string().optional(),
        modeloOutput: z.string().optional(),
        variaveis: z
          .array(
            z.object({
              nome: z.string(),
              descricao: z.string(),
              obrigatorio: z.boolean(),
            })
          )
          .optional(),
        badge: z.string(),
        icone: z.string(),
        ordem: z.number(),
        ativo: z.enum(["sim", "nao"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      // Buscar prompt atual para versionamento
      const atual = await db
        .select({ versao: prompts.versao })
        .from(prompts)
        .where(eq(prompts.id, id))
        .limit(1);

      const versaoAtual = atual.at(0)?.versao ?? 1;

      await db
        .update(prompts)
        .set({
          ...data,
          versao: versaoAtual + 1,
        })
        .where(eq(prompts.id, id));

      return { success: true };
    }),

  toggleAtivo: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ ativo: prompts.ativo })
        .from(prompts)
        .where(eq(prompts.id, input.id))
        .limit(1);
      const atual = rows.at(0);
      if (!atual) throw new Error("Prompt nao encontrado");
      const novo = atual.ativo === "sim" ? "nao" : "sim";
      await db
        .update(prompts)
        .set({ ativo: novo })
        .where(eq(prompts.id, input.id));
      return { ativo: novo };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(prompts).where(eq(prompts.id, input.id));
      return { success: true };
    }),
});
