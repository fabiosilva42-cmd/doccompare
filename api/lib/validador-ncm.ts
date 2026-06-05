/**
 * Validador de NCM (Nomenclatura Comum do Mercosul)
 *
 * Formato: 8 dígitos (XXXX.XX.XX ou XXXXXXXX)
 * Estrutura: 2 (capítulo) + 2 (posição) + 2 (subposição) + 2 (item)
 *
 * Lista dos NCMs mais comuns para brinquedos e produtos infantis
 * importados pela Mantis.
 *
 * Fonte: tabela NCM completa da Receita Federal (simplificada)
 */

export interface ValidacaoNcm {
  valido: boolean;
  formato: string;     // NCM formatado (XXXX.XX.XX)
  numeros: string;     // 8 dígitos
  mensagem: string;
  descricao?: string;  // Descrição do produto (se conhecido)
}

// NCMs comuns para brinquedos e produtos infantis
const NCMS_CONHECIDOS: Record<string, string> = {
  // Triciclos, carrinhos, patinetes
  "8715.00.00": "Carruagens e carrinhos de bebê, e suas partes",
  "9503.00.10": "Triciclos, patinetes, carros de pedais e outros brinquedos de rodas para crianças",
  "9503.00.21": "Bonecas, mesmo de pano",
  "9503.00.22": "Partes e acessórios de bonecas",
  "9503.00.31": "Trens elétricos, incluídas as pistas, sinais e outros acessórios",
  "9503.00.39": "Outros conjuntos de construção e seus acessórios",
  "9503.00.41": "Brinquedos de pelúcia ('stuffed toys')",
  "9503.00.49": "Outros brinquedos de pano ou tecido",
  "9503.00.51": "Instrumentos musicais de brinquedo",
  "9503.00.59": "Outros brinquedos musicais",
  "9503.00.60": "Quebra-cabeças ('puzzles')",
  "9503.00.70": "Brinquedos e jogos, com motor elétrico",
  "9503.00.80": "Outros brinquedos e jogos, montados ou não",
  "9503.00.90": "Outros brinquedos e jogos",
  // Outros produtos infantis
  "3924.90.00": "Outras obras de matérias plásticas (potes, copos, pratos)",
  "6307.90.00": "Outras obras confeccionadas (roupas de bebê, acessórios)",
  "9403.70.00": "Móveis de plástico (cadeirinhas, banheiras)",
  "9619.00.00": "Chupetas e seus acessórios",
};

// Também armazenar sem pontos para busca rápida
const NCMS_NORMALIZADOS: Record<string, string> = {};
for (const [ncm, desc] of Object.entries(NCMS_CONHECIDOS)) {
  NCMS_NORMALIZADOS[ncm.replace(/\./g, "")] = desc;
}

function limpar(ncm: string): string {
  return ncm.replace(/\D/g, "");
}

function formatar(ncm: string): string {
  const n = limpar(ncm);
  if (n.length !== 8) return n;
  return `${n.slice(0, 4)}.${n.slice(4, 6)}.${n.slice(6, 8)}`;
}

export function validarNcm(ncm: string, descricaoProduto?: string): ValidacaoNcm {
  const numeros = limpar(ncm);

  if (numeros.length !== 8) {
    return {
      valido: false,
      formato: ncm,
      numeros,
      mensagem: `NCM deve ter 8 dígitos (encontrado: ${numeros.length})`,
    };
  }

  // Verificar se está na lista conhecida
  const descricaoConhecida = NCMS_NORMALIZADOS[numeros];

  // Se o usuário forneceu uma descrição do produto, podemos fazer uma validação cruzada básica
  // (no futuro, isso pode ser feito via IA)
  let mensagem = descricaoConhecida
    ? `NCM válido: ${descricaoConhecida}`
    : `NCM com formato válido (8 dígitos), mas não está na lista de NCMs comuns de brinquedos. Verifique se está correto.`;

  // Se temos descrição do produto e NCM conhecido, verificar consistência básica
  if (descricaoProduto && descricaoConhecida) {
    const produtoLower = descricaoProduto.toLowerCase();
    const ncmLower = descricaoConhecida.toLowerCase();

    // Verificações básicas de consistência
    const palavrasChave = [
      { palavras: ["triciclo", "patinete", "carrinho", "rodas"], ncmEsperado: ["95030010"] },
      { palavras: ["boneca", "doll"], ncmEsperado: ["95030021", "95030022"] },
      { palavras: ["pelúcia", "stuffed", "plush"], ncmEsperado: ["95030041", "95030049"] },
      { palavras: ["quebra-cabeça", "puzzle"], ncmEsperado: ["95030060"] },
      { palavras: ["chupeta", "pacifier"], ncmEsperado: ["96190000"] },
    ];

    for (const regra of palavrasChave) {
      const produtoMatch = regra.palavras.some(p => produtoLower.includes(p));
      const ncmMatch = regra.ncmEsperado.includes(numeros);

      if (produtoMatch && !ncmMatch) {
        mensagem += ` ⚠️ ALERTA: O produto parece ser "${regra.palavras.join(" / ")}" mas o NCM ${formatar(numeros)} não corresponde. NCMs esperados: ${regra.ncmEsperado.map(formatar).join(", ")}`;
        return {
          valido: true, // formato está OK, mas há inconsistência
          formato: formatar(numeros),
          numeros,
          mensagem,
          descricao: descricaoConhecida,
        };
      }
    }
  }

  return {
    valido: true,
    formato: formatar(numeros),
    numeros,
    mensagem,
    descricao: descricaoConhecida,
  };
}

/**
 * Extrai todos os NCMs (8 dígitos) de um texto
 */
export function extrairNcms(texto: string): string[] {
  // Padrão: 4 dígitos, ponto opcional, 2 dígitos, ponto opcional, 2 dígitos
  // ou 8 dígitos seguidos
  const padrao1 = /\b\d{4}\.?\d{2}\.?\d{2}\b/g;
  const padrao2 = /\b\d{8}\b/g;

  const encontrados1 = texto.match(padrao1) || [];
  const encontrados2 = texto.match(padrao2) || [];

  const todos = [...encontrados1, ...encontrados2].map(limpar);
  return [...new Set(todos)].filter(n => n.length === 8);
}
