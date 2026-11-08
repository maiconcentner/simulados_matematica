// Peças de tela usadas em mais de uma página: cartão do simulado, estado, etiquetas.
import { h, cru } from "./util.js?v=57517fb455";
import { icone } from "./icones.js?v=57517fb455";
import { nota1, plural, dataCurta } from "./util.js?v=57517fb455";
import { situacao } from "./progresso.js?v=57517fb455";
import { encerrado, aindaVaiAbrir } from "./dados.js?v=57517fb455";
import { reloginho } from "./prazo.js?v=57517fb455";
import { temVersaoNova } from "./gerador/index.js?v=57517fb455";

export function etiquetasHabilidades(codigos, habilidades) {
  const vistos = [...new Set(codigos)];
  return h`<ul class="etiquetas" aria-label="Habilidades">${vistos.map((c) => {
    const hab = habilidades[c];
    const nome = hab?.nome || c;
    return hab?.conexao_8ano ? h`<li class="etiqueta conexao" title="Conexão com o 8º ano">${nome}</li>` : h`<li class="etiqueta">${nome}</li>`;
  })}</ul>`;
}

export function seloEstado(sit) {
  if (sit.tipo === "novo") return h`<span class="estado novo">Novo</span>`;
  if (sit.tipo === "andamento") return h`<span class="estado novo">${icone.relogio}Em andamento</span>`;
  const med = sit.medalha ? h`<span class="medalha ${sit.medalha.nome.toLowerCase()}" title="Medalha ${sit.medalha.nome}">${icone.medalha}</span>` : "";
  if (sit.tipo === "melhorar") return h`<span class="estado melhorar">${med}Nota ${nota1(sit.nota)} · dá para melhorar</span>`;
  return h`<span class="estado feito">${med}Nota ${nota1(sit.nota)}</span>`;
}

/** Cartão de um simulado do catálogo (listas Avalia e prova). */
/** "cerca de 1 h 30", "cerca de 40 min" */
function tempoSugerido(min) {
  if (!min) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return `cerca de ${h ? `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}` : `${m} min`}`;
}

/** Cartão de um simulado do catálogo (listas Avalia, prova e treinos). destaque: cartão maior. */
export function cartaoSimulado(s, { estado, config, habilidades, nivelTitulo = 2, destaque = false }) {
  const H = nivelTitulo === 3 ? ["<h3 class=\"sim-titulo\">", "</h3>"] : ["<h2 class=\"sim-titulo\">", "</h2>"];
  const titulo = s.semana ? `Semana ${s.semana}` : s.titulo;
  const fechado = encerrado(s);
  const treino = s.modo === "treino";
  const info = [plural(s.n_questoes, "questão", "questões"), tempoSugerido(s.tempo_sugerido_min), s.area === "prova" ? "vale 10" : null, s.semana && s.data ? `semana de ${dataCurta(s.data)}` : null].filter(Boolean).join(" · ");
  const selos = h`${treino ? h`<span class="etiqueta treino">${icone.check}Correção na hora</span>` : ""}`;
  const vaiAbrir = !fechado && s.status === "publicado" && aindaVaiAbrir(s);
  if (fechado || vaiAbrir || s.status === "em_breve") {
    return h`<article class="cartao sim em-breve ${destaque ? "destaque" : ""}" data-sim="${s.id}">
      <div class="sim-topo">${cru(H[0])}${titulo}${cru(H[1])}<span class="estado breve">${fechado ? "Encerrado" : "Em breve"}</span></div>
      ${s.subtitulo ? h`<p class="sim-info">${s.subtitulo}</p>` : ""}
      <p class="sim-info">${info}</p>
      ${vaiAbrir ? reloginho(s.libera_em, { abre: true }) : h`<p class="sim-info">${fechado ? "O prazo para fazer este simulado acabou. Ele volta quando o professor liberar." : "Ainda não está liberado. Avisamos quando abrir."}</p>`}
    </article>`;
  }
  const sit = situacao(estado, s.id, config);
  const podeGerar = temVersaoNova(s.id, s.n_questoes);
  return h`<article class="cartao sim ${destaque ? "destaque" : ""}" data-sim="${s.id}">
    <div class="sim-topo">
      ${cru(H[0])}<a href="#/simulado/${s.id}">${titulo}</a>${cru(H[1])}
      ${seloEstado(sit)}
    </div>
    ${s.subtitulo ? h`<p class="sim-info">${s.subtitulo}</p>` : ""}
    <p class="sim-info">${info}</p>
    ${selos}
    ${reloginho(s.disponivel_ate)}
    ${etiquetasHabilidades(s.habilidades, habilidades)}
    <div class="botoes acoes">
      <a class="botao pequeno" href="#/simulado/${s.id}">${sit.andamento ? "Continuar" : sit.tipo === "novo" ? "Fazer" : "Refazer"}${icone.seta}</a>
      ${podeGerar ? h`<button type="button" class="botao secundario pequeno" data-acao="versao-nova" data-id="${s.id}" title="Mesmas habilidades, com números e situações novas">${icone.dado}Versão nova</button>` : ""}
    </div>
  </article>`;
}
