// Tema do site: claro é o padrão. Escuro só quando o aluno escolhe.
// "auto" (Automático) segue o aparelho.
const escuroNoAparelho = () => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

/** Tema que vale de fato ("light" ou "dark") para a escolha guardada. */
export function temaEfetivo(escolha) {
  if (escolha === "dark") return "dark";
  if (escolha === "auto") return escuroNoAparelho() ? "dark" : "light";
  return "light";
}

export function aplicarTema(escolha) {
  const t = temaEfetivo(escolha);
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === "dark" ? "#13111f" : "#5b3fd9";
  const botao = document.getElementById("botao-tema");
  if (botao) {
    botao.setAttribute("aria-pressed", String(t === "dark"));
    botao.setAttribute("aria-label", t === "dark" ? "Usar tema claro" : "Usar tema escuro");
    botao.title = t === "dark" ? "Tema claro" : "Tema escuro";
  }
  return t;
}
