// Testes do gerador de simulados (rodam no Node, sem navegador):
//   node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MODELOS, gerarQuestao, gerarVersao, gerarMisto, temVersaoNova } from "../js/gerador/index.js";
import { criarSorteio, problemasDoItem, n, nAte, rs } from "../js/gerador/base.js";

const raiz = new URL("../", import.meta.url);
const ler = (p) => JSON.parse(readFileSync(new URL(p, raiz), "utf-8"));
const catalogo = ler("data/catalogo.json");
const habilidades = ler("data/habilidades.json");
const simulados = catalogo.areas.flatMap((a) => a.simulados);

test("formatação de números em português", () => {
  assert.equal(n(1152), "1 152");
  assert.equal(n(-10), "−10");
  assert.equal(n(6.8), "6,8");
  assert.equal(n(7, 1), "7,0");
  assert.equal(n(0.1 + 0.2), "0,3");
  assert.equal(rs(5306.04), "R$ 5 306,04");
});

test("os modelos batem com as questões originais (código e nível)", () => {
  const semModelo = [];
  for (const s of simulados) {
    if (!temVersaoNova(s.id, s.n_questoes)) semModelo.push(s.id);
    const base = ler(s.arquivo);
    for (const it of base.items) {
      const m = MODELOS.find((x) => x.id === `${s.id}-${it.n}`);
      if (!m) continue;
      assert.equal(m.code, it.code, `${m.id}: código diferente do original`);
      assert.equal(m.level, it.level, `${m.id}: nível diferente do original`);
    }
  }
  for (const m of MODELOS) assert.ok(habilidades[m.code], `${m.code} fora de habilidades.json`);
  // semana nova sem modelos não quebra nada: o site só não mostra "Versão nova" para ela
  if (semModelo.length) console.log(`Simulados ainda sem modelos no gerador: ${semModelo.join(", ")}`);
  for (const id of ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "E3-AV2"]) assert.ok(!semModelo.includes(id), `${id} perdeu modelos`);
});

test("cada modelo gera 300 questões válidas e variadas", () => {
  for (const m of MODELOS) {
    const r = criarSorteio(12345);
    const enunciados = new Set();
    for (let i = 0; i < 300; i++) {
      const q = gerarQuestao(m, r);
      assert.deepEqual(problemasDoItem(q), [], `${m.id}: ${problemasDoItem(q).join(", ")}`);
      assert.ok(q.resolution.length >= 2, `${m.id}: resolução curta`);
      assert.ok(q.check, `${m.id}: sem conferência`);
      enunciados.add(JSON.stringify([q.stem, q.ask, q.options.map((o) => o.text)]));
    }
    assert.ok(enunciados.size >= 8, `${m.id}: só ${enunciados.size} versões diferentes`);
  }
});

test("a resposta certa não fica sempre na mesma letra", () => {
  for (const m of MODELOS) {
    const r = criarSorteio(99);
    const letras = new Set();
    for (let i = 0; i < 80; i++) letras.add(gerarQuestao(m, r).key);
    assert.ok(letras.size >= 2, `${m.id}: correta sempre em ${[...letras]}`);
  }
});

test("versão nova mantém habilidades, níveis e pesos; mesma semente dá o mesmo simulado", () => {
  for (const s of simulados.filter((x) => temVersaoNova(x.id, x.n_questoes))) {
    const base = ler(s.arquivo);
    const v1 = gerarVersao(base, 2024);
    const v2 = gerarVersao(base, 2024);
    assert.deepEqual(v1, v2);
    assert.equal(v1.items.length, base.items.length);
    v1.items.forEach((it, i) => {
      assert.equal(it.code, base.items[i].code);
      assert.equal(it.level, base.items[i].level);
      assert.equal(it.valor, base.items[i].valor);
    });
    if (base.pontuacao.tipo === "valores") {
      assert.equal(v1.items.reduce((s, it) => s + it.valor, 0), 10);
    }
    const v3 = gerarVersao(base, 77);
    assert.notDeepEqual(v1.items.map((i) => i.stem), v3.items.map((i) => i.stem));
  }
});

test("treino montado: quantidade, habilidades escolhidas e ordem por nível", () => {
  const codigos = ["D30", "D05", "EF.09.MAT.2.89"];
  const sim = gerarMisto({ codigos, quantidade: 8, habilidades, semente: 5 });
  assert.equal(sim.items.length, 8);
  assert.ok(sim.items.every((it) => codigos.includes(it.code)));
  for (const c of codigos) assert.ok(sim.items.some((it) => it.code === c), `faltou ${c}`);
  const niveis = sim.items.map((it) => Number(it.level[1]));
  assert.deepEqual(niveis, [...niveis].sort());
  sim.items.forEach((it, i) => assert.equal(it.n, i + 1));
});

test("nada de nome institucional nem travessão nos textos gerados", () => {
  const proibidos = ["U0VTSQ==", "U2VzaQ==", "Q0UgMDI2", "Q0UwMjY=", "SmHDug=="].map((t) => Buffer.from(t, "base64").toString("utf-8"));
  for (const s of simulados.filter((x) => temVersaoNova(x.id, x.n_questoes))) {
    const txt = JSON.stringify(gerarVersao(ler(s.arquivo), 31337));
    for (const w of proibidos) assert.ok(!txt.includes(w));
    assert.ok(!txt.includes("\u2014"));
  }
});
