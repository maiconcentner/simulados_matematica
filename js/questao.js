// Desenho de uma questão (enunciado, tabela, figura, pergunta e alternativas).
// Serve para a prévia do gerador e, na fase 2, para a tela do simulado.
import { h, cru } from "./util.js?v=57517fb455";

export function tabelaHTML(t) {
  if (!t) return "";
  return h`<div class="tabela-rolagem"><table>
    ${t.caption ? h`<caption>${t.caption}</caption>` : ""}
    <thead><tr>${t.header.map((c) => h`<th scope="col">${c}</th>`)}</tr></thead>
    <tbody>${t.rows.map((r) => h`<tr>${r.map((c, i) => (i === 0 ? h`<th scope="row">${c}</th>` : h`<td>${c}</td>`))}</tr>`)}</tbody>
  </table></div>`;
}

export function figuraHTML(f) {
  if (!f) return "";
  const larg = Math.round(Math.min(1, f.scale || 0.85) * 100);
  // figuras geradas vêm como SVG feito pelo próprio site; as do professor, como arquivo
  const corpo = f.svg
    ? h`<div role="img" aria-label="${f.alt}">${cru(f.svg)}</div>`
    : h`<img src="${f.file}" alt="${f.alt}" loading="lazy" style="width:${larg}%">`;
  return h`<figure>${corpo}${f.caption ? h`<figcaption>${f.caption}</figcaption>` : ""}</figure>`;
}

/** Enunciado completo, sem as alternativas. */
export function enunciadoHTML(q) {
  return h`<div class="enunciado">${q.stem.map((p) => h`<p>${p}</p>`)}</div>
    ${tabelaHTML(q.table)}${figuraHTML(q.figure)}
    <p class="pergunta">${q.ask}</p>`;
}

/** Questão com as alternativas só para ler (prévia), marcando a correta se pedido. */
export function questaoLeitura(q, { mostrarCorreta = false } = {}) {
  return h`<article class="questao">
    ${enunciadoHTML(q)}
    <ol class="alternativas">${q.options.map((o) => h`<li class="alternativa ${mostrarCorreta && o.correct ? "correta" : ""}"><span class="letra">${o.letter}</span><span>${o.text}</span></li>`)}</ol>
  </article>`;
}
