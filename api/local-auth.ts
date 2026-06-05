import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";

const JWT_SECRET = process.env.APP_SECRET || "doccompare-secret-key";

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { clockTolerance: 60 }) as {
      userId: number;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function generatePasswordResetToken(userId: number): string {
  return jwt.sign({ userId, type: "password-reset" }, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyPasswordResetToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { clockTolerance: 60 }) as {
      userId: number;
      type: string;
    };
    if (decoded.type !== "password-reset") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  role?: "user" | "admin";
  departamento?:
    | "atendimento"
    | "design"
    | "cq"
    | "supervisor"
    | "admin";
  isSupervisor?: boolean;
}) {
  const db = getDb();
  const password = data.password ? await hashPassword(data.password) : null;
  const result = await db.insert(users).values({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password,
    role: data.role ?? "user",
    departamento: data.departamento ?? null,
    isSupervisor: data.isSupervisor ?? false,
    lastSignInAt: new Date(),
  });
  const userId = Number(result[0].insertId);
  const user = await findUserById(userId);
  return user;
}
