// Tema claro, escuro ou automático (segue o aparelho).
export function aplicarTema(tema) {
  const raiz = document.documentElement;
  if (tema === "light" || tema === "dark") raiz.dataset.theme = tema;
  else delete raiz.dataset.theme;
}
