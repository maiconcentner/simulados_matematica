// planejamento/apps_script/Code.gs com uma planilha falsa (SpreadsheetApp, PropertiesService...).
// Confere alunos, status, resultado, envio, id_envio repetido, código e turma, Resumo e Por questão.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const CODIGO = readFileSync(new URL("../planejamento/apps_script/Code.gs", import.meta.url), "utf-8");

/** Aba falsa: uma matriz de valores. */
class Aba {
  constructor() { this.v = []; }
  getLastRow() { return this.v.length; }
  appendRow(l) { this.v.push([...l]); }
  getDataRange() { return { getValues: () => this.v.map((l) => [...l]) }; }
  getRange(r, c, nr, nc) {
    return {
      setValues: (vals) => {
        for (let i = 0; i < nr; i++) {
          this.v[r - 1 + i] ||= [];
          for (let j = 0; j < nc; j++) this.v[r - 1 + i][c - 1 + j] = vals[i][j];
        }
      },
    };
  }
  clearContents() { this.v = []; }
}

function ambiente({ codigoAula = "PI314", alunos = [] } = {}) {
  const abas = {};
  const ss = {
    getSheetByName: (n) => abas[n] || null,
    insertSheet: (n) => (abas[n] = new Aba()),
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === "CODIGO_AULA" ? codigoAula : null) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (t) => ({ setMimeType: () => ({ texto: t, json: () => JSON.parse(t) }) }),
    },
    Date,
    JSON,
    Math,
    Object,
    String,
    Number,
  };
  vm.createContext(ctx);
  vm.runInContext(CODIGO, ctx);
  const alunosAba = (abas.Alunos = new Aba());
  alunosAba.appendRow(["Turma", "Numero", "Nome"]);
  alunos.forEach((l) => alunosAba.appendRow(l));
  return {
    abas,
    get: (p) => ctx.doGet({ parameter: p }).json(),
    post: (d) => ctx.doPost({ postData: { contents: JSON.stringify(d) } }).json(),
  };
}

// simulado de 4 questões: 1 e 2 na parte 1, 3 e 4 na parte 2; 1 e 3 são da etapa (D), 2 e 4 de conexão (C)
const codigos = { 1: "D05", 2: "C20", 3: "D30", 4: "C17" };
const envio = (parte, respostas, acertos, extra = {}) => ({
  acao: "resposta", codigo: "PI314", id_envio: `e${parte}-${extra.nome || "Ana"}`, id: "SIM", parte, turma: "9A",
  nome: "Ana Teste", nome_digitado: false, ordem: Object.keys(respostas).map(Number).reverse(), respostas, acertos,
  acertos_parte: Object.values(acertos).reduce((a, b) => a + b, 0), tempo_min: 12, data_hora: "2026-11-10 08:40",
  total_questoes: 4, codigos, ...extra,
});

test("alunos: confere o código e a turma e devolve os nomes em ordem alfabética", () => {
  const a = ambiente({ alunos: [["9A", 2, "Bruno Teste"], ["9A", 1, "Ana Teste"], ["9B", 1, "Caio Exemplo"]] });
  assert.deepEqual(a.get({ acao: "alunos", turma: "9A", codigo: "pi314" }), { ok: true, alunos: ["Ana Teste", "Bruno Teste"] });
  assert.deepEqual(a.get({ acao: "alunos", turma: "9A", codigo: "ERRADO" }), { ok: false, erro: "codigo" });
  assert.deepEqual(a.get({ acao: "alunos", turma: "8A", codigo: "PI314" }), { ok: false, erro: "turma" });
  const sem = ambiente({ codigoAula: null });
  assert.deepEqual(sem.get({ acao: "alunos", turma: "9A", codigo: "" }), { ok: false, erro: "codigo" });
});

test("envio grava em Respostas, ignora id_envio repetido e código errado; status e resultado juntam as partes", () => {
  const a = ambiente();
  assert.deepEqual(a.post(envio(1, { 1: "B", 2: "A" }, { 1: 1, 2: 0 })), { ok: true });
  assert.deepEqual(a.post(envio(1, { 1: "B", 2: "A" }, { 1: 1, 2: 0 })), { ok: true, repetido: true });
  assert.equal(a.post({ ...envio(2, { 3: "C", 4: "" }, { 3: 1, 4: 0 }), codigo: "X" }).erro, "codigo");
  assert.equal(a.post({ ...envio(2, { 3: "C", 4: "" }, { 3: 1, 4: 0 }), turma: "7B" }).erro, "turma");
  const resp = a.abas.Respostas.v;
  assert.equal(resp.length, 2); // cabeçalho + 1 envio
  const cab = resp[0];
  assert.deepEqual(cab.slice(0, 8), ["Data/hora", "Simulado", "Parte", "Turma", "Nome", "Nome digitado", "Tempo (min)", "Acertos da parte"]);
  assert.equal(cab[8], "R1");
  assert.equal(cab[8 + 28], "C1");
  assert.deepEqual(cab.slice(-2), ["Ordem mostrada", "id_envio"]);
  const l = resp[1];
  assert.equal(l[cab.indexOf("R1")], "B");
  assert.equal(l[cab.indexOf("C1")], 1);
  assert.equal(l[cab.indexOf("C2")], 0);
  assert.equal(l[cab.indexOf("R3")], ""); // só as da parte preenchidas
  assert.equal(l[cab.indexOf("Ordem mostrada")], "2 1");
  assert.deepEqual(a.get({ acao: "status", id: "SIM", turma: "9A", nome: "ana teste", codigo: "PI314" }), { ok: true, partes: [1] });
  a.post(envio(2, { 3: "C", 4: "" }, { 3: 1, 4: 0 }));
  const r = a.get({ acao: "resultado", id: "SIM", turma: "9A", nome: "Ana Teste", codigo: "PI314" });
  assert.deepEqual(r.partes, [1, 2]);
  assert.deepEqual(r.respostas, { 1: "B", 2: "A", 3: "C", 4: "" });
});

test("Resumo: uma linha por aluno e simulado, com nota, etapa e conexão; Por questão por turma", () => {
  const a = ambiente();
  a.post(envio(1, { 1: "B", 2: "A" }, { 1: 1, 2: 0 }));
  a.post(envio(2, { 3: "C", 4: "D" }, { 3: 1, 4: 0 }));
  a.post({ ...envio(1, { 1: "E", 2: "A" }, { 1: 0, 2: 0 }), nome: "Bruno Teste", turma: "9B", id_envio: "b1" });
  const res = a.abas.Resumo.v;
  const cab = res[0];
  assert.equal(res.length, 3); // cabeçalho + Ana + Bruno
  const ana = res.find((l) => l[1] === "Ana Teste");
  assert.equal(ana[cab.indexOf("Partes recebidas")], "1, 2");
  assert.equal(ana[cab.indexOf("Acertos")], 2);
  assert.equal(ana[cab.indexOf("Nota")], 5);
  assert.equal(ana[cab.indexOf("Etapa")], 10); // as D (1 e 3) certas
  assert.equal(ana[cab.indexOf("Conexão")], 0);
  const pq = a.abas["Por questão"].v;
  assert.equal(pq[0][0], "Simulado SIM");
  assert.deepEqual(pq[1].slice(0, 6), ["Questão", "Código", "Acerto 9A", "Acerto 9B", "Acerto 9C", "Acerto total"]);
  const q1 = pq.find((l) => l[0] === 1);
  assert.equal(q1[1], "D05");
  assert.equal(q1[2], "100%"); // 9A: Ana acertou
  assert.equal(q1[3], "0%"); // 9B: Bruno errou
  assert.equal(q1[5], "50%");
  const q2 = pq.find((l) => l[0] === 2);
  assert.equal(q2[6], "A (2)"); // a mais marcada
});
