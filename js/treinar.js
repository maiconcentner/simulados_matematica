// Treinar com números novos (#/treinar): gerar versão nova de um simulado
// ou montar um treino escolhendo as habilidades.
import { h } from "./util.js";
import { icone } from "./icones.js";
import { simuladosDoCatalogo } from "./dados.js";
import { codigosComModelo, gerarMisto, temVersaoNova } from "./gerador/index.js";
import { guardarGerado, removerGerado } from "./armazenamento.js";
import { plural, dataCurta } from "./util.js";

const QUANTIDADES = [5, 6, 8, 10];
const escolha = { codigos: new Set(), quantidade: 6, base: "" };
let confirmarApagar = null;

export function telaTreinar(ctx) {
  const { catalogo, config, habilidades } = ctx.base;
  const comModelo = new Set(codigosComModelo());
  const sims = simuladosDoCatalogo(catalogo).filter((s) => s.status === "publicado" && temVersaoNova(s.id, s.n_questoes));
  if (!escolha.base && sims.length) {
    const avalia = sims.filter((s) => s.area === "avalia").sort((a, b) => (b.semana || 0) - (a.semana || 0));
    escolha.base = (avalia[0] || sims[0]).id;
  }
  const porTema = config.temas.map((t) => ({
    tema: t,
    codigos: Object.keys(habilidades).filter((c) => habilidades[c].tema === t && comModelo.has(c)).sort((a, b) => habilidades[a].nome.localeCompare(habilidades[b].nome, "pt-BR")),
  })).filter((g) => g.codigos.length);
  const gerados = ctx.estado.gerados;

  return {
    titulo: "Treinar com números novos",
    html: h`
    <h1>Treinar com números novos</h1>
    <p class="sub">O gerador cria questões no mesmo estilo das do professor, com números e situações sorteados. Cada treino é diferente: dá para gerar quantos quiser.</p>

    <div class="grade grade-2">
      <section class="cartao bloco-gerar" aria-labelledby="t-versao">
        <h2 id="t-versao"><span class="passo-num">1</span>Versão nova de um simulado</h2>
        <p class="sub pequeno">Mesmas habilidades, níveis e pesos do simulado escolhido, com números novos.</p>
        <label class="campo"><span>Simulado</span>
          <select class="select" id="sel-base">
            ${catalogo.areas.map((a) => h`<optgroup label="${a.titulo}">${sims.filter((s) => s.area === a.id).map((s) => h`<option value="${s.id}" ${s.id === escolha.base ? "selected" : ""}>${s.semana ? `Semana ${s.semana}` : s.titulo}</option>`)}</optgroup>`)}
          </select>
        </label>
        <button type="button" class="botao" data-acao="gerar-versao">${icone.dado}Gerar versão nova</button>
      </section>

      <section class="cartao bloco-gerar" aria-labelledby="t-monte">
        <h2 id="t-monte"><span class="passo-num">2</span>Monte o seu treino</h2>
        <p class="sub pequeno">Escolha uma ou mais habilidades. As questões vêm da mais fácil para a mais difícil.</p>
        ${porTema.map((g) => h`
          <details class="habilidades-tema" ${g.codigos.some((c) => escolha.codigos.has(c)) ? "open" : ""}>
            <summary>${g.tema} <span class="sub pequeno">(${g.codigos.filter((c) => escolha.codigos.has(c)).length} de ${g.codigos.length})</span></summary>
            <div class="chips">${g.codigos.map((c) => h`<label class="chip"><input type="checkbox" data-acao="hab" value="${c}" ${escolha.codigos.has(c) ? "checked" : ""}>${habilidades[c].nome}</label>`)}</div>
          </details>`)}
        <fieldset>
          <legend>Quantas questões?</legend>
          <div class="chips">${QUANTIDADES.map((q) => h`<label class="chip"><input type="radio" name="qtd" data-acao="qtd" value="${q}" ${q === escolha.quantidade ? "checked" : ""}>${q}</label>`)}</div>
        </fieldset>
        <div class="botoes">
          <button type="button" class="botao" data-acao="gerar-misto">${icone.raio}Gerar meu treino</button>
          ${escolha.codigos.size ? h`<button type="button" class="botao fantasma pequeno" data-acao="limpar">Limpar escolha</button>` : ""}
        </div>
        <p class="msg erro" id="msg-misto" role="status" aria-live="polite"></p>
      </section>
    </div>

    <section class="secao" aria-labelledby="t-gerados">
      <h2 id="t-gerados">${icone.lista}Seus treinos gerados</h2>
      ${gerados.length ? h`<ul class="gerados">${gerados.map((g) => h`
        <li class="cartao gerado">
          <p><strong>${g.titulo}</strong><br><span class="sub pequeno">${g.subtitulo} · ${plural(g.items.length, "questão", "questões")} · ${dataCurta(g.gerado?.criadoEm)}</span></p>
          <div class="botoes">
            <a class="botao pequeno" href="#/simulado/${g.id}">Abrir${icone.seta}</a>
            <button type="button" class="botao fantasma pequeno" data-acao="apagar-gerado" data-id="${g.id}">${icone.lixo}${confirmarApagar === g.id ? "Toque de novo para apagar" : "Apagar"}</button>
          </div>
        </li>`)}</ul>
        <p class="sub pequeno">Ficam guardados os ${plural(12, "último", "últimos")} treinos, só neste aparelho.</p>`
      : h`<div class="cartao vazio">${icone.dado}<p>Os treinos que você gerar ficam guardados aqui.</p></div>`}
    </section>`,
    eventos: {
      "gerar-versao": () => {
        const sel = document.getElementById("sel-base");
        escolha.base = sel.value;
        ctx.gerarVersaoNova(sel.value);
      },
      hab: (el) => {
        if (el.checked) escolha.codigos.add(el.value);
        else escolha.codigos.delete(el.value);
        const det = el.closest("details");
        const cont = det?.querySelector("summary .sub");
        if (cont) {
          const marc = det.querySelectorAll("input:checked").length;
          cont.textContent = `(${marc} de ${det.querySelectorAll("input").length})`;
        }
      },
      qtd: (el) => { escolha.quantidade = Number(el.value); },
      limpar: () => { escolha.codigos.clear(); ctx.redesenhar(); },
      "gerar-misto": () => {
        const msg = document.getElementById("msg-misto");
        if (!escolha.codigos.size) {
          msg.textContent = "Escolha pelo menos uma habilidade.";
          return;
        }
        try {
          const sim = gerarMisto({ codigos: [...escolha.codigos], quantidade: escolha.quantidade, habilidades });
          guardarGerado(sim);
          location.hash = `#/simulado/${sim.id}`;
        } catch (e) {
          msg.textContent = "Não deu para gerar agora. Tente de novo.";
          console.warn(e);
        }
      },
      "apagar-gerado": (el) => {
        const id = el.dataset.id;
        if (confirmarApagar !== id) {
          confirmarApagar = id;
          ctx.redesenhar({ manterFoco: `[data-acao="apagar-gerado"][data-id="${id}"]` });
          return;
        }
        confirmarApagar = null;
        removerGerado(id);
        ctx.redesenhar({ manterFoco: "#t-gerados" });
      },
    },
    aoSair: () => { confirmarApagar = null; },
  };
}
