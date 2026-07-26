import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import type { getDb } from "../queries/connection";

const RESEND_URL = "https://api.resend.com/emails";

export interface EmailNotificacao {
  destinatarios: string[];
  assunto: string;
  mensagem: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function montarHtml(assunto: string, mensagem: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0"><a href="${ctaUrl}" style="background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${ctaLabel}</a></p>`
      : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
  <h2 style="color:#1e3a5f;margin:0 0 4px">DocCompare</h2>
  <p style="color:#64748b;font-size:13px;margin:0 0 16px">Auditoria Documental com IA</p>
  <h3 style="color:#0f172a;margin:0 0 12px">${assunto}</h3>
  <p style="color:#334155;line-height:1.6">${mensagem}</p>
  ${cta}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0 12px">
  <p style="color:#94a3b8;font-size:12px;margin:0">Você recebeu este email porque está cadastrado no DocCompare. As notificações também aparecem no sino dentro do sistema.</p>
</div>`;
}

/**
 * Envia email transacional via Resend. Nunca lança erro — falha de email
 * não pode quebrar o fluxo de trabalho; erros são apenas logados.
 */
export async function enviarEmail(opts: EmailNotificacao): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[EMAIL] RESEND_API_KEY ausente — email pulado:", opts.assunto);
    return;
  }
  const from = process.env.MAIL_FROM || "DocCompare <onboarding@resend.dev>";
  const destinatarios = [...new Set(opts.destinatarios.filter(Boolean))];

  for (const to of destinatarios) {
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `DocCompare — ${opts.assunto}`,
          html: montarHtml(opts.assunto, opts.mensagem, opts.ctaLabel, opts.ctaUrl),
        }),
      });
      if (!res.ok) {
        console.error(`[EMAIL] Falha ao enviar para ${to}:`, res.status, await res.text());
      }
    } catch (err) {
      console.error(`[EMAIL] Erro ao enviar para ${to}:`, err);
    }
  }
}

/**
 * Emails dos admins para cópia (MAIL_COPY_ADMINS=true).
 */
export async function emailsDosAdmins(db: ReturnType<typeof getDb>): Promise<string[]> {
  if (process.env.MAIL_COPY_ADMINS !== "true") return [];
  const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));
  return admins.map((a) => a.email).filter((e): e is string => Boolean(e));
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
