// Testes de ponta a ponta do site (Playwright, Chromium):
//   node --test tests/
// Sobem um servidor local na raiz do site e abrem as telas no celular e no computador.
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
// números que vêm dos dados (o professor acrescenta simulados e conquistas)
const CATALOGO = JSON.parse(await readFile(join(RAIZ, "data/catalogo.json"), "utf-8"));
const CONFIG = JSON.parse(await readFile(join(RAIZ, "data/config.json"), "utf-8"));
const HABILIDADES = JSON.parse(await readFile(join(RAIZ, "data/habilidades.json"), "utf-8"));
const AVALIA = CATALOGO.areas.find((a) => a.id === "avalia").simulados.filter((s) => s.status !== "oculto");
// como o site organiza o catálogo: semanas e simulado completo no Avalia, treinos em Treinos
const SEMANAS = AVALIA.filter((s) => s.semana && !s.destaque);
const COMPLETOS = AVALIA.filter((s) => s.destaque);
const TREINOS = AVALIA.filter((s) => !s.semana && !s.destaque);
const N_CONQUISTAS = CONFIG.conquistas.reduce((n, c) => n + (c.id === "especialista_tema" ? CONFIG.temas.length : 1), 0);
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
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
 * Página nova, sem as fontes externas (o teste não depende da internet), anotando erros.
 * Por padrão os simulados aparecem todos abertos (sem prazo e publicados), para os testes
 * não dependerem do dia de hoje nem do que o professor liberou; prazo: true usa os dados reais.
 */
async function abrir(largura = 390, altura = 844, { prazo = false } = {}) {
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura }, timezoneId: "America/Sao_Paulo" });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (!prazo) {
    const abrirTudo = (s) => { delete s.disponivel_ate; delete s.libera_em; s.status = "publicado"; return s; };
    await pagina.route(/\/data\/(catalogo|prova\/[^/]+)\.json/, async (rota) => {
      const resp = await rota.fetch();
      const d = await resp.json();
      if (d.areas) d.areas.forEach((a) => a.simulados.forEach(abrirTudo)); else abrirTudo(d);
      await rota.fulfill({ response: resp, json: d });
    });
  }
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR_FAILED/.test(m.text())) erros.push(m.text()); });
  return { pagina, erros };
}
/** Espera a tela da rota (sem o "#") terminar de desenhar. */
async function esperarRota(pagina, rota) {
  await pagina.waitForFunction((r) => document.body.dataset.rota === r, "/" + rota.replace(/^#?\//, ""));
}
async function ir(pagina, rota) {
  await pagina.goto(URL_BASE + "#/" + rota);
  await esperarRota(pagina, rota);
}
const larguraDaPagina = (p) => p.evaluate(() => document.documentElement.scrollWidth);

test("todas as telas abrem sem rolagem lateral e sem erro no console (celular e computador)", async () => {
  for (const [w, hgt] of [[360, 740], [390, 844], [1280, 900]]) {
    const { pagina, erros } = await abrir(w, hgt);
    for (const rota of ["", "avalia", "prova", "treinar", "perfil", "simulado/S07", "simulado/S07/3", "simulado/E3-AV2", "simulado/E3-AV2/10", "simulado/S07/revisao", "nao-existe"]) {
      await ir(pagina, rota);
      assert.equal(await larguraDaPagina(pagina), w, `rolagem lateral em #/${rota} com ${w}px`);
    }
    assert.deepEqual(erros, []);
    await pagina.close();
  }
});

test("Avalia mostra o simulado completo em destaque e as semanas; treinos ficam em Treinos; prova mostra a Etapa 3", async () => {
  const { pagina, erros } = await abrir();
  await ir(pagina, "avalia");
  // simulado completo em destaque, antes das semanas
  assert.equal(await pagina.$$eval(".lista-destaque .sim.destaque", (e) => e.length), COMPLETOS.length);
  assert.ok(COMPLETOS.length >= 1);
  // as 7 semanas (e as novas), da mais recente para a mais antiga
  const so = await pagina.$$eval("#lista-semanas .sim-titulo", (els) => els.map((e) => e.textContent.trim()));
  for (let k = 1; k <= 7; k++) assert.ok(so.includes(`Semana ${k}`), `faltou a Semana ${k}`);
  assert.deepEqual(so, [...so].sort((a, b) => Number(b.split(" ")[1]) - Number(a.split(" ")[1])));
  assert.equal(so.length, SEMANAS.length);
  // os treinos não aparecem no Avalia
  for (const t of TREINOS) assert.equal(!!(await pagina.$(`.sim[data-sim="${t.id}"]`)), false, `${t.id} não devia estar no Avalia`);
  await ir(pagina, "treinar");
  assert.equal(await pagina.$$eval("#lista-treinos .sim", (e) => e.length), TREINOS.length);
  assert.match(await pagina.textContent("#lista-treinos"), /Correção na hora/);
  await ir(pagina, "prova");
  assert.equal(await pagina.textContent(".etapa-titulo"), "Etapa 3");
  assert.match(await pagina.textContent(".sim h3"), /Etapa 3/);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("o painel leva às áreas e o filtro por tema funciona", async () => {
  const { pagina } = await abrir();
  await ir(pagina, "");
  assert.match(await pagina.textContent(".jogador"), /Iniciante/);
  await pagina.click(".area >> text=Simulados Avalia");
  await pagina.waitForSelector("#lista-semanas .sim");
  assert.equal(await pagina.$$eval("#lista-semanas .sim", (e) => e.length), SEMANAS.length);
  await pagina.click('button.chip[data-tema="Grandezas e medidas"]');
  const n = await pagina.$$eval("#lista-semanas .sim", (e) => e.length);
  const esperado = SEMANAS.filter((x) => x.habilidades.some((c) => HABILIDADES[c]?.tema === "Grandezas e medidas")).length;
  assert.ok(esperado > 0 && esperado < SEMANAS.length);
  assert.equal(n, esperado, `filtro Grandezas e medidas mostrou ${n}`);
  assert.equal(await pagina.getAttribute('button.chip[data-tema="Grandezas e medidas"]', "aria-pressed"), "true");
  await pagina.close();
});

test("versão nova de um simulado: gera, guarda e abre", async () => {
  const { pagina, erros } = await abrir();
  await ir(pagina, "avalia");
  await pagina.click('.sim[data-sim="S07"] [data-acao="versao-nova"]');
  await pagina.waitForFunction(() => /^\/simulado\/G-[^/]+$/.test(document.body.dataset.rota || ""));
  assert.match(await pagina.textContent("main h1"), /Semana 7 · versão de treino/);
  assert.equal(await pagina.$$eval(".lista-o-que-cai li", (e) => e.length) >= 6, true);
  const guardado = await pagina.evaluate(() => JSON.parse(localStorage.getItem("simulados-mat:v1")).gerados);
  assert.equal(guardado.length, 1);
  assert.equal(guardado[0].items.length, 6);
  assert.equal(guardado[0].gerado.base, "S07");
  // continua lá depois de recarregar
  await pagina.reload();
  await pagina.waitForFunction(() => /^\/simulado\/G-[^/]+$/.test(document.body.dataset.rota || ""));
  assert.match(await pagina.textContent("main h1"), /versão de treino/);
  assert.equal(await larguraDaPagina(pagina), 390);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("monte o seu treino: pede habilidade, gera com a quantidade escolhida e dá para apagar", async () => {
  const { pagina, erros } = await abrir();
  await ir(pagina, "treinar");
  await pagina.click('[data-acao="gerar-misto"]');
  assert.match(await pagina.textContent("#msg-misto"), /pelo menos uma habilidade/);
  await pagina.click("summary >> text=Geometria");
  await pagina.click('label.chip:has(input[value="D30"])');
  await pagina.click('label.chip:has(input[name="qtd"][value="8"])');
  await pagina.click('[data-acao="gerar-misto"]');
  await pagina.waitForFunction(() => /^\/simulado\/G-[^/]+$/.test(document.body.dataset.rota || ""));
  assert.equal(await pagina.$$eval(".lista-o-que-cai li", (e) => e.length) - 3, 8); // 3 itens de "Como funciona"
  await ir(pagina, "treinar");
  assert.equal(await pagina.$$eval(".gerado", (e) => e.length), 1);
  await pagina.click('[data-acao="apagar-gerado"]');
  assert.match(await pagina.textContent('[data-acao="apagar-gerado"]'), /Toque de novo/);
  await pagina.click('[data-acao="apagar-gerado"]');
  assert.equal(await pagina.$$eval(".gerado", (e) => e.length), 0);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("simulado: uma questão por tela, resposta salva a cada toque e continua depois de recarregar", async () => {
  const { pagina, erros } = await abrir();
  await ir(pagina, "simulado/S06");
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/S06/1");
  await pagina.click('.opcao[data-letra="B"]');
  assert.equal(await pagina.getAttribute('.opcao[data-letra="B"]', "aria-checked"), "true");
  await pagina.click("#proxima");
  await esperarRota(pagina, "simulado/S06/2");
  await pagina.click('.opcao[data-letra="C"]');
  await pagina.click("#proxima");
  await esperarRota(pagina, "simulado/S06/3");
  await pagina.reload();
  await pagina.waitForSelector(".questao");
  assert.match(await pagina.textContent("main h1"), /Questão 3/);
  // pelo painel também dá para continuar
  await ir(pagina, "");
  assert.match(await pagina.textContent(".continuar"), /2 questões respondidas/);
  await pagina.click(".continuar a");
  await esperarRota(pagina, "simulado/S06");
  assert.match(await pagina.textContent('[data-acao="comecar"]'), /Continuar da questão 3/);
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/S06/3");
  // voltar e trocar a resposta
  await pagina.click(".bolinha >> text=1");
  await esperarRota(pagina, "simulado/S06/1");
  assert.equal(await pagina.getAttribute('.opcao[data-letra="B"]', "aria-checked"), "true");
  await pagina.click('.opcao[data-letra="D"]');
  const salvo = await pagina.evaluate(() => JSON.parse(localStorage.getItem("simulados-mat:v1")).emAndamento.S06.respostas);
  assert.deepEqual(salvo, { 1: "D", 2: "C" });
  // a revisão mostra as em branco
  await ir(pagina, "simulado/S06/revisao");
  assert.match(await pagina.textContent("main"), /Ficaram 4 questões em branco/);
  assert.equal(await larguraDaPagina(pagina), 390);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("figura amplia com um toque e fecha com Esc", async () => {
  const { pagina } = await abrir();
  await ir(pagina, "simulado/S07/3");
  assert.ok(await pagina.getAttribute(".questao figure img", "alt"));
  await pagina.click(".questao figure");
  await pagina.waitForSelector(".zoom");
  await pagina.keyboard.press("Escape");
  assert.equal(!!(await pagina.$(".zoom")), false);
  await pagina.close();
});

test("as figuras de todas as questões carregam", async () => {
  const { pagina } = await abrir(1280, 900);
  const falhas = [];
  pagina.on("response", (r) => { if (r.url().includes("/assets/") && r.status() >= 400) falhas.push(r.url()); });
  for (const id of ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "E3-AV2"]) {
    const sim = JSON.parse(await readFile(join(RAIZ, id.startsWith("E") ? `data/prova/${id}.json` : `data/avalia/${id}.json`), "utf-8"));
    for (const it of sim.items.filter((i) => i.figure)) {
      await ir(pagina, `simulado/${id}/${it.n}`);
      const ok = await pagina.$eval(".questao figure img", (img) => img.complete || new Promise((r) => { img.onload = () => r(true); img.onerror = () => r(false); }))
        .then(() => pagina.$eval(".questao figure img", (img) => img.naturalWidth > 0));
      if (!ok) falhas.push(`${id} Q${it.n}`);
    }
  }
  assert.deepEqual(falhas, []);
  await pagina.close();
});

/** Responde o simulado inteiro (acertando as questões da lista) e entrega. */
async function fazerSimulado(pagina, id, certas, { conferirLargura = 0 } = {}) {
  const arq = id.startsWith("E") ? `data/prova/${id}.json` : id.startsWith("G-") ? null : `data/avalia/${id}.json`;
  const sim = arq ? JSON.parse(await readFile(join(RAIZ, arq), "utf-8"))
    : await pagina.evaluate((x) => JSON.parse(localStorage.getItem("simulados-mat:v1")).gerados.find((g) => g.id === x), id);
  await ir(pagina, `simulado/${id}`);
  await pagina.click('[data-acao="comecar"]');
  for (const it of sim.items) {
    await esperarRota(pagina, `simulado/${id}/${it.n}`);
    if (conferirLargura) assert.equal(await larguraDaPagina(pagina), conferirLargura, `rolagem lateral na questão ${it.n}`);
    const letra = certas === "todas" || certas.includes(it.n) ? it.key : it.options.find((o) => !o.correct).letter;
    await pagina.click(`.opcao[data-letra="${letra}"]`);
    await pagina.click("#proxima");
  }
  await esperarRota(pagina, `simulado/${id}/revisao`);
  await pagina.click('[data-acao="entregar"]');
  await esperarRota(pagina, `resultado/${id}`);
  // fecha o aviso de conquista nova, se aparecer
  if (await pagina.$(".conquista-capa")) await pagina.click(".conquista-capa .botao");
  return sim;
}

test("percurso completo no celular: painel, Avalia, S07, entregar e ver o resultado", async () => {
  const { pagina, erros } = await abrir(390, 844);
  await ir(pagina, "");
  assert.equal(await larguraDaPagina(pagina), 390);
  await pagina.click(".area >> text=Simulados Avalia");
  await esperarRota(pagina, "avalia");
  assert.equal(await larguraDaPagina(pagina), 390);
  await pagina.click('.sim[data-sim="S07"] .sim-titulo a');
  await esperarRota(pagina, "simulado/S07");
  assert.equal(await larguraDaPagina(pagina), 390);
  await fazerSimulado(pagina, "S07", [1, 2, 3, 4], { conferirLargura: 390 });
  assert.equal(await larguraDaPagina(pagina), 390);
  const texto = await pagina.textContent("main");
  assert.match(await pagina.getAttribute(".anel-texto b", "data-ate"), /^6\.7$/);
  assert.match(texto, /4 de 6/);
  assert.match(texto, /Adequado/);
  assert.match(texto, /Mandando bem/);
  assert.equal(await pagina.$$eval(".etiqueta.forte", (e) => e.length) > 0, true);
  assert.equal(await pagina.$$eval(".etiqueta.fraco", (e) => e.length), 2);
  assert.equal(await pagina.$$eval(".passo", (e) => e.length), 2);
  assert.match(await pagina.textContent(".falta"), /Acerte mais 2 questões para chegar ao Avançado/);
  // revisão comentada abre
  await pagina.click(".item-revisao.errou summary");
  assert.match(await pagina.textContent(".item-revisao.errou[open]"), /Resolução/);
  // o plano virou missão no painel e o simulado aparece como feito
  await ir(pagina, "");
  assert.equal(await pagina.$$eval(".missao input[type=checkbox]", (e) => e.length), 2);
  await ir(pagina, "avalia");
  assert.match(await pagina.textContent('.sim[data-sim="S07"] .estado'), /Nota 6,7/);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("simulado de prova: E3-AV2 todo certo dá 10,0, Avançado e Diamante", async () => {
  const { pagina, erros } = await abrir(390, 844);
  await fazerSimulado(pagina, "E3-AV2", "todas");
  const texto = await pagina.textContent("main");
  assert.equal(await pagina.getAttribute(".anel-texto b", "data-ate"), "10");
  assert.match(texto, /10 de 10/);
  assert.match(texto, /Avançado/);
  assert.match(texto, /Medalha Diamante/);
  assert.match(texto, /Você gabaritou/);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("gamificação: XP, nível e conquistas aparecem e continuam depois de recarregar", async () => {
  const { pagina, erros } = await abrir(390, 844);
  await ir(pagina, "simulado/S07");
  // entrega tudo certo: aparece o aviso de conquista (primeira missão, gabaritou, embalado)
  const sim = JSON.parse(await readFile(join(RAIZ, "data/avalia/S07.json"), "utf-8"));
  await pagina.click('[data-acao="comecar"]');
  for (const it of sim.items) {
    await esperarRota(pagina, `simulado/S07/${it.n}`);
    await pagina.click(`.opcao[data-letra="${it.key}"]`);
    await pagina.click("#proxima");
  }
  await esperarRota(pagina, "simulado/S07/revisao");
  await pagina.click('[data-acao="entregar"]');
  await esperarRota(pagina, "resultado/S07");
  assert.match(await pagina.textContent(".conquista-capa"), /Primeira missão/);
  assert.match(await pagina.textContent(".conquista-capa"), /Gabaritou/);
  await pagina.click(".conquista-capa .botao");
  assert.equal(!!(await pagina.$(".conquista-capa")), false);
  assert.equal(await pagina.getAttribute(".xp-ganho .contar", "data-ate"), "280");
  assert.match(await pagina.textContent(".placar-xp"), /Subiu para o nível 2/);
  // recarregando: XP e conquistas continuam, o aviso não volta
  await pagina.reload();
  await esperarRota(pagina, "resultado/S07");
  assert.equal(!!(await pagina.$(".conquista-capa")), false);
  await ir(pagina, "");
  assert.match(await pagina.textContent(".jogador"), /280 XP/);
  assert.equal(await pagina.textContent(".nivel-selo b"), "2");
  assert.match(await pagina.textContent(".jogador"), new RegExp(`3 de ${N_CONQUISTAS} conquistas`));
  assert.match(await pagina.textContent(".jogador"), /1 dia seguido/);
  // refazer igual não dá XP de novo
  await fazerSimulado(pagina, "S07", "todas");
  assert.equal(await pagina.getAttribute(".xp-ganho .contar", "data-ate"), "0");
  await ir(pagina, "");
  assert.match(await pagina.textContent(".jogador"), /280 XP/);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("modo treino: refaz só as erradas, corrige na hora e soma metade do XP, uma vez por questão", async () => {
  const { pagina, erros } = await abrir(390, 844);
  const sim = await fazerSimulado(pagina, "S07", [1, 2, 3, 4]); // erra 5 e 6 (N4)
  const xpAntes = await pagina.evaluate(() => JSON.parse(localStorage.getItem("simulados-mat:v1")).xp);
  await pagina.click("text=Refazer só as que errei");
  await esperarRota(pagina, "treino/S07");
  assert.match(await pagina.textContent("main h1"), /Questão 5/);
  assert.match(await pagina.textContent("main h1"), /1 de 2/);
  // acerta a 5: a correção aparece na hora, com metade do XP de uma questão N4 (40 × 0,5)
  await pagina.click(`.opcao[data-letra="${sim.items[4].key}"]`);
  await pagina.waitForSelector(".feedback.certo");
  assert.match(await pagina.textContent(".feedback"), /Acertou/);
  assert.match(await pagina.textContent(".feedback"), /\+20 XP/);
  assert.match(await pagina.textContent(".feedback"), /Resolução/);
  await pagina.click('[data-acao="treino-proxima"]');
  assert.match(await pagina.textContent("main h1"), /Questão 6/);
  // erra a 6: mostra o erro provável e a correta, sem XP
  await pagina.click(`.opcao[data-letra="${sim.items[5].options.find((o) => !o.correct).letter}"]`);
  await pagina.waitForSelector(".feedback.errado");
  assert.match(await pagina.textContent(".feedback"), /Erro provável/);
  await pagina.click('[data-acao="treino-proxima"]');
  assert.match(await pagina.textContent("main"), /Treino concluído/);
  assert.match(await pagina.textContent("main"), /1 de 2/);
  const depois = await pagina.evaluate(() => JSON.parse(localStorage.getItem("simulados-mat:v1")));
  assert.equal(depois.xp - xpAntes, 20);
  // a nota oficial não muda
  assert.equal(depois.tentativas.filter((t) => t.modo === "simulado").at(-1).nota, 6.7);
  // treinar de novo a mesma questão não dá XP outra vez
  await ir(pagina, "treino/S07/5");
  await pagina.click(`.opcao[data-letra="${sim.items[4].key}"]`);
  await pagina.waitForSelector(".feedback.certo");
  assert.doesNotMatch(await pagina.textContent(".feedback"), /XP/);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("perfil mostra conquistas, histórico e mapa; Apagar meus dados zera tudo", async () => {
  const { pagina, erros } = await abrir(390, 844);
  await fazerSimulado(pagina, "S01", [1, 2, 3]);
  await ir(pagina, "perfil");
  assert.equal(await larguraDaPagina(pagina), 390);
  assert.equal(await pagina.$$eval(".conquista", (e) => e.length), N_CONQUISTAS);
  assert.equal(await pagina.$$eval(".conquista.ganha", (e) => e.length), 1);
  assert.equal(await pagina.$$eval(".historico li", (e) => e.length), 1);
  assert.match(await pagina.textContent(".barras-tema"), /%/);
  await pagina.click('[data-acao="apagar"]');
  assert.match(await pagina.textContent("#apagar-area"), /Tem certeza/);
  await pagina.click('[data-acao="apagar-nao"]');
  assert.equal(!!(await pagina.$('[data-acao="apagar-sim"]')), false);
  await pagina.click('[data-acao="apagar"]');
  await pagina.click('[data-acao="apagar-sim"]');
  await pagina.waitForSelector("text=foram apagados");
  const guardado = await pagina.evaluate(() => localStorage.getItem("simulados-mat:v1"));
  assert.equal(guardado, null);
  await pagina.reload();
  await ir(pagina, "");
  assert.match(await pagina.textContent(".jogador"), /0 XP/);
  assert.match(await pagina.textContent(".jogador"), new RegExp(`0 de ${N_CONQUISTAS} conquistas`));
  await ir(pagina, "avalia");
  assert.match(await pagina.textContent('.sim[data-sim="S01"] .estado'), /Novo/);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("treino gerado: gerar uma versão nova do E3-AV2, fazer e ver o resultado com metade do XP", async () => {
  const { pagina, erros } = await abrir(390, 844);
  await ir(pagina, "simulado/E3-AV2");
  await pagina.click('[data-acao="versao-nova"]');
  await pagina.waitForFunction(() => /^\/simulado\/G-[^/]+$/.test(document.body.dataset.rota || ""));
  const id = (await pagina.evaluate(() => document.body.dataset.rota)).split("/").pop();
  await fazerSimulado(pagina, id, "todas", { conferirLargura: 390 });
  const texto = await pagina.textContent("main");
  assert.match(texto, /10 de 10/);
  assert.match(texto, /Medalha Diamante/);
  assert.match(texto, /metade do XP/);
  // a figura gerada aparece em SVG, com texto alternativo
  await pagina.click(".item-revisao:nth-child(6) summary");
  assert.ok(await pagina.$(".item-revisao:nth-child(6) [role=img][aria-label] svg"));
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("alvos de toque com pelo menos 44 px no celular", async () => {
  const { pagina } = await abrir(390, 844);
  const pequenos = [];
  for (const rota of ["", "avalia", "treinar", "perfil", "simulado/S07", "simulado/S07/1", "simulado/S07/revisao"]) {
    await ir(pagina, rota);
    const r = await pagina.$$eval(".botao, .chip, .opcao, .bolinha, .abas a, summary, .historico a", (els) =>
      els.filter((e) => e.offsetParent !== null).map((e) => ({ t: (e.textContent || e.className).trim().slice(0, 30), h: e.getBoundingClientRect().height })).filter((x) => x.h < 44));
    pequenos.push(...r.map((x) => `#/${rota}: ${x.t} (${Math.round(x.h)} px)`));
  }
  assert.deepEqual(pequenos, []);
  await pagina.close();
});

test("com movimento reduzido: sem confete e a nota já aparece pronta", async () => {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await fazerSimulado(pagina, "S07", "todas");
  assert.equal(!!(await pagina.$(".confete")), false);
  assert.equal((await pagina.textContent(".anel-texto b")).trim(), "10,0");
  await pagina.close();
});

/* ---------- prazo do simulado (disponivel_ate) ---------- */
const PRAZO = "2026-11-07T23:59:59-03:00";
async function abrirComPrazo(quando) {
  const r = await abrir(390, 844, { prazo: true });
  // o prazo de teste é fixo, para o teste valer em qualquer dia
  await r.pagina.route(/\/data\/(catalogo|prova\/E3-AV2)\.json/, async (rota) => {
    const resp = await rota.fetch();
    const d = await resp.json();
    const marcar = (s) => { if (s.id === "E3-AV2") { s.disponivel_ate = PRAZO; s.status = "publicado"; } };
    if (d.areas) d.areas.forEach((a) => a.simulados.forEach(marcar)); else marcar(d);
    await rota.fulfill({ response: resp, json: d });
  });
  await r.pagina.clock.setFixedTime(new Date(quando));
  return r;
}

test("prazo: antes das 23h59 o simulado de prova abre normalmente", async () => {
  const { pagina, erros } = await abrirComPrazo("2026-11-07T23:58:00-03:00");
  await ir(pagina, "prova");
  assert.doesNotMatch(await pagina.textContent('.sim[data-sim="E3-AV2"]'), /Encerrado/);
  // o reloginho mostra quando fecha e quanto falta
  const relogio = await pagina.textContent('.sim[data-sim="E3-AV2"] .reloginho');
  assert.match(relogio, /Fecha hoje às 23h59/);
  assert.match(relogio, /faltam 00:01:59/);
  assert.match(await pagina.getAttribute('.sim[data-sim="E3-AV2"] .reloginho', "class"), /urgente/);
  await ir(pagina, "");
  assert.match(await pagina.textContent(".prazo-aviso:not(.vai-abrir)"), /Fecha hoje às 23h59/);
  await ir(pagina, "simulado/E3-AV2");
  assert.match(await pagina.textContent("main h1"), /Etapa 3/);
  assert.match(await pagina.textContent(".abertura .reloginho"), /faltam/);
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/E3-AV2/1");
  assert.match(await pagina.textContent(".questao-topo .reloginho"), /faltam/);
  // os Avalia não têm prazo, então não têm reloginho
  await ir(pagina, "simulado/S07");
  assert.equal(!!(await pagina.$(".reloginho")), false);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("prazo: o reloginho conta e, quando zera, a questão aberta vira 'Simulado encerrado'", async () => {
  const { pagina, erros } = await abrirComPrazo("2026-11-07T20:00:00-03:00");
  await ir(pagina, "simulado/E3-AV2");
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/E3-AV2/1");
  assert.match(await pagina.textContent(".reloginho"), /faltam 03:59:59/);
  await pagina.clock.setFixedTime(new Date("2026-11-07T23:59:50-03:00"));
  await pagina.waitForFunction(() => /faltam 00:00:09/.test(document.querySelector(".reloginho")?.textContent || ""));
  assert.match(await pagina.getAttribute(".reloginho", "class"), /muito-urgente/);
  await pagina.clock.setFixedTime(new Date("2026-11-08T00:00:01-03:00"));
  await pagina.waitForSelector("text=Simulado encerrado");
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("prazo: depois das 23h59 o simulado, as versões novas e o treino ficam fechados; o resultado continua", async () => {
  const { pagina, erros } = await abrirComPrazo("2026-11-07T22:00:00-03:00");
  // antes do prazo: entrega o simulado, gera uma versão nova e começa outra tentativa
  await fazerSimulado(pagina, "E3-AV2", [1, 2, 3]);
  await ir(pagina, "simulado/E3-AV2");
  await pagina.click('[data-acao="versao-nova"]');
  await pagina.waitForFunction(() => /^\/simulado\/G-[^/]+$/.test(document.body.dataset.rota || ""));
  const idGerado = (await pagina.evaluate(() => document.body.dataset.rota)).split("/").pop();
  await ir(pagina, "simulado/E3-AV2");
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/E3-AV2/1");
  await pagina.click(".opcao >> nth=0");
  for (let n = 1; n <= 10; n++) {
    await pagina.click("#proxima");
    await esperarRota(pagina, n < 10 ? `simulado/E3-AV2/${n + 1}` : "simulado/E3-AV2/revisao");
  }
  // passa da meia-noite com a revisão aberta: entregar não vale mais
  await pagina.clock.setFixedTime(new Date("2026-11-08T00:00:30-03:00"));
  await pagina.click('[data-acao="entregar"]');
  if (await pagina.$('[data-acao="entregar"]')) await pagina.click('[data-acao="entregar"]');
  await pagina.waitForSelector("text=Simulado encerrado");
  const tentativas = await pagina.evaluate(() => JSON.parse(localStorage.getItem("simulados-mat:v1")).tentativas.length);
  assert.equal(tentativas, 1, "a entrega depois do prazo não pode contar");
  // cartão, abertura, questão, revisão, treino e versão gerada fechados
  await ir(pagina, "prova");
  assert.match(await pagina.textContent('.sim[data-sim="E3-AV2"]'), /Encerrado/);
  assert.equal(!!(await pagina.$('.sim[data-sim="E3-AV2"] a, .sim[data-sim="E3-AV2"] button')), false);
  for (const rota of ["simulado/E3-AV2", "simulado/E3-AV2/3", "simulado/E3-AV2/revisao", "treino/E3-AV2", "treino/E3-AV2/2", `simulado/${idGerado}`]) {
    await ir(pagina, rota);
    assert.match(await pagina.textContent("main h1"), /Simulado encerrado/, `#/${rota} deveria estar fechado`);
  }
  // o painel não oferece continuar, e o gerador não usa os modelos da prova
  await ir(pagina, "");
  assert.equal(!!(await pagina.$(".continuar")), false);
  await ir(pagina, "treinar");
  assert.equal(!!(await pagina.$('#sel-base option[value="E3-AV2"]')), false);
  assert.equal(!!(await pagina.$('input[data-acao="hab"][value^="EF.09"]')), false);
  assert.match(await pagina.textContent(".gerados"), /Encerrado/);
  // o resultado continua visível, sem refazer nem treinar
  await ir(pagina, "resultado/E3-AV2");
  assert.match(await pagina.textContent("main"), /3 de 10/);
  assert.match(await pagina.textContent("main"), /está encerrado/);
  assert.equal(!!(await pagina.$('a[href^="#/treino/"]')), false);
  assert.equal(!!(await pagina.$('[data-acao="treinar-hab"]')), false);
  // os Simulados Avalia continuam abertos
  await ir(pagina, "simulado/S07");
  assert.ok(await pagina.$('[data-acao="comecar"]'));
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("treino do professor (T1) no site principal: correção na hora e resposta travada", async () => {
  const { pagina, erros } = await abrir();
  const T1 = JSON.parse(await readFile(join(RAIZ, "data/avalia/T1.json"), "utf-8"));
  await ir(pagina, "simulado/T1");
  assert.match(await pagina.textContent("main"), /você já vê se acertou/);
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/T1/1");
  const errada = T1.items[0].options.find((o) => !o.correct).letter;
  await pagina.click(`.opcao[data-letra="${errada}"]`);
  await pagina.waitForSelector(".feedback.errado");
  assert.match(await pagina.textContent(".feedback"), /Erro provável/);
  assert.ok(await pagina.$(".opcao.correta"));
  assert.ok(await pagina.$(".opcao[disabled]"));
  // continua salvo depois de recarregar
  await pagina.reload();
  await esperarRota(pagina, "simulado/T1/1");
  assert.ok(await pagina.$(".feedback.errado"));
  assert.equal(await larguraDaPagina(pagina), 390);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("tema claro é o padrão, mesmo com o aparelho no escuro; o aluno escolhe o escuro e ele fica", async () => {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const fundo = () => pagina.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await ir(pagina, "");
  assert.equal(await pagina.getAttribute("html", "data-theme"), "light");
  const claro = await fundo();
  // botão do topo
  await pagina.click("#botao-tema");
  assert.equal(await pagina.getAttribute("html", "data-theme"), "dark");
  assert.notEqual(await fundo(), claro);
  assert.equal(await pagina.getAttribute("#botao-tema", "aria-pressed"), "true");
  await pagina.reload();
  await esperarRota(pagina, "");
  assert.equal(await pagina.getAttribute("html", "data-theme"), "dark");
  // no Perfil, Claro volta
  await ir(pagina, "perfil");
  assert.equal(await pagina.isChecked('input[name="tema"][value="dark"]'), true);
  await pagina.click('label.chip:has(input[name="tema"][value="light"])');
  assert.equal(await pagina.getAttribute("html", "data-theme"), "light");
  // as páginas de aula ficam no claro
  await pagina.goto(URL_BASE + "simulado.html?id=T1");
  await pagina.waitForFunction(() => document.body.dataset.tela);
  assert.equal(await fundo(), claro);
  await pagina.close();
});

test("versão publicada mais nova: o site recarrega sozinho uma vez; com a página aberta, mostra o aviso", async () => {
  const { pagina, erros } = await abrir();
  let publicada = null; // null: responde a versão de verdade
  await pagina.route(/\/versao\.json/, async (rota) => {
    if (!publicada) return rota.continue();
    await rota.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ versao: publicada }) });
  });
  let carregamentos = 0;
  pagina.on("load", () => carregamentos++);
  // versão em dia: carrega uma vez só
  await ir(pagina, "");
  assert.equal(carregamentos, 1);
  // saiu versão nova antes de abrir: recarrega sozinho uma vez e não fica em laço
  publicada = "versao-nova-de-teste";
  carregamentos = 0;
  await pagina.reload();
  await pagina.waitForSelector("#aviso-versao");
  assert.equal(carregamentos, 2, "devia recarregar uma vez, sozinho");
  // como o arquivo continuou velho (no teste), mostra o aviso com o botão Atualizar
  assert.match(await pagina.textContent("#aviso-versao"), /versão nova/);
  assert.equal(await larguraDaPagina(pagina), 390);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("carimbos de versão em dia (python3 tools/carimbar_versao.py --conferir)", () => {
  const saida = execFileSync("python3", [join(RAIZ, "tools/carimbar_versao.py"), "--conferir"], { encoding: "utf-8" });
  assert.match(saida, /carimbos em dia/);
});

test("liberação marcada (libera_em): antes das 7h o Simulado Completo mostra quando abre; às 7h abre sozinho", async () => {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, timezoneId: "America/Sao_Paulo" });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  // a liberação de teste é fixa, para o teste valer em qualquer dia
  await pagina.route(/\/data\/(catalogo|avalia\/E3-COMPLETO)\.json/, async (rota) => {
    const resp = await rota.fetch();
    const d = await resp.json();
    const marcar = (x) => { if (x.id === "E3-COMPLETO") { x.status = "publicado"; x.libera_em = "2026-11-10T07:00:00-03:00"; } };
    if (d.areas) d.areas.forEach((a) => a.simulados.forEach(marcar)); else marcar(d);
    await rota.fulfill({ response: resp, json: d });
  });
  await pagina.clock.setFixedTime(new Date("2026-11-08T18:00:00-03:00"));
  await ir(pagina, "avalia");
  const cartao = '.sim[data-sim="E3-COMPLETO"]';
  assert.match(await pagina.textContent(cartao), /Em breve/);
  assert.match(await pagina.textContent(`${cartao} .reloginho`), /Abre na terça \(10\/11\) às 07h00/);
  assert.equal(!!(await pagina.$(`${cartao} a`)), false);
  await ir(pagina, "");
  assert.match(await pagina.textContent(".vai-abrir"), /Abre na terça/);
  // pelo link direto, não abre antes da hora
  await ir(pagina, "simulado/E3-COMPLETO");
  assert.match(await pagina.textContent("main"), /Ainda não liberado/);
  assert.match(await pagina.textContent("main"), /Abre na terça \(10\/11\) às 07h00/);
  // com a página aberta, às 07h00 ela abre sozinha
  await pagina.clock.setFixedTime(new Date("2026-11-10T06:59:58-03:00"));
  await pagina.clock.setFixedTime(new Date("2026-11-10T07:00:01-03:00"));
  await pagina.waitForSelector('[data-acao="comecar"]');
  assert.match(await pagina.textContent("main h1"), /Simulado Completo/);
  await ir(pagina, "avalia");
  assert.ok(await pagina.$(`${cartao} a[href="#/simulado/E3-COMPLETO"]`));
  assert.equal(await larguraDaPagina(pagina), 390);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("Simulado Completo no site: 20 da etapa certas e 8 de conexão erradas dão 7,1, etapa 10,0 e conexão 0,0; plano de 3 dias em 15/11; conquistas", async () => {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, timezoneId: "America/Sao_Paulo" });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await pagina.route(/\/data\/(catalogo|avalia\/E3-COMPLETO)\.json/, async (rota) => {
    const resp = await rota.fetch();
    const d = await resp.json();
    const abrir = (x) => { if (x.id === "E3-COMPLETO") { x.status = "publicado"; delete x.libera_em; delete x.disponivel_ate; } };
    if (d.areas) d.areas.forEach((a) => a.simulados.forEach(abrir)); else abrir(d);
    await rota.fulfill({ response: resp, json: d });
  });
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.clock.setFixedTime(new Date("2026-11-15T10:00:00-03:00"));
  const sim = JSON.parse(await readFile(join(RAIZ, "data/avalia/E3-COMPLETO.json"), "utf-8"));
  await ir(pagina, "simulado/E3-COMPLETO");
  await pagina.click('[data-acao="comecar"]');
  await esperarRota(pagina, "simulado/E3-COMPLETO/1");
  // cronômetro visível, com pausa
  assert.match(await pagina.textContent(".cronometro"), /de 1:30:00/);
  await pagina.click('[data-acao="pausar"]');
  await pagina.waitForSelector(".pausa-aviso");
  assert.equal(await pagina.isVisible(".questao"), false, "a questão some durante a pausa");
  await pagina.click('[data-acao="continuar-cronometro"]');
  await pagina.waitForSelector(".questao");
  // grade de 1 a 28
  assert.equal(await pagina.$$eval(".bolinha", (e) => e.length), 28);
  for (const it of sim.items) {
    await esperarRota(pagina, `simulado/E3-COMPLETO/${it.n}`);
    const letra = it.code.startsWith("D") ? it.key : it.options.find((o) => !o.correct).letter;
    await pagina.click(`.opcao[data-letra="${letra}"]`);
    await pagina.click("#proxima");
  }
  await esperarRota(pagina, "simulado/E3-COMPLETO/revisao");
  await pagina.click('[data-acao="entregar"]');
  await esperarRota(pagina, "resultado/E3-COMPLETO");
  assert.match(await pagina.textContent(".conquista-capa"), /Simulado completo/);
  assert.match(await pagina.textContent(".conquista-capa"), /Pronto para o Avalia\+/);
  await pagina.click(".conquista-capa .botao");
  assert.equal(await pagina.getAttribute(".anel-texto b", "data-ate"), "7.1");
  assert.equal((await pagina.textContent(".nota-etapa")).trim(), "10,0");
  assert.equal((await pagina.textContent(".nota-conexao")).trim(), "0,0");
  assert.match(await pagina.textContent("#t-temas"), /Por eixo/);
  assert.match(await pagina.textContent(".barras-tema"), /9 de 9|de 9/);
  // plano até a prova (18/11): de 15/11 são 3 dias
  assert.equal(await pagina.$$eval(".plano-prova > li", (e) => e.length), 3);
  assert.match(await pagina.textContent(".plano-prova"), /Hoje/);
  assert.ok(await pagina.$('.plano-prova a.botao'), "cada dia tem o botão Treinar");
  assert.equal(await larguraDaPagina(pagina), 390);
  // depois da prova, o plano some
  await pagina.clock.setFixedTime(new Date("2026-11-19T10:00:00-03:00"));
  await pagina.reload();
  await esperarRota(pagina, "resultado/E3-COMPLETO");
  assert.equal(!!(await pagina.$(".plano-prova")), false);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("o apelido fica guardado e aparece no painel", async () => {
  const { pagina } = await abrir();
  await ir(pagina, "perfil");
  await pagina.fill("#apelido", "Fera");
  await pagina.click("#form-apelido button");
  await pagina.reload();
  await ir(pagina, "");
  assert.equal(await pagina.textContent("main h1"), "Oi, Fera!");
  await pagina.close();
});

test("sem localStorage o site funciona e avisa", async () => {
  const { pagina, erros } = await abrir();
  await pagina.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("bloqueado"); } });
  });
  await ir(pagina, "");
  assert.equal(await pagina.isVisible("#aviso-armazenamento"), true);
  await ir(pagina, "avalia");
  assert.equal(await pagina.$$eval(".sim", (e) => e.length), SEMANAS.length + COMPLETOS.length);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("a prévia do gerador para o professor abre todos os modelos sem erro", async () => {
  const { pagina, erros } = await abrir(1280, 900);
  await pagina.goto(URL_BASE + "tools/ver_gerador.html?sim=todos&semente=7");
  await pagina.waitForSelector(".modelo");
  const { MODELOS } = await import("../js/gerador/index.js");
  assert.equal(await pagina.$$eval(".modelo", (e) => e.length), MODELOS.length); // um por questão com modelo (Avalia e prova)
  assert.ok(MODELOS.length >= 60);
  assert.deepEqual(erros, []);
  await pagina.close();
});
