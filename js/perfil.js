// Perfil (#/perfil): apelido, nível, conquistas, histórico, evolução da nota,
// mapa das habilidades, tema e "Apagar meus dados deste aparelho".
import { h, nota1, dataCurta, plural } from "./util.js";
import { icone } from "./icones.js";
import { atualizar, apagarTudo } from "./armazenamento.js";
import { aplicarTema } from "./tema.js";
import { nivelDoJogador, listaDeConquistas, sequenciaDeDias } from "./gamificacao.js";
import { simuladosDoCatalogo } from "./dados.js";
import { faixaDaNota, medalhaDoPercentual } from "./correcao.js";

const TEMAS = [["light", "Claro"], ["dark", "Escuro"], ["auto", "Automático (segue o aparelho)"]];

function tituloDe(simId, catalogo, estado) {
  const g = estado.gerados.find((x) => x.id === simId);
  if (g) return g.titulo;
  const s = simuladosDoCatalogo(catalogo).find((x) => x.id === simId);
  return s ? (s.semana ? `Semana ${s.semana}` : s.titulo) : "Treino gerado (apagado)";
}

/** Linha da evolução da nota (SVG), uma bolinha por entrega, na cor da faixa. */
function evolucao(tentativas, config) {
  if (tentativas.length < 2) return h`<p class="sub">Depois de duas entregas aparece aqui a linha da sua nota.</p>`;
  const ult = tentativas.slice(-12);
  const W = 520, H = 180, mx = 30, my = 16;
  const x = (i) => mx + (i * (W - mx - 12)) / (ult.length - 1);
  const y = (n) => my + (1 - n / 10) * (H - 2 * my);
  const linhas = [0, 5, 10].map((v) => `<line x1="${mx}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--linha)"/><text x="${mx - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--texto-2)">${v}</text>`).join("");
  const caminho = ult.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(t.nota).toFixed(1)}`).join(" ");
  const pontos = ult.map((t, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(t.nota).toFixed(1)}" r="5" fill="${faixaDaNota(t.nota, config).cor}"/>`).join("");
  const desc = ult.map((t) => nota1(t.nota)).join(", ");
  return h`<div role="img" aria-label="Suas últimas notas: ${desc}">${{ __cru: true, html: `<svg viewBox="0 0 ${W} ${H}" class="grafico-evolucao" aria-hidden="true">${linhas}<path d="${caminho}" fill="none" stroke="var(--primaria)" stroke-width="3" stroke-linejoin="round"/>${pontos}</svg>` }}</div>`;
}

export function telaPerfil(ctx) {
  const { config, habilidades, catalogo } = ctx.base;
  const e = ctx.estado;
  const p = e.perfil;
  const jog = nivelDoJogador(e.xp, config);
  const conquistas = listaDeConquistas(config);
  const entregas = e.tentativas.filter((t) => t.modo === "simulado");

  // mapa das habilidades: acerto acumulado de todas as entregas
  const mapa = {};
  for (const t of entregas) for (const [code, g] of Object.entries(t.porHabilidade || {})) {
    const m = (mapa[code] ||= { a: 0, n: 0 });
    m.a += g.acertos;
    m.n += g.total;
  }
  const habs = Object.entries(mapa).map(([code, m]) => ({ code, pct: Math.round((m.a / m.n) * 100), ...m })).sort((a, b) => a.pct - b.pct || b.n - a.n);
  let confirmar = false;

  return {
    titulo: "Perfil",
    html: h`
    <h1>Perfil</h1>
    <p class="sub">Tudo aqui fica só neste aparelho. Nada é enviado para ninguém.</p>

    <div class="grade grade-2">
      <section class="cartao">
        <form id="form-apelido" class="campo" autocomplete="off">
          <label for="apelido"><strong>Seu apelido</strong></label>
          <input id="apelido" class="select" maxlength="20" value="${p.apelido || ""}" placeholder="Como quer ser chamado?">
          <div class="botoes"><button class="botao pequeno" type="submit">Salvar apelido</button></div>
          <p class="msg" id="msg-apelido" role="status" aria-live="polite"></p>
        </form>
      </section>
      <section class="cartao perfil-nivel" aria-label="Seu nível">
        <p class="perfil-nivel-num">Nível <b>${jog.nivel}</b> · ${jog.titulo}</p>
        <div class="trilho" role="progressbar" aria-label="XP no nível" aria-valuemin="0" aria-valuemax="${jog.porNivel}" aria-valuenow="${jog.noNivel}"><span style="width:${Math.round((jog.noNivel / jog.porNivel) * 100)}%;background:var(--xp)"></span></div>
        <p class="sub pequeno">${jog.xp} XP no total · faltam ${jog.falta} para o nível ${jog.nivel + 1}</p>
        <p class="sub pequeno">${icone.chama} ${plural(sequenciaDeDias(e.diasDeUso), "dia seguido", "dias seguidos")} · ${plural(entregas.length, "simulado entregue", "simulados entregues")}</p>
      </section>
    </div>

    <section class="secao" aria-labelledby="t-conq">
      <h2 id="t-conq">${icone.trofeu}Conquistas <span class="sub pequeno">(${Object.keys(e.conquistas).length} de ${conquistas.length})</span></h2>
      <ul class="conquistas">${conquistas.map((c) => {
        const quando = e.conquistas[c.id];
        return h`<li class="cartao conquista ${quando ? "ganha" : "bloqueada"}">
          <span class="conquista-selo" aria-hidden="true">${icone.trofeu}</span>
          <div><strong>${c.nome}</strong><br><span class="sub pequeno">${quando ? `Ganha em ${dataCurta(quando)}` : `Bloqueada: ${c.regra}`}</span></div>
        </li>`;
      })}</ul>
    </section>

    <section class="cartao secao" aria-labelledby="t-evol">
      <h2 id="t-evol">Evolução da nota</h2>
      ${evolucao(entregas, config)}
    </section>

    <section class="cartao secao" aria-labelledby="t-mapa">
      <h2 id="t-mapa">Mapa das habilidades</h2>
      ${habs.length ? h`<p class="sub pequeno">Acerto em todos os simulados, da habilidade mais fraca para a mais forte.</p>
      <ul class="barras-tema">${habs.map((x) => h`<li>
        <div class="barra-rotulo"><span>${habilidades[x.code]?.nome || x.code}</span><strong>${x.pct}%</strong></div>
        <div class="barra-trilho"><span class="barra-atual" style="width:${x.pct}%;background:${x.pct >= 80 ? "var(--ok)" : x.pct >= 50 ? "var(--xp)" : "var(--alerta)"}"></span></div>
        <p class="sub pequeno">${x.a} de ${plural(x.n, "questão", "questões")}</p>
      </li>`)}</ul>` : h`<p class="sub">Entregue um simulado para ver o seu mapa.</p>`}
    </section>

    <section class="cartao secao" aria-labelledby="t-hist">
      <h2 id="t-hist">Histórico</h2>
      ${e.tentativas.length ? h`<ul class="historico">${[...e.tentativas].reverse().slice(0, 30).map((t) => {
        const med = t.modo === "simulado" ? medalhaDoPercentual(t.percentual ?? t.nota * 10, config) : null;
        return h`<li>
          <span>${dataCurta(t.fim)}</span>
          <span>${tituloDe(t.simId, catalogo, e)}${t.modo === "treino" ? h` <span class="etiqueta">treino</span>` : ""}</span>
          <span>${t.modo === "simulado" ? h`${med ? h`<span class="medalha ${med.nome.toLowerCase()}" title="Medalha ${med.nome}">${icone.medalha}</span>` : ""}<strong>${nota1(t.nota)}</strong>` : `${t.acertos} de ${t.total}`}</span>
          ${t.modo === "simulado" && (e.gerados.some((g) => g.id === t.simId) || !t.simId.startsWith("G-")) ? h`<a href="#/resultado/${t.simId}" aria-label="Ver o resultado">${icone.seta}</a>` : h`<span></span>`}
        </li>`;
      })}</ul>` : h`<p class="sub">Nenhuma entrega ainda.</p>`}
    </section>

    <section class="cartao secao">
      <fieldset>
        <legend>Tema</legend>
        <div class="chips">${TEMAS.map(([v, rot]) => h`<label class="chip"><input type="radio" name="tema" data-acao="tema-cor" value="${v}" ${(p.tema || "light") === v ? "checked" : ""}>${rot}</label>`)}</div>
      </fieldset>
    </section>

    <section class="cartao secao zona-perigo" aria-labelledby="t-apagar">
      <h2 id="t-apagar">Apagar meus dados deste aparelho</h2>
      <p class="sub">Apaga apelido, notas, XP, conquistas, missão e treinos gerados. Não dá para desfazer.</p>
      <div id="apagar-area"><button type="button" class="botao secundario perigo" data-acao="apagar">${icone.lixo}Apagar meus dados</button></div>
    </section>`,
    depois: () => {
      document.getElementById("form-apelido").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const v = document.getElementById("apelido").value.trim().slice(0, 20);
        atualizar((x) => { x.perfil.apelido = v; });
        document.getElementById("msg-apelido").textContent = v ? `Pronto, ${v}!` : "Apelido apagado.";
      });
    },
    eventos: {
      "tema-cor": (el) => {
        atualizar((x) => { x.perfil.tema = el.value; });
        aplicarTema(el.value);
        window.dispatchEvent(new Event("tema-mudou"));
      },
      apagar: () => {
        confirmar = true;
        document.getElementById("apagar-area").innerHTML = String(h`
          <p role="alert"><strong>Tem certeza?</strong> Tudo o que está guardado neste aparelho vai ser apagado.</p>
          <div class="botoes"><button type="button" class="botao perigo" data-acao="apagar-sim">Sim, apagar tudo</button><button type="button" class="botao fantasma" data-acao="apagar-nao">Cancelar</button></div>`);
        document.querySelector('[data-acao="apagar-nao"]').focus();
      },
      "apagar-nao": () => {
        confirmar = false;
        ctx.redesenhar({ manterFoco: '[data-acao="apagar"]' });
      },
      "apagar-sim": async () => {
        if (!confirmar) return;
        apagarTudo();
        aplicarTema("light");
        window.dispatchEvent(new Event("tema-mudou"));
        await ctx.redesenhar();
        const msg = document.createElement("p");
        msg.className = "msg";
        msg.setAttribute("role", "status");
        msg.textContent = "Pronto: os dados deste aparelho foram apagados.";
        document.getElementById("apagar-area")?.appendChild(msg);
      },
    },
  };
}
