/**
 * Validador de EAN-13 e DUN-14 — algoritmo GS1 (módulo 10)
 *
 * EAN-13: 13 dígitos, usado em produtos individuais
 * DUN-14: 14 dígitos, usado em embalagens master/inner
 *
 * Regras de prefixo DUN-14 (padrão GS1):
 *   - Prefixo 0 ou 1: Inner pack (embalagem interna)
 *   - Prefixo 2 a 9: Master carton / outros níveis de agrupamento
 *
 * Na prática da Mantis:
 *   - Inner pack → prefixo 1 (DUN começa com 1)
 *   - Master carton → prefixo 2 (DUN começa com 2)
 */

export interface ValidacaoEan {
  valido: boolean;
  tipo: "ean13" | "dun14" | "desconhecido";
  numeros: string;
  mensagem: string;
  prefixo?: string;
  prefixoEsperado?: string;
}

function limpar(codigo: string): string {
  return codigo.replace(/\D/g, "");
}

/**
 * Calcula o dígito verificador GS1 (módulo 10)
 * Para EAN-13: passar os 12 primeiros dígitos
 * Para DUN-14: passar os 13 primeiros dígitos
 */
function calcularDigitoVerificador(digitos: string): number {
  // Regra GS1: percorrendo do dígito MAIS À DIREITA do payload para a
  // esquerda, o primeiro multiplica por 3, alternando 3/1. Iterar da
  // esquerda inverte os pesos quando o payload tem tamanho par (EAN-13).
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    const digito = parseInt(digitos[digitos.length - 1 - i], 10);
    soma += i % 2 === 0 ? digito * 3 : digito;
  }
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

export function validarEan13(codigo: string): ValidacaoEan {
  const numeros = limpar(codigo);

  if (numeros.length !== 13) {
    return { valido: false, tipo: "ean13", numeros, mensagem: `EAN-13 deve ter 13 dígitos (encontrado: ${numeros.length})` };
  }

  const semDv = numeros.slice(0, 12);
  const dvEsperado = calcularDigitoVerificador(semDv);
  const dvReal = parseInt(numeros[12], 10);

  if (dvEsperado !== dvReal) {
    return {
      valido: false,
      tipo: "ean13",
      numeros,
      mensagem: `EAN-13 inválido (dígito verificador: esperado ${dvEsperado}, encontrado ${dvReal})`,
    };
  }

  return { valido: true, tipo: "ean13", numeros, mensagem: "EAN-13 válido" };
}

export function validarDun14(codigo: string, tipoEmbalagemEsperado?: "inner" | "master"): ValidacaoEan {
  const numeros = limpar(codigo);

  if (numeros.length !== 14) {
    return { valido: false, tipo: "dun14", numeros, mensagem: `DUN-14 deve ter 14 dígitos (encontrado: ${numeros.length})` };
  }

  const prefixo = numeros[0];
  const semDv = numeros.slice(0, 13);
  const dvEsperado = calcularDigitoVerificador(semDv);
  const dvReal = parseInt(numeros[13], 10);

  // Validação do dígito verificador
  if (dvEsperado !== dvReal) {
    return {
      valido: false,
      tipo: "dun14",
      numeros,
      prefixo,
      mensagem: `DUN-14 inválido (dígito verificador: esperado ${dvEsperado}, encontrado ${dvReal})`,
    };
  }

  // Validação do prefixo
  const prefixoNum = parseInt(prefixo, 10);
  let prefixoOk = true;
  let prefixoMsg = "";

  if (tipoEmbalagemEsperado) {
    if (tipoEmbalagemEsperado === "inner" && prefixoNum !== 1) {
      prefixoOk = false;
      prefixoMsg = `Prefixo do DUN-14 deve ser 1 (inner pack), encontrado ${prefixoNum}`;
    } else if (tipoEmbalagemEsperado === "master" && prefixoNum !== 2) {
      prefixoOk = false;
      prefixoMsg = `Prefixo do DUN-14 deve ser 2 (master carton), encontrado ${prefixoNum}`;
    }
  } else {
    // Sem tipo esperado, apenas validar se é 0-9 válido
    if (prefixoNum < 0 || prefixoNum > 9) {
      prefixoOk = false;
      prefixoMsg = `Prefixo do DUN-14 inválido: ${prefixoNum}`;
    }
  }

  if (!prefixoOk) {
    return {
      valido: false,
      tipo: "dun14",
      numeros,
      prefixo,
      prefixoEsperado: tipoEmbalagemEsperado === "inner" ? "1" : tipoEmbalagemEsperado === "master" ? "2" : undefined,
      mensagem: `${prefixoMsg}. Dígito verificador está correto (${dvReal}).`,
    };
  }

  return {
    valido: true,
    tipo: "dun14",
    numeros,
    prefixo,
    mensagem: `DUN-14 válido (prefixo ${prefixo})`,
  };
}

/**
 * Tenta validar como EAN-13 ou DUN-14 automaticamente
 */
export function validarCodigoBarras(codigo: string, tipoEmbalagemEsperado?: "inner" | "master"): ValidacaoEan {
  const numeros = limpar(codigo);

  if (numeros.length === 13) {
    return validarEan13(codigo);
  }

  if (numeros.length === 14) {
    return validarDun14(codigo, tipoEmbalagemEsperado);
  }

  return {
    valido: false,
    tipo: "desconhecido",
    numeros,
    mensagem: `Código de barras deve ter 13 (EAN-13) ou 14 (DUN-14) dígitos. Encontrado: ${numeros.length}`,
  };
}

/**
 * Extrai todos os códigos de barras (13 ou 14 dígitos) de um texto
 */
export function extrairCodigosBarras(texto: string): string[] {
  // Padrão: sequência de 13 ou 14 dígitos
  const padrao = /\b\d{13,14}\b/g;
  const encontrados = texto.match(padrao) || [];
  return [...new Set(encontrados)];
}
