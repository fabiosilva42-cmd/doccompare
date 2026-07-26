import { describe, it, expect } from "vitest";
import { validarNcm } from "./validador-ncm";

describe("validarNcm", () => {
  it("aceita NCM de brinquedo conhecido (8 dígitos)", () => {
    expect(validarNcm("95030010").valido).toBe(true);
    expect(validarNcm("9503.00.10").valido).toBe(true);
  });

  it("rejeita formato inválido", () => {
    expect(validarNcm("1234").valido).toBe(false);
    expect(validarNcm("abcdefgh").valido).toBe(false);
  });
});
