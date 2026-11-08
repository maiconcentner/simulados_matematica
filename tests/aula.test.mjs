// Páginas de aula (simulado.html e completo.html), com o Apps Script simulado.
// Especificação: planejamento/pagina_simulado_completo.md, seção "Testes".
//   node --test tests/
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = await import("playwright")); }

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const URL_FALSA = "https://script.google.com/macros/s/TESTE/exec";
const CODIGO = "PI314";
// nomes de mentira (nenhum nome de aluno entra no repositório)
const ALUNOS = { "9A": ["Bruno Teste", "Ana Teste", "Caio Exemplo"], "9B": ["Duda Exemplo"], "9C": ["Eva Exemplo"] };
const COMPLETO = JSON.parse(await readFile(join(RAIZ, "data/avalia/E3-COMPLETO.json"), "utf-8"));
const T1 = JSON.parse(await readFile(join(RAIZ, "data/avalia/T1.json"), "utf-8"));
const itemDe = (sim, n) => sim.items.find((i) => i.n === n);

let servidor, URL_BASE, navegador;
before(async () => {
  servidor = createServer(async (req, res) => {
    const caminho = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    const arq = join(RAIZ, caminho.endsWith("/") ? caminho + "index.html" : caminho);
    try {
      const corpo = await readFile(arq);
      res.writeHead(200, { "Content-Type": TIPOS[extname(arq)] || "application/octet-stream" });
      res.end(corpo);
    } catch {
      res.writeHead(404); res.end("não encontrado");
    }
  });
  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  URL_BASE = `http://127.0.0.1:${servidor.address().port}/`;
  navegador = await chromium.launch();
});
after(async () => { await navegador?.close(); servidor?.close(); });

/**
 * Planilha simulada: guarda os envios e responde alunos, status e resultado.
 * foraGet / foraPost: simula o Apps Script fora do ar.
 */
function novaPlanilha() {
  return { recebidos: [], foraGet: false, foraPost: false };
}

/** "Computador" novo (contexto com armazenamento próprio), ligado à planilha simulada. */
async function computador(planilha, { largura = 390, altura = 844, quando = "2026-11-10T08:00:00-03:00" } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, timezoneId: "America/Sao_Paulo" });
  const erros = [];
  ctx.on("weberror", (e) => erros.push(e.error().message));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  // a página fala com a planilha falsa
  await ctx.route(/\/js\/aula\/config\.js$/, async (rota) => {
    const resp = await rota.fetch();
    const corpo = (await resp.text()).replace(/URL_DA_PLANILHA = "[^"]*"/, `URL_DA_PLANILHA = "${URL_FALSA}"`);
    await rota.fulfill({ response: resp, body: corpo });
  });
  await ctx.route(`${URL_FALSA}**`, async (rota) => {
    const req = rota.request();
    const cors = { "Access-Control-Allow-Origin": "*" };
    if (req.method() === "POST") {
      if (planilha.foraPost) return rota.abort();
      const d = JSON.parse(req.postData());
      if (d.codigo === CODIGO && !planilha.recebidos.some((x) => x.id_envio === d.id_envio)) planilha.recebidos.push(d);
      return rota.fulfill({ status: 200, body: "ok", headers: cors });
    }
    if (planilha.foraGet) return rota.abort();
    const q = new URL(req.url()).searchParams;
    const json = (o) => rota.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(o), headers: cors });
    if (q.get("codigo") !== CODIGO) return json({ ok: false, erro: "codigo" });
    const meus = planilha.recebidos.filter((x) => x.id === q.get("id") && x.turma === q.get("turma") && x.nome === q.get("nome"));
    if (q.get("acao") === "alunos") return json({ ok: true, alunos: ALUNOS[q.get("turma")] || [] });
    if (q.get("acao") === "status") return json({ ok: true, partes: [...new Set(meus.map((x) => x.parte))] });
    if (q.get("acao") === "resultado") return json({ ok: true, partes: meus.map((x) => x.parte), respostas: Object.assign({}, ...meus.map((x) => x.respostas)) });
    return json({ ok: false, erro: "acao" });
  });
  const pagina = await ctx.newPage();
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR_FAILED/.test(m.text())) erros.push(m.text()); });
  await pagina.clock.setFixedTime(new Date(quando));
  return { ctx, pagina, erros, larguras: [], largura };
}

const tela = (pc, nome) => pc.pagina.waitForFunction((t) => document.body.dataset.tela === t, nome);
async function conferirLargura(pc) {
  const w = await pc.pagina.evaluate(() => document.documentElement.scrollWidth);
  assert.equal(w, pc.largura, `rolagem lateral na tela "${await pc.pagina.evaluate(() => document.body.dataset.tela)}"`);
}

async function identificar(pc, { turma = "9A", nome, codigo = CODIGO, digitado = false }) {
  const p = pc.pagina;
  await tela(pc, "Identificação");
  await conferirLargura(pc);
  await p.click(`label.chip:has(input[value="${turma}"])`);
  await p.fill("#codigo", codigo);
  await p.click('#form-ident button[type="submit"]');
  if (digitado) {
    await p.waitForSelector("#nome-digitado");
    await conferirLargura(pc);
    await p.fill("#nome-digitado", nome);
    await p.click('[data-acao="entrar-digitado"]');
  } else {
    await p.waitForSelector("#nome-lista");
    await conferirLargura(pc);
    await p.selectOption("#nome-lista", nome);
    await p.click('[data-acao="entrar-lista"]');
  }
}

/** Questão na tela agora (número original). */
const numeroNaTela = (pc) => pc.pagina.$eval(".questao[data-n]", (el) => Number(el.dataset.n));

/**
 * Faz uma parte inteira. escolher(item) devolve a letra (ou null para deixar em branco).
 * Devolve a ordem mostrada.
 */
async function fazerParte(pc, sim, parte, escolher, { enviar = true } = {}) {
  const p = pc.pagina;
  if (await p.$(`[data-acao="abrir-parte"][data-parte="${parte}"]`)) await p.click(`[data-acao="abrir-parte"][data-parte="${parte}"]`);
  const ordem = [];
  for (;;) {
    const t = await p.evaluate(() => document.body.dataset.tela);
    if (t === "Revisão") break;
    await p.waitForSelector(".questao[data-n]");
    await conferirLargura(pc);
    const n = await numeroNaTela(pc);
    ordem.push(n);
    const letra = escolher(itemDe(sim, n));
    if (letra) await p.click(`.opcao[data-letra="${letra}"]`);
    const k = ordem.length;
    await p.click("#proxima");
    if (k < (sim.partes ? sim.partes.find((x) => x.n === parte).questoes.length : sim.items.length)) await tela(pc, `Questão ${k + 1}`);
    else await tela(pc, "Revisão");
  }
  await conferirLargura(pc);
  if (enviar) {
    await p.click("#botao-enviar");
    if (await p.$('#msg-enviar:has-text("Toque de novo")')) await p.click("#botao-enviar");
    await p.waitForFunction(() => !["Revisão"].includes(document.body.dataset.tela));
  }
  return ordem;
}
const certa = (it) => it.key;
const errada = (it) => it.options.find((o) => !o.correct).letter;
const soEtapa = (it) => (it.code.startsWith("D") ? it.key : errada(it)); // acerta as D, erra as C

test("dois alunos no mesmo computador: as 4 partes, sem misturar o progresso, e o JSON de cada envio", async () => {
  const planilha = novaPlanilha();
  const pc = await computador(planilha);
  const p = pc.pagina;
  await p.goto(URL_BASE + "completo.html");
  await identificar(pc, { nome: "Ana Teste" });
  await tela(pc, COMPLETO.titulo);
  await conferirLargura(pc);
  assert.equal(await p.$$eval(".parte", (e) => e.length), 4);
  // Ana começa a parte 1 e responde 2 questões
  await p.click('[data-acao="abrir-parte"][data-parte="1"]');
  await tela(pc, "Questão 1");
  assert.match(await p.textContent("main h1"), /Questão 1 de 7 · Parte 1/);
  await p.click(`.opcao[data-letra="${certa(itemDe(COMPLETO, await numeroNaTela(pc)))}"]`);
  await p.click("#proxima");
  await tela(pc, "Questão 2");
  await p.click(`.opcao[data-letra="${certa(itemDe(COMPLETO, await numeroNaTela(pc)))}"]`);
  // troca de aluno: o Bruno não vê o progresso da Ana
  await p.click('[data-acao="trocar"]');
  await identificar(pc, { nome: "Bruno Teste" });
  await tela(pc, COMPLETO.titulo);
  assert.match(await p.textContent(".parte:nth-child(1)"), /Não começada/);
  // Bruno faz as 4 partes, fora de ordem, acertando só as questões da etapa (códigos D)
  for (const parte of [3, 1, 4, 2]) {
    await fazerParte(pc, COMPLETO, parte, soEtapa);
    if (parte !== 2) {
      await tela(pc, COMPLETO.titulo);
      assert.match(await p.textContent(".aviso-aula.ok"), new RegExp(`Parte ${parte} enviada`));
      assert.match(await p.textContent(`.parte:nth-child(${parte})`), /Enviada/);
    }
  }
  await tela(pc, "Resultado");
  await conferirLargura(pc);
  // 20 da etapa certas e 8 de conexão erradas: 7,1; etapa 10,0; conexão 0,0
  assert.equal(await p.getAttribute(".anel-texto b", "data-ate"), "7.1");
  assert.equal((await p.textContent(".nota-etapa")).trim(), "10,0");
  assert.equal((await p.textContent(".nota-conexao")).trim(), "0,0");
  assert.equal(await p.$$eval(".barras-tema li", (e) => e.length) > 0, true);
  assert.equal(await p.$$eval(".passo", (e) => e.length), 3);
  // o que chegou à planilha: 4 envios do Bruno, respostas pelo número original
  const doBruno = planilha.recebidos.filter((x) => x.nome === "Bruno Teste");
  assert.deepEqual(doBruno.map((x) => x.parte), [3, 1, 4, 2]);
  for (const env of doBruno) {
    const questoes = COMPLETO.partes.find((x) => x.n === env.parte).questoes;
    assert.equal(env.acao, "resposta");
    assert.equal(env.codigo, CODIGO);
    assert.equal(env.id, "E3-COMPLETO");
    assert.equal(env.turma, "9A");
    assert.equal(env.nome_digitado, false);
    assert.ok(env.id_envio);
    assert.deepEqual([...env.ordem].sort((a, b) => a - b), [...questoes].sort((a, b) => a - b));
    assert.deepEqual(Object.keys(env.respostas).map(Number).sort((a, b) => a - b), [...questoes].sort((a, b) => a - b));
    for (const n of questoes) {
      const it = itemDe(COMPLETO, n);
      assert.equal(env.respostas[n], soEtapa(it), `resposta da questão ${n}`);
      assert.equal(env.acertos[n], it.code.startsWith("D") ? 1 : 0);
    }
    assert.equal(env.acertos_parte, questoes.filter((n) => itemDe(COMPLETO, n).code.startsWith("D")).length);
    assert.ok(env.tempo_min >= 1);
    assert.match(env.data_hora, /^2026-11-10 \d\d:\d\d$/);
    assert.equal(env.total_questoes, 28);
  }
  // a Ana volta: a parte 1 continua de onde ela parou (2 respondidas, na questão 2)
  await p.click('[data-acao="trocar"]');
  await identificar(pc, { nome: "Ana Teste" });
  await tela(pc, COMPLETO.titulo);
  assert.match(await p.textContent(".parte:nth-child(1)"), /Em andamento[\s\S]*2 respondidas/);
  await p.click('[data-acao="abrir-parte"][data-parte="1"]');
  await tela(pc, "Questão 2");
  assert.ok(await p.$('.opcao[aria-checked="true"]'));
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("interromper a parte 2, recarregar e continuar da mesma questão, na mesma ordem", async () => {
  const pc = await computador(novaPlanilha());
  const p = pc.pagina;
  await p.goto(URL_BASE + "completo.html");
  await identificar(pc, { nome: "Caio Exemplo" });
  await tela(pc, COMPLETO.titulo);
  await p.click('[data-acao="abrir-parte"][data-parte="2"]');
  const ordem = [];
  for (let k = 1; k <= 4; k++) {
    await tela(pc, `Questão ${k}`);
    ordem.push(await numeroNaTela(pc));
    if (k < 4) { await p.click(`.opcao[data-letra="${certa(itemDe(COMPLETO, ordem.at(-1)))}"]`); await p.click("#proxima"); }
  }
  // a aula acabou: recarrega (a aba continua aberta, o aluno continua identificado)
  await p.reload();
  await tela(pc, "Questão 4");
  assert.match(await p.textContent("main h1"), /Questão 4 de 7 · Parte 2/);
  assert.equal(await numeroNaTela(pc), ordem[3]);
  // as anteriores, na mesma ordem e com as respostas guardadas
  for (let k = 1; k <= 3; k++) {
    await p.click(`.bolinha[data-k="${k - 1}"]`);
    await tela(pc, `Questão ${k}`);
    assert.equal(await numeroNaTela(pc), ordem[k - 1]);
    assert.equal(await p.getAttribute(`.opcao[data-letra="${certa(itemDe(COMPLETO, ordem[k - 1]))}"]`, "aria-checked"), "true");
  }
  // a aba fechou: o aluno se identifica de novo e continua no mesmo computador
  const p2 = await pc.ctx.newPage();
  pc.pagina = p2;
  await p2.clock.setFixedTime(new Date("2026-11-10T09:00:00-03:00"));
  await p2.goto(URL_BASE + "completo.html");
  await identificar(pc, { nome: "Caio Exemplo" });
  await tela(pc, COMPLETO.titulo);
  assert.match(await p2.textContent(".parte:nth-child(2)"), /Em andamento[\s\S]*3 respondidas/);
  await p2.click('[data-acao="abrir-parte"][data-parte="2"]');
  // a última questão vista antes de fechar a aba foi a 3
  await tela(pc, "Questão 3");
  assert.equal(await numeroNaTela(pc), ordem[2]);
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("ordem embaralhada: alunos diferentes têm ordens diferentes; o mesmo aluno, sempre a mesma", async () => {
  const planilha = novaPlanilha();
  const ordemDe = async (nome, pc) => {
    await pc.pagina.goto(URL_BASE + "completo.html");
    await identificar(pc, { nome });
    await tela(pc, COMPLETO.titulo);
    const ordens = [];
    for (const parte of [1, 2, 3, 4]) {
      await pc.pagina.click(`[data-acao="abrir-parte"][data-parte="${parte}"]`);
      const o = [];
      for (let k = 1; k <= 7; k++) {
        await pc.pagina.click(`.bolinha[data-k="${k - 1}"]`);
        await tela(pc, `Questão ${k}`);
        o.push(await numeroNaTela(pc));
      }
      ordens.push(o);
      await pc.pagina.click('[data-acao="trocar"]');
      await identificar(pc, { nome });
      await tela(pc, COMPLETO.titulo);
    }
    await pc.pagina.click('[data-acao="trocar"]');
    return ordens;
  };
  const pcA = await computador(planilha);
  const ana = await ordemDe("Ana Teste", pcA);
  const bruno = await ordemDe("Bruno Teste", pcA);
  // outro computador: a Ana recebe a mesma ordem
  const pcB = await computador(planilha);
  const anaDeNovo = await ordemDe("Ana Teste", pcB);
  assert.deepEqual(anaDeNovo, ana);
  assert.notDeepEqual(bruno, ana);
  ana.forEach((o, i) => assert.deepEqual([...o].sort((a, b) => a - b), [...COMPLETO.partes[i].questoes].sort((a, b) => a - b)));
  // embaralhou de verdade (não é a ordem do JSON em todas as partes)
  assert.ok(ana.some((o, i) => o.join() !== COMPLETO.partes[i].questoes.join()));
  assert.deepEqual(pcA.erros, []);
  assert.deepEqual(pcB.erros, []);
  await pcA.ctx.close();
  await pcB.ctx.close();
});

test("as alternativas aparecem na ordem do JSON (A a E)", async () => {
  const pc = await computador(novaPlanilha());
  await pc.pagina.goto(URL_BASE + "completo.html");
  await identificar(pc, { nome: "Eva Exemplo", turma: "9C" });
  await tela(pc, COMPLETO.titulo);
  await pc.pagina.click('[data-acao="abrir-parte"][data-parte="1"]');
  await tela(pc, "Questão 1");
  const it = itemDe(COMPLETO, await numeroNaTela(pc));
  const naTela = await pc.pagina.$$eval(".opcao", (els) => els.map((e) => [e.querySelector(".letra").textContent.trim(), e.lastElementChild.textContent.trim()]));
  assert.deepEqual(naTela, it.options.map((o) => [o.letter, o.text]));
  await pc.ctx.close();
});

test("trocar de computador entre as partes: a situação e o resultado vêm da planilha", async () => {
  const planilha = novaPlanilha();
  const pcA = await computador(planilha);
  await pcA.pagina.goto(URL_BASE + "completo.html");
  await identificar(pcA, { nome: "Duda Exemplo", turma: "9B" });
  await tela(pcA, COMPLETO.titulo);
  await fazerParte(pcA, COMPLETO, 1, certa);
  await tela(pcA, COMPLETO.titulo);
  await fazerParte(pcA, COMPLETO, 2, certa);
  await tela(pcA, COMPLETO.titulo);
  // no outro computador, as partes 1 e 2 aparecem como enviadas
  const pcB = await computador(planilha, { quando: "2026-11-12T10:00:00-03:00" });
  await pcB.pagina.goto(URL_BASE + "completo.html");
  await identificar(pcB, { nome: "Duda Exemplo", turma: "9B" });
  await pcB.pagina.waitForFunction(() => document.querySelectorAll(".parte.enviada").length === 2);
  await fazerParte(pcB, COMPLETO, 3, certa);
  await tela(pcB, COMPLETO.titulo);
  await fazerParte(pcB, COMPLETO, 4, errada);
  await tela(pcB, "Resultado");
  // 21 certas (partes 1 a 3) de 28: 7,5
  assert.equal(await pcB.pagina.getAttribute(".anel-texto b", "data-ate"), "7.5");
  assert.deepEqual(pcA.erros, []);
  assert.deepEqual(pcB.erros, []);
  await pcA.ctx.close();
  await pcB.ctx.close();
});

test("aviso das questões em branco antes de enviar", async () => {
  const planilha = novaPlanilha();
  const pc = await computador(planilha);
  const p = pc.pagina;
  await p.goto(URL_BASE + "simulado.html?id=E3-COMPLETO&parte=3");
  await identificar(pc, { nome: "Ana Teste" });
  // com &parte=3 abre direto a parte 3
  await tela(pc, "Questão 1");
  assert.match(await p.textContent("main h1"), /Parte 3/);
  let k = 0;
  await fazerParte(pc, COMPLETO, 3, () => (k++ < 5 ? "A" : null), { enviar: false });
  assert.match(await p.textContent(".aviso-aula.erro"), /Ficaram 2 questões em branco/);
  assert.match(await p.textContent(".aviso-aula.erro"), /Questão 6, Questão 7/);
  await p.click("#botao-enviar");
  assert.match(await p.textContent("#msg-enviar"), /Toque de novo/);
  assert.equal(planilha.recebidos.length, 0);
  await p.click("#botao-enviar");
  await tela(pc, COMPLETO.titulo);
  assert.equal(planilha.recebidos.length, 1);
  const env = planilha.recebidos[0];
  assert.equal(Object.values(env.respostas).filter((r) => r === "").length, 2);
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("código da aula errado: mensagem na própria página", async () => {
  const pc = await computador(novaPlanilha());
  const p = pc.pagina;
  await p.goto(URL_BASE + "completo.html");
  await tela(pc, "Identificação");
  await p.click('label.chip:has(input[value="9A"])');
  await p.fill("#codigo", "ERRADO");
  await p.click('#form-ident button[type="submit"]');
  await p.waitForSelector("#msg-ident:has-text('Código da aula errado')");
  assert.equal(await p.$("#nome-lista"), null);
  await conferirLargura(pc);
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("Apps Script fora do ar: o aluno digita o nome e o envio leva nome_digitado; envio que falha fica guardado e sai depois", async () => {
  const planilha = novaPlanilha();
  planilha.foraGet = true;
  planilha.foraPost = true;
  const pc = await computador(planilha);
  const p = pc.pagina;
  await p.goto(URL_BASE + "completo.html");
  await identificar(pc, { nome: "Fulano de Teste", digitado: true });
  await tela(pc, COMPLETO.titulo);
  await fazerParte(pc, COMPLETO, 1, certa);
  await tela(pc, COMPLETO.titulo);
  assert.match(await p.textContent("main"), /Não foi enviada, chame o professor/);
  assert.match(await p.textContent(".parte:nth-child(1)"), /Não foi enviada/);
  assert.equal(planilha.recebidos.length, 0);
  // a planilha volta: o botão tenta de novo
  planilha.foraPost = false;
  await p.click('[data-acao="reenviar"]');
  await p.waitForSelector(".aviso-aula.ok");
  assert.equal(planilha.recebidos.length, 1);
  assert.equal(planilha.recebidos[0].nome, "Fulano de Teste");
  assert.equal(planilha.recebidos[0].nome_digitado, true);
  assert.match(await p.textContent(".parte:nth-child(1)"), /Enviada/);
  // e também ao abrir a página: outra parte que falhou sai sozinha no próximo carregamento
  planilha.foraPost = true;
  await fazerParte(pc, COMPLETO, 2, certa);
  await tela(pc, COMPLETO.titulo);
  planilha.foraPost = false;
  await p.reload();
  await tela(pc, COMPLETO.titulo);
  for (let i = 0; i < 50 && planilha.recebidos.length < 2; i++) await new Promise((r) => setTimeout(r, 100));
  assert.equal(planilha.recebidos.length, 2);
  assert.match(await p.textContent(".parte:nth-child(2)"), /Enviada/);
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("revisão das questões só a partir de 11/11; antes disso, nada de alternativa correta", async () => {
  for (const [quando, liberada] of [["2026-11-10T11:00:00-03:00", false], ["2026-11-11T08:00:00-03:00", true]]) {
    const planilha = novaPlanilha();
    const pc = await computador(planilha, { quando });
    const p = pc.pagina;
    await p.goto(URL_BASE + "completo.html");
    await identificar(pc, { nome: "Ana Teste" });
    await tela(pc, COMPLETO.titulo);
    for (const parte of [1, 2, 3, 4]) {
      await fazerParte(pc, COMPLETO, parte, errada);
      if (parte < 4) await tela(pc, COMPLETO.titulo);
    }
    await tela(pc, "Resultado");
    await conferirLargura(pc);
    if (liberada) {
      assert.equal(await p.$$eval(".item-revisao", (e) => e.length), 28);
      assert.ok(await p.$(".alternativa.correta"));
    } else {
      assert.match(await p.textContent(".revisao-bloqueada"), /abre em 11\/11\/2026/);
      assert.equal(await p.$(".item-revisao"), null);
      assert.equal(await p.$(".alternativa.correta"), null);
      assert.doesNotMatch(await p.textContent("main"), /Correta:/);
    }
    assert.deepEqual(pc.erros, []);
    await pc.ctx.close();
  }
});

test("modo treino (T1): a correção aparece na hora, mesmo antes de 11/11", async () => {
  const planilha = novaPlanilha();
  const pc = await computador(planilha, { quando: "2026-11-10T11:00:00-03:00" });
  const p = pc.pagina;
  await p.goto(URL_BASE + "simulado.html?id=T1");
  await identificar(pc, { nome: "Bruno Teste" });
  // sem partes: vai direto às questões
  await tela(pc, "Questão 1");
  assert.match(await p.textContent("main h1"), new RegExp(`Questão 1 de ${T1.items.length}$`));
  const n = await numeroNaTela(pc);
  await p.click(`.opcao[data-letra="${errada(itemDe(T1, n))}"]`);
  await p.waitForSelector(".feedback.errado");
  assert.match(await p.textContent(".feedback"), /Erro provável/);
  assert.match(await p.textContent(".feedback"), /Resolução/);
  assert.ok(await p.$(".opcao.correta"));
  // depois de responder, não troca
  assert.ok(await p.$(".opcao[disabled]"));
  await conferirLargura(pc);
  await p.click("#proxima");
  await tela(pc, "Questão 2");
  await p.click(`.opcao[data-letra="${certa(itemDe(T1, await numeroNaTela(pc)))}"]`);
  await p.waitForSelector(".feedback.certo");
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("a S08 e os treinos abrem pela página genérica; link sem simulado mostra aviso", async () => {
  const pc = await computador(novaPlanilha());
  const p = pc.pagina;
  for (const id of ["S08", "T2", "T3"]) {
    await p.goto(URL_BASE + `simulado.html?id=${id}`);
    await tela(pc, "Identificação");
    await conferirLargura(pc);
  }
  await p.goto(URL_BASE + "simulado.html?id=NAO-EXISTE");
  await tela(pc, "Ops");
  await conferirLargura(pc);
  assert.match(await p.textContent("main"), /Não encontrei esse simulado/);
  await pc.ctx.close();
});

test("telas em 1280 px sem rolagem lateral", async () => {
  const planilha = novaPlanilha();
  const pc = await computador(planilha, { largura: 1280, altura: 900 });
  await pc.pagina.goto(URL_BASE + "completo.html");
  await identificar(pc, { nome: "Ana Teste" });
  await tela(pc, COMPLETO.titulo);
  await conferirLargura(pc);
  for (const parte of [1, 2, 3, 4]) {
    await fazerParte(pc, COMPLETO, parte, certa);
    if (parte < 4) await tela(pc, COMPLETO.titulo);
  }
  await tela(pc, "Resultado");
  await conferirLargura(pc);
  assert.deepEqual(pc.erros, []);
  await pc.ctx.close();
});

test("validação dos dados: python3 tools/validar_dados.py sem erro", () => {
  const saida = execFileSync("python3", [join(RAIZ, "tools/validar_dados.py")], { encoding: "utf-8" });
  assert.match(saida, /0 erro\(s\)/);
});
