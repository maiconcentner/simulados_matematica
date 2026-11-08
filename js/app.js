// Inicialização e rotas do site (navegação por hash, que funciona no GitHub Pages).
import { h, esc } from "./util.js?v=42dba01b94";
import { icone } from "./icones.js?v=42dba01b94";
import { carregarBase, carregarSimulado, bloqueio } from "./dados.js?v=42dba01b94";
import { ler, atualizar, armazenamentoDisponivel, guardarGerado } from "./armazenamento.js?v=42dba01b94";
import { aplicarTema, temaEfetivo } from "./tema.js?v=42dba01b94";
import { iniciarRelogios } from "./prazo.js?v=42dba01b94";
import { conferirVersao } from "./atualizacao.js?v=42dba01b94";
import { gerarVersao } from "./gerador/index.js?v=42dba01b94";
import { telaPainel } from "./painel.js?v=42dba01b94";
import { telaAvalia, telaProva } from "./listas.js?v=42dba01b94";
import { telaTreinar } from "./treinar.js?v=42dba01b94";
import { telaSimulado } from "./simulado.js?v=42dba01b94";
import { telaPerfil } from "./perfil.js?v=42dba01b94";
import { telaResultado, marcarEntregaRecente } from "./resultado.js?v=42dba01b94";
import { entregarSimulado } from "./entrega.js?v=42dba01b94";
import { telaTreino } from "./treino.js?v=42dba01b94";

const raiz = document.getElementById("app");
const menu = document.getElementById("menu");

const ITENS = [
  ["painel", "#/", icone.painel, "Painel"],
  ["avalia", "#/avalia", icone.avalia, "Avalia"],
  ["prova", "#/prova", icone.prova, "Prova"],
  ["treinar", "#/treinar", icone.dado, "Treinos"],
  ["perfil", "#/perfil", icone.perfil, "Perfil"],
];

const ROTAS = [
  [/^\/?$/, "painel", (ctx) => telaPainel(ctx)],
  [/^\/avalia\/?$/, "avalia", (ctx) => telaAvalia(ctx)],
  [/^\/prova\/?$/, "prova", (ctx) => telaProva(ctx)],
  [/^\/treinar\/?$/, "treinar", (ctx) => telaTreinar(ctx)],
  [/^\/perfil\/?$/, "perfil", (ctx) => telaPerfil(ctx)],
  [/^\/simulado\/([^/?]+)(?:\/(\d+|revisao))?\/?$/, null, (ctx, id, parte) => telaSimulado(ctx, decodeURIComponent(id), parte)],
  [/^\/resultado\/([^/?]+)\/?$/, null, (ctx, id) => telaResultado(ctx, decodeURIComponent(id))],
  [/^\/treino\/([^/?]+)(?:\/(\d+))?\/?$/, null, (ctx, id, n) => telaTreino(ctx, decodeURIComponent(id), n)],
];

let base = null;
let telaAtual = null;
let primeira = true;

function desenharMenu(ativo) {
  menu.innerHTML = ITENS.map(([id, href, ic, rot]) =>
    `<a href="${href}"${id === ativo ? ' aria-current="page"' : ""}>${ic}<span>${esc(rot)}</span></a>`).join("");
}

/** Item do menu que fica marcado numa página de simulado. */
function areaDoSimulado(id) {
  if (id.startsWith("G-")) return "treinar";
  for (const a of base.catalogo.areas) if (a.simulados.some((s) => s.id === id)) return a.id;
  return null;
}

function erroHTML(msg) {
  return h`<div class="cartao vazio"><h1>Ops!</h1><p>${msg}</p><p><a class="botao" href="#/">Voltar ao painel</a></p></div>`.html;
}

/** Tela de simulado fechado (prazo acabou ou ainda não liberado). */
function telaFechado(s) {
  const titulo = s.semana ? `Semana ${s.semana}` : s.titulo;
  const acabou = !!s.disponivel_ate && Date.now() > Date.parse(s.disponivel_ate);
  return {
    titulo: acabou ? "Simulado encerrado" : "Simulado fechado",
    html: h`<div class="cartao vazio abertura">${icone.relogio}
      <h1>${acabou ? "Simulado encerrado" : "Ainda não liberado"}</h1>
      <p><strong>${titulo}</strong></p>
      <p>${acabou ? "O prazo para fazer este simulado acabou. Ele volta quando o professor liberar." : "Este simulado ainda não foi liberado pelo professor."}</p>
      <p><a class="botao" href="#/">Voltar ao painel</a></p>
    </div>`.html,
  };
}

async function gerarVersaoNova(simId) {
  if (bloqueio(base.catalogo, ler(), simId)) {
    location.hash = `#/simulado/${simId}`;
    return;
  }
  try {
    const original = await carregarSimulado(base.catalogo, simId);
    const sim = gerarVersao(original);
    guardarGerado(sim);
    location.hash = `#/simulado/${sim.id}`;
  } catch (e) {
    console.warn(e);
    raiz.insertAdjacentHTML("afterbegin", erroHTML("Não deu para gerar a versão nova agora. Tente de novo."));
  }
}

/** Entrega o simulado: corrige, guarda e abre o resultado. */
function entregar(sim) {
  if (bloqueio(base.catalogo, ler(), sim.id)) {
    desenhar();
    return;
  }
  entregarSimulado(sim, base);
  marcarEntregaRecente(sim.id);
  location.hash = `#/resultado/${sim.id}`;
}

async function desenhar({ manterFoco = null } = {}) {
  const caminho = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  const rota = ROTAS.find(([re]) => re.test(caminho));
  if (telaAtual?.aoSair && !manterFoco) telaAtual.aoSair();
  const ctx = { base, estado: ler(), redesenhar: (o) => desenhar(o), gerarVersaoNova, entregar };
  let tela;
  let ativo = null;
  try {
    if (!rota) {
      tela = { titulo: "Página não encontrada", html: erroHTML("Essa página não existe.") };
    } else {
      const [re, area, fn] = rota;
      const params = caminho.match(re).slice(1);
      ativo = area || areaDoSimulado(decodeURIComponent(params[0] || ""));
      // simulado fechado: não abre, não continua, não treina (o resultado continua visível)
      const fechado = /^\/(simulado|treino)\//.test(caminho) ? bloqueio(base.catalogo, ctx.estado, decodeURIComponent(params[0])) : null;
      tela = fechado ? telaFechado(fechado) : await fn(ctx, ...params);
    }
  } catch (e) {
    console.warn(e);
    tela = { titulo: "Ops", html: erroHTML(e.message || "Algo deu errado ao abrir esta página.") };
  }
  telaAtual = tela;
  desenharMenu(ativo);
  raiz.innerHTML = String(tela.html);
  document.title = `${tela.titulo} · Simulados de Matemática`;
  tela.depois?.();
  if (manterFoco) {
    raiz.querySelector(manterFoco)?.focus();
  } else if (!primeira) {
    window.scrollTo(0, 0);
    const h1 = raiz.querySelector("h1");
    if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
  }
  primeira = false;
  // marca a rota já desenhada (ajuda os testes a saber quando a tela está pronta)
  document.body.dataset.rota = caminho;
}

// Um ouvinte só para as ações de todas as telas (data-acao="...").
function acao(ev) {
  const el = ev.target.closest("[data-acao]");
  if (!el || !raiz.contains(el)) return;
  // caixas e opções agem no "change"; botões no "click"
  const ehCampo = el.tagName === "INPUT";
  if ((ev.type === "change") !== ehCampo) return;
  const nome = el.dataset.acao;
  if (telaAtual?.eventos?.[nome]) {
    if (el.tagName === "BUTTON") ev.preventDefault();
    telaAtual.eventos[nome](el, ev);
  } else if (nome === "versao-nova") {
    el.disabled = true;
    gerarVersaoNova(el.dataset.id);
  } else if (nome === "missao") {
    atualizar((e) => { if (e.missao?.passos?.[el.dataset.i]) e.missao.passos[el.dataset.i].feito = el.checked; });
  }
}

function ligarBotaoTema() {
  const botao = document.getElementById("botao-tema");
  if (!botao) return;
  const desenharBotao = () => { botao.innerHTML = String(temaEfetivo(ler().perfil.tema) === "dark" ? icone.sol : icone.lua); };
  botao.addEventListener("click", () => {
    const novo = temaEfetivo(ler().perfil.tema) === "dark" ? "light" : "dark";
    atualizar((e) => { e.perfil.tema = novo; });
    aplicarTema(novo);
    desenharBotao();
    // se o Perfil estiver aberto, a escolha lá acompanha
    const radio = document.querySelector(`input[name="tema"][value="${novo}"]`);
    if (radio) radio.checked = true;
  });
  desenharBotao();
  window.addEventListener("tema-mudou", desenharBotao);
}

async function iniciar() {
  if (await conferirVersao()) return; // recarregando com a versão nova
  aplicarTema(ler().perfil.tema);
  ligarBotaoTema();
  if (!armazenamentoDisponivel()) {
    const aviso = document.getElementById("aviso-armazenamento");
    aviso.textContent = "Este navegador não deixa guardar dados. Dá para usar o site normalmente, mas o seu progresso não vai ficar salvo.";
    aviso.hidden = false;
  }
  try {
    base = await carregarBase();
  } catch (e) {
    console.warn(e);
    raiz.innerHTML = erroHTML("Não consegui carregar os simulados. Confira a internet e recarregue a página.");
    return;
  }
  raiz.addEventListener("click", acao);
  raiz.addEventListener("change", acao);
  window.addEventListener("hashchange", () => desenhar());
  // quando um prazo acaba com a página aberta, redesenha (o simulado aparece encerrado)
  iniciarRelogios(() => desenhar());
  await desenhar();
}

iniciar();
