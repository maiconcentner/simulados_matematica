// Peças de tela usadas em mais de uma página: cartão do simulado, estado, etiquetas.
import { h, cru } from "./util.js";
import { icone } from "./icones.js";
import { nota1, plural, dataCurta } from "./util.js";
import { situacao } from "./progresso.js";
import { temVersaoNova } from "./gerador/index.js";

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
export function cartaoSimulado(s, { estado, config, habilidades, nivelTitulo = 2 }) {
  const H = nivelTitulo === 3 ? ["<h3>", "</h3>"] : ["<h2 class=\"sim-titulo\">", "</h2>"];
  const titulo = s.semana ? `Semana ${s.semana}` : s.titulo;
  if (s.status === "em_breve") {
    return h`<article class="cartao sim em-breve">
      <div class="sim-topo">${cru(H[0])}${titulo}${cru(H[1])}<span class="estado breve">Em breve</span></div>
      ${s.subtitulo ? h`<p class="sim-info">${s.subtitulo}</p>` : ""}
    </article>`;
  }
  const sit = situacao(estado, s.id, config);
  const info = [plural(s.n_questoes, "questão", "questões"), s.area === "prova" ? "vale 10" : null, s.data ? `semana de ${dataCurta(s.data)}` : null].filter(Boolean).join(" · ");
  const podeGerar = temVersaoNova(s.id, s.n_questoes);
  return h`<article class="cartao sim" data-sim="${s.id}">
    <div class="sim-topo">
      ${cru(H[0])}<a href="#/simulado/${s.id}">${titulo}</a>${cru(H[1])}
      ${seloEstado(sit)}
    </div>
    ${s.subtitulo ? h`<p class="sim-info">${s.subtitulo}</p>` : ""}
    <p class="sim-info">${info}</p>
    ${etiquetasHabilidades(s.habilidades, habilidades)}
    <div class="botoes acoes">
      <a class="botao pequeno" href="#/simulado/${s.id}">${sit.andamento ? "Continuar" : sit.tipo === "novo" ? "Fazer" : "Refazer"}${icone.seta}</a>
      ${podeGerar ? h`<button type="button" class="botao secundario pequeno" data-acao="versao-nova" data-id="${s.id}" title="Mesmas habilidades, com números e situações novas">${icone.dado}Versão nova</button>` : ""}
    </div>
  </article>`;
}
