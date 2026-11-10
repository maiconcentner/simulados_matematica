// Resultado (#/resultado/<id>): placar, faixa, fortes e a melhorar, plano, temas,
// revisão comentada e ações. Mostra a última entrega do simulado.
import { h, cru, nota1, plural } from "./util.js?v=f5446e8815";
import { icone } from "./icones.js?v=f5446e8815";
import { carregarSimulado, simuladosDoCatalogo, bloqueio, idsIndisponiveis, disponivelAgora, tipoDoSimulado } from "./dados.js?v=f5446e8815";
import { corrigir, temasAcumulados, fortesEFracos } from "./correcao.js?v=f5446e8815";
import { planoAteAProva } from "./plano_prova.js?v=f5446e8815";
import { contextoCorrecao } from "./entrega.js?v=f5446e8815";
import { anelNota, reguaFaixas, barrasTema, animarContadores, corDoTexto } from "./graficos.js?v=f5446e8815";
import { enunciadoHTML } from "./questao.js?v=f5446e8815";
import { codigosComModelo, gerarMisto } from "./gerador/index.js?v=f5446e8815";
import { guardarGerado } from "./armazenamento.js?v=f5446e8815";
import { melhorTentativa } from "./progresso.js?v=f5446e8815";
import { nivelDoJogador, nomeDaConquista, listaDeConquistas, hojeISO } from "./gamificacao.js?v=f5446e8815";

// a animação de subir de nível, o confete e o aviso de conquista só aparecem logo depois de entregar
let entregaRecente = null;
export const marcarEntregaRecente = (id) => { entregaRecente = id; };

function blocoXp(t, config) {
  if (typeof t.xp !== "number") return "";
  const antes = nivelDoJogador(t.xpAntes ?? 0, config);
  const depois = nivelDoJogador((t.xpAntes ?? 0) + t.xp, config);
  const d = t.detalheXp || {};
  const partes = [d.acertos ? `acertos ${d.acertos}` : "", d.concluir ? `concluir ${d.concluir}` : "", d.nota8 ? `nota 8 ou mais ${d.nota8}` : "", d.combo ? `combo ${d.combo}` : ""].filter(Boolean).join(" · ");
  const motivo = d.motivo === "refazer"
    ? (t.xp ? "Refazendo, o XP vem do que você melhorou." : "Refazendo, o XP vem só quando a nota passa da sua melhor.")
    : d.motivo === "gerado" ? "Treino gerado vale metade do XP." : partes;
  // ao subir de nível, a barra recomeça do zero no nível novo
  const pctAntes = depois.nivel > antes.nivel ? 0 : Math.round((antes.noNivel / antes.porNivel) * 100);
  const pctDepois = Math.round((depois.noNivel / depois.porNivel) * 100);
  return h`<div class="placar-xp">
    <p class="xp-ganho">${icone.estrela}<b class="contar" data-ate="${t.xp}" data-prefixo="+">+${t.xp}</b> XP</p>
    <p class="sub pequeno">${motivo}</p>
    <div class="barra-nivel" role="progressbar" aria-label="XP no nível ${depois.nivel}" aria-valuemin="0" aria-valuemax="${depois.porNivel}" aria-valuenow="${depois.noNivel}">
      <span style="--de:${pctAntes}%;--ate:${pctDepois}%"></span>
    </div>
    <p class="sub pequeno">Nível ${depois.nivel} · ${depois.titulo} · ${depois.noNivel} de ${depois.porNivel} XP</p>
    ${t.subiuNivel ? h`<p class="subiu-nivel">${icone.raio}Subiu para o nível ${t.subiuNivel.nivel} · ${t.subiuNivel.titulo}</p>` : ""}
  </div>`;
}

function avisoConquistas(ids, config) {
  const lista = listaDeConquistas(config);
  return h`<div class="conquista-capa" role="dialog" aria-modal="true" aria-labelledby="t-conquista" data-acao="fechar-conquista">
    <div class="conquista-cartao">
      <span class="conquista-icone">${icone.trofeu}</span>
      <h2 id="t-conquista">${ids.length === 1 ? "Conquista nova!" : `${ids.length} conquistas novas!`}</h2>
      <ul>${ids.map((id) => h`<li><strong>${nomeDaConquista(id, config)}</strong><br><span class="sub pequeno">${lista.find((c) => c.id === id)?.regra || ""}</span></li>`)}</ul>
      <button type="button" class="botao" data-acao="fechar-conquista">Valeu!</button>
    </div>
  </div>`;
}

export function soltarConfete() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const cores = ["#5b3fd9", "#ffc233", "#2f9c6e", "#e4572e", "#2f6db5", "#f2a541"];
  const caixa = document.createElement("div");
  caixa.className = "confete";
  caixa.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = cores[i % cores.length];
    p.style.animationDelay = `${Math.random() * 0.5}s`;
    p.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    caixa.appendChild(p);
  }
  document.body.appendChild(caixa);
  setTimeout(() => caixa.remove(), 3200);
}

/** Notas separadas da etapa (códigos D) e da conexão com o 8º ano (códigos C), quando o simulado tem as duas. */
function notasPorParte(questoes) {
  const nota = (pref) => {
    const qs = questoes.filter((q) => q.code?.startsWith(pref));
    return qs.length ? { acertos: qs.filter((q) => q.acertou).length, total: qs.length } : null;
  };
  const etapa = nota("D"), conexao = nota("C");
  if (!etapa || !conexao) return "";
  const n = (x) => nota1((x.acertos / x.total) * 10);
  return h`<div class="notas-parte">
    <p><span class="sub pequeno">Etapa (${etapa.acertos} de ${etapa.total})</span><b class="nota-etapa">${n(etapa)}</b></p>
    <p><span class="sub pequeno">Conexão com o 8º ano (${conexao.acertos} de ${conexao.total})</span><b class="nota-conexao">${n(conexao)}</b></p>
  </div>`;
}

/**
 * Plano até a prova (simulados com data_prova): as habilidades a melhorar, a mais fraca primeiro,
 * distribuídas pelos dias que faltam. Treinar: a semana do Avalia com o mesmo código, se houver,
 * senão a questão no modo treino.
 */
function planoProva(sim, res, { catalogo, habilidades, fechado }) {
  if (!sim.data_prova) return "";
  const semanas = simuladosDoCatalogo(catalogo).filter((s) => tipoDoSimulado(s) === "semana" && disponivelAgora(s));
  const fracos = fortesEFracos(sim, res.questoes, Infinity).fracos.map((f) => {
    const semana = semanas.find((s) => s.habilidades?.includes(f.code));
    return {
      code: f.code,
      nome: habilidades[f.code]?.nome || f.code,
      dica: sim.dicas?.[f.code] || habilidades[f.code]?.dica || "",
      treinar: semana ? { href: `#/simulado/${semana.id}`, rotulo: `Treinar na Semana ${semana.semana}` }
        : fechado ? null : { href: `#/treino/${sim.id}/${f.primeiraErrada}`, rotulo: "Treinar esta questão" },
    };
  });
  const dias = planoAteAProva({ dataProva: sim.data_prova, hoje: hojeISO(), fracos });
  if (!dias.length) return "";
  const [a, m, d] = sim.data_prova.split("-");
  return h`<section class="secao" aria-labelledby="t-plano-prova">
    <h2 id="t-plano-prova">${icone.relogio}Plano até a prova (${d}/${m})</h2>
    <p class="sub pequeno">Um pouco por dia, começando pelo que está mais fraco.</p>
    <ol class="plano plano-prova">${dias.map((dia) => h`
      <li class="cartao passo">
        <h3><span class="passo-num">${dia.dia}</span>${dia.rotulo} <span class="sub pequeno">${dia.data}</span></h3>
        ${dia.revisao ? h`<p>Revisão geral: refaça as questões que você errou e descanse para a prova.</p>` : h`<ul class="plano-dia">${dia.habilidades.map((x) => h`
          <li><strong>${x.nome}</strong>${x.dica ? h`<br><span class="sub pequeno">${x.dica[0].toUpperCase()}${x.dica.slice(1)}</span>` : ""}
            ${x.treinar ? h`<br><a class="botao pequeno secundario" href="${x.treinar.href}">${icone.raio}${x.treinar.rotulo}</a>` : ""}</li>`)}</ul>`}
      </li>`)}</ol>
  </section>`;
}

const minutos = (ini, fim) => Math.max(1, Math.round((new Date(fim) - new Date(ini)) / 60000));

export async function telaResultado(ctx, id) {
  const { config, habilidades, catalogo } = ctx.base;
  const sim = await carregarSimulado(catalogo, id);
  const tentativas = ctx.estado.tentativas.filter((t) => t.simId === sim.id && t.modo === "simulado");
  const t = tentativas[tentativas.length - 1];
  if (!t) throw new Error("Você ainda não entregou este simulado.");
  const res = corrigir(sim, t.respostas, contextoCorrecao(ctx.base, ctx.estado));
  const prova = sim.pontuacao?.tipo === "valores";
  const fechado = bloqueio(catalogo, ctx.estado, sim.id);
  const comModelo = new Set(codigosComModelo(idsIndisponiveis(catalogo)));
  const nomeHab = (c) => habilidades[c]?.nome || c;
  const recente = entregaRecente === sim.id;
  entregaRecente = null;

  // temas: este simulado e o acumulado de todas as entregas
  const acum = temasAcumulados(ctx.estado.tentativas.filter((x) => x.modo === "simulado"), habilidades);
  const linhasTema = config.temas.filter((tema) => res.porTema[tema]).map((tema) => ({
    tema, ...res.porTema[tema], acumAcertos: acum[tema]?.acertos || 0, acumTotal: acum[tema]?.total || 0,
  }));

  // desafio para quem gabaritou
  let desafio = null;
  if (!res.plano.length) {
    const prox = simuladosDoCatalogo(catalogo).find((s) => s.id !== sim.id && disponivelAgora(s) && (melhorTentativa(ctx.estado, s.id)?.nota ?? 0) < 10);
    desafio = prox
      ? h`<p>Você gabaritou! Desafio: tente o simulado <a href="#/simulado/${prox.id}">${prox.semana ? `Semana ${prox.semana}` : prox.titulo}</a> sem errar nenhuma.</p>`
      : h`<p>Você gabaritou! Desafio: ajude um colega a revisar as questões em que ele errou.</p>`;
  }

  const fortes = res.fortes.map((f) => nomeHab(f.code));
  const fracos = res.fracos.map((f) => nomeHab(f.code));

  return {
    titulo: `Resultado · ${sim.titulo}`,
    html: h`
    <div class="resultado">
      <p class="pequeno sub"><a href="#/simulado/${sim.id}">${sim.titulo}</a></p>
      <h1 class="visualmente-escondido">Resultado</h1>

      <section class="cartao placar" style="--cor-faixa:${res.faixa.cor}" aria-label="Placar">
        ${anelNota(res.nota, res.faixa.cor)}
        <div class="placar-info">
          <p class="placar-acertos"><strong>${res.acertos} de ${res.total}</strong> ${res.total === 1 ? "acerto" : "acertos"}</p>
          ${notasPorParte(res.questoes)}
          ${res.medalha
            ? h`<p class="placar-medalha"><span class="medalha grande ${res.medalha.nome.toLowerCase()}">${icone.medalha}</span>Medalha ${res.medalha.nome}</p>`
            : h`<p class="placar-medalha sub">Sem medalha desta vez: com metade de acerto já vem o Bronze.</p>`}
          <p class="sub pequeno">${icone.relogio} ${plural(minutos(t.inicio, t.fim), "minuto", "minutos")}</p>
          ${blocoXp(t, config)}
        </div>
      </section>

      <section class="cartao secao faixa-resultado" aria-labelledby="t-faixa">
        <h2 id="t-faixa"><span class="selo-faixa" style="background:${res.faixa.cor};color:${corDoTexto(res.faixa.cor)}">${res.faixa.nivel}</span> ${res.faixa.apelido}</h2>
        ${reguaFaixas(res.nota, config.escala)}
        <p>${res.faixa.frase}</p>
        ${res.falta ? h`<p class="falta"><strong>${res.textoFalta}</strong></p>` : ""}
      </section>

      <div class="grade grade-2 secao">
        <section class="cartao" aria-labelledby="t-fortes">
          <h2 id="t-fortes">${icone.check}Pontos fortes</h2>
          ${fortes.length ? h`<ul class="etiquetas">${fortes.map((f) => h`<li class="etiqueta forte">${icone.check}${f}</li>`)}</ul>` : h`<p class="sub">Ainda não. Nenhuma habilidade saiu sem erro desta vez, e é para isso que serve o plano.</p>`}
        </section>
        <section class="cartao" aria-labelledby="t-fracos">
          <h2 id="t-fracos">${icone.alvo}A melhorar</h2>
          ${fracos.length ? h`<ul class="etiquetas">${fracos.map((f) => h`<li class="etiqueta fraco">${icone.alvo}${f}</li>`)}</ul>` : h`<p class="sub">Nada! Você acertou todas as habilidades.</p>`}
        </section>
      </div>

      <section class="secao" aria-labelledby="t-plano">
        <h2 id="t-plano">${icone.lista}Seu plano</h2>
        ${res.plano.length ? h`<ol class="plano">${res.plano.map((p, i) => h`
          <li class="cartao passo">
            <h3><span class="passo-num">${i + 1}</span>${p.nome}</h3>
            <p><strong>Erro provável:</strong> ${p.erro}</p>
            ${p.dica ? h`<p><strong>Dica:</strong> ${p.dica}</p>` : ""}
            <div class="botoes">
              ${fechado ? "" : h`<a class="botao pequeno secundario" href="#/treino/${sim.id}/${p.questao}">Refazer esta questão</a>`}
              ${p.outro ? h`<a class="botao pequeno secundario" href="#/simulado/${p.outro.id}">Treinar em outro simulado (${p.outro.titulo})</a>` : ""}
              ${comModelo.has(p.code) ? h`<button type="button" class="botao pequeno secundario" data-acao="treinar-hab" data-code="${p.code}">${icone.dado}Treinar com números novos</button>` : ""}
            </div>
            ${!p.outro && !comModelo.has(p.code) ? h`<p class="sub pequeno">Peça ao professor uma lista sobre isso.</p>` : ""}
          </li>`)}</ol>
          <p class="sub pequeno">O plano virou a sua missão no painel.</p>`
        : h`<div class="cartao">${desafio}</div>`}
      </section>

      ${planoProva(sim, res, { catalogo, habilidades, fechado })}

      ${linhasTema.length ? h`
      <section class="cartao secao" aria-labelledby="t-temas">
        <h2 id="t-temas">${sim.destaque ? "Por eixo" : "Por tema"}</h2>
        <p class="sub pequeno"><span class="legenda-atual"></span> este simulado <span class="legenda-acum"></span> tudo o que você já fez</p>
        ${barrasTema(linhasTema)}
      </section>` : ""}

      <section class="secao" aria-labelledby="t-revisao">
        <h2 id="t-revisao">Revisão das questões</h2>
        <div class="revisao">${sim.items.map((it, i) => {
          const q = res.questoes[i];
          const marcada = it.options.find((o) => o.letter === q.marcada);
          const correta = it.options.find((o) => o.correct);
          const estado = q.acertou ? "acertou" : q.marcada ? "errou" : "branco";
          return h`<details class="cartao item-revisao ${estado}">
            <summary>
              <span class="sinal" aria-hidden="true">${q.acertou ? icone.check : icone.alvo}</span>
              <span><strong>Questão ${it.n}</strong> · ${it.short}${prova ? ` · vale ${nota1(it.valor)}` : ""}</span>
              <span class="estado ${q.acertou ? "feito" : "melhorar"}">${q.acertou ? "Acertou" : q.marcada ? "Errou" : "Em branco"}</span>
            </summary>
            <div class="questao">
              ${enunciadoHTML(it)}
              <ol class="alternativas">${it.options.map((o) => h`<li class="alternativa ${o.correct ? "correta" : ""} ${o.letter === q.marcada && !o.correct ? "errada" : ""}"><span class="letra">${o.letter}</span><span>${o.text}${o.letter === q.marcada ? h` <em class="sub">(sua resposta)</em>` : ""}</span></li>`)}</ol>
              ${marcada && !q.acertou ? h`<p><strong>Erro provável:</strong> ${marcada.why}</p>` : ""}
              <p><strong>Correta: ${correta.letter}.</strong> ${correta.why}</p>
              <p><strong>Resolução</strong></p>
              <ol class="resolucao">${it.resolution.map((r) => h`<li>${r}</li>`)}</ol>
              ${it.check ? h`<p><strong>Como conferir:</strong> ${it.check}</p>` : ""}
            </div>
          </details>`;
        })}</div>
      </section>

      <div class="botoes secao acoes-resultado">
        ${fechado ? h`<p class="sub pequeno">Este simulado está encerrado. O resultado continua aqui para você revisar.</p>` : ""}
        ${res.acertos < res.total && !fechado ? h`<a class="botao" href="#/treino/${sim.id}">${icone.raio}Refazer só as que errei</a>` : ""}
        <a class="botao secundario" href="#/">${icone.painel}Voltar ao painel</a>
        <button type="button" class="botao fantasma" data-acao="imprimir">${icone.prova}Imprimir ou salvar PDF</button>
      </div>
    </div>
      ${recente && t.conquistasNovas?.length ? avisoConquistas(t.conquistasNovas, config) : ""}`,
    depois: () => {
      animarContadores(document.getElementById("app"));
      if (recente && (t.subiuNivel || t.subiuFaixa || t.conquistasNovas?.length)) soltarConfete();
      document.querySelector(".conquista-capa .botao")?.focus();
    },
    eventos: {
      "fechar-conquista": () => document.querySelector(".conquista-capa")?.remove(),
      imprimir: () => {
        document.querySelectorAll(".item-revisao").forEach((d) => { d.open = true; });
        window.print();
      },
      "treinar-hab": (el) => {
        const novo = gerarMisto({ codigos: [el.dataset.code], quantidade: 5, habilidades, excluirSims: idsIndisponiveis(catalogo) });
        guardarGerado(novo);
        location.hash = `#/simulado/${novo.id}`;
      },
    },
  };
}

export { cru };
