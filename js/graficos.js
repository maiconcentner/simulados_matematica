// Gráficos em SVG feitos à mão: anel da nota e barras por tema.
import { h, cru, nota1 } from "./util.js?v=42dba01b94";

const R = 54, C = 2 * Math.PI * R;

/** Anel com a nota (0 a 10) na cor da faixa. A animação entra pelo CSS (.anel-progresso). */
export function anelNota(nota, cor) {
  const frac = Math.max(0, Math.min(1, nota / 10));
  return h`<div class="anel" style="--cor-faixa:${cor}">
    <svg viewBox="0 0 128 128" aria-hidden="true">
      <circle cx="64" cy="64" r="${R}" class="anel-fundo"/>
      <circle cx="64" cy="64" r="${R}" class="anel-progresso" style="stroke-dasharray:${C.toFixed(1)};--fim:${(C * (1 - frac)).toFixed(1)};--inicio:${C.toFixed(1)}" transform="rotate(-90 64 64)"/>
    </svg>
    <div class="anel-texto"><b class="contar" data-ate="${nota}" data-casas="1">${nota1(nota)}</b><span>nota</span></div>
  </div>`;
}

/** Texto preto ou branco, o que contrastar mais com a cor de fundo (hex). */
export function corDoTexto(hex) {
  const c = hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? "#1d1a33" : "#ffffff";
}

/** Régua com as faixas e um marcador na nota do aluno. */
export function reguaFaixas(nota, escala) {
  let ini = 0;
  const partes = escala.map((f) => {
    const larg = ((f.ate - ini) / 10) * 100;
    const p = h`<div class="regua-faixa" style="width:${larg}%"><i style="background:${f.cor}"></i><span>${f.nivel}</span></div>`;
    ini = f.ate;
    return p;
  });
  return h`<div class="regua" role="img" aria-label="Sua nota ${nota1(nota)} na régua das faixas">
    <div class="regua-trilho">${partes}</div>
    <div class="regua-marcador" style="left:${Math.max(0, Math.min(100, nota * 10))}%"><span>${nota1(nota)}</span></div>
  </div>`;
}

/** Barras horizontais por tema: este simulado (cor) e o acumulado do aluno (cinza claro). */
export function barrasTema(linhas) {
  return h`<ul class="barras-tema">${linhas.map((l) => {
    const p = l.total ? Math.round((l.acertos / l.total) * 100) : 0;
    const pa = l.acumTotal ? Math.round((l.acumAcertos / l.acumTotal) * 100) : null;
    return h`<li>
      <div class="barra-rotulo"><span>${l.tema}</span><strong>${l.acertos} de ${l.total}</strong></div>
      <div class="barra-trilho">
        ${pa !== null ? h`<span class="barra-acum" style="width:${pa}%"></span>` : ""}
        <span class="barra-atual" style="width:${p}%"></span>
      </div>
      ${pa !== null ? h`<p class="sub pequeno">No total: ${pa}% de acerto em ${l.acumTotal} ${l.acumTotal === 1 ? "questão" : "questões"}</p>` : ""}
    </li>`;
  })}</ul>`;
}

/** Faz os números com .contar subirem de 0 até o valor (sem animação se o aluno pedir menos movimento). */
export function animarContadores(raiz = document) {
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  raiz.querySelectorAll(".contar").forEach((el) => {
    const ate = Number(el.dataset.ate);
    const casas = Number(el.dataset.casas || 0);
    const prefixo = el.dataset.prefixo || "";
    const fmt = (v) => prefixo + (casas ? v.toFixed(casas).replace(".", ",") : String(Math.round(v)));
    if (reduzir || !Number.isFinite(ate)) { el.textContent = fmt(ate); return; }
    const t0 = performance.now(), dur = 1100;
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(ate * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(passo);
  });
}

export { cru };
