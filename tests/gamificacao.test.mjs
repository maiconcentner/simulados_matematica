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
test("conquistas do simulado completo: terminar as 28 e 70% ou mais", { todo: "em construção" }, () => {
  const ctx = { config, habilidades, ehCompleto: (id) => id === "E3-COMPLETO", hoje: "2026-11-15" };
  const resp = (n, branco = 0) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, i < n - branco ? "A" : ""]));
  const t = (percentual, branco) => ({ simId: "E3-COMPLETO", modo: "simulado", nota: percentual / 10, percentual, acertos: Math.round(percentual * 0.28), total: 28, respostas: resp(28, branco), fim: "2026-11-15T10:00:00Z", porHabilidade: {} });
  const est = (tt) => ({ conquistas: {}, diasDeUso: ["2026-11-15"], tentativas: [tt] });
  let a = t(71.43, 0);
  let n = conquistasNovas(est(a), { ...ctx, tentativa: a });
  assert.ok(n.includes("simulado_completo"));
  assert.ok(n.includes("pronto_para_prova"));
  a = t(60, 2); // 2 em branco e abaixo de 70%
  n = conquistasNovas(est(a), { ...ctx, tentativa: a });
  assert.ok(!n.includes("simulado_completo"));
  assert.ok(!n.includes("pronto_para_prova"));
  // outro simulado não conta
  a = { ...t(100, 0), simId: "S07" };
  n = conquistasNovas(est(a), { ...ctx, tentativa: a });
  assert.ok(!n.includes("simulado_completo"));
});

test("plano até a prova: dias de hoje até a véspera, no máximo 5", async () => {
  const { diasAteAProva, planoAteAProva } = await import("../js/plano_prova.js");
  assert.equal(diasAteAProva("2026-11-18", "2026-11-15"), 3);
  assert.equal(diasAteAProva("2026-11-18", "2026-11-10"), 5);
  assert.equal(diasAteAProva("2026-11-18", "2026-11-18"), 0);
  assert.equal(diasAteAProva("2026-11-18", "2026-11-20"), 0);
  const fracos = ["A", "B", "C", "D", "E", "F", "G"].map((c) => ({ code: c }));
  const p = planoAteAProva({ dataProva: "2026-11-18", hoje: "2026-11-15", fracos });
  assert.equal(p.length, 3);
  assert.deepEqual(p.map((d) => d.habilidades.map((x) => x.code)), [["A", "B", "C"], ["D", "E", "F"], ["G"]]);
  assert.equal(p[0].rotulo, "Hoje");
  assert.equal(p[1].rotulo, "Amanhã");
  assert.equal(p[2].rotulo, "Terça"); // 17/11/2026
  assert.deepEqual(planoAteAProva({ dataProva: "2026-11-18", hoje: "2026-11-19", fracos }), []);
});

test("maior sequência de acertos", () => {
  assert.equal(maiorSequencia([{ acertou: true }, { acertou: true }, { acertou: false }, { acertou: true }]), 2);
});
