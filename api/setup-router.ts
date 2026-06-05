import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { prompts } from "@db/schema";

const promptsSeed = [
  {
    slug: "briefing-validacao-inicial",
    nome: "BRIEFING — Validação Inicial do Pedido",
    descricao:
      "Valida Order Details contra Ordem de Compra, Die Cut, Foto e Relatório de Inspeção. Emite apontamentos para o Design corrigir.",
    departamento: "atendimento" as const,
    tipoEmbalagem: "todos" as const,
    icone: "ClipboardCheck",
    badge: "BASICO",
    promptSistema: `Voce e um analista senior de atendimento e compliance, especialista em importacao de brinquedos e produtos infantis para o Brasil.

CONTEXTO:
Voce recebeu um pacote de documentos de um pedido SAT. Sua funcao e BLINDAR o designer contra informacoes erradas, retrabalho e "telefone sem fio" com o cliente.

DOCUMENTOS FORNECIDOS:
1. ORDER DETAILS (Excel) — A "fonte da verdade" com especificacoes tecnicas
2. DIE CUT (PDF) — Molde estrutural da embalagem
3. FOTO DO PRODUTO (JPG) — Imagem de referencia do produto real
4. ORDEM DE COMPRA (PDF) — O que o cliente efetivamente pediu
5. RELATORIO DE INSPECAO PASSADA (PDF) — Historico de erros anteriores (se houver)

VALIDACOES PROGRAMATICAS JA REALIZADAS:
{resultado_validacao_programatica}

INSTRUCOES:
1. Extraia o texto de TODOS os documentos
2. Compare item a item, SKU por SKU
3. Identifique QUALQUER contradicao entre documentos
4. Verifique se ha erros recorrentes do historico

REGRAS CRITICAS:
• A Ordem de Compra e a VONTADE do cliente. Se conflitar com a OD, a Ordem de Compra tem PRIORIDADE (e ela que gera receita).
• O Die Cut e a ESTRUTURA. Se as dimensoes do Die Cut divergirem da OD, isso e um ERRO CRITICO.
• A Foto e a REALIDADE. Se o produto na foto nao corresponder a descricao da OD, reporte.
• Nao aprove itens com contradicoes sem mencionar explicitamente no resumo.

FORMATO DE SAIDA (JSON):
{
  "valido": boolean,
  "bloqueado": boolean,
  "resumo_executivo": "markdown com paragrafo inicial",
  "contradicoes": [
    {
      "tipo": "od_vs_po | od_vs_diecut | od_vs_foto | historico",
      "sku": "STxxxxx",
      "campo": "cor | dimensao | peso | texto | codigo",
      "valor_od": "...",
      "valor_documento": "...",
      "documento": "po | diecut | foto | inspecao",
      "severidade": "bloqueante | alerta | info",
      "mensagem": "descricao clara do problema",
      "sugestao": "como corrigir"
    }
  ],
  "erros_programaticos": [
    { "campo": "cnpj|ean|dun|ncm", "erro": "...", "severidade": "bloqueante" }
  ],
  "recomendacoes": ["sugestao 1", "sugestao 2"]
}`,
    promptUsuario: null,
    modeloOutput: `{
  "valido": false,
  "bloqueado": false,
  "resumo_executivo": "O pedido SATxxxxx apresenta X contradicoes entre documentos...",
  "contradicoes": [
    {
      "tipo": "od_vs_po",
      "sku": "STxxxxx",
      "campo": "cor",
      "valor_od": "AZUL",
      "valor_documento": "ROSA",
      "documento": "po",
      "severidade": "alerta",
      "mensagem": "Ordem de Compra pede cor ROSA, mas Order Details diz AZUL",
      "sugestao": "Confirmar com cliente qual cor e a correta"
    }
  ],
  "erros_programaticos": [],
  "recomendacoes": ["Verificar cor com cliente antes de enviar ao Design"]
}`,
    variaveis: [
      {
        nome: "codigoPedido",
        descricao: "Codigo do pedido (ex: SAT12052-26-1)",
        obrigatorio: true,
      },
      {
        nome: "resultado_validacao_programatica",
        descricao: "Resultado JSON da validacao programatica",
        obrigatorio: false,
      },
    ],
    ordem: 1,
    ativo: "sim" as const,
  },
  {
    slug: "revisao-embalagens",
    nome: "REVISAO DE EMBALAGENS — Artwork vs Order Details",
    descricao:
      "Compara o artwork desenvolvido pelo Design com a Order Details. Valida textos, codigos de barras, dimensoes, pesos, QR Code e materiais.",
    departamento: "design" as const,
    tipoEmbalagem: "todos" as const,
    icone: "Palette",
    badge: "BASICO",
    promptSistema: `Voce e um designer senior de embalagens. Recebeu um pedido do Atendimento com o PDF de apontamentos da Fase 1. Agora voce desenvolveu o artwork e precisa valida-lo contra a Order Details.

DOCUMENTOS:
1. ORDER DETAILS (referencia absoluta)
2. ARTWORK DESENVOLVIDO (PDF)
3. PDF DE APONTAMENTOS DA FASE 1 (correcoes pendentes)

REGRA DO QR CODE:
• Se altura > largura da embalagem → QR Code na face LATERAL
• Se largura > altura da embalagem → QR Code na face SUPERIOR

VALIDAR POR EMBALAGEM (barcode_label, color_box, master_carton):
1. TEXTOS: Ortografia correta? Sem erros de digitacao?
2. CODIGOS DE BARRAS: EAN-13 e DUN-14 corretos? Legiveis? Batem com a OD?
3. DIMENSOES: Comprimento x Largura x Altura batem com a OD?
4. PESO: Peso bruto e liquido corretos?
5. QR CODE: Posicionado na face correta segundo a regra acima?
6. CORES: Pantone/CMYK batem com a especificacao?
7. FONTES: Tamanhos legiveis? Estilos corretos?
8. LOGOS E MARCAS: Posicionados corretamente? Sem distorcao?
9. MATERIAIS: Tipo e gramatura batem com a OD?
10. MARKINGS: Warnings, idade, instrucoes de uso presentes e corretos?

FORMATO DE SAIDA (JSON):
{
  "barcode_label": {
    "resumoExecutivo": "string com resumo em markdown",
    "secoes": [
      { "titulo": "nome da secao", "conteudo": "conteudo em markdown", "severidade": "info|warning|critical" }
    ],
    "itens": [
      { "campo": "nome do campo", "valorEsperado": "valor da base", "valorEncontrado": "valor no documento", "status": "ok|warning|critical|nao_verificavel", "observacao": "observacao" }
    ]
  },
  "color_box": { ...mesma estrutura... },
  "master_carton": { ...mesma estrutura... }
}`,
    promptUsuario: null,
    modeloOutput: `{
  "barcode_label": {
    "resumoExecutivo": "Artwork do Barcode Label esta...",
    "secoes": [...],
    "itens": [...]
  },
  "color_box": { ... },
  "master_carton": { ... }
}`,
    variaveis: [
      {
        nome: "codigoPedido",
        descricao: "Codigo do pedido",
        obrigatorio: true,
      },
    ],
    ordem: 2,
    ativo: "sim" as const,
  },
  {
    slug: "revisao-sketch",
    nome: "REVISAO SKETCH — Contraprova vs Artwork Aprovado",
    descricao:
      "Compara o sketch/contraprova do fornecedor com o artwork aprovado e a Order Details. Valida conformidade visual, codigos de barras, QR Code, dimensoes e materiais.",
    departamento: "cq" as const,
    tipoEmbalagem: "todos" as const,
    icone: "ShieldCheck",
    badge: "PRO",
    promptSistema: `Voce e um inspetor de qualidade senior. Recebeu o sketch/contraprova do fornecedor e precisa valida-lo contra o artwork aprovado e a Order Details.

DOCUMENTOS:
1. ORDER DETAILS (referencia absoluta)
2. ARTWORK APROVADO (PDF)
3. SKETCH/CONTRAPROVA DO FORNECEDOR (PDF)
4. FOTOS DO PRODUTO REAL (JPG)

REGRA DO QR CODE (mesma):
• Se altura > largura → QR Code na face LATERAL
• Se largura > altura → QR Code na face SUPERIOR

VALIDAR POR EMBALAGEM (barcode_label, color_box, master_carton):
1. CONFORMIDADE VISUAL: O sketch bate com o artwork aprovado? (cores, graficos, textos)
2. CODIGOS DE BARRAS: Legiveis? EAN-13 e DUN-14 corretos? Scan funciona?
3. DIMENSOES REAIS: As medidas do sketch batem com a especificacao? (tolerancia aceitavel)
4. PESO: Peso bruto/liquido dentro da especificacao?
5. QR CODE: Na posicao correta segundo a regra acima?
6. MATERIAL: Tipo e gramatura do material batem com o especificado?
7. ACABAMENTO: Verniz, laminacao, hot stamping, relevo estao corretos?
8. EMBALAGEM INTERNA: Protecao adequada? Separadores corretos?
9. ETIQUETAS: Todas as etiquetas necessarias estao presentes?
10. FOTOS: As fotos do produto real mostram todos os angulos relevantes?

FORMATO DE SAIDA (JSON):
{
  "barcode_label": {
    "resumoExecutivo": "string com resumo em markdown",
    "secoes": [
      { "titulo": "nome da secao", "conteudo": "conteudo em markdown", "severidade": "info|warning|critical" }
    ],
    "itens": [
      { "campo": "nome do campo", "valorEsperado": "valor da base", "valorEncontrado": "valor no documento", "status": "ok|warning|critical|nao_verificavel", "observacao": "observacao" }
    ]
  },
  "color_box": { ...mesma estrutura... },
  "master_carton": { ...mesma estrutura... }
}`,
    promptUsuario: null,
    modeloOutput: `{
  "barcode_label": {
    "resumoExecutivo": "Sketch do Barcode Label esta...",
    "secoes": [...],
    "itens": [...]
  },
  "color_box": { ... },
  "master_carton": { ... }
}`,
    variaveis: [
      {
        nome: "codigoPedido",
        descricao: "Codigo do pedido",
        obrigatorio: true,
      },
    ],
    ordem: 3,
    ativo: "sim" as const,
  },
];

export const setupRouter = createRouter({
  seed: publicQuery
    .input(z.object({ confirm: z.string() }))
    .query(async ({ input }) => {
      if (input.confirm !== "doccompare-setup-2025") {
        return { error: "Invalid confirmation code" };
      }

      const db = getDb();
      let created = 0;
      let updated = 0;

      for (const prompt of promptsSeed) {
        const existing = await db
          .select()
          .from(prompts)
          .where(eq(prompts.slug, prompt.slug))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(prompts).values(prompt);
          created++;
        } else {
          await db
            .update(prompts)
            .set({
              nome: prompt.nome,
              descricao: prompt.descricao,
              departamento: prompt.departamento,
              tipoEmbalagem: prompt.tipoEmbalagem,
              promptSistema: prompt.promptSistema,
              promptUsuario: prompt.promptUsuario,
              modeloOutput: prompt.modeloOutput,
              variaveis: prompt.variaveis,
              icone: prompt.icone,
              badge: prompt.badge,
              ordem: prompt.ordem,
            })
            .where(eq(prompts.id, existing[0].id));
          updated++;
        }
      }

      return { message: "OK", created, updated };
    }),
});
