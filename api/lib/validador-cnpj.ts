/**
 * Validador de CNPJ — algoritmo módulo 11
 * Aceita formatos: 11222333000181 ou 11.222.333/0001-81
 * Retorna: { valido: boolean, formato: string, mensagem: string }
 */

export interface ValidacaoCnpj {
  valido: boolean;
  formato: string;      // CNPJ formatado (XX.XXX.XXX/XXXX-XX)
  numeros: string;      // Somente dígitos
  mensagem: string;
}

function limpar(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

function formatar(cnpj: string): string {
  const n = limpar(cnpj);
  if (n.length !== 14) return n;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`;
}

function todosDigitosIguais(cnpj: string): boolean {
  return /^(\d)\1{13}$/.test(cnpj);
}

function calcularDigito(cnpj: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) {
    soma += parseInt(cnpj[i], 10) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCnpj(cnpj: string): ValidacaoCnpj {
  const numeros = limpar(cnpj);

  if (numeros.length !== 14) {
    return { valido: false, formato: cnpj, numeros, mensagem: "CNPJ deve ter 14 dígitos" };
  }

  if (todosDigitosIguais(numeros)) {
    return { valido: false, formato: formatar(numeros), numeros, mensagem: "CNPJ inválido (dígitos repetidos)" };
  }

  // Primeiro dígito verificador
  const digito1 = calcularDigito(numeros, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digito1 !== parseInt(numeros[12], 10)) {
    return { valido: false, formato: formatar(numeros), numeros, mensagem: "CNPJ inválido (1º dígito verificador incorreto)" };
  }

  // Segundo dígito verificador
  const digito2 = calcularDigito(numeros, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digito2 !== parseInt(numeros[13], 10)) {
    return { valido: false, formato: formatar(numeros), numeros, mensagem: "CNPJ inválido (2º dígito verificador incorreto)" };
  }

  return { valido: true, formato: formatar(numeros), numeros, mensagem: "CNPJ válido" };
}

/**
 * Extrai todos os CNPJs encontrados em um texto
 */
export function extrairCnpjs(texto: string): string[] {
  const padrao = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
  const encontrados = texto.match(padrao) || [];
  // Remover duplicatas
  return [...new Set(encontrados)];
}
