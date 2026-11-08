// Listas de simulados: Avalia (#/avalia: simulado completo e semanas) e de prova (#/prova).
import { h, plural } from "./util.js?v=42dba01b94";
import { icone } from "./icones.js?v=42dba01b94";
import { cartaoSimulado } from "./componentes.js?v=42dba01b94";
import { simuladosDoCatalogo, tipoDoSimulado } from "./dados.js?v=42dba01b94";

let temaEscolhido = "Todos";

export function telaAvalia(ctx) {
  const { catalogo, config, habilidades } = ctx.base;
  const doAvalia = simuladosDoCatalogo(catalogo, "avalia");
  const completos = doAvalia.filter((s) => tipoDoSimulado(s) === "completo");
  const semanas = doAvalia.filter((s) => tipoDoSimulado(s) === "semana").sort((a, b) => (b.semana || 0) - (a.semana || 0));
  const temas = ["Todos", ...config.temas];
  if (!temas.includes(temaEscolhido)) temaEscolhido = "Todos";
  const lista = temaEscolhido === "Todos" ? semanas : semanas.filter((s) => s.habilidades.some((c) => habilidades[c]?.tema === temaEscolhido));
  const cartao = (s, extra = {}) => cartaoSimulado(s, { estado: ctx.estado, config, habilidades, nivelTitulo: 3, ...extra });
  return {
    titulo: "Simulados Avalia",
    html: h`
    <h1>Simulados Avalia</h1>
    <p class="sub">O simulado completo, no formato do Avalia+, e um simulado por semana, com as habilidades da etapa.</p>
    ${completos.length ? h`
    <section class="secao" aria-labelledby="t-completo">
      <h2 class="etapa-titulo" id="t-completo">${icone.trofeu}Simulado completo</h2>
      <div class="lista-destaque">${completos.map((s) => cartao(s, { destaque: true }))}</div>
    </section>` : ""}
    <section class="secao" aria-labelledby="t-semanas">
      <h2 class="etapa-titulo" id="t-semanas">${icone.avalia}Semanas</h2>
      <div class="filtros" role="group" aria-label="Filtrar as semanas por tema">
        <div class="chips">${temas.map((t) => h`<button type="button" class="chip" data-acao="tema" data-tema="${t}" aria-pressed="${t === temaEscolhido}">${t}</button>`)}</div>
      </div>
      <p class="sub pequeno" aria-live="polite">${lista.length === semanas.length ? plural(semanas.length, "semana", "semanas") : `${lista.length} de ${semanas.length} semanas com ${temaEscolhido}`}</p>
      ${lista.length
        ? h`<div class="lista-sim" id="lista-semanas">${lista.map((s) => cartao(s))}</div>`
        : h`<div class="cartao vazio"><p>Nenhuma semana com esse tema por enquanto.</p></div>`}
    </section>`,
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
