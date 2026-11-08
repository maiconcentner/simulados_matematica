// Modo treino (#/treino/<id> e #/treino/<id>/<n>): refazer as questões erradas da
// última entrega (ou uma questão do plano), com correção na hora.
// Dá refazer_fator do XP da questão, uma vez por questão; não muda a nota do simulado.
import { h, plural } from "./util.js?v=0bc7986d38";
import { icone } from "./icones.js?v=0bc7986d38";
import { carregarSimulado, prazoDe } from "./dados.js?v=0bc7986d38";
import { reloginho } from "./prazo.js?v=0bc7986d38";
import { atualizar } from "./armazenamento.js?v=0bc7986d38";
import { enunciadoHTML } from "./questao.js?v=0bc7986d38";
import { xpDaQuestao, registrarDia, conquistasNovas, hojeISO, nomeDaConquista } from "./gamificacao.js?v=0bc7986d38";
import { contextoConquistas } from "./entrega.js?v=0bc7986d38";
import { soltarConfete } from "./resultado.js?v=0bc7986d38";

// sessão de treino em andamento (só na memória: recarregar recomeça o treino)
let sessao = null;

export async function telaTreino(ctx, id, nParam) {
  const { config } = ctx.base;
  const sim = await carregarSimulado(ctx.base.catalogo, id);
  const chave = `${sim.id}/${nParam || "erradas"}`;
  if (!sessao || sessao.chave !== chave) {
    let fila;
    if (nParam) fila = [Number(nParam)];
    else {
      const ts = ctx.estado.tentativas.filter((t) => t.simId === sim.id && t.modo === "simulado");
      const ult = ts[ts.length - 1];
      if (!ult) throw new Error("Entregue o simulado primeiro para treinar as que errou.");
      fila = sim.items.filter((it) => ult.respostas[String(it.n)] !== it.key).map((it) => it.n);
    }
    if (!fila.length || fila.some((n) => !sim.items[n - 1])) throw new Error("Não há questões para treinar aqui.");
    sessao = { chave, fila, i: 0, respostas: {}, xp: 0, acertos: 0 };
  }
  const prova = sim.pontuacao?.tipo === "valores";

  if (sessao.i >= sessao.fila.length) return telaFim(ctx, sim);

  const n = sessao.fila[sessao.i];
  const it = sim.items[n - 1];
  const respondida = sessao.respostas[n];
  const ultima = sessao.i === sessao.fila.length - 1;

  const feedback = () => {
    const r = sessao.respostas[n];
    const op = it.options.find((o) => o.letter === r.letra);
    const correta = it.options.find((o) => o.correct);
    return h`<div class="feedback ${r.acertou ? "certo" : "errado"}" role="status" aria-live="polite">
      <p class="feedback-titulo">${r.acertou ? h`${icone.check}Acertou!` : h`${icone.alvo}Ainda não.`} ${r.xp ? h`<span class="xp-mini">+${r.xp} XP</span>` : ""}</p>
      <p>${r.acertou ? op.why : h`<strong>Erro provável:</strong> ${op.why}`}</p>
      ${!r.acertou ? h`<p><strong>Correta: ${correta.letter}.</strong> ${correta.why}</p>` : ""}
      <p><strong>Resolução</strong></p>
      <ol class="resolucao">${it.resolution.map((x) => h`<li>${x}</li>`)}</ol>
      ${it.check ? h`<p><strong>Como conferir:</strong> ${it.check}</p>` : ""}
    </div>`;
  };

  return {
    titulo: `Treino · ${sim.titulo}`,
    html: h`
    <div class="tela-questao">
      <div class="questao-topo">
        <p class="pequeno sub"><a href="#/resultado/${sim.id}">${icone.voltar} Voltar ao resultado</a></p>
        <span class="estado novo">${icone.raio}Modo treino</span>
        <h1 class="questao-num">Questão ${n} <span class="sub">· ${sessao.i + 1} de ${sessao.fila.length} no treino</span></h1>
        ${reloginho(prazoDe(ctx.base.catalogo, ctx.estado, sim.id), { compacto: true })}
      </div>
      <article class="cartao questao">
        ${prova ? h`<div class="etiquetas"><span class="etiqueta valor">vale ${String(it.valor).replace(".", ",")}</span></div>` : ""}
        ${enunciadoHTML(it)}
        <div class="alternativas" role="radiogroup" aria-label="Alternativas">
          ${it.options.map((o) => {
            const cls = respondida ? (o.correct ? "correta" : o.letter === respondida.letra ? "errada" : "") : "";
            return h`<button type="button" role="radio" class="alternativa opcao ${cls}" aria-checked="${String(respondida?.letra === o.letter)}" data-acao="treinar-resp" data-letra="${o.letter}" ${respondida ? "disabled" : ""}><span class="letra">${o.letter}</span><span>${o.text}</span></button>`;
          })}
        </div>
        <div id="feedback">${respondida ? feedback() : ""}</div>
      </article>
      <div class="navegacao-questao">
        <span></span>
        ${respondida ? h`<button type="button" class="botao" data-acao="treino-proxima" id="proxima">${ultima ? "Terminar treino" : "Próxima"}${icone.seta}</button>` : ""}
      </div>
    </div>`,
    eventos: {
      "treinar-resp": (el) => {
        if (sessao.respostas[n]) return;
        const letra = el.dataset.letra;
        const acertou = letra === it.key;
        let xp = 0;
        atualizar((e) => {
          const feitas = (e.treino[sim.id] ||= {});
          if (acertou && !feitas[n]) {
            xp = Math.round(xpDaQuestao(it, prova, config) * config.xp.refazer_fator);
            feitas[n] = true;
            e.xp += xp;
          }
        });
        sessao.respostas[n] = { letra, acertou, xp };
        if (acertou) sessao.acertos++;
        sessao.xp += xp;
        ctx.redesenhar({ manterFoco: "#feedback" });
      },
      "treino-proxima": () => {
        sessao.i++;
        ctx.redesenhar({ manterFoco: "h1" });
      },
    },
  };
}

function telaFim(ctx, sim) {
  const s = sessao;
  let novas = s.conquistas;
  if (!novas) {
    atualizar((e) => {
      e.tentativas.push({ simId: sim.id, modo: "treino", fim: new Date().toISOString(), acertos: s.acertos, total: s.fila.length, xp: s.xp, questoes: s.fila });
      e.diasDeUso = registrarDia(e.diasDeUso);
      novas = conquistasNovas(e, { ...contextoConquistas(ctx.base, e), tentativa: null });
      for (const id of novas) e.conquistas[id] = hojeISO();
    });
    s.conquistas = novas;
  }
  return {
    titulo: `Treino concluído · ${sim.titulo}`,
    html: h`
    <div class="abertura">
      <span class="estado novo">${icone.raio}Modo treino</span>
      <h1>Treino concluído</h1>
      <div class="cartao placar-treino">
        <p class="placar-acertos"><strong>${s.acertos} de ${s.fila.length}</strong> ${s.fila.length === 1 ? "acerto" : "acertos"} no treino</p>
        <p class="xp-ganho">${icone.estrela}+${s.xp} XP</p>
        <p class="sub pequeno">No treino cada questão vale metade do XP, uma vez só. A nota do simulado continua a mesma.</p>
        ${novas.length ? h`<p><strong>Conquista nova:</strong> ${novas.map((id) => nomeDaConquista(id, ctx.base.config)).join(", ")}</p>` : ""}
      </div>
      <div class="botoes secao">
        ${s.acertos < s.fila.length ? h`<button type="button" class="botao" data-acao="treinar-de-novo">${icone.raio}Treinar de novo</button>` : ""}
        <a class="botao secundario" href="#/simulado/${sim.id}">Refazer o simulado inteiro</a>
        <a class="botao fantasma" href="#/">${icone.painel}Voltar ao painel</a>
      </div>
      <p class="sub pequeno">${plural(s.fila.length, "questão treinada", "questões treinadas")}. Refazendo o simulado inteiro e subindo 2 pontos na nota, você ganha a conquista Volta por cima.</p>
    </div>`,
    depois: () => { if (novas.length) soltarConfete(); },
    eventos: {
      "treinar-de-novo": () => {
        sessao = null;
        ctx.redesenhar();
      },
    },
  };
}
