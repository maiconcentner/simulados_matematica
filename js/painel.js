// Painel (#/): cartão do jogador, áreas, continuar, missão e conquistas.
import { h } from "./util.js";
import { icone } from "./icones.js";
import { nivelDoJogador, sequenciaDeDias, nomeDaConquista, listaDeConquistas } from "./gamificacao.js";
import { simuladosDoCatalogo, bloqueio, disponivelAgora, tipoDoSimulado } from "./dados.js";
import { reloginho } from "./prazo.js";
import { melhorTentativa } from "./progresso.js";
import { plural } from "./util.js";

const totalDeConquistas = (config) => listaDeConquistas(config).length;


function tituloDoSimulado(id, catalogo, estado) {
  const g = estado.gerados.find((x) => x.id === id);
  if (g) return g.titulo;
  const s = simuladosDoCatalogo(catalogo).find((x) => x.id === id);
  return s ? s.titulo : id;
}

export function telaPainel({ base, estado }) {
  const { catalogo, config, habilidades } = base;
  const jog = nivelDoJogador(estado.xp, config);
  const seq = sequenciaDeDias(estado.diasDeUso);
  const nConq = Object.keys(estado.conquistas).length;
  const pct = Math.round((jog.noNivel / jog.porNivel) * 100);

  const contar = (tipos) => {
    const lista = simuladosDoCatalogo(catalogo).filter((s) => tipos.includes(tipoDoSimulado(s)) && s.status === "publicado");
    return { total: lista.length, feitos: lista.filter((s) => melhorTentativa(estado, s.id)).length };
  };
  const av = contar(["semana", "completo"]), pr = contar(["prova"]), tr = contar(["treino"]);

  const andamento = Object.entries(estado.emAndamento)
    .filter(([id]) => !bloqueio(catalogo, estado, id))
    .sort((a, b) => String(b[1].inicio || "").localeCompare(String(a[1].inicio || "")))[0];

  const missao = estado.missao && estado.missao.passos?.length ? estado.missao : null;
  const conquistas = Object.entries(estado.conquistas).sort((a, b) => String(b[1]).localeCompare(String(a[1]))).slice(0, 3);

  const cartaoArea = (cls, href, ic, titulo, texto, prog, rotulo) => h`
    <a class="cartao area ${cls}" href="${href}">
      <span class="icone-area">${ic}</span>
      <h2>${titulo}</h2>
      <p>${texto}</p>
      <div class="progresso-area">
        ${prog !== null ? h`<div class="trilho" role="progressbar" aria-label="${rotulo}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${prog}"><span style="width:${prog}%"></span></div>` : ""}
        <p>${rotulo}</p>
      </div>
    </a>`;

  return {
    titulo: "Painel",
    html: h`
    <div class="saudacao">
      <h1>${estado.perfil.apelido ? `Oi, ${estado.perfil.apelido}!` : "Oi! Bora treinar?"}</h1>
      ${estado.perfil.apelido ? "" : h`<p class="pequeno"><a href="#/perfil">Escolher um apelido</a></p>`}
    </div>

    <section class="cartao jogador" aria-label="Seu nível">
      <div class="nivel-selo" aria-hidden="true"><div><small>nível</small><b>${jog.nivel}</b></div></div>
      <div>
        <h2>${jog.titulo}</h2>
        <div class="barra-xp" role="progressbar" aria-label="XP até o próximo nível" aria-valuemin="0" aria-valuemax="${jog.porNivel}" aria-valuenow="${jog.noNivel}"><span style="width:${pct}%"></span></div>
        <p class="xp-texto">${jog.noNivel} de ${jog.porNivel} XP · faltam ${jog.falta} XP para o nível ${jog.nivel + 1}</p>
      </div>
      <div class="contadores">
        <span class="contador">${icone.estrela}${jog.xp} XP</span>
        <span class="contador">${icone.chama}${plural(seq, "dia seguido", "dias seguidos")}</span>
        <span class="contador">${icone.trofeu}${nConq} de ${totalDeConquistas(config)} conquistas</span>
      </div>
    </section>

    ${simuladosDoCatalogo(catalogo).filter((s) => s.disponivel_ate && disponivelAgora(s)).map((s) => h`
    <section class="secao" aria-label="Prazo">
      <div class="cartao continuar prazo-aviso">
        <div><p><strong>${s.semana ? `Semana ${s.semana}` : s.titulo}</strong></p>${reloginho(s.disponivel_ate)}</div>
        <a class="botao" href="#/simulado/${s.id}">${estado.emAndamento[s.id] ? "Continuar" : "Fazer"}${icone.seta}</a>
      </div>
    </section>`)}

    ${andamento ? h`
    <section class="secao" aria-labelledby="t-continuar">
      <h2 id="t-continuar">${icone.relogio}Continue de onde parou</h2>
      <div class="cartao continuar">
        <p><strong>${tituloDoSimulado(andamento[0], catalogo, estado)}</strong><br>
        <span class="sub">${plural(Object.keys(andamento[1].respostas || {}).length, "questão respondida", "questões respondidas")}</span></p>
        <a class="botao" href="#/simulado/${andamento[0]}">Continuar${icone.seta}</a>
      </div>
    </section>` : ""}

    <section class="secao" aria-label="Áreas">
      <div class="grade grade-3 areas">
        ${cartaoArea("", "#/avalia", icone.avalia, "Simulados Avalia", "O simulado completo e um simulado por semana, com as habilidades da etapa.", av.total ? Math.round((av.feitos / av.total) * 100) : 0, `${av.feitos} de ${plural(av.total, "simulado feito", "simulados feitos")}`)}
        ${cartaoArea("prova", "#/prova", icone.prova, "Simulados de prova", "Treino no formato da avaliação da etapa, valendo 10.", pr.total ? Math.round((pr.feitos / pr.total) * 100) : 0, `${pr.feitos} de ${plural(pr.total, "simulado feito", "simulados feitos")}`)}
        ${cartaoArea("treinar", "#/treinar", icone.dado, "Treinos", "Correção na hora, com a explicação. E treinos com números novos, quantos quiser.", tr.total ? Math.round((tr.feitos / tr.total) * 100) : null, tr.total ? `${tr.feitos} de ${plural(tr.total, "treino feito", "treinos feitos")}` : "Gere seu primeiro treino")}
      </div>
    </section>

    <section class="secao missao" aria-labelledby="t-missao">
      <h2 id="t-missao">${icone.alvo}Sua missão</h2>
      <div class="cartao">
        ${missao ? h`
          <p class="sub pequeno">Plano do seu último resultado. Marque o que já fez.</p>
          <ol>${missao.passos.map((p, i) => h`<li><label><input type="checkbox" data-acao="missao" data-i="${i}" ${p.feito ? "checked" : ""}><span>${habilidades[p.code]?.nome || p.code}</span></label></li>`)}</ol>`
        : h`<div class="vazio">${icone.alvo}<p>Faça um simulado e entregue: o plano do resultado vira a sua missão aqui.</p></div>`}
      </div>
    </section>

    <section class="secao" aria-labelledby="t-conquistas">
      <h2 id="t-conquistas">${icone.trofeu}Últimas conquistas</h2>
      <div class="cartao">
        ${conquistas.length
          ? h`<ul class="etiquetas">${conquistas.map(([id]) => h`<li class="etiqueta">${nomeDaConquista(id, config)}</li>`)}</ul>`
          : h`<div class="vazio">${icone.trofeu}<p>Suas conquistas aparecem aqui. A primeira vem quando você concluir um simulado.</p></div>`}
      </div>
    </section>`,
  };
}
