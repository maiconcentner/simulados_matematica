// Simulado: abertura (#/simulado/<id>), uma questão por tela (#/simulado/<id>/<n>)
// e revisão antes de entregar (#/simulado/<id>/revisao).
// As respostas são salvas a cada toque em emAndamento, para continuar depois.
import { h, cru, plural, nota1 } from "./util.js?v=f5446e8815";
import { icone } from "./icones.js?v=f5446e8815";
import { carregarSimulado, idsIndisponiveis, prazoDe } from "./dados.js?v=f5446e8815";
import { reloginho } from "./prazo.js?v=f5446e8815";
import { gerarMisto } from "./gerador/index.js?v=f5446e8815";
import { guardarGerado, atualizar, ler } from "./armazenamento.js?v=f5446e8815";
import { enunciadoHTML } from "./questao.js?v=f5446e8815";
import { tempoSugerido } from "./componentes.js?v=f5446e8815";
import { cronometroHTML, pausaHTML, ligarCronometro, pausar, continuar } from "./cronometro.js?v=f5446e8815";

export const papelParaAluno = (role) => {
  if (!role) return "";
  if (role.startsWith("Conexão")) return "Conexão com o 8º ano";
  if (role.startsWith("Retomada")) return "Revisão";
  return "";
};

const voltarPara = (sim) => (sim.area === "gerado" ? "#/treinar" : sim.area === "prova" ? "#/prova" : "#/avalia");
const agora = () => new Date().toISOString();

/** Começa (ou continua) um simulado e devolve a questão onde o aluno parou. */
export function comecar(simId) {
  let q = 1;
  atualizar((e) => {
    if (!e.emAndamento[simId]) e.emAndamento[simId] = { respostas: {}, questaoAtual: 1, inicio: agora() };
    q = e.emAndamento[simId].questaoAtual || 1;
  });
  return q;
}

function salvarResposta(simId, n, letra) {
  atualizar((e) => {
    const a = e.emAndamento[simId] || (e.emAndamento[simId] = { respostas: {}, questaoAtual: n, inicio: agora() });
    a.respostas[String(n)] = letra;
    a.questaoAtual = n;
    a.ultimaMudanca = agora();
  });
}

function marcarQuestaoAtual(simId, n) {
  atualizar((e) => {
    const a = e.emAndamento[simId];
    if (a) a.questaoAtual = n;
  });
}

export async function telaSimulado(ctx, id, parte) {
  const sim = await carregarSimulado(ctx.base.catalogo, id);
  if (parte === "revisao") return telaRevisao(ctx, sim);
  if (parte) {
    const n = Number(parte);
    if (!Number.isInteger(n) || n < 1 || n > sim.items.length) throw new Error("Essa questão não existe neste simulado.");
    if (!ler().emAndamento[sim.id]) comecar(sim.id);
    return telaQuestao(ctx, sim, n);
  }
  return telaAbertura(ctx, sim);
}

/* ---------- abertura ---------- */
function telaAbertura(ctx, sim) {
  const { habilidades } = ctx.base;
  const prova = sim.pontuacao?.tipo === "valores";
  const n = sim.items.length;
  const gerado = sim.area === "gerado";
  const valores = prova ? [...new Set(sim.items.map((i) => i.valor))].sort((a, b) => b - a) : [];
  const andamento = ctx.estado.emAndamento[sim.id];
  const respondidas = andamento ? Object.keys(andamento.respostas || {}).length : 0;
  let confirmarRecomeco = false;

  return {
    titulo: sim.titulo,
    html: h`
    <div class="abertura">
      <p class="pequeno"><a href="${voltarPara(sim)}">${icone.voltar} Voltar</a></p>
      ${gerado ? h`<span class="estado novo">${icone.dado}Treino gerado</span>` : ""}
      <h1>${sim.titulo}</h1>
      ${sim.subtitulo || sim.temas ? h`<p class="sub">${sim.subtitulo || sim.temas}</p>` : ""}
      ${reloginho(prazoDe(ctx.base.catalogo, ctx.estado, sim.id))}

      <div class="resumo">
        <div><b>${n}</b>${plural(n, "questão", "questões").replace(/^\d+ /, "")}</div>
        <div><b>0 a 10</b>${prova ? "soma do valor das questões certas" : "nota pelos acertos"}</div>
        ${sim.tempo_sugerido_min
          ? h`<div><b>${tempoSugerido(sim.tempo_sugerido_min).replace("cerca de ", "")}</b>tempo de prova, com cronômetro e pausa</div>`
          : h`<div><b>Sem pressa</b>sem limite de tempo</div>`}
      </div>

      ${andamento ? h`<div class="cartao continuar"><p><strong>Você já começou este simulado.</strong><br><span class="sub">${plural(respondidas, "questão respondida", "questões respondidas")} de ${n}.</span></p></div>` : ""}

      <div class="botoes secao">
        <button type="button" class="botao" data-acao="comecar">${icone.play}${andamento ? `Continuar da questão ${andamento.questaoAtual || 1}` : "Começar"}</button>
        ${andamento ? h`<button type="button" class="botao fantasma" data-acao="recomecar">Recomeçar do zero</button>` : ""}
      </div>

      <section class="cartao secao">
        <h2>Como funciona</h2>
        <ul class="lista-o-que-cai">
          <li>${sim.modo === "treino" ? "Uma questão por tela. Pense antes de tocar: depois de responder, a resposta não muda." : "Uma questão por tela. Dá para voltar e trocar a resposta."}</li>
          <li>Suas respostas ficam salvas a cada toque: se a página fechar, você continua de onde parou.</li>
          <li>${prova ? `As questões valem ${valores.map((v) => nota1(v)).join(", ")} pontos, de acordo com o nível.` : `Cada acerto vale ${nota1(10 / n)} na nota.`} ${sim.modo === "treino" ? "Depois de cada resposta você já vê se acertou, com a explicação." : "O resultado aparece só no fim, como no papel."}</li>
        </ul>
        <h2 class="secao">O que cai</h2>
        <ol class="lista-o-que-cai">${sim.items.map((it) => h`<li>${habilidades[it.code]?.nome || it.short}${papelParaAluno(it.role) ? h` <span class="etiqueta ${it.role.startsWith("Conexão") ? "conexao" : ""}">${papelParaAluno(it.role)}</span>` : ""}${prova ? h` <span class="etiqueta">vale ${nota1(it.valor)}</span>` : ""}</li>`)}</ol>
      </section>

      <div class="botoes secao">
        ${gerado && sim.gerado?.tipo === "versao" ? h`<button type="button" class="botao secundario" data-acao="versao-nova" data-id="${sim.gerado.base}">${icone.dado}Gerar outra versão</button>` : ""}
        ${gerado && sim.gerado?.tipo === "misto" ? h`<button type="button" class="botao secundario" data-acao="gerar-de-novo">${icone.dado}Gerar outro igual</button>` : ""}
        ${!gerado ? h`<button type="button" class="botao secundario" data-acao="versao-nova" data-id="${sim.id}">${icone.dado}Versão nova, com outros números</button>` : ""}
      </div>
    </div>`,
    eventos: {
      comecar: () => {
        const q = comecar(sim.id);
        location.hash = `#/simulado/${sim.id}/${q}`;
      },
      recomecar: (el) => {
        if (!confirmarRecomeco) {
          confirmarRecomeco = true;
          el.textContent = "Toque de novo para apagar as respostas";
          return;
        }
        atualizar((e) => { delete e.emAndamento[sim.id]; });
        const q = comecar(sim.id);
        location.hash = `#/simulado/${sim.id}/${q}`;
      },
      "gerar-de-novo": () => {
        const novo = gerarMisto({ codigos: sim.gerado.codigos, quantidade: sim.items.length, habilidades: ctx.base.habilidades, excluirSims: idsIndisponiveis(ctx.base.catalogo) });
        guardarGerado(novo);
        location.hash = `#/simulado/${novo.id}`;
      },
    },
  };
}

/* ---------- uma questão por tela ---------- */
/** Correção na hora (simulados com modo "treino"): acertou ou não, o erro provável e a resolução. */
function correcaoNaHora(it, letra) {
  const op = it.options.find((o) => o.letter === letra);
  const certo = letra === it.key;
  return h`<div class="feedback ${certo ? "certo" : "errado"}" role="status" tabindex="-1">
    <p class="feedback-titulo">${certo ? h`${icone.check}Acertou!` : h`${icone.alvo}Ainda não.`}</p>
    <p>${certo ? op.why : h`<strong>Erro provável:</strong> ${op.why}`}</p>
    <p><strong>Resolução</strong></p>
    <ol class="resolucao">${it.resolution.map((x) => h`<li>${x}</li>`)}</ol>
    ${it.check ? h`<p><strong>Como conferir:</strong> ${it.check}</p>` : ""}
  </div>`;
}

function bolinhas(sim, respostas, atual) {
  return h`<nav class="bolinhas" aria-label="Questões">${sim.items.map((it) => {
    const r = respostas[String(it.n)];
    const estado = r ? "respondida" : "em branco";
    return h`<a href="#/simulado/${sim.id}/${it.n}" class="bolinha ${r ? "feita" : ""} ${it.n === atual ? "atual" : ""}" ${it.n === atual ? cru('aria-current="step"') : ""} aria-label="Questão ${it.n}, ${estado}">${it.n}</a>`;
  })}</nav>`;
}

function telaQuestao(ctx, sim, n) {
  const it = sim.items[n - 1];
  const prova = sim.pontuacao?.tipo === "valores";
  const andamento = ctx.estado.emAndamento[sim.id];
  const respostas = andamento?.respostas || {};
  const marcada = respostas[String(n)] || null;
  const pausado = !!sim.tempo_sugerido_min && !!andamento?.pausado;
  const total = sim.items.length;
  const papel = papelParaAluno(it.role);
  // modo treino: depois de responder, a correção aparece na hora e a resposta fica travada
  const treino = sim.modo === "treino";
  const travada = treino && !!marcada;
  marcarQuestaoAtual(sim.id, n);

  return {
    titulo: `Questão ${n} · ${sim.titulo}`,
    html: h`
    <div class="tela-questao">
      <div class="questao-topo">
        <p class="pequeno sub"><a href="#/simulado/${sim.id}">${sim.titulo}</a></p>
        <h1 class="questao-num">Questão ${n} <span class="sub">de ${total}</span></h1>
        ${reloginho(prazoDe(ctx.base.catalogo, ctx.estado, sim.id), { compacto: true })}
        ${cronometroHTML(sim, andamento)}
        ${bolinhas(sim, respostas, n)}
      </div>
      ${pausaHTML(sim, andamento)}
      ${pausado ? "" : h`<article class="cartao questao">
        <div class="etiquetas">
          ${papel ? h`<span class="etiqueta ${papel.startsWith("Conexão") ? "conexao" : ""}">${papel}</span>` : ""}
          ${prova ? h`<span class="etiqueta valor">vale ${nota1(it.valor)}</span><span class="etiqueta">Nível ${it.level.slice(1)}</span>` : ""}
        </div>
        ${enunciadoHTML(it)}
        <div class="alternativas" role="radiogroup" aria-label="Alternativas da questão ${n}">
          ${it.options.map((o) => {
            const cls = travada ? (o.correct ? "correta" : o.letter === marcada ? "errada" : "") : marcada === o.letter ? "marcada" : "";
            return h`<button type="button" role="radio" class="alternativa opcao ${cls}" aria-checked="${String(marcada === o.letter)}" data-acao="responder" data-letra="${o.letter}" ${travada ? "disabled" : ""}><span class="letra">${o.letter}</span><span>${o.text}</span></button>`;
          })}
        </div>
        ${travada ? correcaoNaHora(it, marcada) : ""}
        <p class="salvo sub pequeno" id="salvo" role="status" aria-live="polite">${marcada && !treino ? "Resposta salva." : ""}</p>
      </article>
      <div class="navegacao-questao">
        ${n > 1 ? h`<a class="botao secundario" href="#/simulado/${sim.id}/${n - 1}">${icone.voltar}Anterior</a>` : h`<span></span>`}
        ${n < total
          ? h`<a class="botao" href="#/simulado/${sim.id}/${n + 1}" id="proxima">Próxima${icone.seta}</a>`
          : h`<a class="botao" href="#/simulado/${sim.id}/revisao" id="proxima">Revisar e entregar${icone.seta}</a>`}
      </div>`}
    </div>`,
    depois: () => { ligarZoom(); ligarCronometro(sim); },
    eventos: {
      pausar: () => { pausar(sim); ctx.redesenhar(); },
      "continuar-cronometro": () => { continuar(sim); ctx.redesenhar(); },
      responder: (el) => {
        const letra = el.dataset.letra;
        if (travada) return;
        salvarResposta(sim.id, n, letra);
        if (treino) return ctx.redesenhar({ manterFoco: ".feedback" });
        document.querySelectorAll(".opcao").forEach((b) => {
          const sel = b === el;
          b.classList.toggle("marcada", sel);
          b.setAttribute("aria-checked", String(sel));
        });
        const bol = document.querySelector(`.bolinha[href$="/${n}"]`);
        if (bol) { bol.classList.add("feita"); bol.setAttribute("aria-label", `Questão ${n}, respondida`); }
        document.getElementById("salvo").textContent = `Resposta ${letra} salva.`;
      },
    },
  };
}

/** Toque na figura amplia em tela cheia; toque de novo ou Esc fecha. */
function ligarZoom() {
  document.querySelectorAll(".questao figure").forEach((fig) => {
    const alvo = fig.querySelector("img, [role=img]");
    if (!alvo) return;
    fig.classList.add("ampliavel");
    fig.tabIndex = 0;
    fig.setAttribute("aria-label", "Ampliar a figura");
    const abrir = () => {
      const capa = document.createElement("div");
      capa.className = "zoom";
      capa.setAttribute("role", "dialog");
      capa.setAttribute("aria-modal", "true");
      capa.setAttribute("aria-label", "Figura ampliada");
      capa.innerHTML = `<div class="zoom-corpo">${alvo.outerHTML}</div><button type="button" class="botao zoom-fechar">Fechar</button>`;
      const fechar = () => { capa.remove(); document.removeEventListener("keydown", tecla); fig.focus(); };
      const tecla = (ev) => { if (ev.key === "Escape") fechar(); };
      capa.addEventListener("click", fechar);
      document.addEventListener("keydown", tecla);
      document.body.appendChild(capa);
      capa.querySelector(".zoom-fechar").focus();
    };
    fig.addEventListener("click", abrir);
    fig.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); abrir(); } });
  });
}

/* ---------- revisão antes de entregar ---------- */
function telaRevisao(ctx, sim) {
  const andamento = ctx.estado.emAndamento[sim.id];
  if (!andamento) throw new Error("Este simulado não foi começado. Volte e toque em Começar.");
  const respostas = andamento.respostas || {};
  const brancas = sim.items.filter((it) => !respostas[String(it.n)]).map((it) => it.n);
  let confirmar = false;
  return {
    titulo: `Revisão · ${sim.titulo}`,
    html: h`
    <div class="abertura">
      <p class="pequeno sub"><a href="#/simulado/${sim.id}/${sim.items.length}">${icone.voltar} Voltar à última questão</a></p>
      <h1>Revisar e entregar</h1>
      ${reloginho(prazoDe(ctx.base.catalogo, ctx.estado, sim.id))}
      ${bolinhas(sim, respostas, 0)}
      <div class="cartao secao">
        ${brancas.length
          ? h`<p><strong>${brancas.length === 1 ? "Ficou 1 questão em branco" : `Ficaram ${brancas.length} questões em branco`}:</strong></p>
             <ul class="chips">${brancas.map((b) => h`<li><a class="chip" href="#/simulado/${sim.id}/${b}">Questão ${b}</a></li>`)}</ul>
             <p class="sub pequeno secao">Questão em branco conta como erro. Dá para voltar e responder antes de entregar.</p>`
          : h`<p><strong>Tudo respondido!</strong> Confira se quer trocar alguma resposta. Depois de entregar, sai o resultado.</p>`}
        <ul class="lista-revisao">${sim.items.map((it) => h`<li><a href="#/simulado/${sim.id}/${it.n}"><span>Questão ${it.n}</span><strong>${respostas[String(it.n)] || "em branco"}</strong></a></li>`)}</ul>
      </div>
      <div class="botoes secao">
        <button type="button" class="botao" data-acao="entregar">${icone.check}Entregar</button>
      </div>
      <p class="msg" id="msg-entregar" role="status" aria-live="polite"></p>
    </div>`,
    eventos: {
      entregar: (el) => {
        if (brancas.length && !confirmar) {
          confirmar = true;
          el.textContent = `Entregar com ${plural(brancas.length, "questão", "questões")} em branco`;
          document.getElementById("msg-entregar").textContent = "Toque de novo para confirmar.";
          return;
        }
        ctx.entregar(sim);
      },
    },
  };
}
