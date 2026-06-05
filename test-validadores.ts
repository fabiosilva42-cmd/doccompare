/**
 * Teste rápido dos validadores programáticos
 * Usando dados reais do pedido SAT12052-26-1 (com DVs corretos)
 */

import { validarCnpj } from "./api/lib/validador-cnpj";
import { validarEan13, validarDun14 } from "./api/lib/validador-ean";
import { validarNcm } from "./api/lib/validador-ncm";
import { validarOrderDetails } from "./api/lib/validador-programatico";

// Helper para calcular DV de EAN-13 (12 dígitos base)
function calcDvEan13(base12: string): string {
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(base12[i], 10);
    soma += i % 2 === 0 ? d * 3 : d;
  }
  const resto = soma % 10;
  return String(resto === 0 ? 0 : 10 - resto);
}

// Helper para calcular DV de DUN-14 (13 dígitos base: prefixo + 12 do EAN)
function calcDvDun14(base13: string): string {
  let soma = 0;
  for (let i = 0; i < 13; i++) {
    const d = parseInt(base13[i], 10);
    soma += i % 2 === 0 ? d * 3 : d;
  }
  const resto = soma % 10;
  return String(resto === 0 ? 0 : 10 - resto);
}

// Gerar EAN-13 válidos
const eanBase1 = "695237340749";
const eanValido1 = eanBase1 + calcDvEan13(eanBase1);
const eanBase2 = "695237340750";
const eanValido2 = eanBase2 + calcDvEan13(eanBase2);

// Gerar DUN-14 válidos (prefixo 1 = inner, prefixo 2 = master)
// DUN-14 = prefixo + 12 dígitos do EAN + DV (calculado sobre 13 dígitos)
const dunInner1 = "1" + eanBase1 + calcDvDun14("1" + eanBase1);
const dunMaster1 = "2" + eanBase1 + calcDvDun14("2" + eanBase1);
const dunInner2 = "1" + eanBase2 + calcDvDun14("1" + eanBase2);
const dunMaster2 = "2" + eanBase2 + calcDvDun14("2" + eanBase2);

console.log("=== TESTE VALIDADORES ===\n");
console.log("Códigos gerados para teste:");
console.log(`  EAN-13 #1: ${eanValido1}`);
console.log(`  EAN-13 #2: ${eanValido2}`);
console.log(`  DUN-14 Inner #1: ${dunInner1}`);
console.log(`  DUN-14 Master #1: ${dunMaster1}`);
console.log(`  DUN-14 Inner #2: ${dunInner2}`);
console.log(`  DUN-14 Master #2: ${dunMaster2}\n`);

// ── CNPJ ────────────────────────────────────────────────────────────
console.log("1. CNPJ");
const cnpj1 = validarCnpj("79.379.491/0001-83");
console.log(`  ${cnpj1.formato} → ${cnpj1.valido ? "✅" : "❌"} ${cnpj1.mensagem}`);

const cnpj2 = validarCnpj("11.222.333/0001-81");
console.log(`  ${cnpj2.formato} → ${cnpj2.valido ? "✅" : "❌"} ${cnpj2.mensagem}`);

// ── EAN-13 ──────────────────────────────────────────────────────────
console.log("\n2. EAN-13");
const ean1 = validarEan13(eanValido1);
console.log(`  ${ean1.numeros} → ${ean1.valido ? "✅" : "❌"} ${ean1.mensagem}`);

// EAN com dígito errado
const eanInvalido = eanValido1.slice(0, 12) + "0";
const ean2 = validarEan13(eanInvalido);
console.log(`  ${ean2.numeros} (DV errado) → ${ean2.valido ? "✅" : "❌"} ${ean2.mensagem}`);

// ── DUN-14 ──────────────────────────────────────────────────────────
console.log("\n3. DUN-14");

// DUN-14 válido (prefixo 1 = inner)
const dun1 = validarDun14(dunInner1, "inner");
console.log(`  ${dun1.numeros} (inner) → ${dun1.valido ? "✅" : "❌"} ${dun1.mensagem}`);

// DUN-14 válido (prefixo 2 = master)
const dun2 = validarDun14(dunMaster1, "master");
console.log(`  ${dun2.numeros} (master) → ${dun2.valido ? "✅" : "❌"} ${dun2.mensagem}`);

// DUN-14 com prefixo TROCADO (erro comum nas ODs)
const dunTrocado1 = validarDun14(dunMaster1, "inner"); // master marcado como inner
console.log(`  ${dunTrocado1.numeros} (esperado inner, é master) → ${dunTrocado1.valido ? "✅" : "❌"} ${dunTrocado1.mensagem}`);

const dunTrocado2 = validarDun14(dunInner1, "master"); // inner marcado como master
console.log(`  ${dunTrocado2.numeros} (esperado master, é inner) → ${dunTrocado2.valido ? "✅" : "❌"} ${dunTrocado2.mensagem}`);

// ── NCM ─────────────────────────────────────────────────────────────
console.log("\n4. NCM");
const ncm1 = validarNcm("9503.00.10", "Tricycle");
console.log(`  ${ncm1.formato} → ${ncm1.valido ? "✅" : "❌"} ${ncm1.mensagem}`);

const ncm2 = validarNcm("9503.00.21", "Doll");
console.log(`  ${ncm2.formato} → ${ncm2.valido ? "✅" : "❌"} ${ncm2.mensagem}`);

// NCM com descrição inconsistente
const ncm3 = validarNcm("9503.00.10", "Doll");
console.log(`  ${ncm3.formato} (Doll com NCM de triciclo) → ${ncm3.valido ? "✅" : "❌"} ${ncm3.mensagem}`);

// ── Validação completa de Order Details ─────────────────────────────
console.log("\n5. Validação Completa (simulando Order Details)");

const textoOd = `
Supplier: MANTIS TOYS LTD
CNPJ: 79.379.491/0001-83
NCM: 9503.00.10
Item Description: Tricycle LED Light

ST85101 - EAN-13: ${eanValido1}
ST85101 - DUN-14 (Inner): ${dunInner1}
ST85101 - DUN-14 (Master): ${dunMaster1}

ST85102 - EAN-13: ${eanValido2}
ST85102 - DUN-14 (Inner): ${dunInner2}
ST85102 - DUN-14 (Master): ${dunMaster2}

Dimensions: 56.5 x 24.0 x 38.0 cm
Weight: 3.2 kg
Quantity: 1200 pcs
Material: ABS Plastic
Color: Pantone 123C
Marking: Warning choking hazard
`;

const resultado = validarOrderDetails(textoOd);
console.log(`  Resumo: ${resultado.resumo}`);
console.log(`  Erros bloqueantes: ${resultado.temErrosBloqueantes ? "SIM ❌" : "NÃO ✅"}`);
console.log(`  Alertas: ${resultado.temAlertas ? "SIM ⚠️" : "NÃO"}`);

console.log(`\n  CNPJs encontrados: ${resultado.cnpjs.length}`);
for (const c of resultado.cnpjs) {
  console.log(`    ${c.formato} → ${c.valido ? "✅" : "❌"} ${c.mensagem}`);
}

console.log(`\n  Códigos de barras encontrados: ${resultado.eans.length}`);
for (const e of resultado.eans) {
  console.log(`    ${e.valor} (${e.tipo}) → ${e.valido ? "✅" : "❌"} ${e.mensagem}`);
}

console.log(`\n  NCMs encontrados: ${resultado.ncms.length}`);
for (const n of resultado.ncms) {
  console.log(`    ${n.formato} → ${n.valido ? "✅" : "❌"} ${n.mensagem}`);
}

console.log(`\n  Campos obrigatórios:`);
for (const c of resultado.camposObrigatorios) {
  console.log(`    ${c.campo}: ${c.preenchido ? "✅" : "❌"}`);
}

// ── Teste com DUN-14 trocado (cenário real do SAT12052-26-1) ───────
console.log("\n6. Cenário REAL: DUN-14 com prefixos trocados (inner=2, master=1)");

const textoOdTrocado = `
Supplier: MANTIS TOYS LTD
CNPJ: 79.379.491/0001-83
NCM: 9503.00.10

ST85101 - EAN-13: ${eanValido1}
ST85101 - DUN-14 (Inner): ${dunMaster1}
ST85101 - DUN-14 (Master): ${dunInner1}

Dimensions: 56.5 x 24.0 x 38.0 cm
Weight: 3.2 kg
`;

const resultadoTrocado = validarOrderDetails(textoOdTrocado);
console.log(`  Resumo: ${resultadoTrocado.resumo}`);
console.log(`  Erros bloqueantes: ${resultadoTrocado.temErrosBloqueantes ? "SIM ❌" : "NÃO ✅"}`);

for (const e of resultadoTrocado.eans) {
  console.log(`    ${e.valor} (${e.tipo}, prefixo ${e.prefixo}) → ${e.valido ? "✅" : "❌"} ${e.mensagem}`);
}

console.log("\n=== TESTE CONCLUÍDO ===");
