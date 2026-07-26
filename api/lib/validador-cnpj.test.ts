import { describe, it, expect } from "vitest";
import { validarCnpj } from "./validador-cnpj";

describe("validarCnpj", () => {
  it("aceita CNPJ válido com e sem formatação", () => {
    expect(validarCnpj("11.222.333/0001-81").valido).toBe(true);
    expect(validarCnpj("11222333000181").valido).toBe(true);
  });

  it("formata o CNPJ na saída", () => {
    expect(validarCnpj("11222333000181").formato).toBe("11.222.333/0001-81");
  });

  it("rejeita dígito verificador errado", () => {
    expect(validarCnpj("11.222.333/0001-82").valido).toBe(false);
  });

  it("rejeita dígitos todos iguais", () => {
    expect(validarCnpj("11111111111111").valido).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(validarCnpj("123").valido).toBe(false);
  });
});
