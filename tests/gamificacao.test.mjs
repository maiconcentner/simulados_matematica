// XP, nível e conquistas (js/gamificacao.js), com os números do config.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { corrigir } from "../js/correcao.js";
import { xpDoSimulado, xpGanho, nivelDoJogador, sequenciaDeDias, conquistasNovas, maiorSequencia, listaDeConquistas, registrarDia } from "../js/gamificacao.js";

const ler = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf-8"));
const config = ler("data/config.json"), habilidades = ler("data/habilidades.json");
const S07 = ler("data/avalia/S07.json"), E3 = ler("data/prova/E3-AV2.json");
const resp = (sim, certas) => Object.fromEntries(sim.items.map((it) => [it.n, certas === "todas" || certas.includes(it.n) ? it.key : it.options.find((o) => !o.correct).letter]));
const corr = (sim, certas) => corrigir(sim, resp(sim, certas), { config, habilidades });

test("XP do Avalia: acerto pelo nível, concluir, nota 8 ou mais e combo", () => {
  const r = corr(S07, "todas"); // níveis N3 N3 N3 N4 N4 N4
  const x = xpDoSimulado(S07, r.questoes, r.nota, config);
  assert.equal(x.acertos, 30 * 3 + 40 * 3);
  assert.equal(x.concluir, 20);
  assert.equal(x.nota8, 30);
  assert.equal(x.combo, 4 * 5); // do 3º ao 6º acerto seguido
  assert.equal(x.total, 210 + 20 + 30 + 20);
  const r2 = corr(S07, [1, 2, 4, 5]);
  const x2 = xpDoSimulado(S07, r2.questoes, r2.nota, config);
  assert.equal(x2.combo, 0);
  assert.equal(x2.nota8, 0);
});
test("XP da prova: valor × prova_por_ponto", () => {
  const r = corr(E3, "todas");
  assert.equal(xpDoSimulado(E3, r.questoes, r.nota, config).acertos, 10 * 20);
});
test("refazer só dá XP pelo que melhorar; treino gerado dá metade", () => {
  const cheio = { total: 200 };
  assert.equal(xpGanho(cheio, { anteriores: [], nota: 6 }, config), 200);
  assert.equal(xpGanho(cheio, { anteriores: [{ nota: 8, xpCheio: 250 }], nota: 6 }, config), 0);
  assert.equal(xpGanho(cheio, { anteriores: [{ nota: 5, xpCheio: 150 }], nota: 7 }, config), 50);
  assert.equal(xpGanho(cheio, { gerado: true, nota: 7 }, config), 100);
});
test("nível e título", () => {
  assert.deepEqual([nivelDoJogador(0, config).nivel, nivelDoJogador(0, config).titulo], [1, "Iniciante"]);
  assert.equal(nivelDoJogador(149, config).nivel, 1);
  assert.equal(nivelDoJogador(300, config).titulo, "Explorador");
  assert.equal(nivelDoJogador(600, config).nivel, 5);
  assert.equal(nivelDoJogador(600, config).titulo, "Estrategista");
});
test("sequência de dias", () => {
  assert.equal(sequenciaDeDias(["2026-11-01", "2026-11-02", "2026-11-03"], "2026-11-03"), 3);
  assert.equal(sequenciaDeDias(["2026-11-01", "2026-11-02"], "2026-11-03"), 2);
  assert.equal(sequenciaDeDias(["2026-10-30", "2026-11-02"], "2026-11-03"), 1);
  assert.deepEqual(registrarDia(["2026-11-01"], "2026-11-01"), ["2026-11-01"]);
});
test("a conquista de tema vira uma por tema", () => {
  const ids = listaDeConquistas(config).map((c) => c.id);
  assert.equal(ids.length, config.conquistas.length - 1 + config.temas.length);
  assert.ok(ids.includes("especialista_tema:Geometria"));
});
test("conquistas: primeira, gabaritou, embalado, volta por cima, maratona, persistente, prova e especialista", () => {
  const ctx = { config, habilidades, avaliaPublicados: ["S01", "S02"], ehProva: (id) => id === "E3-AV2", hoje: "2026-11-03" };
  const t = (simId, nota, acertos, total, fim, porHabilidade = {}) => ({ simId, modo: "simulado", nota, acertos, total, fim, porHabilidade });
  const estado = {
    conquistas: {},
    diasDeUso: ["2026-11-01", "2026-11-02", "2026-11-03"],
    tentativas: [t("S01", 4, 2, 5, "2026-11-01T10:00:00Z"), t("S02", 6, 3, 5, "2026-11-02T10:00:00Z"), t("E3-AV2", 10, 10, 10, "2026-11-03T10:00:00Z", { "EF.09.MAT.2.89": { acertos: 4, total: 4 }, "EF.09.MAT.2.88": { acertos: 3, total: 3 } }), t("S01", 8, 4, 5, "2026-11-03T11:00:00Z")],
  };
  const novas = conquistasNovas(estado, { ...ctx, tentativa: estado.tentativas[2], anterior: null, maiorSeq: 10 });
  for (const id of ["primeira_missao", "gabaritou", "sequencia_5", "prova_pronta", "maratona", "persistente", "todas_as_semanas", "especialista_tema:Álgebra e funções"]) assert.ok(novas.includes(id), `faltou ${id}`);
  assert.ok(!novas.includes("volta_por_cima"));
  const volta = conquistasNovas(estado, { ...ctx, tentativa: estado.tentativas[3], anterior: estado.tentativas[0], maiorSeq: 2 });
  assert.ok(volta.includes("volta_por_cima"));
  // não repete as que já tem
  estado.conquistas.primeira_missao = "2026-11-01";
  assert.ok(!conquistasNovas(estado, { ...ctx, tentativa: estado.tentativas[3] }).includes("primeira_missao"));
});
test("maior sequência de acertos", () => {
  assert.equal(maiorSequencia([{ acertou: true }, { acertou: true }, { acertou: false }, { acertou: true }]), 2);
});
