import { describe, it, expect } from "vitest";
import { validarEan13, validarDun14, validarCodigoBarras } from "./validador-ean";

describe("validarEan13", () => {
  it("aceita EAN-13 válidos reais", () => {
    // 7891000100103 = produto real brasileiro; 1234567890128 = exemplo canônico GS1
    expect(validarEan13("7891000100103").valido).toBe(true);
    expect(validarEan13("1234567890128").valido).toBe(true);
  });

  it("aceita EAN-13 com formatação (espaços/pontos)", () => {
    expect(validarEan13("789.1000.100103").valido).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    const r = validarEan13("7891000100104");
    expect(r.valido).toBe(false);
    expect(r.mensagem).toContain("dígito verificador");
  });

  it("rejeita tamanho errado", () => {
    expect(validarEan13("123456").valido).toBe(false);
  });
});

describe("validarDun14", () => {
  it("aceita DUN-14 inner (prefixo 1) válido", () => {
    const r = validarDun14("17891000100100", "inner");
    expect(r.valido).toBe(true);
    expect(r.prefixo).toBe("1");
  });

  it("aceita DUN-14 master (prefixo 2) válido", () => {
    const r = validarDun14("27891000100107", "master");
    expect(r.valido).toBe(true);
    expect(r.prefixo).toBe("2");
  });

  it("rejeita dígito verificador errado", () => {
    expect(validarDun14("17891000100101").valido).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(validarDun14("1789100010010").valido).toBe(false);
  });
});

describe("validarCodigoBarras", () => {
  it("detecta o tipo pelo tamanho", () => {
    expect(validarCodigoBarras("7891000100103").tipo).toBe("ean13");
    expect(validarCodigoBarras("17891000100100").tipo).toBe("dun14");
  });
});
