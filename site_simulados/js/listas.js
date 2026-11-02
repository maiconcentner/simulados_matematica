// Listas de simulados: Avalia (#/avalia) e de prova (#/prova).
import { h } from "./util.js";
import { cartaoSimulado } from "./componentes.js";
import { simuladosDoCatalogo } from "./dados.js";

let temaEscolhido = "Todos";

export function telaAvalia(ctx) {
  const { catalogo, config, habilidades } = ctx.base;
  const area = catalogo.areas.find((a) => a.id === "avalia");
  const todos = simuladosDoCatalogo(catalogo, "avalia").sort((a, b) => (b.semana || 0) - (a.semana || 0));
  const temas = ["Todos", ...config.temas];
  if (!temas.includes(temaEscolhido)) temaEscolhido = "Todos";
  const lista = temaEscolhido === "Todos" ? todos : todos.filter((s) => s.habilidades.some((c) => habilidades[c]?.tema === temaEscolhido));
  return {
    titulo: "Simulados Avalia",
    html: h`
    <div class="cabecalho-lista">
      <div><h1>Simulados Avalia</h1><p class="sub">${area?.descricao || ""}</p></div>
    </div>
    <div class="filtros" role="group" aria-label="Filtrar por tema">
      <div class="chips">${temas.map((t) => h`<button type="button" class="chip" data-acao="tema" data-tema="${t}" aria-pressed="${t === temaEscolhido}">${t}</button>`)}</div>
    </div>
    <p class="sub pequeno" aria-live="polite">${lista.length === todos.length ? `${todos.length} simulados` : `${lista.length} de ${todos.length} simulados com ${temaEscolhido}`}</p>
    ${lista.length
      ? h`<div class="lista-sim">${lista.map((s) => cartaoSimulado(s, { estado: ctx.estado, config, habilidades }))}</div>`
      : h`<div class="cartao vazio"><p>Nenhum simulado com esse tema por enquanto.</p></div>`}`,
    eventos: {
      tema: (el) => {
        temaEscolhido = el.dataset.tema;
        ctx.redesenhar({ manterFoco: `[data-tema="${temaEscolhido}"]` });
      },
    },
  };
}

export function telaProva(ctx) {
  const { catalogo, config, habilidades } = ctx.base;
  const area = catalogo.areas.find((a) => a.id === "prova");
  const todos = simuladosDoCatalogo(catalogo, "prova");
  const etapas = [...new Set(todos.map((s) => s.etapa))].sort((a, b) => b - a);
  return {
    titulo: "Simulados de prova",
    html: h`
    <h1>Simulados de prova</h1>
    <p class="sub">${area?.descricao || ""}</p>
    ${etapas.length ? etapas.map((et) => h`
      <section aria-labelledby="etapa-${et}">
        <h2 class="etapa-titulo" id="etapa-${et}">Etapa ${et}</h2>
        <div class="lista-sim">${todos.filter((s) => s.etapa === et).map((s) => cartaoSimulado(s, { estado: ctx.estado, config, habilidades, nivelTitulo: 3 }))}</div>
      </section>`)
    : h`<div class="cartao vazio"><p>Nenhum simulado de prova publicado ainda.</p></div>`}`,
  };
}
