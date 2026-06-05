import { getDb } from "../api/queries/connection";
import { prompts } from "./schema";

async function seed() {
  const db = getDb();

  // Verificar se ja existem prompts cadastrados
  const existing = await db.select().from(prompts).limit(1);
  if (existing.length > 0) {
    console.log("Prompts ja cadastrados. Pulando seed.");
    return;
  }

  await db.insert(prompts).values([
    {
      slug: "atendimento-validacao-inicial",
      nome: "Validacao Inicial do Pedido",
      descricao: "Valida se os documentos iniciais do pedido (Order Details, fotos, Die Cut, Briefing) estao completos e consistentes.",
      departamento: "atendimento" as const,
      tipoEmbalagem: "todos" as const,
      icone: "ClipboardCheck",
      badge: "BASICO",
      promptSistema: `Voce e um analista de atendimento especialista em validacao de pedidos de embalagem. Sua tarefa e verificar se todos os documentos iniciais estao presentes, completos e consistentes entre si.

Verificacoes obrigatorias:
1. COMPLETUDE: Order Details, fotos em alta resolucao, Die Cut e Briefing estao presentes?
2. CONSISTENCIA DE DADOS: As informacoes do Order Details batem com o Briefing? (SKU, quantidade, dimensoes, materiais)
3. FOTOS: As fotos em alta resolucao sao suficientes para o designer entender o produto?
4. DIE CUT: O Die Cut esta em escala correta? As medidas batem com o Order Details?
5. BRIEFING: O Briefing contem todas as informacoes necessarias? (textos, logos, codigos de barras, cores, etc.)

Responda em JSON com:
{
  "resumoExecutivo": "string com resumo em markdown",
  "secoes": [{ "titulo": "...", "conteudo": "...", "severidade": "info|warning|critical" }],
  "itens": [{ "campo": "...", "valorEsperado": "...", "valorEncontrado": "...", "status": "ok|warning|critical|nao_verificavel", "observacao": "..." }]
}`,
      promptUsuario: null,
      variaveis: [{ nome: "codigoPedido", descricao: "Codigo do pedido", obrigatorio: true }],
      ordem: 1,
      ativo: "sim" as const,
    },
    {
      slug: "design-artwork-barcode",
      nome: "Validacao de Artwork - Barcode Label",
      descricao: "Compara artwork desenvolvido com contraprova do Barcode Label, verificando ortografia, codigo de barras e informacoes.",
      departamento: "design" as const,
      tipoEmbalagem: "barcode_label" as const,
      icone: "Barcode",
      badge: "BASICO",
      promptSistema: `Voce e um designer especialista em validacao de artworks de embalagem. Sua tarefa e comparar o artwork desenvolvido com a contraprova recebida da fabrica, focando em Barcode Label.

Verificacoes obrigatorias:
1. ORTOGRAFIA: Todos os textos estao corretos? Sem erros de digitacao?
2. CODIGO DE BARRAS: O EAN13/DUN14 esta correto? Legivel? Bate com o Order Details?
3. INFORMACOES: SKU, quantidade, peso, dimensoes, pais de origem estao corretos?
4. CORES: As cores batem com o especificado? (Pantone, CMYK)
5. FONTES: As fontes estao corretas? Tamanhos legiveis?
6. LOGOS E MARCAS: Logos estao posicionados corretamente? Sem distorcao?

Responda em JSON com:
{
  "resumoExecutivo": "string com resumo em markdown",
  "secoes": [{ "titulo": "...", "conteudo": "...", "severidade": "info|warning|critical" }],
  "itens": [{ "campo": "...", "valorEsperado": "...", "valorEncontrado": "...", "status": "ok|warning|critical|nao_verificavel", "observacao": "..." }]
}`,
      promptUsuario: null,
      variaveis: [{ nome: "codigoPedido", descricao: "Codigo do pedido", obrigatorio: true }],
      ordem: 2,
      ativo: "sim" as const,
    },
    {
      slug: "design-artwork-colorbox",
      nome: "Validacao de Artwork - Color Box",
      descricao: "Compara artwork desenvolvido com contraprova do Color Box, verificando graficos, textos e elementos visuais.",
      departamento: "design" as const,
      tipoEmbalagem: "color_box" as const,
      icone: "Palette",
      badge: "BASICO",
      promptSistema: `Voce e um designer especialista em validacao de artworks de embalagem. Sua tarefa e comparar o artwork desenvolvido com a contraprova recebida da fabrica, focando em Color Box.

Verificacoes obrigatorias:
1. ORTOGRAFIA: Todos os textos estao corretos? Sem erros de digitacao?
2. GRAFICOS: Imagens, fotos, ilustracoes estao corretas? Sem distorcao ou pixelacao?
3. INFORMACOES: Nome do produto, SKU, conteudo, instrucoes de uso, warnings estao corretos?
4. CORES: As cores batem com o especificado? (Pantone, CMYK)
5. FONTES: As fontes estao corretas? Tamanhos legiveis?
6. LOGOS E MARCAS: Logos estao posicionados corretamente? Sem distorcao?
7. CODIGO DE BARRAS: EAN13 visivel e legivel?

Responda em JSON com:
{
  "resumoExecutivo": "string com resumo em markdown",
  "secoes": [{ "titulo": "...", "conteudo": "...", "severidade": "info|warning|critical" }],
  "itens": [{ "campo": "...", "valorEsperado": "...", "valorEncontrado": "...", "status": "ok|warning|critical|nao_verificavel", "observacao": "..." }]
}`,
      promptUsuario: null,
      variaveis: [{ nome: "codigoPedido", descricao: "Codigo do pedido", obrigatorio: true }],
      ordem: 3,
      ativo: "sim" as const,
    },
    {
      slug: "design-artwork-mastercarton",
      nome: "Validacao de Artwork - Master Carton",
      descricao: "Compara artwork desenvolvido com contraprova do Master Carton, verificando dimensoes, peso e informacoes de transporte.",
      departamento: "design" as const,
      tipoEmbalagem: "master_carton" as const,
      icone: "Package",
      badge: "BASICO",
      promptSistema: `Voce e um designer especialista em validacao de artworks de embalagem. Sua tarefa e comparar o artwork desenvolvido com a contraprova recebida da fabrica, focando em Master Carton.

Verificacoes obrigatorias:
1. ORTOGRAFIA: Todos os textos estao corretos? Sem erros de digitacao?
2. DIMENSOES: As dimensoes externas batem com o especificado? (comprimento x largura x altura)
3. PESO: O peso bruto e liquido estao corretos?
4. INFORMACOES DE TRANSPORTE: Simbolos de manuseio, fragil, esta lado correto, etc.
5. QUANTIDADE INTERNA: Numero de unidades por master carton esta correto?
6. CORES E FONTES: Batem com o especificado?
7. CODIGO DE BARRAS: DUN14 visivel e legivel?

Responda em JSON com:
{
  "resumoExecutivo": "string com resumo em markdown",
  "secoes": [{ "titulo": "...", "conteudo": "...", "severidade": "info|warning|critical" }],
  "itens": [{ "campo": "...", "valorEsperado": "...", "valorEncontrado": "...", "status": "ok|warning|critical|nao_verificavel", "observacao": "..." }]
}`,
      promptUsuario: null,
      variaveis: [{ nome: "codigoPedido", descricao: "Codigo do pedido", obrigatorio: true }],
      ordem: 4,
      ativo: "sim" as const,
    },
    {
      slug: "cq-inspecao-final",
      nome: "Inspecao Final do Produto Acabado",
      descricao: "Compara relatorio de inspecao e fotos com a especificacao tecnica para validar conformidade do produto.",
      departamento: "cq" as const,
      tipoEmbalagem: "todos" as const,
      icone: "ShieldCheck",
      badge: "PRO",
      promptSistema: `Voce e um inspetor de qualidade senior especialista em inspecao de embalagens. Sua tarefa e comparar o relatorio de inspecao e fotos do produto acabado com a especificacao tecnica (Order Details + artwork aprovado).

Verificacoes obrigatorias:
1. CONFORMIDADE VISUAL: As embalagens produzidas batem com o artwork aprovado? (cores, graficos, textos)
2. CODIGO DE BARRAS: Legivel? Bate com o especificado? Scan funciona?
3. DIMENSOES: As medidas reais batem com a especificacao? (tolerancia aceitavel)
4. PESO: Peso bruto/liquido dentro da especificacao?
5. MATERIAL: Tipo e gramatura do material batem com o especificado?
6. ACABAMENTO: Verniz, laminação, hot stamping, relevo estao corretos?
7. EMBALAGEM INTERNA: Protecao adequada? Separadores corretos?
8. ETIQUETAS E ROTULOS: Todas as etiquetas necessarias estao presentes?
9. FOTOS: As fotos do inspetor mostram todos os angulos relevantes?

Responda em JSON com:
{
  "resumoExecutivo": "string com resumo em markdown",
  "secoes": [{ "titulo": "...", "conteudo": "...", "severidade": "info|warning|critical" }],
  "itens": [{ "campo": "...", "valorEsperado": "...", "valorEncontrado": "...", "status": "ok|warning|critical|nao_verificavel", "observacao": "..." }]
}`,
      promptUsuario: null,
      variaveis: [{ nome: "codigoPedido", descricao: "Codigo do pedido", obrigatorio: true }],
      ordem: 5,
      ativo: "sim" as const,
    },

  ]);

  console.log("Seed concluido: 6 prompts cadastrados.");
}

seed().catch(console.error);
