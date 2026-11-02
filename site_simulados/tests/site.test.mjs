// Testes de ponta a ponta do site (Playwright, Chromium):
//   node --test tests/
// Sobem um servidor local na raiz do site e abrem as telas no celular e no computador.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = await import("playwright")); }

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
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

/** Página nova, sem as fontes externas (o teste não depende da internet), anotando erros. */
async function abrir(largura = 390, altura = 844) {
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR_FAILED/.test(m.text())) erros.push(m.text()); });
  return { pagina, erros };
}
async function ir(pagina, rota) {
  await pagina.goto(URL_BASE + "#/" + rota);
  await pagina.waitForSelector("main h1");
}
const larguraDaPagina = (p) => p.evaluate(() => document.documentElement.scrollWidth);

test("todas as telas abrem sem rolagem lateral e sem erro no console (celular e computador)", async () => {
  for (const [w, hgt] of [[360, 740], [390, 844], [1280, 900]]) {
    const { pagina, erros } = await abrir(w, hgt);
    for (const rota of ["", "avalia", "prova", "treinar", "perfil", "simulado/S07", "simulado/E3-AV2", "nao-existe"]) {
      await ir(pagina, rota);
      assert.equal(await larguraDaPagina(pagina), w, `rolagem lateral em #/${rota} com ${w}px`);
    }
    assert.deepEqual(erros, []);
    await pagina.close();
  }
});

test("as duas áreas mostram os 7 Avalia e o simulado da Etapa 3", async () => {
  const { pagina, erros } = await abrir();
  await ir(pagina, "avalia");
  const semanas = await pagina.$$eval(".sim h3", (els) => els.map((e) => e.textContent.trim()));
  assert.deepEqual(semanas, ["Semana 7", "Semana 6", "Semana 5", "Semana 4", "Semana 3", "Semana 2", "Semana 1"]);
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
  await pagina.waitForSelector(".sim");
  assert.equal(await pagina.$$eval(".sim", (e) => e.length), 7);
  await pagina.click('button.chip[data-tema="Grandezas e medidas"]');
  const n = await pagina.$$eval(".sim", (e) => e.length);
  assert.equal(n, 2, `filtro Grandezas e medidas mostrou ${n}`); // Semanas 6 e 7
  assert.equal(await pagina.getAttribute('button.chip[data-tema="Grandezas e medidas"]', "aria-pressed"), "true");
  await pagina.close();
});

test("versão nova de um simulado: gera, guarda e abre", async () => {
  const { pagina, erros } = await abrir();
  await ir(pagina, "avalia");
  await pagina.click('.sim[data-sim="S07"] [data-acao="versao-nova"]');
  await pagina.waitForURL(/#\/simulado\/G-/);
  await pagina.waitForSelector("main h1");
  assert.match(await pagina.textContent("main h1"), /Semana 7 · versão de treino/);
  assert.equal(await pagina.$$eval(".lista-o-que-cai li", (e) => e.length) >= 6, true);
  const guardado = await pagina.evaluate(() => JSON.parse(localStorage.getItem("simulados-mat:v1")).gerados);
  assert.equal(guardado.length, 1);
  assert.equal(guardado[0].items.length, 6);
  assert.equal(guardado[0].gerado.base, "S07");
  // continua lá depois de recarregar
  await pagina.reload();
  await pagina.waitForSelector("main h1");
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
  await pagina.waitForURL(/#\/simulado\/G-/);
  await pagina.waitForSelector("main h1");
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
  assert.equal(await pagina.$$eval(".sim", (e) => e.length), 7);
  assert.deepEqual(erros, []);
  await pagina.close();
});

test("a prévia do gerador para o professor abre todos os modelos sem erro", async () => {
  const { pagina, erros } = await abrir(1280, 900);
  await pagina.goto(URL_BASE + "tools/ver_gerador.html?sim=todos&semente=7");
  await pagina.waitForSelector(".modelo");
  assert.equal(await pagina.$$eval(".modelo", (e) => e.length), 50); // 40 do Avalia + 10 da prova
  assert.deepEqual(erros, []);
  await pagina.close();
});
