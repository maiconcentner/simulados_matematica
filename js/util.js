// Pequenas ajudas de texto e HTML.

/** Escapa texto para pôr dentro de HTML. */
export function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Template de HTML que escapa os valores; use cru() para HTML já pronto. */
export function h(partes, ...valores) {
  let s = "";
  partes.forEach((p, i) => {
    s += p;
    if (i < valores.length) {
      const v = valores[i];
      if (Array.isArray(v)) s += v.map((x) => (x && x.__cru ? x.html : esc(x))).join("");
      else if (v && v.__cru) s += v.html;
      else if (v === false || v === null || v === undefined) s += "";
      else s += esc(v);
    }
  });
  return { __cru: true, html: s, toString: () => s };
}
export const cru = (html) => ({ __cru: true, html: String(html), toString: () => String(html) });

/** Nota com uma casa e vírgula: 6,7 */
export const nota1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");

/** "1 questão", "6 questões" */
export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export const maiuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

export function dataCurta(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}
