import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { enviarEmail, appUrl } from "./email";

const ENV_ORIGINAL = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe("enviarEmail", () => {
  it("não lança erro quando RESEND_API_KEY está ausente", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      enviarEmail({ destinatarios: ["a@b.com"], assunto: "t", mensagem: "m" })
    ).resolves.toBeUndefined();
  });

  it("não lança erro mesmo quando o fetch falha", async () => {
    process.env.RESEND_API_KEY = "re_fake";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(
      enviarEmail({ destinatarios: ["a@b.com"], assunto: "t", mensagem: "m" })
    ).resolves.toBeUndefined();
  });

  it("deduplica destinatários e envia um request por email", async () => {
    process.env.RESEND_API_KEY = "re_fake";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await enviarEmail({
      destinatarios: ["a@b.com", "a@b.com", "c@d.com"],
      assunto: "t",
      mensagem: "m",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("appUrl", () => {
  it("monta URL com APP_URL do ambiente, sem barra duplicada", () => {
    process.env.APP_URL = "https://app.exemplo.com/";
    expect(appUrl("/dashboard")).toBe("https://app.exemplo.com/dashboard");
  });

  it("usa localhost como padrão", () => {
    delete process.env.APP_URL;
    expect(appUrl("/x")).toBe("http://localhost:3000/x");
  });
});
