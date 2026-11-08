// Funções de correção (js/correcao.js) com os casos de planejamento/resultado_gamificado.md, item 1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { corrigir, faixaDaNota, medalhaDoPercentual } from "../js/correcao.js";

const ler = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf-8"));
const config = ler("data/config.json");
const habilidades = ler("data/habilidades.json");
const catalogo = ler("data/catalogo.json");
// só as semanas (S01, S02...), para o teste não depender dos simulados extras do catálogo
const catalogoSims = catalogo.areas.flatMap((a) => a.simulados).filter((s) => /^S\d+$/.test(s.id));
const S07 = ler("data/avalia/S07.json"), S01 = ler("data/avalia/S01.json"), E3 = ler("data/prova/E3-AV2.json");

/** Respostas acertando só as questões da lista (as outras com uma letra errada). */
function respostas(sim, certas) {
  const r = {};
  for (const it of sim.items) r[it.n] = certas.includes(it.n) ? it.key : it.options.find((o) => !o.correct).letter;
  return r;
}
const c = (sim, certas) => corrigir(sim, respostas(sim, certas), { config, habilidades, catalogoSims });

test("S07: 4 acertos dão 6,7 e Adequado", () => {
  const r = c(S07, [1, 2, 3, 4]);
  assert.equal(r.nota, 6.7);
  assert.equal(r.faixa.nivel, "Adequado");
  assert.equal(r.acertos, 4);
});
test("S07: 3 acertos dão 5,0 e Básico", () => {
  const r = c(S07, [1, 2, 3]);
  assert.equal(r.nota, 5);
  assert.equal(r.faixa.nivel, "Básico");
});
test("S07: 6 acertos dão 10,0, Avançado e Diamante", () => {
  const r = c(S07, [1, 2, 3, 4, 5, 6]);
  assert.equal(r.nota, 10);
  assert.equal(r.faixa.nivel, "Avançado");
  assert.equal(r.medalha.nome, "Diamante");
  assert.equal(r.falta, null);
  assert.equal(r.textoFalta, r.faixa.frase);
  assert.equal(r.plano.length, 0);
  assert.equal(r.fracos.length, 0);
});
test("S01: 2 acertos dão 4,0, Abaixo do básico, e falta 1 questão para o Básico", () => {
  const r = c(S01, [1, 2]);
  assert.equal(r.nota, 4);
  assert.equal(r.faixa.nivel, "Abaixo do básico");
  assert.equal(r.textoFalta, "Acerte mais 1 questão para chegar ao Básico.");
  assert.equal(r.medalha, null);
  assert.equal(c(S01, [1, 2, 3]).nota, 6);
});
test("E3-AV2: acertar 1 a 5 dá 6,5 e Básico; Faltam 0,5 ponto para o Adequado", () => {
  const r = c(E3, [1, 2, 3, 4, 5]);
  assert.equal(r.nota, 6.5);
  assert.equal(r.faixa.nivel, "Básico");
  assert.equal(r.textoFalta, "Faltam 0,5 ponto para o Adequado.");
});
test("E3-AV2: todas menos a 10 dá 9,5 e Avançado; todas dá 10,0, Avançado e Diamante", () => {
  const r = c(E3, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(r.nota, 9.5);
  assert.equal(r.faixa.nivel, "Avançado");
  const t = c(E3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(t.nota, 10);
  assert.equal(t.medalha.nome, "Diamante");
});
test("faixas e medalhas nos limites", () => {
  assert.equal(faixaDaNota(4.5, config).nivel, "Abaixo do básico");
  assert.equal(faixaDaNota(4.6, config).nivel, "Básico");
  assert.equal(faixaDaNota(8.5, config).nivel, "Adequado");
  assert.equal(faixaDaNota(8.6, config).nivel, "Avançado");
  assert.equal(medalhaDoPercentual(49.9, config), null);
  assert.equal(medalhaDoPercentual(50, config).nome, "Bronze");
  assert.equal(medalhaDoPercentual(70, config).nome, "Prata");
  assert.equal(medalhaDoPercentual(90, config).nome, "Ouro");
});
test("fortes por nível mais alto; a melhorar por nível mais baixo; plano com erro provável e dica", () => {
  // S07: acerta 1 (N3), 4 (N4) e 6 (N4); erra 2 (N3), 3 (N3) e 5 (N4)
  const r = c(S07, [1, 4, 6]);
  assert.deepEqual(r.fortes.map((f) => f.code), ["D30", "D35", "C24"]);
  assert.deepEqual(r.fracos.map((f) => f.code), ["D08", "D05", "D06"]);
  const p = r.plano[0];
  assert.equal(p.code, "D08");
  assert.equal(p.questao, 2);
  const marcada = S07.items[1].options.find((o) => o.letter === p.marcada);
  assert.equal(p.erro, marcada.why);
  assert.match(p.dica, /^[A-ZÁÉÍÓÚ]/);
  assert.ok(r.plano.length <= 3);
});
test("prova: a melhorar desempata pelo maior valor", () => {
  // erra 1 (N1, 1,5) e 4 (N2, 1,0), ambas da habilidade 2.87, e 2 (N1, 1,5)
  const r = c(E3, [3, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(r.fracos.map((f) => f.code).sort(), ["EF.09.MAT.2.87", "EF.09.MAT.2.88"]);
});
test("treinar em outro simulado: primeiro do catálogo com a mesma habilidade ainda não acertada", () => {
  const r = corrigir(S07, respostas(S07, [1, 2, 3, 5, 6]), { config, habilidades, catalogoSims, jaAcertou: (id) => id === "S01" });
  // D30 (Pitágoras) também está na Semana 1, mas o aluno já acertou lá
  assert.equal(r.plano[0].code, "D30");
  assert.equal(r.plano[0].outro, null);
  const r2 = corrigir(S07, respostas(S07, [1, 2, 3, 5, 6]), { config, habilidades, catalogoSims });
  assert.equal(r2.plano[0].outro.id, "S01");
});
test("questão em branco conta como erro e o plano avisa", () => {
  const r = corrigir(S01, { 1: S01.items[0].key }, { config, habilidades, catalogoSims });
  assert.equal(r.acertos, 1);
  assert.equal(r.nota, 2);
  assert.match(r.plano[0].erro, /em branco/);
});
